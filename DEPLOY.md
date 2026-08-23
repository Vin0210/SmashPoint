# Deploying the Pickleball Booking System

Stack: Laravel 5.4 (API) + React 19/Vite (SPA) + MySQL.

## 1. Build the frontend

```bash
cd frontend
npm install
npm run build          # outputs to frontend/dist
```

- In development, Vite proxies `/api` to `http://127.0.0.1:8000` (see `vite.config.js`).
- In production, the SPA calls `/api` on its own domain by default.
  If your API lives on a different domain, create `frontend/.env.production`:

  ```
  VITE_API_BASE=https://api.yourdomain.com/api
  ```

## 2. Prepare the backend

```bash
cd backend
composer install --no-dev
cp .env.example .env      # then edit (below)
php artisan key:generate
php artisan migrate --seed --force
```

`.env` for production:

```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com
APP_TIMEZONE=Asia/Manila

DB_HOST=127.0.0.1
DB_DATABASE=pickleball_booking
DB_USERNAME=pickleball        # dedicated user, NOT root
DB_PASSWORD=strong-password

CORS_ALLOWED_ORIGIN=https://yourdomain.com   # * only for local dev
```

Create a dedicated MySQL user:

```sql
CREATE USER 'pickleball'@'localhost' IDENTIFIED BY 'strong-password';
GRANT ALL PRIVILEGES ON pickleball_booking.* TO 'pickleball'@'localhost';
FLUSH PRIVILEGES;
```

## 3A. Single-domain layout (recommended)

Point one vhost at the built SPA and expose `/api` from Laravel:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/frontend/dist;

    location /api {
        root /var/www/backend/public;   # Laravel public dir
        try_files $uri $uri/ /index.php?$query_string;
        # + standard php-fpm fastcgi block
    }

    location / {
        try_files $uri $uri/ /index.html;   # SPA fallback
    }
}
```

Apache equivalent: serve `frontend/dist` as DocumentRoot and alias
`/api` to `backend/public/index.php` with RewriteRule, or simply place
the contents of `frontend/dist` inside a folder served next to
Laravel's `public/`.

## 3B. Shared hosting (cPanel)

1. Upload `backend/` above webroot (e.g. `/home/user/backend`).
2. Point the domain's document root to `frontend/dist`.
3. Create `.htaccess` in `frontend/dist` forwarding `/api/*`
   to `backend/public/`, or use a subdomain `api.yourdomain.com`
   pointing at `backend/public` and set `VITE_API_BASE`.

## 4. Checklist before going live

- [ ] `APP_DEBUG=false` (errors return clean JSON)
- [ ] Dedicated DB user with password
- [ ] HTTPS enabled (tokens are sent as headers)
- [ ] Change the seeded admin password (`admin@pickleball.com`)
- [ ] Update wallet numbers in `frontend/src/payments.js` to the venue's real GCash/Maya/GoTyme accounts
- [ ] Schedule `php artisan schedule:run` or a cron cleanup if desired
