# NKB GLOBAL HUNTER — STAGING DEPLOYMENT GUIDE
## Target: Hostinger AlmaLinux 10 VPS (Isolated Staging Environment)

**MANDATORY ISOLATION POLICY:**
- Staging must be deployed on an isolated port / subdomain (`hunter-staging.nkb-cloud.internal` or dedicated staging port `5050`).
- Staging connects to an isolated staging database (`nkb_global_hunter_staging`).
- Never write to or modify existing production NKB Cloud, KBELLA, or Staff-Management databases.

---

## 1. Prerequisites on Hostinger VPS

- OS: AlmaLinux 9 or 10 / Rocky Linux
- Node.js: v22+ or v26+
- PostgreSQL: 14+ or 16+
- Nginx: Reverse proxy with HTTPS (Let's Encrypt / Certbot)
- PM2: Process supervision

```bash
# Verify Node and PostgreSQL
node -v
psql --version
nginx -v
```

---

## 2. PostgreSQL Staging Database Setup

Log into PostgreSQL on the VPS and create an isolated staging user and database:

```sql
-- Connect as postgres superuser
CREATE USER nkb_hunter_staging WITH PASSWORD 'SECURE_GENERATED_DB_PASS';
CREATE DATABASE nkb_global_hunter_staging OWNER nkb_hunter_staging;
GRANT ALL PRIVILEGES ON DATABASE nkb_global_hunter_staging TO nkb_hunter_staging;
```

---

## 3. Directory Layout on VPS

Clone or rsync the repository to an isolated staging directory:

```bash
mkdir -p /var/www/nkb-global-hunter-staging
cd /var/www/nkb-global-hunter-staging
```

---

## 4. Environment Configuration

Create `/var/www/nkb-global-hunter-staging/server/.env`:

```env
PORT=5000
NODE_ENV=staging

JWT_SECRET=REPLACE_WITH_GENERATED_64_CHAR_HEX_KEY
JWT_EXPIRES_IN=7d

ADMIN_EMAIL=admin@nkb-hunter.local
ADMIN_PASSWORD=Admin@NKB2026!

DATABASE_URL=postgres://nkb_hunter_staging:SECURE_GENERATED_DB_PASS@127.0.0.1:5432/nkb_global_hunter_staging

CORS_ORIGIN=http://hunter-staging.nkb-manufacturing.com
```

---

## 5. Build and Migration Execution

```bash
# 1. Install dependencies
cd /var/www/nkb-global-hunter-staging/server
npm install --production

# 2. Run Database Migrations against PostgreSQL Staging Database
npm run migrate

# 3. Build React Frontend Client
cd /var/www/nkb-global-hunter-staging/client
npm install
npm run build
```

---

## 6. PM2 Process Supervision

Create `/var/www/nkb-global-hunter-staging/ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [
    {
      name: 'nkb-hunter-staging-api',
      script: './server/src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'staging',
        PORT: 5000
      }
    }
  ]
};
```

Start the service:
```bash
pm2 start ecosystem.config.cjs
pm2 save
```

---

## 7. Nginx Reverse Proxy Configuration

Create `/etc/nginx/conf.d/nkb_hunter_staging.conf`:

```nginx
server {
    listen 80;
    server_name hunter-staging.nkb-manufacturing.com;

    # Static Client Assets
    root /var/www/nkb-global-hunter-staging/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Test and reload Nginx:
```bash
nginx -t
systemctl reload nginx
```
