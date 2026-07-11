# Production Deployment Guide

## Overview

This guide covers deployment of Literary Studio to production environments using Docker Compose, PostgreSQL, and Nginx reverse proxy with HTTPS.

## Environment Configuration

### Required Variables

- `DATABASE_URL` — PostgreSQL connection string (e.g., `postgresql://user:password@host:5432/literary_studio`)
- `ANTHROPIC_API_KEY` — API key for Claude integration

### Optional Variables

- `NODE_ENV` — Set to `production` for production deployments (default: `development`)
- `PORT` — Application port (default: `3000`)
- `HOSTNAME` — Bind hostname (default: `localhost`, use `0.0.0.0` for Docker)
- `RATE_LIMIT_ENABLED` — Enable rate limiting (default: `true`)
- `RATE_LIMIT_REQUESTS_PER_WINDOW` — Max requests per window (default: `10`)
- `RATE_LIMIT_WINDOW_MS` — Window duration in milliseconds (default: `900000` = 15 minutes)
- `DB_PASSWORD` — PostgreSQL password for production database

### Local Development Setup

Create `apps/studio/.env.local`:
```
DATABASE_URL=postgresql://studio:password@localhost:5432/literary_studio
ANTHROPIC_API_KEY=your-api-key-here
NODE_ENV=development
PORT=3000
HOSTNAME=localhost
RATE_LIMIT_ENABLED=false
```

### Docker Environment

Create `.env.prod`:
```
DATABASE_URL=postgresql://studio:password@postgres:5432/literary_studio
ANTHROPIC_API_KEY=your-api-key-here
DB_PASSWORD=password
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_WINDOW=10
RATE_LIMIT_WINDOW_MS=900000
```

## Database Migrations

### Strategy

**First Deployment (empty database):**
- All pending migrations in `apps/studio/prisma/migrations/` are applied together
- No risk of partial schema state
- Automatic via `entrypoint.sh` → `prisma migrate deploy`

**Subsequent Deployments:**
- Only new migrations since last deployment are applied
- Existing data preserved
- Automatic via Docker entrypoint

### Running Migrations Manually

Development environment:
```bash
cd apps/studio
npx prisma migrate dev
```

Production (Docker):
```bash
docker-compose -f docker-compose.prod.yml up --force-recreate studio
```

The `entrypoint.sh` automatically runs `prisma migrate deploy` before application startup.

### Dockerfile Configuration

The `apps/studio/Dockerfile` is configured for Option A (automated):
- Copies `prisma/` directory with schema and migrations
- Uses `entrypoint.sh` to run migrations
- Sets `ENTRYPOINT` (not `CMD`) to ensure migrations run on every container start

## Database Backup & Restore

### Manual Backup

```bash
# Using pg_dump directly
pg_dump "postgresql://user:password@host/literary_studio" > backup.sql

# Using provided script
./scripts/backup-db.sh
```

Backups are timestamped: `backup-literary_studio-YYYYMMDD-HHMMSS.sql`

### Automated Backup (Cron)

Add to crontab for daily backup at 02:00 UTC:
```bash
0 2 * * * cd /path/to/literary-studio && DATABASE_URL="postgresql://..." ./scripts/backup-db.sh
```

Backups older than 30 days are automatically deleted (configurable via `BACKUP_RETENTION_DAYS`).

### Restore from Backup

**WARNING:** This will overwrite all database data.

```bash
./scripts/backup-db-restore.sh backups/backup-literary_studio-YYYYMMDD-HHMMSS.sql
```

The script will prompt for confirmation before proceeding.

## Production Deployment

### Prerequisites

- Docker and Docker Compose installed
- PostgreSQL connection string (or use bundled PostgreSQL service)
- Anthropic API key
- SSL/TLS certificates (auto-generated or provide real certificates)

### Quick Start

1. **Clone repository and navigate to project:**
   ```bash
   git clone <repo> literary-studio
   cd literary-studio
   ```

2. **Create `.env.prod` with production variables** (see Environment Configuration above)

3. **Start production stack:**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
   ```

4. **Verify health:**
   ```bash
   curl -k https://localhost/api/health
   ```

### SSL/TLS Certificates

**Self-Signed (development/testing):**
- Auto-generated on first startup
- Located in `nginx/certs/`
- Valid for 365 days

**Production (Let's Encrypt or Commercial):**
1. Obtain certificates (e.g., via Certbot)
2. Place `cert.pem` and `key.pem` in `nginx/certs/` before starting
3. Restart Nginx container

### Scaling & Load Balancing

The Docker Compose configuration exposes Nginx on ports 80 (HTTP) and 443 (HTTPS). For multi-instance deployments:

1. Use external load balancer (AWS ALB, Azure LB, etc.)
2. Point to Nginx container on target infrastructure
3. Database and Studio are internal-only (not directly exposed)

## Production Checklist

- [ ] Environment variables configured in `.env.prod`
- [ ] Database initialized (first deploy runs migrations automatically)
- [ ] SSL/TLS certificates in place or auto-generation enabled
- [ ] Backup scripts tested with `DATABASE_URL`
- [ ] Cron job configured for automated backups
- [ ] Health check endpoint responding: `curl -k https://your-domain/api/health`
- [ ] Rate limiting configured appropriately for expected load
- [ ] Logs monitored (Docker Compose logs available via `docker-compose logs`)

## Troubleshooting

### Database Connection Issues

Check PostgreSQL service:
```bash
docker-compose -f docker-compose.prod.yml logs postgres
docker-compose -f docker-compose.prod.yml exec postgres psql -U studio -d literary_studio -c "SELECT 1"
```

### Application Not Starting

Check Studio service logs:
```bash
docker-compose -f docker-compose.prod.yml logs studio
```

Common causes:
- Missing `ANTHROPIC_API_KEY` environment variable
- Database not ready (check PostgreSQL healthcheck)
- Port already in use (change `PORT` environment variable)

### SSL/TLS Certificate Errors

1. Verify certificates exist: `ls -la nginx/certs/`
2. Check Nginx logs: `docker-compose -f docker-compose.prod.yml logs nginx`
3. Regenerate self-signed certs: Delete `nginx/certs/` and restart Nginx container

### Rate Limiting Issues

If legitimate users are being rate-limited:
- Increase `RATE_LIMIT_REQUESTS_PER_WINDOW`
- Increase `RATE_LIMIT_WINDOW_MS` (milliseconds)
- Disable with `RATE_LIMIT_ENABLED=false` (not recommended for production)

## Security Considerations

1. **Keep `DATABASE_URL` and `ANTHROPIC_API_KEY` secret** — Use secure secret management
2. **Use real SSL/TLS certificates** in production (not self-signed)
3. **Enable rate limiting** to protect against abuse
4. **Regularly backup database** — Automate with cron
5. **Monitor logs** for suspicious activity
6. **Keep Docker images updated** — Rebuild regularly with latest base images

## Support

For issues or questions, refer to README.md or project documentation.
