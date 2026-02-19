# MedGama — Production Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start (Single Command)](#quick-start)
3. [SSL Certificate Setup](#ssl-certificate-setup)
4. [WebSocket (Reverb) over SSL](#websocket-reverb-over-ssl)
5. [Environment Configuration](#environment-configuration)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

- Docker Engine 24+ & Docker Compose v2
- Domain names: `medgama.com` + `api.medgama.com` pointing to your server
- Minimum server: 2 vCPU, 4GB RAM, 40GB SSD

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Cross4solution/MedGama.git
cd MedGama

# 2. Configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env — set DB_PASSWORD, APP_KEY, REVERB keys, MAIL credentials

# 3. Generate Laravel app key
docker-compose run --rm app php artisan key:generate

# 4. Build frontend
npm ci --legacy-peer-deps
REACT_APP_API_BASE=https://api.medgama.com/api \
REACT_APP_REVERB_APP_KEY=your-reverb-app-key \
REACT_APP_REVERB_HOST=api.medgama.com \
REACT_APP_REVERB_PORT=443 \
npx react-scripts build

# 5. Create SSL directory (see SSL section below)
mkdir -p docker/ssl

# 6. Start everything
docker-compose up -d

# 7. Run migrations
docker-compose exec app php artisan migrate --force

# 8. Optimize Laravel
docker-compose exec app php artisan config:cache
docker-compose exec app php artisan route:cache
docker-compose exec app php artisan view:cache
```

## SSL Certificate Setup

### Option A: Let's Encrypt (Free, Auto-renewal)

```bash
# 1. First, start nginx without SSL (comment out 443 blocks in nginx.conf)
# 2. Get initial certificate:
docker-compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d medgama.com -d www.medgama.com -d api.medgama.com \
  --email admin@medgama.com --agree-tos --no-eff-email

# 3. Certificates are saved to docker/ssl/live/medgama.com/
# 4. Create symlinks:
ln -s live/medgama.com/fullchain.pem docker/ssl/fullchain.pem
ln -s live/medgama.com/privkey.pem docker/ssl/privkey.pem

# 5. Restart nginx with full SSL config
docker-compose restart nginx
```

The `certbot` service in docker-compose auto-renews every 12 hours.

### Option B: Custom SSL Certificate

```bash
# Place your certificate files:
cp your-fullchain.pem docker/ssl/fullchain.pem
cp your-privkey.pem docker/ssl/privkey.pem
```

## WebSocket (Reverb) over SSL

### Architecture

```
Client (Browser)
    │
    │  wss://api.medgama.com/app/{key}
    │
    ▼
┌─────────────────────────┐
│  Nginx (port 443, SSL)  │
│  location /app/ {       │
│    proxy_pass reverb:8080│
│    Upgrade: websocket   │
│  }                      │
└─────────────────────────┘
    │
    │  ws://reverb:8080 (internal, no SSL)
    │
    ▼
┌─────────────────────────┐
│  Laravel Reverb          │
│  (port 8080, internal)   │
└─────────────────────────┘
```

### How It Works

1. **Nginx terminates SSL** on port 443
2. The `/app/*` location block proxies WebSocket connections to Reverb (internal port 8080)
3. Reverb runs **without SSL** internally — Nginx handles all encryption
4. The `proxy_set_header Upgrade` and `Connection "upgrade"` headers enable the WebSocket protocol upgrade

### Backend `.env` Configuration

```env
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=medgama
REVERB_APP_KEY=your-reverb-app-key        # Generate: openssl rand -hex 16
REVERB_APP_SECRET=your-reverb-app-secret  # Generate: openssl rand -hex 32
REVERB_HOST=0.0.0.0
REVERB_PORT=8080
REVERB_SCHEME=https
```

### Frontend `.env` Configuration

```env
# For Reverb via Nginx SSL proxy:
REACT_APP_REVERB_APP_KEY=your-reverb-app-key  # Must match backend REVERB_APP_KEY
REACT_APP_REVERB_HOST=api.medgama.com          # Public domain (NOT internal hostname)
REACT_APP_REVERB_PORT=443                       # Nginx SSL port (NOT 8080)
```

### Key Nginx Config (already in `docker/nginx/nginx.conf`)

```nginx
location /app/ {
    proxy_pass http://reverb;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400s;   # 24h — keep WebSocket alive
    proxy_send_timeout 86400s;
}
```

### Broadcasting Auth

The `/broadcasting/auth` endpoint is handled by Laravel (PHP-FPM) through the standard Nginx PHP location block. The frontend's Echo client sends a POST to this endpoint with the Sanctum token to authorize private channel subscriptions.

## Environment Configuration

### Production Checklist

| Setting | Value | Why |
|---------|-------|-----|
| `APP_ENV` | `production` | Enables caching, disables debug features |
| `APP_DEBUG` | `false` | **Critical**: prevents stack traces in responses |
| `APP_KEY` | `base64:...` | Generate with `php artisan key:generate` |
| `SESSION_ENCRYPT` | `true` | Encrypts session data |
| `SESSION_SECURE_COOKIE` | `true` | Cookies only sent over HTTPS |
| `SESSION_DOMAIN` | `.medgama.com` | Shared across subdomains |
| `LOG_LEVEL` | `warning` | Reduces log noise in production |
| `CACHE_STORE` | `redis` | Fast in-memory cache |
| `QUEUE_CONNECTION` | `redis` | Async job processing |
| `BCRYPT_ROUNDS` | `12` | Strong password hashing |

### Secrets to Set (never commit these)

- `APP_KEY` — `php artisan key:generate`
- `DB_PASSWORD` — strong random password
- `REVERB_APP_KEY` — `openssl rand -hex 16`
- `REVERB_APP_SECRET` — `openssl rand -hex 32`
- `MAIL_USERNAME` / `MAIL_PASSWORD` — SMTP credentials

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push to `main` and `new-development`:

### Jobs

| Job | What it does |
|-----|-------------|
| **Backend Tests** | PHP 8.3 + PostgreSQL 16 + Redis 7 → `php artisan test` |
| **Frontend Build** | Node 20 → `npm ci` + `react-scripts build` |
| **Docker Build** | (main only) Builds backend Docker image to verify Dockerfile |

### Branch Protection (Recommended)

In GitHub → Settings → Branches → Branch protection rules:
- Require status checks: `Backend Tests`, `Frontend Build`
- Require PR reviews before merging to `main`

## Monitoring & Maintenance

### Useful Commands

```bash
# View logs
docker-compose logs -f app
docker-compose logs -f nginx
docker-compose logs -f reverb
docker-compose logs -f queue

# Run artisan commands
docker-compose exec app php artisan migrate --force
docker-compose exec app php artisan config:cache
docker-compose exec app php artisan queue:restart

# Database backup
docker-compose exec postgres pg_dump -U medgama medgama > backup_$(date +%Y%m%d).sql

# Scale queue workers
docker-compose up -d --scale queue=3

# Restart a single service
docker-compose restart reverb
```

### Health Checks

- **PHP-FPM**: Built-in healthcheck via `php-fpm-healthcheck`
- **PostgreSQL**: `pg_isready` every 10s
- **Redis**: `redis-cli ping` every 10s
- **Nginx**: Responds on port 80/443

### Log Rotation

Laravel daily logs are stored in `backend/storage/logs/`. Configure logrotate or use:

```bash
# Clean logs older than 14 days
docker-compose exec app find storage/logs -name "*.log" -mtime +14 -delete
```
