# Thriv — Stock Exchange Simulator

> An educational paper-trading platform with real-time-style markets, gamified missions, account sync, and a professional market UI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![React](https://img.shields.io/badge/react-19-61dafb)
![TypeScript](https://img.shields.io/badge/typescript-5.8-3178c6)

---

## Overview

Thriv is a full-stack web application that lets users practice investing without risking real money. It combines a realistic trading interface with educational activities and a progression system to keep learners engaged.

**Disclaimer:** Thriv is for educational purposes only. Simulated prices are not real exchange data. Nothing in this app constitutes financial advice.

---

## Features

| Category | Details |
|----------|---------|
| **Accounts** | Email/password registration, JWT sessions, cloud-synced portfolio & progress |
| **Guest mode** | Try the app locally without an account (device-only storage) |
| **Markets** | 20 major stocks with simulated tick-by-tick price movements |
| **Trading** | Market & limit orders, watchlist, price alerts, interactive charts |
| **Gamification** | Rank system (Associate → Fellow), missions, credentials, XP activities |
| **Activities** | Quizzes, scenarios, price predictor, sector sprint, stock compare, position sizer |
| **PWA** | Installable on Android & iOS — no app store required |
| **Mobile-first** | Bottom navigation, card layouts, touch-friendly controls |

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Recharts
- **Backend:** Node.js, Express 5, JSON Web Tokens, bcrypt
- **Auth (optional):** Firebase Authentication (replaces the custom Express server)
- **Storage:** `server/data/db.json` (swap for PostgreSQL at scale)

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install & Run (Development)

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/thriv.git
cd thriv

# 2. Install dependencies
npm install

# 3. Copy the environment template
cp .env.example .env
# Edit .env and fill in your values (see Environment Variables below)

# 4. Start both frontend and API together
npm run dev:all
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3001 |

> **Frontend only** (no auth): `npm run dev`  
> **API only**: `npm run dev:server`

The Vite dev server proxies all `/api` requests to the Express backend automatically.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values for your environment.

### API (Backend)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Port for the Express server (default: `3001`) |
| `NODE_ENV` | Yes (prod) | Set to `production` in production |
| `JWT_SECRET` | **Yes** | Long random string, minimum 32 characters |
| `CORS_ORIGIN` | Yes (prod) | Your frontend URL, e.g. `https://thriv.vercel.app` |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes (prod) | Full URL of your API, no trailing slash |

### Firebase (Optional)

If you prefer Firebase Authentication over the self-hosted Express server, add your Firebase project credentials:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

---

## Production Build

```bash
# Build the frontend (outputs to dist/)
npm run build

# Start the API server
npm run start:server
```

Serve `dist/` as a static site and reverse-proxy `/api` to the Node server. Example **nginx** config:

```nginx
location /api {
    proxy_pass http://127.0.0.1:3001;
}
location / {
    root /var/www/thriv/dist;
    try_files $uri /index.html;
}
```

---

## Deployment

Thriv consists of two parts: a **static React frontend** and a **Node/Express API**. Both must be deployed and connected for authentication to work.

### Recommended Setup

| Part | Platform | Notes |
|------|----------|-------|
| Frontend | [Vercel](https://vercel.com) or [Netlify](https://netlify.app) | Free tier, great for Vite |
| API | [Railway](https://railway.app) or [Render](https://render.com) | Runs Express + persistent disk for `db.json` |

> Vercel alone cannot run this Express server without refactoring to serverless functions.

---

### Step 1 — Deploy the API (Railway)

1. Push your repo to GitHub.
2. Create a **Railway** project → **Deploy from repo**.
3. Set the **start command** to `npm run start:server`.
4. Add the following **environment variables**:

   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | A long random string (32+ characters) |
   | `CORS_ORIGIN` | Your Vercel/Netlify frontend URL |

5. Add a **volume** mounted at `server/data` so `db.json` persists across redeploys.
6. Note your public API URL (e.g. `https://thriv-api.up.railway.app`).

**Verify:** `GET https://YOUR-API/api/health` should return `{ "ok": true }`.

---

### Step 2 — Deploy the Frontend (Vercel)

1. Import the same GitHub repo in **Vercel**.
2. Set framework to **Vite**.
3. Build command: `npm run build` | Output directory: `dist`
4. Add environment variable:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://YOUR-API.up.railway.app` (no trailing slash) |

5. Deploy and open your `*.vercel.app` URL.

`vercel.json` in the repo already configures SPA routing.

#### Netlify Alternative

1. Import repo → Build command: `npm run build` → Publish directory: `dist`
2. Set `VITE_API_URL` environment variable.
3. Redeploy after setting the variable (Vite bakes it in at build time).

`netlify.toml` already configures SPA routing.

---

### Step 3 — Verify Authentication

1. API health check returns `ok: true`.
2. Register a new account on the live site.
3. Refresh the page — you should remain signed in.
4. Make a trade or claim XP, wait ~2 seconds, then refresh — progress should persist.
5. Sign out and sign back in with the same email.

#### Common Issues

| Symptom | Fix |
|---------|-----|
| "API offline" on login | `VITE_API_URL` is wrong or the API server is not running |
| CORS error in browser console | Add your exact frontend origin to `CORS_ORIGIN` on the API |
| 401 after page refresh | `JWT_SECRET` changed between deploys — users must re-register |

---

### PWA Installation (Mobile)

Thriv is a Progressive Web App and can be installed without an app store:

- **Android:** Open in Chrome → menu → **Install app** / **Add to Home screen**
- **iOS:** Open in Safari → Share → **Add to Home Screen**

---

### Local Production Test

```bash
# Terminal 1 — API
JWT_SECRET=your-local-test-secret-min-32-chars-long npm run start:server

# Terminal 2 — Frontend (builds first, then previews)
VITE_API_URL=http://localhost:3001 npm run build && npm run preview
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Sign in |
| `GET` | `/api/auth/me` | Get current user |
| `PATCH` | `/api/auth/profile` | Update display name |
| `GET` | `/api/game-state` | Load portfolio & progress |
| `PUT` | `/api/game-state` | Save portfolio & progress |

---

## Project Structure

```
thriv/
├── server/              # Express API (auth + game state)
│   ├── data/            # db.json (persistent storage)
│   └── index.ts
├── src/                 # React frontend
│   ├── components/      # UI components
│   ├── contexts/        # AuthProvider, game state
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities, market simulation
├── public/              # Static assets
├── dist/                # Production build output (generated)
├── vercel.json          # Vercel SPA routing config
├── netlify.toml         # Netlify SPA routing config
└── railway.toml         # Railway build config
```

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

---

## License

[MIT](LICENSE)
