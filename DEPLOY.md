# Deploying Thriv

Thriv is **two parts**: a static React frontend and a Node/Express API with a JSON database. Auth only works when both are deployed and connected.

## Recommended setup (easiest)

| Part | Platform | Why |
|------|----------|-----|
| **Frontend** | [Vercel](https://vercel.com) | Free, fast, great for Vite |
| **API** | [Railway](https://railway.app) or [Render](https://render.com) | Runs Express + persistent disk for `db.json` |

Vercel alone cannot run this Express server as-is without refactoring to serverless functions.

---

## 1. Deploy the API (Railway)

1. Push the repo to GitHub.
2. Create a **Railway** project → Deploy from repo.
3. Set **Root Directory** to the repo root (or leave default).
4. **Start command:** `npm run start:server`
5. **Environment variables:**

   | Variable | Value |
   |----------|--------|
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | Long random string (32+ characters) |
   | `CORS_ORIGIN` | Your Vercel URL, e.g. `https://thriv.vercel.app` |
   | `PORT` | Railway sets this automatically |

6. Add a **volume** mounted at `server/data` so `db.json` survives redeploys.
7. Copy the public URL, e.g. `https://thriv-api.up.railway.app`

Health check: `GET https://YOUR-API/api/health` → `{ "ok": true }`

---

## 2. Deploy the frontend (Vercel or Netlify)

1. Import the same GitHub repo in Vercel.
2. **Framework:** Vite  
3. **Build command:** `npm run build`  
4. **Output directory:** `dist`  
5. **Environment variable:**

   | Variable | Value |
   |----------|--------|
   | `VITE_API_URL` | `https://YOUR-API.up.railway.app` (no trailing slash) |

6. Deploy. Open your `*.vercel.app` URL and **create an account** to verify login.

`vercel.json` in the repo enables SPA routing.

### Netlify

1. Import the repo → **Build command:** `npm run build` → **Publish directory:** `dist`
2. **Required environment variable:** `VITE_API_URL` = your Railway/Render API URL (no trailing slash)
3. Redeploy after setting the variable (Vite bakes this in at build time).

**Alternative without rebuild:** edit `public/thriv-config.json` in the repo before deploy:

```json
{ "apiUrl": "https://YOUR-API.up.railway.app" }
```

`netlify.toml` enables SPA routing.

---

## 3. Verify authentication

1. API health returns `ok: true`.
2. Register a new account on the live site.
3. Refresh the page — you should stay signed in.
4. Change something (trade / claim XP), wait ~2s, refresh — progress should persist.
5. Sign out and sign in again with the same email.

### Common auth failures

| Symptom | Fix |
|---------|-----|
| “API offline” on login | `VITE_API_URL` wrong or API not running |
| CORS error in browser console | Add exact Vercel origin to `CORS_ORIGIN` on API |
| Login succeeds then empty portfolio | Fixed in app: token must be stored before `/api/game-state` |
| 401 after refresh | `JWT_SECRET` changed between deploys — users must re-register |

---

## Android (no app store required)

Thriv is a **PWA**:

1. Deploy frontend on HTTPS (Vercel).
2. On Android Chrome → menu → **Install app** / **Add to Home screen**.

For a Play Store app later, wrap the site with [Capacitor](https://capacitorjs.com) pointing at your Vercel URL.

## iOS

Same PWA flow in Safari → Share → **Add to Home Screen**.

---

## Local production test

```bash
# Terminal 1
JWT_SECRET=your-local-test-secret-min-32-chars-long npm run start:server

# Terminal 2
VITE_API_URL=http://localhost:3001 npm run build && npm run preview
```

Open the preview URL and test register/login against the real API.
