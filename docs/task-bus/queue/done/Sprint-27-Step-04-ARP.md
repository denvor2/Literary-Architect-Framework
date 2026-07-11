# Sprint-27-Step-04 ARP: Production docker-compose + Nginx

## Что сделано

Реализована полная production-конфигурация с Docker Compose и Nginx HTTPS reverse proxy.

**Файлы:**
1. `docker-compose.prod.yml` — production stack с PostgreSQL, Studio, Nginx
2. `nginx/Dockerfile` — Nginx image с конфигурацией
3. `nginx/nginx.conf` — HTTPS reverse proxy с SSL/TLS
4. `nginx/init-certs.sh` — автоматическое создание self-signed сертификатов
5. `docs/project/DEPLOYMENT.md` — полное руководство по развёртыванию
6. `README.md` — обновлена ссылка на production guide

**Компоненты:**
- PostgreSQL: изолирована внутри контейнера, не exposed на хост
- Studio: доступен только через Nginx на портах 80/443
- Nginx: слушает 80 (HTTP redirect) и 443 (HTTPS)
- Сертификаты: auto-generated при первом запуске или replaceable на реальные

## Соответствие Scope

- ✓ **Allowed paths:** docker-compose.prod.yml, nginx/**, docs/project/DEPLOYMENT.md, README.md, .gitignore
- ✓ **Forbidden paths:** docker-compose.yml dev-версия, apps/studio/Dockerfile, src/**, schema.prisma не тронуты

## Validation

1. **docker-compose config** — ✓ valid YAML
2. **TypeScript** — ✓ no errors
3. **ESLint** — ✓ clean
4. **Prettier** — ✓ formatted
5. **npm run build** — ✓ successful

## Architecture

- PostgreSQL контейнер с volume persistence
- Studio контейнер не exposing port 3000 наружу
- Nginx слушает 80 (переводит на 443) и 443 (HTTPS)
- Self-signed сертификаты для dev, replaceable для production

---

**STATUS:** Готово к review. Коммит ожидает `STATUS: OK`.
