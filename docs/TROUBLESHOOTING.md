# Troubleshooting

## Backend won't start

| Symptom | Likely cause | Fix |
|---|---|---|
| `Cannot find module '@prisma/client'` | client not generated | `cd backend && npx prisma generate` |
| `Prisma Client did not initialize yet` | stale generated client | `npx prisma generate`, restart |
| `P1010/P3014` on `prisma migrate dev` | user lacks shadow-DB privilege | grant `CREATE` on `prisma_migrate_shadow_db_%` (see README) |
| `P1001` can't reach DB | wrong `DATABASE_URL` / MySQL down | check `mysqladmin status`, fix `.env` |
| exits with `Invalid or expired session` loop | wrong `JWT_SECRET` (changed since login) | log in again; keep the secret stable |
| `zod` validation error on boot | missing env var | compare `.env` against `.env.example` (all vars required) |

## Redirects

| Symptom | Likely cause | Fix |
|---|---|---|
| `curl -I /promo2026` returns 404 | slug inactive/expired/missing | check status + `expires_at` in DB or admin panel |
| returns 404 in production but works locally | Nginx catch-all missing | make `location /` proxy to Node, don't use `try_files` for `/` |
| QR code scans to `localhost` | `PUBLIC_BASE_URL` wrong | set `PUBLIC_BASE_URL=https://go.domain.com` in `backend/.env`, restart |
| destination changed but redirect is old | browser cache / HTTP cache | 302 is not cached by default; if you added caching, invalidate on update |

## Admin panel

| Symptom | Likely cause | Fix |
|---|---|---|
| 403 `Invalid CSRF token` on save | csrf cookie/header mismatch | hard-refresh, log out/in; ensure HTTPS (cookies are `secure` in prod) |
| login redirects back to /login | session cookie not stored | check `COOKIE_SECURE` matches your scheme (true only on HTTPS) |
| blank page / 404 on `/admin/links` refresh | SPA fallback missing | Nginx: `location /admin { try_files $uri $uri/ /index.html; }` |
| API returns 401 after deploy | new `JWT_SECRET` | keep the same secret across restarts |

## Builds

| Symptom | Likely cause | Fix |
|---|---|---|
| `vue-tsc`/`tsc` extremely slow or hangs | huge/old `node_modules`, disk pressure | fresh install: `rm -rf node_modules package-lock.json && npm install`; free disk space |
| Vite HTTP 500 `Cannot find module .../dist.js` | corrupt install | `npm cache clean --force; rm -rf node_modules package-lock.json; npm install; npx prisma generate` |
| `vite` auto-increments port (5173→5174) | port in use | `lsof -i :5173`, kill the stale process, restart |
| backend `dist/` missing | not built | `npm run build -w backend` |

## PM2

| Symptom | Fix |
|---|---|
| app not running after reboot | run the command printed by `pm2 startup`, then `pm2 save` |
| `EADDRINUSE :4000` | another process on 4000: `lsof -i :4000`, kill it, or change `PORT` |
| logs show crash loop | `pm2 logs shortlink-backend`, fix cause, `pm2 restart` |

## MySQL

| Symptom | Fix |
|---|---|
| `Too many connections` | raise `max_connections` in `/etc/mysql/mysql.conf.d/mysqld.cnf`, restart |
| disk full (MySQL stops writing) | `df -h`; purge binary logs: `PURGE BINARY LOGS BEFORE NOW() - INTERVAL 3 DAY;` |
| slow redirects at scale | add indexes (already in schema); consider Redis cache (see DEPLOYMENT.md) |

## General performance notes

- Redirect path = 1 indexed SELECT → 302; analytics insert is fire-and-forget.
- `app.set("trust proxy", 1)` + Nginx `X-Forwarded-For` → real client IPs for
  rate limiting and analytics. Without Nginx forwarding headers, all clients look
  like `127.0.0.1`.
