require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const path = require('path');
const { pathToFileURL } = require('url');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const messageRoutes = require('./routes/messageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { verifyCsrfToken } = require('./middleware/csrfMiddleware');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 6002;
const allowedOrigins = new Set(
  (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      try {
        return new URL(origin).origin;
      } catch {
        return origin;
      }
    })
);

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://127.0.0.1:5173');
  allowedOrigins.add('http://localhost:5174');
  allowedOrigins.add('http://127.0.0.1:5174');
} else {
  const invalidOrigins = [...allowedOrigins].filter((origin) => {
    try {
      const parsedOrigin = new URL(origin);
      return parsedOrigin.protocol !== 'https:' || parsedOrigin.origin !== origin;
    } catch {
      return true;
    }
  });
  if (invalidOrigins.length > 0) {
    throw new Error('Production FRONTEND_URL values must be valid HTTPS origins.');
  }
}

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:', 'ws:', 'wss:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: process.env.NODE_ENV === 'production',
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
}));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LocalKart backend is running' });
});

app.use('/api', verifyCsrfToken);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ai', aiRoutes);

async function startServer() {
  if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, 'utf8') < 32) {
    throw new Error('JWT_SECRET must be set to a random secret of at least 32 bytes.');
  }

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
