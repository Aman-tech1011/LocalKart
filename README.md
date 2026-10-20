# LocalKart

A full-stack marketplace project with a React frontend and a Node.js + Express backend.

## Structure

- `frontend/` - React application
- `backend/` - Node.js + Express API

## Getting Started

1. Install dependencies with `npm --prefix frontend install` and `npm --prefix backend install`.
2. Start MongoDB locally or use a MongoDB Atlas URI.
3. Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI`, a long, random `JWT_SECRET`, and SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and optionally `EMAIL_FROM`) so signup verification codes can be emailed. For Gmail, use an app password rather than your account password. Set `CAMPUS_NAME` to enforce one university for all visitors. When it is omitted, signed-in students are scoped by the college name supplied during registration; public browsing is not locked to one campus.
4. Run `npm run dev` from the project root. The backend serves the API and Vite-powered frontend at `http://localhost:6002` by default. Change `PORT` in `backend/.env` if that port is already in use. If you run the frontend separately on Vite (usually port `5173`), keep the backend running on port `6002`; the frontend connects to it automatically. For a custom backend port, set `VITE_BACKEND_PORT` in the frontend environment or set `VITE_API_URL` to the full API URL.

## Marketplace flows

- Browse live listings, search and filter by category and price.
- Register with a university name, sign in, list an item with up to five photos, and manage its live/sold state in the dashboard.
- Buyers sign in to message the student seller. After they finalize the deal, the buyer can send an "I bought this item" request from its detail page. The listing stays available until the seller confirms the sale from their dashboard; then LocalKart marks it sold and notifies the buyer in chat. Conversations are visible to both participants and update while the chat is open.
- Seed 50 sample campus listings and 10 demo sellers by setting `DEMO_SEED_PASSWORD` in `backend/.env` and running `npm run seed:demo`. Demo listings are shown only until a real student listing is available for that campus, then real listings replace the demo feed automatically. The homepage refreshes listings every 15 seconds and when the browser tab gets focus. Demo seller logins are `seller01@localkart-demo.test` through `seller10@localkart-demo.test`; all use the configured demo password. Keep these demo credentials local and change them before deployment.
- Agree on payment and a safe campus handover directly with the other student before either side requests or confirms the sale. LocalKart does not process online payments or provide delivery.
- Listing photos are stored locally and served from `/uploads`; Cloudinary can optionally be configured for hosted images.

For production, build the frontend with `npm run build` and start the backend with `NODE_ENV=production npm start` from `backend/`. Configure the same `CAMPUS_NAME` in the backend for strict single-university access, and use a managed MongoDB URI and strong JWT secret.
