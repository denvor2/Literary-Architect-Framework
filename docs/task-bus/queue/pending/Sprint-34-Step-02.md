id: Sprint-34-Step-02
name: "Prisma schema: Story Bible поля (Series + Book)"
type: implementation

## Контекст

ADR-0016 принята. Теперь нужна Prisma миграция для добавления ~16 новых полей к Series и Book.

Миграция:
- `Series`: добавить targetAudience, genre[], decisions, throughlineElements[], seriesConstraints[], notes, firstPublishedDate, author
- `Book`: добавить workingTitle, targetAudience, genre[], estimatedWordCount, estimatedChapters, status, mainPlotlines[], principle, escalation, themes[], bookConstraints[], notes, publishedDate, isbn

## Scope

### Allowed paths (ТОЛЬКО):
- apps/studio/prisma/schema.prisma (новые поля + enum SeriesStatus, BookStatus)
- Новая миграция 20260714XXXXXX_add_story_bible

### Forbidden paths:
- apps/studio/src/** (реализация идёт в Step 03)
- Логика наследования (в Step 05)

## Objective

1. **Обновить schema.prisma:**
   - `Series` модель: добавить все Story Bible поля
   - `Book` модель: добавить все Story Bible поля
   - Добавить enum: `enum SeriesStatus { outline, in_progress, complete, published }`
   - Добавить enum: `enum BookStatus { outline, draft, editing, beta, published }`

2. **Prisma migration:**
   - `npx prisma migrate dev --name add_story_bible`
   - Миграция должна содержать ADD COLUMN для всех полей
   - Для array полей (genre[], mainPlotlines[], etc) использовать PostgreSQL text[] или JSON

3. **Документация:**
   - Комментарии в schema.prisma для каждого нового поля

## Примечание: JSON vs Text[]

Для массивов используем **JSON type** (удобнее для Prisma):
```prisma
genre                  Json?              // stored as JSON array: ["Fantasy", "Sci-Fi"]
throughlineElements    Json?              // JSON array of strings
seriesConstraints      Json?              // JSON array of strings
mainPlotlines          Json?              // JSON array of strings
themes                 Json?              // JSON array of strings
bookConstraints        Json?              // JSON array of strings
```

В Prisma это автоматически маппится на `string[]` при чтении.

## Validation

1. `npx tsc --noEmit` — TypeScript errors?
2. `npx prisma generate` — Prisma client генерируется?
3. `docker compose up -d postgres` — БД запущена?
4. `npx prisma migrate dev` — миграция применяется?
5. `docker compose exec postgres psql -U literary -d literary_studio -c '\d series'` — проверить поля созданы?

## Output

ARP файлом в docs/task-bus/queue/active/:
1. Скриншот schema.prisma (новые поля)
2. Результат `npx prisma generate` (успешно)
3. Результат миграции (migration file path)
4. Результат psql запроса (все поля видны)

## Stop Condition

Не коммитить без подтверждения Product Owner.
