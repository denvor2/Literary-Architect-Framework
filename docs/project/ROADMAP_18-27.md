# Literary Studio — Roadmap: Sprint 18–27

Детальный план на 10 спринтов. Составлен 2026-07-10. Конфиденность падает
по мере удаления от текущего спринта — контракты открываются через код,
не проектируются заранее (evolutionary architecture, ADR-0002).

Источники: `docs/vision/SPRINT_ROADMAP.md`,
`docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md`, `docs/project/BACKLOG.md`.

---

## Sprint 18 — Раздел «Идеи» в коллекции книги

**Цель:** добавить в Book раздел для свободных заметок (текст + авто-дата/время).
Чисто доменное расширение, без AI-операций.

**Уверенность:** Высокая.

### Step Cards

| Шаг | Описание | Файлы |
|-----|----------|-------|
| Step 01 | Добавить `ideas: Idea[]` в `Book` (`domain/model.ts`). `Idea = { id, text, createdAt }`. `normalizeBook()` — дефолт `ideas: []`. | `model.ts`, `workspaceStorage.ts` |
| Step 02 | `IdeasPanel.tsx` — список заметок + кнопка "Добавить" + редактирование inline + удаление. Дата создаётся автоматически, не редактируется. | `components/IdeasPanel.tsx`, `components/Sidebar.tsx` |
| Step 03 | Интеграция в unified book view: IdeasPanel отображается в `EditorArea.tsx` после списка персонажей (или как отдельная вкладка — решение по UX во время Step 02). | `EditorArea.tsx` |

### Definition of Done

- [ ] `Book.ideas` — массив `Idea`, каждый с `id`/`text`/`createdAt`
- [ ] `normalizeBook()` добавляет `ideas: []` для старых книг
- [ ] UI: создание, редактирование, удаление заметок
- [ ] Дата создаётся автоматически при создании
- [ ] `tsc`, `eslint`, `prettier`, `build` — чисто

---

## Sprint 19 — Critic: тематические подкатегории

**Цель:** расширить Critic четырьмя тематическими линзами —
Continuity/Fact/Developmental/Style — каждая с фокусированным промптом.

**Уверенность:** Средняя. Зависит от ADR по design subcategories.

### Step Cards

| Шаг | Описание | Файлы |
|-----|----------|-------|
| Step 01 | ADR-0009: дизайн Critic subcategories — как передаётся подкатегория (query param vs. system prompt suffix), какие 4 подкатегории, формат ответа (structured `reviews[]` как сейчас, или другой). | `docs/adr/ADR-0009-critic-subcategories.md` |
| Step 02 | Backend: `/api/critic` принимает опциональный `subcategory` параметр. Каждая подкатегория = уникальный system prompt suffix. Без подкатегории — поведение как сейчас ( backward compatible). | `app/api/critic/route.ts` |
| Step 03 | AI Bus: `critic_review` operation gaining optional `subcategory` field. `aiBus.execute()` пробрасывает. | `ai/operations.ts`, `ai/aiBus.ts` |
| Step 04 | UI: `AssistantPanel.tsx` — в Critic mode добавить выбор подкатегории (radio buttons или dropdown). Переключение подкатегории сбрасывает текущий thread (или нет —取决于 ADR-0009). | `AssistantPanel.tsx` |

### Definition of Done

- [ ] ADR-0009 принят
- [ ] `/api/critic` accepts `subcategory` (backward compatible)
- [ ] 4 подкатегории: Continuity, Fact, Developmental, Style
- [ ] Каждая подкатегория = уникальный system prompt
- [ ] UI: выбор подкатегории в Critic mode
- [ ] `tsc`, `eslint`, `prettier`, `build` — чисто

---

## Sprint 20 — Co-author: предложение структуры глав/сцен

**Цель:** Co-author предлагает структуру книги (главы/сцены с названиями
и описаниями), пользователь принимает через чекбоксы.

**Уверенность:** Средняя. Сложный UX, нужен ADR.

### Step Cards

| Шаг | Описание | Файлы |
|-----|----------|-------|
| Step 01 | ADR-00010: контракт structure proposal — формат предложения (массив ChapterProposal с scenes), как Co-author получает текущую структуру, формат ответа. | `docs/adr/ADR-0010-coauthor-structure-proposal.md` |
| Step 02 | Backend: новый тип операции `coauthor_propose_structure` (или расширение `/api/coauthor` с `mode: "structure"`). Промпт получает текущую структуру Book + текст, возвращает structured proposal. | `app/api/coauthor/route.ts`, `ai/operations.ts` |
| Step 03 | UI: `AssistantPanel.tsx` — в Co-author mode новый подрежим "Предложить структуру". Отображение proposal как дерева с чекбоксами. Уже существующие главы помечаются. | `AssistantPanel.tsx` |
| Step 04 | Принятие: кнопка "Добавить выбранное" / "Добавить всё". Маппинг proposal → реальные Chapter/Scene через workspace controller. | `AssistantPanel.tsx`, `useWorkspaceController.ts` |

### Definition of Done

- [ ] ADR-0010 принят
- [ ] Co-author может предложить структуру на основе текущего текста
- [ ] UI: дерево с чекбоксами, отмечаются существующие главы
- [ ] Кнопки "Добавить выбранное" / "Добавить всё"
- [ ] Предложение преобразуется в реальные Chapter/Scene
- [ ] `tsc`, `eslint`, `prettier`, `build` — чисто

---

## Sprint 21 — AI-операции с полями книги

**Цель:** помочь AI работать не только с текстом Scene, но и с метаданными
Book (заголовок, жанр, аннотация, synopsis).

**Уверенность:** Низкая. Новая архитектурная поверхность.

### Step Cards

| Шаг | Описание | Файлы |
|-----|----------|-------|
| Step 01 | ADR-0011: book-field operations — новый тип операции в AI Bus, формат запроса (field name + current value + context), формат ответа (suggested value + explanation). | `docs/adr/ADR-0011-book-field-operations.md` |
| Step 02 | Backend: новый endpoint `/api/book-field` (или расширение существующего). Промпт получает field name, current value, book context, возвращает suggestion. | `app/api/book-field/route.ts` |
| Step 03 | AI Bus: новый тип операции `book_field_suggestion`. `aiBus.execute()` dispatches. | `ai/operations.ts`, `ai/aiBus.ts` |
| Step 04 | UI: кнопка "AI-предложение" у каждого поля в book requisites блоке. Отображение suggestion с кнопками "Принять" / "Отклонить". | `EditorArea.tsx`, `AssistantPanel.tsx` |

### Definition of Done

- [ ] ADR-0011 принят
- [ ] AI может анализировать и предлагать значения для полей Book
- [ ] UI: кнопка "AI-предложение" у полей book requisites
- [ ] Suggestions отображаются с кнопками accept/reject
- [ ] `tsc`, `eslint`, `prettier`, `build` — чисто

---

## Sprint 22 — Docker + базовая инфраструктура

**Цель:** контейнеризация приложения, базовый docker-compose для
локальной разработки и деплоя.

**Уверенность:** Средняя. Техническая работа, мало архитектурных вопросов.

### Step Cards

| Шаг | Описание | Файлы |
|-----|----------|-------|
| Step 01 | `Dockerfile` — multi-stage build (builder + runner). Оптимизация: кэширование node_modules, .next cache. | `Dockerfile` |
| Step 02 | `docker-compose.yml` — сервис studio с env vars, port mapping, volume для данных. | `docker-compose.yml` |
| Step 03 | `.dockerignore` — исключение node_modules, .next, .git, docs. | `.dockerignore` |
| Step 04 | Валидация: `docker-compose build` + `docker-compose up` + проверка работоспособности. | — |

### Definition of Done

- [ ] `docker-compose build` проходит без ошибок
- [ ] `docker-compose up` запускает приложение
- [ ] Приложение доступно на localhost:3000
- [ ] Multi-stage build оптимизирован (образ < 200MB)
- [ ] `.dockerignore` исключает ненужные файлы

---

## Sprint 23 — PostgreSQL + Prisma

**Цель:** подключить PostgreSQL через Prisma, создать схему,
соответствующую доменной модели.

**Уверенность:** Средняя. Прямое следствие ADR-0003.

### Step Cards

| Шаг | Описание | Файлы |
|-----|----------|-------|
| Step 01 | `prisma/schema.prisma` — модели User, Book, Chapter, Scene, Character, Idea, AssistantThread, ChatMessage. Связи соответствии доменной иерархии. | `prisma/schema.prisma` |
| Step 02 | `docker-compose.yml` — добавить сервис postgres с volume, healthcheck. | `docker-compose.yml` |
| Step 03 | `prisma migrate dev` — первая миграция. Валидация: `prisma studio` показывает пустые таблицы. | — |
| Step 04 | `src/lib/db.ts` — Prisma client singleton. | `src/lib/db.ts` |

### Definition of Done

- [ ] PostgreSQL работает в docker-compose
- [ ] Prisma schema отражает доменную модель
- [ ] Миграция применена успешно
- [ ] Prisma client создан и доступен
- [ ] `tsc`, `eslint`, `prettier`, `build` — чисто

---

## Sprint 24 — Миграция localStorage → Database

**Цель:** заменить localStorage на PostgreSQL. Workspace controller
работает через repository, не через storage.

**Уверенность:** Средняя. Критический шаг, затрагивает все слои.

### Step Cards

| Шаг | Описание | Файлы |
|-----|----------|-------|
| Step 01 | Repository layer: `src/repositories/bookRepository.ts`, `chapterRepository.ts`, etc. CRUD операции через Prisma. | `src/repositories/*.ts` |
| Step 02 | `workspaceStorage.ts` — dual mode: read from localStorage (fallback) + write to DB. Postgres primary, localStorage backup. | `storage/workspaceStorage.ts` |
| Step 03 | Migration script: `scripts/migrate-localStorage-to-db.ts` — перенос существующих данных. | `scripts/` |
| Step 04 | `useWorkspaceController.ts` — переключение на repository layer. localStorage как fallback если DB недоступна. | `workspace/useWorkspaceController.ts` |

### Definition of Done

- [ ] Repository layer создан для всех сущностей
- [ ] Workspace controller работает через repository
- [ ] localStorage остаётся как fallback
- [ ] Migration script переносит данные
- [ ] Приложение работает с PostgreSQL
- [ ] `tsc`, `eslint`, `prettier`, `build` — чисто

---

## Sprint 25 — Environment + HTTPS + Production hardening

**Цель:** конфигурация окружения, HTTPS, базовый production hardening.

**Уверенность:** Средняя.

### Step Cards

| Шаг | Описание | Файлы |
|-----|----------|-------|
| Step 01 | `.env.example` + `.env.production` — DATABASE_URL, ANTHROPIC_API_KEY, NEXTAUTH_SECRET, NODE_ENV. Документация переменных. | `.env.example`, `.env.production` |
| Step 02 | `docker-compose.prod.yml` — production-специфичные настройки (replicas, restart policy, resource limits). | `docker-compose.prod.yml` |
| Step 03 | Nginx reverse proxy конфигурация: HTTPS (Let's Encrypt), rate limiting, security headers. | `nginx/nginx.conf` |
| Step 04 | Health check endpoint: `/api/health` — проверка DB connection, Anthropic API availability. | `app/api/health/route.ts` |

### Definition of Done

- [ ] `.env.example` документирует все переменные
- [ ] `docker-compose.prod.yml` работает
- [ ] Nginx конфигурация с HTTPS
- [ ] `/api/health` возвращает статус системы
- [ ] Rate limiting на API-роуты
- [ ] `tsc`, `eslint`, `prettier`, `build` — чисто

---

## Sprint 26 — Интеграция жанров с ЛитРес

**Цель:** список жанров подгружается из ЛитРес API, автокомплит
при выборе жанра книги.

**Уверенность:** Низкая. Зависит от наличия публичного API ЛитРес.

### Step Cards

| Шаг | Описание | Файлы |
|-----|----------|-------|
| Step 01 | Research: существует ли публичный API/список жанров ЛитРес? Альтернативы: ручной кэш, OpenLibrary genres, жанровое дерево с authortoday.ru. | `docs/research/litres-genres.md` |
| Step 02 | `src/services/genreService.ts` — загрузка + кэширование жанров (in-memory + DB cache). | `src/services/genreService.ts` |
| Step 03 | API route: `/api/genres` — возвращает дерево жанров. | `app/api/genres/route.ts` |
| Step 04 | UI: автокомплит в поле "Жанр" book requisites. Дерево с вложенностью, поиск по названию. | `EditorArea.tsx` |

### Definition of Done

- [ ] Исследование API ЛитРес проведено, альтернатива выбрана
- [ ] Genre service загружает и кэширует жанры
- [ ] `/api/genres` возвращает дерево жанров
- [ ] UI: автокомплит в поле "Жанр"
- [ ] `tsc`, `eslint`, `prettier`, `build` — чисто

---

## Sprint 27 — Серия книг

**Цель:** группы книг с общими персонажами и миром. Book может
принадлежать серии.

**Уверенность:** Низкая. Требует расширения доменной модели.

### Step Cards

| Шаг | Описание | Файлы |
|-----|----------|-------|
| Step 01 | ADR-0013: серия книг — доменная модель (Series как контейнер для Book? Character на уровне Series?). | `docs/adr/ADR-0013-book-series.md` |
| Step 02 | Domain: `Series` entity (`id`, `name`, `description`, `bookIds`). `Book` gaining `seriesId?`. | `domain/model.ts` |
| Step 03 | Prisma schema + миграция для Series. | `prisma/schema.prisma` |
| Step 04 | UI: `SeriesPanel.tsx` — создание серии, добавление книг. Sidebar: дерево серий → книги. | `components/SeriesPanel.tsx`, `Sidebar.tsx` |
| Step 05 | Workspace controller: series CRUD,关联 книг к сериям. | `useWorkspaceController.ts` |

### Definition of Done

- [ ] ADR-0013 принят
- [ ] Series entity в доменной модели
- [ ] Prisma schema + миграция
- [ ] UI: создание серии, добавление книг
- [ ] Sidebar: дерево серий
- [ ] `tsc`, `eslint`, `prettier`, `build` — чисто

---

## Sprint 28 — Мультипользовательская система: Админ + Пользователи

**Цель:** заменить временного "единственного локального пользователя" (введённого в Sprint 24
как заглушка, см. ADR-0012) полноценной системой ролей.

**Уверенность:** Низкая. Новая архитектурная поверхность (аутентификация), требует ADR.

**Срок:** зафиксирован Product Owner 2026-07-10 — не позже 5 спринтов от Sprint 24 (то есть не
позднее Sprint 29). Не проектировать раньше времени (evolutionary architecture) — но и не
пропустить: этот срок сам по себе является продуктовым решением, не предположением планировщика.

### Требования (зафиксированы Product Owner 2026-07-10, не переформулированы)

- **Админ:** все возможности Пользователя, плюс создание/редактирование пользователей,
  блокировка новых регистраций, просмотр здоровья БД, снятие бэкапа БД, режим настроек с
  просмотром и тонкой настройкой промптов AI-экспертов (Line Editor/Critic/Reader/Co-author) —
  зафиксировано Product Owner 2026-07-11. Затрагивает `apps/studio/src/app/api/*/route.ts`
  (сейчас system-промпты — константы в коде, потребуется вынести их в редактируемое хранилище,
  доступное только Админу).
- **Пользователь:** регистрация, авторизация, восстановление пароля, контрольные вопросы,
  капча.

### Step Cards

Не расписаны — по Evolutionary Architecture этот ADR/декомпозиция пишутся ближе к старту
спринта, не сейчас. `sprint-planner` должен прочитать ADR-0012 (Sprint 24) для контекста
временной User-модели перед декомпозицией. Следующий свободный номер ADR на момент написания —
ADR-0014 (ADR-0012 занят Sprint 24, ADR-0013 — Sprint 27); перепроверить актуальный свободный
номер на момент старта, если между 2026-07-10 и стартом Sprint 28 появятся другие ADR.

### Definition of Done

- [ ] ADR принят: модель ролей (Админ/Пользователь), схема аутентификации, хранение паролей
- [ ] Регистрация, авторизация, восстановление пароля, контрольные вопросы, капча — реализованы
- [ ] Админ может создавать/редактировать пользователей, блокировать регистрации
- [ ] Админ видит здоровье БД и может снять бэкап
- [ ] Временный единственный локальный пользователь (Sprint 24) заменён/смигрирован
- [ ] `tsc`, `eslint`, `prettier`, `build` — чисто

---

## Сводная таблица

| Sprint | Тема | Уверенность | Тип |
|--------|------|-------------|-----|
| 18 | Идеи/Заметки | Высокая | Домен |
| 19 | Critic subcategories | Средняя | AI |
| 20 | Co-author structure proposal | Средняя | AI + UX |
| 21 | Book field AI operations | Низкая | AI + Архитектура |
| 22 | Docker + инфраструктура | Средняя | DevOps |
| 23 | PostgreSQL + Prisma | Средняя | Инфраструктура |
| 24 | Миграция localStorage → DB | Средняя | Миграция |
| 25 | Production hardening | Средняя | DevOps |
| 26 | ЛитРес жанры | Низкая | Интеграция |
| 27 | Серия книг | Низкая | Домен |
| 28 | Мультипользовательская система (Админ + Пользователи) | Низкая | Архитектура + Auth |

## Зависимости

```
18 (Идеи) ───────────────────────────────────
19 (Critic) ──────────────────────────────────
20 (Co-author structure) ────────────────────
21 (Book fields) ────────────────────────────
22 (Docker) → 23 (PostgreSQL) → 24 (Migration) → 25 (Production)
                                  24 (Migration) → 28 (Multi-user, не позже Sprint 29)
26 (ЛитРес) ─────────────────────────────────
27 (Серия) ──────────────────────────────────
```

Sprint 22-25 — последовательная цепочка (каждый зависит от предыдущего). Sprint 28 зависит от
24 (заменяет временную single-user модель ADR-0012 вводит) — жёсткий срок: не позже Sprint 29
(зафиксировано Product Owner 2026-07-10).
Sprint 18-21, 26-27 — независимы друг от друга, могут идти в любом порядке.

## Рекомендуемый порядок

1. **Sprint 18** (Идеи) — быстрый, чисто доменный, без архитектурных вопросов
2. **Sprint 19** (Critic subcategories) — важен для продукта, средняя сложность
3. **Sprint 20** (Co-author structure) — важен для UX, средняя сложность
4. **Sprint 21** (Book fields) — архитектурное расширение, низкая уверенность
5. **Sprint 22-25** (Cloud deployment) — инфраструктурный блок
6. **Sprint 28** (Multi-user) — не позже Sprint 29 (жёсткий срок от Product Owner), планировать
   не позже, чем сразу после блока 22-25
7. **Sprint 26** (ЛитРес) — зависит от исследования API
8. **Sprint 27** (Серия) — требует ADR, низкая уверенность
