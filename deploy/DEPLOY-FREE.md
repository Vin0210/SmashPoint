# Deploying SmashPoint for Free

Target: **GoogieHost** (free, lets you pick PHP 7.x which Laravel 5.4 needs).
AwardSpace works too — same steps, different panel names.

---

## What's in `deploy/`

| File | Purpose |
|---|---|
| `htdocs/` | Everything that gets uploaded (SPA + API merged) |
| `database.sql` | Full schema + data — import via phpMyAdmin |
| `.env.deploy` | Production config template → you will rename it to `.env` |
| `smashpoint-upload.zip` | Zipped `htdocs` for one-shot upload |

Layout used by this package (everything inside the web root):

```
<webroot>/              <- host's htdocs / public_html
├── index.php           <- Laravel front controller (points into core/)
├── .htaccess           <- routes /api & /photos to Laravel, rest to SPA
├── index.html          <- React app (built with npm run build)
├── assets/ ...         <- SPA bundle files
└── core/               <- full Laravel app incl. vendor/
```

---

## Step-by-step

### 1. Create the hosting account
1. Sign up at googiehost.com (free).
2. **Choose PHP 7.4** when asked (or change later in panel). Do NOT leave it on 8.x — Laravel 5.4 breaks.
3. Note your assigned domain, e.g. `yourname.us.freehost.pl`.

### 2. Create the database
1. In the control panel open **MySQL Databases** → create a database + user.
2. Open **phpMyAdmin**, select your new database → **Import** → upload `database.sql`.
3. You should see 11 tables including `users`, `courts`, `bookings`, `court_photos`.

### 3. Prepare your `.env`
1. Copy `deploy/.env.deploy`.
2. Replace the four `DB_*` placeholders with the credentials from step 2.
3. Replace both `YOUR-DOMAIN` values (`APP_URL`, `FRONTEND_URL`) with your real URL — include `https://`, no trailing slash.
4. Copy the `CRON_KEY=...` value from `backend/.env` (local machine) into the template.

### 4. Upload
1. Zip or drag the **contents of `deploy/htdocs/`** into the web root
   (`htdocs`, `public_html` — whatever your panel calls it).
2. Upload `.env` (the edited template) into `<webroot>/core/.env`.
   It MUST live next to `core/artisan`, not in the web root itself.
3. If the panel rejects a big file: upload `core/vendor` as its own zip
   and extract it inside `core/`.

### 5. Verify the site
- `https://your-domain/`          → SmashPoint sign-in screen
- `https://your-domain/api/courts` → JSON list of courts
- Register a fresh account, book a slot, check My Bookings.
- Forgot-password should send a real email (Gmail SMTP is preconfigured;
  if the host blocks port 587 you'll get the friendly 503 — see notes).

### 6. Keep reminders running (no cron on free hosts)
1. Create a free account at cron-job.org.
2. Add a job:
   - URL: `https://your-domain/api/cron/remind?key=YOUR_CRON_KEY`
   - Schedule: every 5 minutes.
3. Done — booking reminders now fire automatically, same as your local Windows task.

### 7. Lock down
- [ ] `APP_DEBUG=false` (already set in the template)
- [ ] Admin login uses your Gmail + the password YOU set (reset anytime via "Forgot password")
- [ ] Optional: delete demo rows from `bookings` table via phpMyAdmin

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| HTTP 500, blank page | `.env` missing/misplaced, or wrong `APP_KEY` — must start with `base64:` |
| `The only supported ciphers...` | `APP_KEY` not set correctly |
| API returns HTML instead of JSON | `.htaccess` didn't upload (hidden file! enable "show hidden") |
| Photos don't upload | chmod `core/storage` to 755 (or 775) recursively |
| Emails fail with timeout | Host blocks SMTP — set `BREVO_API_KEY` in `core/.env` (free brevo.com account, 300 emails/day) and all mail switches to their HTTP API automatically; SMS still works |
| Reset link opens wrong domain | `FRONTEND_URL` mismatch in `.env` |

## Notes on free-tier limits
- ~50k hits/day cap, no SSH, no real cron — fine for a demo/small venue.
- Semaphore SMS works from any host (plain HTTPS call), just add your key.
- If you outgrow it, the same package runs on any paid shared host unchanged,
  or move `core/` above the web root on a VPS for better security.

## PHP 8 compatibility patches (already applied to `core/vendor/`)
The bundled vendor folder is Laravel 5.4-era code with three hand-patches that
make it run on PHP 8.x (needed because hosts like GoogieHost only offer PHP 8):

1. `core/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php`
   - `handleError()` now returns false for `E_DEPRECATED` / `E_USER_DEPRECATED`
     instead of escalating them to exceptions.
2. `core/vendor/nesbot/carbon/src/Carbon/Carbon.php`
   - Both `setLastErrors(parent::getLastErrors())` call sites now normalize
     PHP 8.2's `false` return into an empty error array first.
3. `core/vendor/symfony/http-foundation/FileBag.php`
   - `convertFileInformation()` strips PHP 8.1+'s new `full_path` key from
     `$_FILES` entries so uploads are recognized again.

**Warning:** if you ever run `composer install` / `composer update` on the
server, these patches will be overwritten and uploads/deprecations will break
again. Re-apply them after any composer run.

