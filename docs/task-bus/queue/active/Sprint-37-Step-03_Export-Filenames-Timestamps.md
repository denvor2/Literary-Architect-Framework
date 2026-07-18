# Sprint-37-Step-03: Export Filenames with Timestamps

## Objective

Реализовать поддержку временных меток (timestamp) в названиях экспортируемых файлов. Сейчас при экспорте файл имеет статическое имя (book.json/book.docx), сложно различить разные версии одной книги. Нужно добавить автоматическую дата-время метку во все форматы экспорта (Markdown ZIP, DOCX, PDF, FB2, JSON).

## Why Now

- Пользователь делает несколько экспортов одной книги за день
- Без временных меток сложно найти нужный файл в Downloads
- Стандартная практика для всех export функций (Office, Figma, etc.)
- JSON экспорт требуется как часть системы резервного копирования

## Scope

**Что входит:**
- Функция `generateFilename(bookTitle, extension)` в ExportDialog.tsx
- Интеграция timestamp в обработчики экспорта (all 5 formats: markdown-zip, docx, pdf, fb2, json)
- E2E тесты проверяющие реальные скачиваемые файлы (не только API requests)
- JSON export с полной структурой книги (chapters, scenes, characters, ideas)
- Обновление CRITICAL_FEATURES.md

**Что не входит (future steps):**
- PDF/FB2 реализация (только JSON + интеграция существующих форматов)
- Кастомизация формата timestamp
- Массовые экспорты

## Allowed Paths

- `apps/studio/src/components/ExportDialog.tsx` — функция generateFilename, интеграция в диалог
- `apps/studio/src/app/page.tsx` — интеграция timestamp в обработчики экспорта
- `apps/studio/e2e/export-timestamps.spec.ts` — E2E тесты
- `docs/project/CRITICAL_FEATURES.md` — обновить таблицу функций

## Forbidden Paths

- ❌ Нельзя трогать API routes (`apps/studio/src/app/api/`)
- ❌ Нельзя менять Prisma schema
- ❌ Нельзя менять другие компоненты (Header, Sidebar, etc.)

## Acceptance Criteria

- [x] **JSON экспорт** реализован: `book-title_2026-07-18_14-35-42.json`
- [x] **Markdown ZIP** с timestamp: `book-title_2026-07-18_14-35-42.zip`
- [x] **DOCX** с timestamp: `book-title_2026-07-18_14-35-42.docx`
- [x] **PDF** с timestamp: `book-title_2026-07-18_14-35-42.pdf`
- [x] **FB2** с timestamp: `book-title_2026-07-18_14-35-42.fb2`
- [x] **Формат timestamp:** `YYYY-MM-DD_HH-mm-ss` (e.g. 2026-07-18_14-35-42)
- [x] **E2E тесты** проверяют реальные скачиваемые файлы (не только API requests)
- [x] **npm run validate** PASSES (format check, tsc, eslint, build, e2e tests)
- [x] **CRITICAL_FEATURES.md** обновлена с новыми функциями

## Implementation Details

### Timestamp Generation

```typescript
function generateFilename(bookTitle: string, extension: string): string {
  const now = new Date();
  const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-mm-ss
  const sanitized = bookTitle
    .toLowerCase()
    .replace(/[^a-z0-9а-я]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${sanitized}_${date}_${time}.${extension}`;
}
```

### Format Support Matrix

| Format | Status | Filename | Notes |
|--------|--------|----------|-------|
| JSON | ✅ DONE | `book_YYYY-MM-DD_HH-mm-ss.json` | Полная структура (Book + Chapters + Scenes) |
| Markdown ZIP | ✅ DONE | `book_YYYY-MM-DD_HH-mm-ss.zip` | Используется generateFilename |
| DOCX | ✅ DONE | `book_YYYY-MM-DD_HH-mm-ss.docx` | Используется generateFilename |
| PDF | ✅ DONE | `book_YYYY-MM-DD_HH-mm-ss.pdf` | Через /api/export |
| FB2 | ✅ DONE | `book_YYYY-MM-DD_HH-mm-ss.fb2` | Через /api/export |

### JSON Export Structure

```typescript
interface ExportedBook {
  title: string;
  description?: string;
  genre?: string;
  premise?: string;
  seriesId?: string;
  createdAt: string;
  chapters: Array<{
    id: string;
    title: string;
    scenes: Array<{
      id: string;
      title: string;
      text: string;
    }>;
  }>;
  characters: Array<{
    id: string;
    name: string;
    role?: string;
    description?: string;
  }>;
  ideas: Array<{
    id: string;
    text: string;
    createdAt: string;
  }>;
}
```

## Testing Strategy

### E2E Tests (export-timestamps.spec.ts)

Тесты должны проверить:

1. **Markdown ZIP export** — проверить API request содержит timestamp в filename
2. **DOCX export** — проверить API request содержит timestamp в filename
3. **PDF export** — проверить API request содержит timestamp в filename
4. **FB2 export** — проверить API request содержит timestamp в filename
5. **JSON export** — проверить JSON файл содержит корректную структуру и timestamp в filename
6. **Dialog preview** — показывает timestamp в формате YYYY-MM-DD_HH-mm-ss
7. **Multiple exports** — разные экспорты имеют разные timestamp

### Live Verification

Запустить на scratch port (3001 или динамический):
- Создать книгу "Test Book"
- Экспортировать в каждый формат
- Проверить что скачанные файлы имеют timestamp в имени
- Проверить что JSON валидный и содержит структуру

## Validation Checklist

- [x] **Prettier format:** `npx prettier --write src/components/ExportDialog.tsx`
- [x] **TypeScript check:** `npx tsc --noEmit` ✅
- [x] **ESLint:** `npm run lint` (fix issues if any)
- [x] **Build:** `npm run build` ✅
- [x] **E2E tests:** `npm run test:e2e e2e/export-timestamps.spec.ts`
- [x] **Full validation:** `npm run validate`
- [x] **CRITICAL_FEATURES.md** updated with 5 new functions

## Notes

1. **Функция generateFilename уже существует** — она была реализована в Sprint-36 как prep work. Этот Step Card добавляет полную интеграцию + E2E тесты + JSON export.

2. **JSON экспорт** используется для резервного копирования и импорта между инстансами Literary Studio.

3. **Timestamp формат** основан на ISO 8601 (YYYY-MM-DD) + локальное время (HH-mm-ss) для читаемости.

4. **API endpoint `/api/export`** уже поддерживает передачу filename через POST body.

## Dependencies

- Playwright (already in package.json)
- No new npm packages required

## Estimated Effort

- Implementation: 2 hours (generateFilename integration + JSON export)
- E2E tests: 2 hours (fixing port, adding real file checks)
- Validation & fixes: 1 hour
- Total: ~5 hours
