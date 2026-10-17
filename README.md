# LocalKart

A full-stack marketplace project with a React frontend and a Node.js + Express backend.

## Structure

- `frontend/` - React application
- `backend/` - Node.js + Express API

## Getting Started

1. Install dependencies with `npm --prefix frontend install` and `npm --prefix backend install`.
2. Create `backend/.env` with `PORT=6001`, `MONGO_URI=<your MongoDB connection string>`, and `JWT_SECRET=<a long random secret>`. For AI price suggestions, also set `GEMINI_API_KEY` (model defaults to `gemini-3.5-flash-lite`).
3. Run `npm run dev` from the project root. The backend serves both the frontend and API on `http://localhost:6001`.

For production, build the frontend with `npm run build` and start the backend with `NODE_ENV=production npm start` from `backend/`.
