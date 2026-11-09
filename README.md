<div align="center">

# 🛒 LocalKart

![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&size=26&pause=1000&color=22C55E&center=true&vCenter=true&width=600&lines=Good+finds.+Right+on+campus.;Buy.+Sell.+Repeat.;Campus+marketplace%2C+reimagined.)

### Campus marketplace — buy & sell within your university, securely.

[![Live Frontend](https://img.shields.io/badge/🌐_Live_Frontend-localkart--jet.vercel.app-22C55E?style=for-the-badge)](https://localkart-jet.vercel.app)
[![Live Backend](https://img.shields.io/badge/⚡_Live_API-localkart--backend--cyz6.onrender.com-000000?style=for-the-badge)](https://localkart-backend-cyz6.onrender.com)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_%2B_Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)

</div>

---

## 🚀 Live Links

| | URL |
|---|---|
| 🌐 **Frontend (Vercel)** | [https://localkart-jet.vercel.app](https://localkart-jet.vercel.app) |
| ⚡ **Backend API (Render)** | [https://localkart-backend-cyz6.onrender.com](https://localkart-backend-cyz6.onrender.com) |
| 🗄️ **Database** | MongoDB Atlas — FREE M0 cluster `localkart` (AWS ap-south-1, Mumbai) |
| 💻 **Repository** | [r1shabhsharma05/LocalKart](https://github.com/r1shabhsharma05/LocalKart) |

> **Note:** The backend runs on Render's Free plan — the first request after ~15 minutes of inactivity can take ~50 seconds while the service wakes up. The frontend loads instantly on Vercel.

---

## ✨ What is LocalKart?

LocalKart is a **full-stack campus marketplace** where students buy and sell pre-owned items — mobiles, laptops, audio gear, books, cycles and more — safely within their own university. No online payments, no delivery: students agree on a price, meet on campus, and hand over the item in person.

**Core idea:** real listings from real students, with demo listings filling empty categories so the marketplace never looks dead.

---

## 🎯 Features

### 🛍️ Marketplace
- **Browse live listings** — search and filter by category and price
- **12 categories** — Mobiles, Laptops, Audio, Books, Cycles, and 7 more
- **Category rails** — the homepage shows a separate horizontal rail for each category
- **120 demo listings** — 10 in each category, plus 10 demo sellers (seed with `npm run seed:demo`)
- **Real listings first** — each real listing replaces one demo listing from the same category; categories without real listings keep their demo products
- **Auto-refresh** — listings refresh every 15 seconds and when the browser tab gets focus

### 🔐 Auth & Security
- **Email verification codes** — signup requires a 6-digit code sent by email (expires in 10 min, 5 attempts max, 1-min resend cooldown, max 5 codes/hour)
- **Strong passwords** — at least 10 characters, must include an uppercase letter, a number, and one of `@`, `,`, `.`, or `/`
- **Cookie sessions** — login uses signed HttpOnly cookies; the session JWT is never stored in `localStorage`
- **CSRF protection** — every mutating API request requires a CSRF token
- **Rate limits** — auth endpoints have IP-based rate limits (default store is process-local; use a shared store for multi-instance deploys)
- **Password reset** — reset from the login page using an email code
- **Production cookies** — marked `Secure` over HTTPS; configure `FRONTEND_URL` for separate frontend origins

### 💬 Buying & Selling
- **List an item** — up to 5 photos per listing (stored locally in `/uploads`, or Cloudinary for hosted images)
- **Manage listings** — toggle live/sold state from the dashboard
- **Buyer–seller chat** — buyers sign in to message the student seller; conversations update live while the chat is open
- **Sale flow** — buyer sends an "I bought this item" request → seller confirms from their dashboard → LocalKart marks it sold and notifies the buyer in chat
- **Safe handover** — agree on payment and a safe campus handover directly; LocalKart does not process online payments or provide delivery

### 🎨 Experience
- **Light & dark themes** — follows the system theme preference, with a manual switch
- **Polished UI** — refreshed navigation, multi-column footer, responsive layout

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite 6.4.5 |
| **Backend** | Node.js + Express |
| **Database** | MongoDB (Mongoose 8) — Atlas M0, AWS ap-south-1 |
| **Auth** | JWT + signed HttpOnly cookie sessions + CSRF |
| **Uploads** | multer (local `/uploads`) + Cloudinary (optional) |
| **Email** | nodemailer SMTP (Gmail app password) |
| **AI (optional)** | Google Gemini |
| **Deploy — Frontend** | Vercel (Hobby) |
| **Deploy — Backend** | Render (Free, Node, Singapore) |

---

## 📁 Project Structure

```
LocalKart/
├── frontend/                 # React 18 + Vite app
│   ├── src/
│   │   ├── api/axios.js      # API client (uses VITE_API_URL in production)
│   │   └── components/       # MarketplaceImage, theme, nav, footer…
│   └── vite.config.js
├── backend/                  # Node.js + Express API
│   ├── config/               # db.js, cloudinary.js, multer.js
│   ├── controllers/          # auth, product, message, AI
│   ├── middleware/           # CSRF, rate limits, image validation
│   ├── models/               # User, Product, Review, Message,
│   │                         #   EmailVerification, PasswordReset
│   ├── routes/               # API routes
│   ├── scripts/seedDemoData.js
│   ├── uploads/              # local listing photos
│   └── server.js             # entry point (PORT 6002 locally)
├── .env.example
└── README.md
```

---

## ⚙️ Getting Started (Local)

### 1. Install dependencies

```bash
npm --prefix frontend install
npm --prefix backend install
```

### 2. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Set these in `backend/.env`:

| Variable | What it is |
|---|---|
| `MONGO_URI` | MongoDB Atlas SRV string (or local MongoDB URI) |
| `JWT_SECRET` | Cryptographically random secret, at least 32 bytes |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASSWORD` | SMTP for verification codes (Gmail → use an **app password**, not your account password) |
| `EMAIL_FROM` | Sender address for verification emails |
| `FRONTEND_URL` | Exact frontend origin (comma-separated origins supported) |
| `CAMPUS_NAME` | Enforce one university for all visitors (optional — when omitted, students are scoped by the college name given at registration; public browsing is not locked to one campus) |
| `DEMO_SEED_PASSWORD` | Password for the 10 demo sellers |
| `CLOUDINARY_*` | Optional hosted image uploads |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Optional AI features |

### 3. Run it

```bash
npm run dev          # from the project root
```

- Backend + API: `http://localhost:6002`
- Frontend (Vite, if run separately): usually `http://localhost:5173` — it connects to the backend automatically. For a custom backend port, set `VITE_BACKEND_PORT` in the frontend environment or set `VITE_API_URL` to the full API URL.

### 4. Seed demo data (optional)

```bash
npm run seed:demo    # from backend/ — needs DEMO_SEED_PASSWORD set
```

Seeds **120 sample listings** (10 per category) and **10 demo sellers**. Demo logins: `seller01@localkart-demo.test` … `seller10@localkart-demo.test` — all use the configured demo password. **Keep these demo credentials local and change them before deployment.**

---

## 🌍 Production Deployment

### Backend — Render

| Setting | Value |
|---|---|
| Service | Web Service, Node, Free plan |
| Region | Singapore |
| Repo / Branch | `r1shabhsharma05/LocalKart` — `feat/atlas-connect-run` |
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Env vars | All of `backend/.env` (MONGO_URI, JWT_SECRET, SMTP_*, CLOUDINARY_*, GEMINI_*, DEMO_SEED_PASSWORD) with `NODE_ENV=production` and `FRONTEND_URL=https://localkart-jet.vercel.app` |

### Frontend — Vercel

| Setting | Value |
|---|---|
| Project | `localkart` (Hobby) |
| Repo / Branch | `r1shabhsharma05/LocalKart` — `feat/atlas-connect-run` (promoted to Production) |
| Root Directory | `frontend` |
| Framework | Vite — Build `npm run build`, Output `dist` |
| Env var | `VITE_API_URL=https://localkart-backend-cyz6.onrender.com/api` |

> The frontend's API client uses relative `/api` on localhost, so `VITE_API_URL` **must** be set at Vercel build time or all API calls 404. The backend's CORS allows only the origins in `FRONTEND_URL`, so it must list the exact Vercel domain.

For a production build locally: build the frontend with `npm run build` and start the backend with `NODE_ENV=production npm start` from `backend/`. Serve over HTTPS (production cookies are `Secure`). Use a managed MongoDB URI and a strong JWT secret, and configure the same `CAMPUS_NAME` for strict single-university access.

---

## 🛡️ Security Notes

- Never commit `backend/.env` — it is gitignored. Use `backend/.env.example` as the template.
- Rotate `JWT_SECRET` and SMTP credentials if they are ever exposed.
- The default rate-limit store is process-local — use a shared store when deploying multiple backend instances.
- Configure Express to trust only your actual reverse proxy if deploying behind one.
- Keep the frontend and API on the same site in production, serve over HTTPS, and set `FRONTEND_URL` for separate frontend origins.

---

## 👥 Contributors

- **Shivam Rajput** ([@shivamcodes89](https://github.com/shivamcodes89)) — main contributor (cookie sessions, CSRF, demo listings, theme/nav refresh, security hardening)
- **Rishabh Sharma** ([@r1shabhsharma05](https://github.com/r1shabhsharma05)) — Atlas + deployment

---

<div align="center">

**Built for students, by students. 🎓**

[🌐 Open LocalKart](https://localkart-jet.vercel.app) · [⚡ API](https://localkart-backend-cyz6.onrender.com) · [💻 Repo](https://github.com/r1shabhsharma05/LocalKart)

</div>
