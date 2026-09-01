# Production Deployment — Ubuntu 22.04/24.04 (no Docker)

Complete walkthrough from a blank server to a live short-link service at
`https://go.domain.com` with Nginx, PM2, MySQL/MariaDB, Node.js LTS, and Let's Encrypt SSL.

Architecture:

```
Internet
   ↓
Nginx (80/443)
   ├── /          → /var/www/shortlink/frontend/dist  (Vue static files)
   ├── /admin     → SPA fallback → frontend/dist/index.html
   ├── /api/*     → proxy → 127.0.0.1:4000            (REST API)
   └── /:slug     → proxy → 127.0.0.1:4000            (HTTP 302 redirect)
              ↓
          Node.js (PM2) :4000
              ↓
          MySQL/MariaDB :3306
```

Public short link flow (no intermediate page):

```
GET https://go.domain.com/promo2026
  → Nginx → Node.js → lookup slug (indexed) → check status/expiry
  → record click (async) → HTTP 302 Location: https://example.com/promo
```

---

## 1. Update the server

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw
```

## 2. Install Node.js LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v22.x LTS
```

## 3. Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
```

## 4. Install MySQL (or MariaDB)

```bash
# MySQL 8
sudo apt install -y mysql-server
sudo systemctl enable --now mysql

# or MariaDB 11
# sudo apt install -y mariadb-server
```

Secure it (set a strong root password):

```bash
sudo mysql_secure_installation
```

## 5. Create the database and user

```bash
sudo mysql <<'SQL'
CREATE DATABASE shortlink CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'shortlink_user'@'localhost' IDENTIFIED BY 'REPLACE_WITH_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON shortlink.* TO 'shortlink_user'@'localhost';
FLUSH PRIVILEGES;
SQL
```

Prisma `migrate dev` (development) needs a shadow database; `migrate deploy`
(production) does not. For dev only, also grant:

```sql
GRANT CREATE, ALTER, DROP, REFERENCES, INDEX, SELECT, INSERT, UPDATE, DELETE
ON `prisma_migrate_shadow_db\_%`.* TO 'shortlink_user'@'localhost';
```

## 6. Clone the repository

```bash
sudo mkdir -p /var/www && sudo chown "$USER":"$USER" /var/www
git clone https://github.com/YOUR_ORG/shortlink.git /var/www/shortlink
cd /var/www/shortlink
npm install
```

## 7. Configure environment

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Production values:

```
NODE_ENV=production
PORT=4000
DATABASE_URL="mysql://shortlink_user:***@localhost:3306/shortlink"
APP_ORIGIN="https://go.domain.com"
PUBLIC_BASE_URL="https://go.domain.com"
JWT_SECRET=<openssl rand -hex 48>      # generate with: openssl rand -hex 48
COOKIE_SECURE=true
SESSION_TTL_SECONDS=604800
```

`PUBLIC_BASE_URL` is what short URLs and QR codes are built from — it MUST be the
public domain so QR codes point at the public host.

## 8. Run Prisma migrations

```bash
cd /var/www/shortlink/backend
npx prisma migrate deploy
```

## 9. Seed the admin user (first deploy only)

```bash
npx prisma db seed
# admin@example.com / ChangeMe123!
```

Change the password immediately after first login (Profile page).

## 10. Build the app

```bash
cd /var/www/shortlink
npm run build
```

Outputs:
- `backend/dist/server.js` — the API bundle
- `frontend/dist/` — the Vue admin panel

## 11. Install and start PM2

```bash
sudo npm install -g pm2
cd /var/www/shortlink/backend
pm2 start ecosystem.config.cjs --env production
pm2 save

# boot persistence
pm2 startup            # prints a command; run it (it's sudo systemctl ...)
```

Process name: `shortlink-backend`, listening on `127.0.0.1:4000`.

Useful PM2 commands:

```bash
pm2 status
pm2 logs shortlink-backend --lines 100
pm2 restart shortlink-backend
pm2 reload shortlink-backend        # zero-downtime restart
pm2 monit
pm2 save                            # after any change
```

## 12. Configure Nginx

```bash
sudo cp /var/www/shortlink/nginx/shortlink.conf /etc/nginx/sites-available/shortlink
sudo ln -s /etc/nginx/sites-available/shortlink /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default     # remove the default site
sudo nginx -t && sudo systemctl reload nginx
```

Key routing rules (see `nginx/shortlink.conf`):

- `/admin` + `/assets` → Vue SPA (try_files → index.html)
- `/api/*` → proxy_pass `http://127.0.0.1:4000`
- everything else (`/:slug`) → proxy_pass `http://127.0.0.1:4000` (the 302 redirect)

The catch-all is REQUIRED for short links like `/promo2026` to reach Node.

## 13. SSL with Let's Encrypt / Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d go.domain.com
sudo certbot renew --dry-run        # verify auto-renewal works
```

Certbot rewrites the nginx config to add TLS + redirects HTTP→HTTPS.
Renewal runs automatically via a systemd timer — nothing else to configure.

Verify:

```bash
sudo systemctl list-timers | grep certbot
```

## 14. Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'     # 80 + 443
sudo ufw enable
sudo ufw status
```

Port 4000 must NOT be exposed publicly — Nginx is the only entry point.

## 15. Test the redirect

```bash
curl -I https://go.domain.com/promo2026
# HTTP/2 302
# location: https://example.com/promo

curl -I https://go.domain.com/api/health
# HTTP/2 200  {"ok":true}
```

The critical acceptance test: `302`, a `location` header, and **no HTML body**.

## 16. Database backup

See `docs/BACKUP.md` for mysqldump backups, restore, cron schedule and retention.

---

## Optional: Redis cache for the hot redirect path

Not required — the indexed MySQL lookup is fast enough for most workloads.
If you want it later:

1. `sudo apt install redis-server`
2. Add a small in-memory LRU map (or Redis) in front of `LinkRepository.findBySlug`
3. Invalidate the cached slug whenever a link is updated/deleted (the service layer
   already funnels every mutation through `LinkService`, so invalidation is one spot)

---

## Troubleshooting

- `PM2` app crashes on boot → `pm2 logs shortlink-backend`, check `DATABASE_URL` in `.env`
- `Prisma Client did not initialize` → `cd backend && npx prisma generate`
- Redirects return 404 for valid slugs → make sure the Nginx catch-all `location /` proxies to Node (not `try_files`)
- QR codes point at `localhost` → `PUBLIC_BASE_URL` is wrong in `backend/.env`
- CSRF errors in admin panel → cookies require HTTPS when `COOKIE_SECURE=true`; always access via `https://go.domain.com`
- 429 on login → rate limiter (10 attempts / 15 min per IP); wait or whitelist your IP
