require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { pathToFileURL } = require('url');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const messageRoutes = require('./routes/messageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 6001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LocalKart backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ai', aiRoutes);

async function startServer() {
  await connectDB();

  if (process.env.NODE_ENV === 'production') {
    const frontendDist = path.resolve(__dirname, '../frontend/dist');
    app.use(express.static(frontendDist));
    app.get('*', (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
  } else {
    const viteEntry = path.resolve(__dirname, '../frontend/node_modules/vite/dist/node/index.js');
    const { createServer } = await import(pathToFileURL(viteEntry).href);
    const vite = await createServer({
      root: path.resolve(__dirname, '../frontend'),
      configFile: false,
      server: { middlewareMode: true, hmr: { server } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = Number(err.status || err.statusCode);
    const isClientError = status >= 400 && status < 500;
    const isUploadError = err.name === 'MulterError';
    const responseStatus = isClientError || isUploadError ? 400 : 500;
    const message = responseStatus === 400
      ? (err.type === 'entity.parse.failed' ? 'Invalid JSON request body' : err.message || 'Invalid request data')
      : 'Something went wrong';

    res.status(responseStatus).json({ message });
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. LocalKart may already be running at http://localhost:${PORT}.`);
    } else {
      console.error('LocalKart server failed to start:', error.message);
    }
    process.exit(1);
  });

  server.listen(PORT, () => {
    console.log(`LocalKart is running at http://localhost:${PORT}`);
  });
}

startServer();
