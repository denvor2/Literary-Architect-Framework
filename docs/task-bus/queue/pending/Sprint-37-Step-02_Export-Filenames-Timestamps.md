# Sprint-37-Step-02: Export Filenames with Timestamps

## Objective
Добавить дата-время в имена экспортируемых файлов. Сейчас экспорт создает файлы без временной метки, сложно различить разные версии.

## Why Now
- Пользователь делает несколько экспортов одной книги за день
- Без временных меток сложно найти нужный файл
- Стандартная практика для export функций

## Acceptance Criteria
- [ ] JSON экспорт: `book-title_2026-07-16_14-35-42.json`
- [ ] Markdown ZIP: `book-title_2026-07-16_14-35-42.zip`
- [ ] DOCX: `book-title_2026-07-16_14-35-42.docx`
- [ ] Формат timestamp: YYYY-MM-DD_HH-mm-ss
- [ ] Тесты: filenames содержат правильный timestamp

## Implementation

### Changed Files
- `apps/studio/src/components/ExportDialog.tsx` 
  - Add timestamp generation function
  - Pass to export functions

### Timestamp Format
```typescript
const timestamp = new Date().toISOString()
  .replace(/T/, '_')
  .replace(/:/g, '-')
  .split('.')[0];
// Result: "2026-07-16_14-35-42"

const filename = `${bookTitle}_${timestamp}.${ext}`;
```

### Updated Export Functions
```typescript
// Before
const filename = `book.json`;

// After  
const filename = `book_2026-07-16_14-35-42.json`;
```

## Testing
- [ ] E2E: click Export → downloaded file has timestamp
- [ ] E2E: timestamp format is YYYY-MM-DD_HH-mm-ss
- [ ] E2E: export twice → different timestamps

## Notes
Это preparation для JSON экспорта - нужно понять use case.

Возможные use cases для JSON:
1. **Backup** - сохранить всю структуру для восстановления
2. **Import** - загрузить из другого Literary Studio
3. **API integration** - отправить на сервер
4. **Version control** - хранить в Git разные версии

Нужно обсудить - для чего на самом деле JSON?
