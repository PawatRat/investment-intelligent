# Deployment Plan

## Overview

Investment Intelligent is a React frontend + Express backend application. Posts are stored as Markdown files on disk — there is no database.

**Architecture:**
- **Frontend:** React 18 + Vite (builds to static files in `dist/`)
- **Backend:** Node.js + Express (serves API + static uploads)
- **Content:** Markdown files in `content/posts/` (file-based, no database)
- **Runtime requirements:** Node.js 18+

---

## 1. Build

```bash
# Install dependencies
npm install

# Build frontend for production
npm run build

# The `dist/` folder now contains the production frontend assets.
```

---

## 2. Environment Variables

Create a `.env` file in the project root (not committed to Git):

```env
PORT=3001
NODE_ENV=production
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Express server port |
| `NODE_ENV` | `development` | Set to `production` to disable dev features |

---

## 3. Option A: VPS Deployment (Recommended for Full Control)

### 3.1 Server Setup

**Requirements:** Ubuntu 22.04/24.04 LTS, 1 CPU, 1GB RAM minimum.

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### 3.2 Deploy Application

```bash
# On your local machine, copy files to server
rsync -avz --exclude=node_modules --exclude=.git --exclude=dist ./ user@your-server:/var/www/investment-intelligent/

# SSH into server
cd /var/www/investment-intelligent

# Install dependencies
npm install --production

# Build frontend
npm run build

# Ensure content directory exists
mkdir -p content/posts public/uploads

# Start with PM2
pm2 start server/index.js --name investment-intelligent
pm2 save
pm2 startup systemd
```

### 3.3 Nginx Configuration

Create `/etc/nginx/sites-available/investment-intelligent`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /var/www/investment-intelligent/dist;
        try_files $uri $uri/ /index.html;
    }

    # API and uploads proxy to Express
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/investment-intelligent /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3.4 SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 4. Option B: Platform-as-a-Service (PaaS)

### Railway / Render / Fly.io

These platforms work well for Node.js apps.

**Important:** Since posts are file-based, you need **persistent disk** or the `content/posts/` directory will be wiped on every deploy.

**Railway:** Add a volume mount at `/app/content/posts` and `/app/public/uploads`.

**Render:** Use a Blueprint with `disk:` enabled:

```yaml
services:
  - type: web
    name: investment-intelligent
    runtime: node
    buildCommand: npm install && npm run build
    startCommand: node server/index.js
    disk:
      name: content
      mountPath: /app/content/posts
      sizeGB: 1
```

**Fly.io:** Add a `[mounts]` section in `fly.toml`:

```toml
[mounts]
  source = "content_data"
  destination = "/app/content/posts"
```

---

## 5. Option C: Static Frontend + Separate Backend

If you prefer to host the frontend on a CDN:

1. Build the frontend: `npm run build`
2. Deploy `dist/` to Vercel, Netlify, Cloudflare Pages, or S3 + CloudFront
3. Deploy the Express backend to Railway, Render, Fly.io, or a VPS
4. Update the API base URL in the frontend code or use environment variables

**Note:** The current Vite dev proxy (`vite.config.js`) only works in development. For production, you need the frontend and backend on the same domain (Option A) or configure CORS on the backend.

---

## 6. File Persistence (Critical)

**This application stores all content as files.** If you deploy to a platform without persistent storage, your posts will disappear on every redeploy.

**Solutions:**

| Approach | How |
|---|---|
| **Persistent disk** | Mount a volume at `content/posts/` and `public/uploads/` |
| **Git-based content** | Keep `content/posts/` in Git and redeploy on every content change |
| **External storage** | Mount S3/MinIO via `s3fs-fuse` to `content/posts/` |
| **Backup to Git** | Cron job that commits `content/posts/` to a private repo nightly |

**Recommended for VPS:**

```bash
# Daily backup of posts to a private Git repo
crontab -e
# Add:
0 3 * * * cd /var/www/investment-intelligent/content/posts && git add . && git commit -m "auto: $(date +\%Y-\%m-\%d)" && git push origin main
```

---

## 7. Process Management

On a VPS, always use a process manager so the app restarts if it crashes.

**PM2 (recommended):**

```bash
# Start
pm2 start server/index.js --name investment-intelligent

# Restart
pm2 restart investment-intelligent

# View logs
pm2 logs investment-intelligent

# Auto-start on boot
pm2 startup
pm2 save
```

**Systemd service** (alternative, no PM2 needed):

Create `/etc/systemd/system/investment-intelligent.service`:

```ini
[Unit]
Description=Investment Intelligent
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/investment-intelligent
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable investment-intelligent
sudo systemctl start investment-intelligent
sudo systemctl status investment-intelligent
```

---

## 8. Security Checklist

- [ ] **Firewall:** Only open ports 22 (SSH), 80 (HTTP), and 443 (HTTPS)
- [ ] **Fail2ban:** Install to prevent brute-force SSH attacks
- [ ] **SSL:** Enforce HTTPS with Let's Encrypt
- [ ] **File permissions:** `chmod 755 /var/www/investment-intelligent`, never run as root
- [ ] **Backups:** Automate daily backups of `content/posts/` and `public/uploads/`
- [ ] **Updates:** Schedule `apt upgrade` for security patches

---

## 9. CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci
      - run: npm run build

      - name: Deploy to server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          source: "dist/,server/,content/,package.json,package-lock.json"
          target: "/var/www/investment-intelligent"
          strip_components: 0

      - name: Restart service
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/investment-intelligent
            npm install --production
            pm2 restart investment-intelligent
```

**Required GitHub Secrets:**
- `HOST` — your server IP or domain
- `USERNAME` — SSH user (e.g., `deploy`)
- `SSH_KEY` — private key for passwordless SSH

---

## 10. Rollback Plan

If a deployment breaks:

```bash
# On the server
cd /var/www/investment-intelligent

# Revert to previous code (if using Git)
git reset --hard HEAD~1

# Rebuild
npm run build

# Restart
pm2 restart investment-intelligent

# Or restore content from backup
tar -xzf /backups/investment-intelligent-$(date +%Y%m%d).tar.gz -C /
```

---

## Quick Reference

| Task | Command |
|---|---|
| Build | `npm run build` |
| Start (prod) | `NODE_ENV=production node server/index.js` |
| Start (dev) | `npm run dev` |
| Check status | `pm2 status` |
| View logs | `pm2 logs investment-intelligent` |
| Nginx test | `sudo nginx -t` |
| Nginx restart | `sudo systemctl restart nginx` |
| SSL renew | `sudo certbot renew --dry-run` |
