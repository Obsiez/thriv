# Thriv — Stock Exchange Simulator

A production-ready **educational paper trading platform** with account login, cloud-synced progress, gamified missions, and a professional market UI.

## Features

- **Accounts** — Email/password registration, JWT sessions, cloud-saved portfolio & mission progress
- **Guest mode** — Try locally without an account (device-only storage)
- **Live-style markets** — 20 major stocks, simulated tick-by-tick prices
- **Trading** — Market & limit orders, watchlist, price alerts, charts
- **Gamification** — Rank system (Associate → Fellow), missions, credentials, activities
- **Activities** — Quizzes, scenarios, price predictor, sector sprint, stock compare, position sizer
- **Mobile-first** — Bottom navigation, card layouts, touch-friendly controls

## Quick start (development)

```bash
npm install
npm run dev:all
```

- **Web:** http://localhost:5173  
- **API:** http://localhost:3001  

`dev:all` runs the Vite frontend and Express API together. The frontend proxies `/api` to the backend.

### Auth only (frontend)

```bash
npm run dev
```

Sign-in requires the API (`npm run dev:server` in another terminal) or use **Continue as guest**.

## Environment

Copy `.env.example` to `.env` for production:

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `3001`) |
| `JWT_SECRET` | **Required in production** — long random string |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated |
| `VITE_API_URL` | Frontend API base (empty = same-origin `/api`) |

## Production build

```bash
npm run build          # Frontend → dist/
npm run start:server   # API (set JWT_SECRET first)
```

Serve `dist/` behind nginx/Caddy and proxy `/api` to the Node server. Example nginx:

```nginx
location /api {
  proxy_pass http://127.0.0.1:3001;
}
location / {
  root /var/www/thriv/dist;
  try_files $uri /index.html;
}
```

## Project structure

```
thriv/
├── server/          # Express API (auth + game state)
├── src/             # React frontend
│   ├── components/
│   ├── contexts/    # AuthProvider
│   ├── hooks/
│   └── lib/
└── dist/            # Production build output
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current user |
| PATCH | `/api/auth/profile` | Update display name |
| GET | `/api/game-state` | Load portfolio + progress |
| PUT | `/api/game-state` | Save portfolio + progress |

User data is stored in `server/data/db.json` (replace with PostgreSQL for large deployments).

## Disclaimer

Thriv is for **education only**. Simulated prices are not real exchange data. Not financial advice.
