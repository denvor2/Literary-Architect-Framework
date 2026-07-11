# Sprint-27-Step-06 ARP: Prisma migration deployment docs

## Что сделано

Документирована процедура развёртывания Prisma-миграций для production-окружения и автоматизирована миграция в Docker контейнере.

**Файлы:**
1. `docs/project/DEPLOYMENT.md` — новая секция "Database Migrations" с полной стратегией
2. `README.md` — добавлена секция "Production Deployment Checklist"
3. `apps/studio/Dockerfile` — обновлена runner stage с prisma/ и entrypoint.sh
4. `apps/studio/entrypoint.sh` — новый скрипт (Option A) для запуска миграций при старте

**Миграция стратегия:**
- **Первый deploy на чистую БД:** все миграции применяются вместе через `prisma migrate deploy`
- **Последующие deploys:** только новые миграции из apps/studio/prisma/migrations/ применяются

**Dockerfile изменения:**
- Скопирован node_modules (для Prisma CLI)
- Скопирована prisma/ папка (схема и миграции)
- Добавлен entrypoint.sh с правами на выполнение
- Заменён CMD на ENTRYPOINT

**entrypoint.sh:**
```bash
#!/bin/bash
npx prisma migrate deploy
exec "$@"
```

## Соответствие Scope

- ✓ **Allowed paths:** docs/project/DEPLOYMENT.md, README.md, apps/studio/Dockerfile, apps/studio/entrypoint.sh
- ✓ **Forbidden paths:** apps/studio/src/**, prisma/schema.prisma, docker-compose файлы не тронуты

## Validation

1. **TypeScript** — ✓ no errors
2. **ESLint** — ✓ clean
3. **Prettier** — ✓ formatted
4. **npm run build** — ✓ successful (Turbopack, API routes)
5. **docker-compose config** — ✓ valid with updated Dockerfile

## Documentation

- DEPLOYMENT.md: Development vs Production подходы ✓
- DEPLOYMENT.md: Жизненный цикл миграций ✓
- DEPLOYMENT.md: Инструкции для первого deploy ✓
- DEPLOYMENT.md: Инструкции для последующих deploy'ов ✓
- README.md: Production Deployment Checklist ✓

---

**STATUS:** Готово к review. Коммит ожидает `STATUS: OK`.
