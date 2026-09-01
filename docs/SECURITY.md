# Security Hardening

What is implemented in the code, and what the production server should enforce
on top of it.

## In-app protections (already implemented)

- **Authentication**: JWT stored in an **httpOnly, SameSite=Lax** cookie; `secure`
  flag enabled in production (`COOKIE_SECURE=true`). 7-day session TTL
  (`SESSION_TTL_SECONDS`).
- **Password hashing**: argon2id (memory-hard), via the `argon2` library.
- **CSRF**: double-submit token — a non-httpOnly `csrf_token` cookie is set at
  login, and every non-GET `/api` request (except login/logout) must echo it in
  the `x-csrf-token` header. Enforced by middleware on all state-changing routes.
- **Rate limiting** (`express-rate-limit`):
  - login: 10 attempts / 15 min per IP
  - API: 600 requests / 15 min per IP
- **Helmet** security headers (CSP, X-Frame-Options, HSTS, nosniff, etc.).
- **Input validation** with zod on every API body/query (title, slug, URL, dates,
  pagination params, bulk IDs).
- **SSRF-aware URL validation** (`utils/url.ts`): destination URLs must be
  `http:`/`https:`; `file:`, `ftp:`, `gopher:`, `data:`, `javascript:` are
  rejected; `localhost`/`.localhost` hostnames are rejected. Admin-only feature,
  but defense-in-depth is cheap.
- **Slug validation**: `[A-Za-z0-9_-]{2,120}`, reserved-slug blocklist checked
  case-insensitively in both the API and the public redirect handler.
- **SQL injection**: all queries go through the Prisma ORM with parameterized
  queries — no raw SQL in the app.
- **XSS**: Vue auto-escapes all bindings; no `v-html` used.
- **404 instead of 403** for unknown slugs — no information leak about which
  slugs exist.
- **Geo-IP / UA parsing** runs async after the redirect is sent; a failure is
  swallowed and never blocks the redirect.

## Server hardening (Ubuntu)

```bash
# UFW firewall
sudo ufw default deny incoming
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# SSH: keys only, no root password login
sudo nano /etc/ssh/sshd_config
#   PasswordAuthentication no
#   PermitRootLogin prohibit-password
sudo systemctl restart ssh

# fail2ban (optional but recommended)
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
```

## Nginx security headers

Add inside the `server` block (see `nginx/shortlink.conf`):

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## Secrets management

- `backend/.env` is gitignored; never commit real credentials.
- `JWT_SECRET`: generate with `openssl rand -hex 48`; keep it private; rotating it
  invalidates all sessions (users must log in again).
- Database password: strong random value; the app user only has privileges on the
  `shortlink` database.
- Do not expose port 4000 publicly — only Nginx (80/443) is reachable.

## Operational checklist

- [ ] HTTPS only (Certbot auto-renewal verified)
- [ ] UFW enabled, only SSH + 80/443
- [ ] SSH key authentication, root password login disabled
- [ ] Admin password changed from the seeded default
- [ ] Daily mysqldump + tested restore (see `docs/BACKUP.md`)
- [ ] `pm2 save` + `pm2 startup` so the app survives reboots
- [ ] `pm2 monit` / external monitoring for the process
- [ ] Regular `apt update && apt upgrade`
- [ ] Keep an eye on logs: `journalctl -u nginx -f`, `pm2 logs shortlink-backend`
