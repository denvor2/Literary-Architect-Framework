# Sprint-37-Step-02: Export Filenames with Timestamps — TEST REPORT

**Тестер:** Claude (QA role)  
**Дата:** 2026-07-18  
**Статус:** ⚠️ FAIL (с критичным замечанием о валидации)

---

## Резюме

Реализованная функция `generateFilename` **технически работает корректно** и генерирует временные метки в требуемом формате `YYYY-MM-DD_HH-mm-ss` для всех форматов экспорта (ZIP, DOCX, PDF, FB2). 

**Однако** ARP заявляет, что "npm run validate passes" (строка 52 ARP), что **неправда**: prettier validation падает на `apps/studio/src/components/ExportDialog.tsx`.

---

## Что я тестировал самостоятельно

### 1. Верификация функции generateFilename

**Код в `page.tsx` (строки 545-555):**
```typescript
function generateFilename(bookTitle: string, extension: string): string {
  const now = new Date();
  const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS
  const sanitized = bookTitle
    .toLowerCase()
    .replace(/[^a-z0-9а-я]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${sanitized}_${date}_${time}.${extension}`;
}
```

**Тестирование в Node.js:**

```
Test 1 - Normal title: war-and-peace_2026-07-18_09-12-20.zip
✓ Format matches: true

Test 2 - Cyrillic title: война-и-мир_2026-07-18_09-12-20.docx
✓ Format matches: true

Test 3 - Special chars: book-my-story-2026_2026-07-18_09-12-20.pdf
✓ Format matches: true
```

**Вывод:** Функция работает правильно для нормальных названий и кириллицы. ✅

**Найденный edge case:** Пустые названия книг приводят к filenames вроде `_2026-07-18_09-12-20.fb2`, что технически валидно, но не идеально.

### 2. Верификация интеграции во все форматы

**Найдено в `page.tsx`:**
- Строка 567: `const filename = generateFilename(book.title, "zip");` ✅
- Строка 589: `const filename = generateFilename(book.title, "docx");` ✅
- Строка 609: `const filename = generateFilename(book.title, "pdf");` ✅
- Строка 629: `const filename = generateFilename(book.title, "fb2");` ✅

Все 4 формата используют функцию и передают filename в API. ✅

### 3. Статическая валидация

**npx tsc --noEmit:**
```
(no output = no errors) ✅
```

**npm run build:**
```
✓ Compiled successfully ✅
```

**npx prettier --check:**
```
[warn] src/components/ExportDialog.tsx
Code style issues found in the above file. ❌

ТАКЖЕ НАЙДЕНО:
[warn] src/components/AdminAuditPanel.tsx
[warn] src/components/AuditEventRow.tsx
... (ещё 6 файлов)
```

**КРИТИЧНОЕ ЗАМЕЧАНИЕ:** ARP утверждает "npm run validate passes" (✅ в строке 52 и 127 ARP), но prettier fail. Это означает:
- `npm run validate` на самом деле **не проходит** (зависит от prettier check)
- ARP либо не запустил валидацию должным образом, либо её результаты неточны

### 4. CRITICAL_FEATURES.md обновлён правильно

**Найдено:**
```markdown
## ✅ Sprint-37: Завершено

| # | Функция | E2E Тест | Статус | Примечания |
|---|---------|----------|--------|-----------|
| 13 | Export: filenames with timestamps | e2e/export-timestamps.spec.ts | ✅ VERIFIED (live) | YYYY-MM-DD_HH-mm-ss формат |
| 14 | Export: Markdown ZIP with timestamp | e2e/export-timestamps.spec.ts | ✅ VERIFIED (live) | book-title_timestamp.zip |
| 15 | Export: DOCX with timestamp | e2e/export-timestamps.spec.ts | ✅ VERIFIED (live) | book-title_timestamp.docx |
| 16 | Export: unique timestamps per export | e2e/export-timestamps.spec.ts | ✅ VERIFIED (live) | Каждый экспорт имеет разный timestamp |
```

Обновление выглядит корректным. ✅

### 5. E2E тесты

**Файл существует:** `apps/studio/e2e/export-timestamps.spec.ts` ✅

**Структура тестов:**
- Test 1: ZIP export filename with timestamp format
- Test 2: DOCX export with timestamp
- Test 3: PDF export with timestamp
- Test 4: Export dialog preview shows timestamp

**Проблема:** Тесты используют hardcoded `const BASE_URL = "http://127.0.0.1:3456";` (строка 3 теста), но dev сервер запускается на 3001. Тесты не работают.

Дополнительно: тесты требуют authentication, что добавляет сложность.

---

## Edge Cases - Независимое тестирование

Я попытался протестировать следующие edge cases:

1. **Пустое название книги** → Результат: `_YYYY-MM-DD_HH-mm-ss.zip` (работает, но не идеально)
2. **Только спецсимволы** → Результат: `_YYYY-MM-DD_HH-mm-ss.docx` (работает, но не идеально)
3. **Кириллица + спецсимволы** → Результат: `война-и-мир-black_YYYY-MM-DD_HH-mm-ss.pdf` ✓
4. **Очень длинное название** → Работает (нет ограничений в коде)
5. **Быстрые экспорты подряд** → Функция использует `new Date()`, так что timestamps будут уникальны (миллисекунды разница)

---

## Соответствие Acceptance Criteria

| Критерий | Статус | Доказательство |
|----------|--------|---|
| JSON экспорт с timestamp | ⚠ Не найден | JSON export не реализован в коде (только ZIP, DOCX, PDF, FB2) |
| Markdown ZIP: filename with timestamp | ✅ | Строка 567 page.tsx |
| DOCX: filename with timestamp | ✅ | Строка 589 page.tsx |
| Формат: YYYY-MM-DD_HH-mm-ss | ✅ | Функция генерирует правильный формат |
| E2E тесты | ⚠ Частично | Тесты существуют, но hardcoded port не соответствует dev server |
| npm run validate passes | ❌ | prettier validation падает |

---

## Найденные проблемы

### 1. КРИТИЧНО: Ложь в ARP о валидации

**Проблема:** ARP утверждает:
- "npm run validate passes ✅" (строка 52)
- "npm run validate OK" (таблица в строке 52)
- "npm run validate OK" (чеклист, строка 174)

**Реальность:** 
```
npx prettier --check
Code style issues found in the above file. (ExportDialog.tsx и 8 других файлов)
```

**Вывод:** ARP либо не запустил полную валидацию, либо проигнорировал результаты. Это нарушает доверие к процессу верификации.

### 2. JSON export не реализован

Step Card требует "JSON экспорт: `book-title_2026-07-16_14-35-42.json`" (Acceptance Criteria), но в коде реализованы только ZIP, DOCX, PDF, FB2. JSON исключён сознательно (см. commit `d3728bc: chore: Hide JSON export option`).

### 3. E2E тесты используют неправильный порт

Тесты hardcoded на 3456, но dev server по умолчанию 3000/3001. Это мешает запустить тесты.

### 4. Отсутствие скринов/видео live verification

ARP не предоставляет скриншотов работающего UI с exported файлами, подтверждающих что функция работает в браузере.

---

## Что работает ✅

1. **Функция `generateFilename` технически корректна**
   - Генерирует timestamps в формате YYYY-MM-DD_HH-mm-ss
   - Работает с кириллицей
   - Обрабатывает спецсимволы
   - Интегрирована во все форматы (ZIP, DOCX, PDF, FB2)

2. **Code structure правильный**
   - Функция вызывается для всех форматов
   - Filename передаётся в API
   - Санитизация названия книги правильная

3. **TypeScript compilation passes**
   - `npx tsc --noEmit` - успешно

4. **Build успешен**
   - `npm run build` - успешно

5. **CRITICAL_FEATURES.md обновлён**
   - 4 новые функции добавлены для Sprint-37

---

## STATUS

**FAIL**

### Причины отказа:

1. **Ложь в документации ARP** о прохождении валидации - это критично для процесса QA/review
2. **Prettier validation не проходит** - нарушает требование "npm run validate passes"
3. **JSON export не реализован** из Acceptance Criteria
4. **E2E тесты не могут быть запущены** из-за hardcoded порта

### Рекомендации:

1. **СРОЧНО:** Исправить prettier issues в ExportDialog.tsx и других файлах
2. Обновить E2E тесты на использование настраиваемого порта (из playwright.config)
3. Обсудить с Product Owner: требуется ли JSON export или это intentional exclusion
4. Запустить `npm run validate` полностью и убедиться что всё проходит
5. Предоставить скриншоты/видео live verification с браузера

---

## Дополнительные замечания

- **Честность ARP:** Документ содержит ошибки в разделе Validation, что подрывает доверие к другим заявлениям
- **Соответствие CLAUDE.md:** По правилам CLAUDE.md (Sprint 35+), функция должна иметь E2E тесты - они существуют, но не работают
- **Persistence:** Я не мог протестировать persistence to DB из-за authentication issues

---

**Заключение:** Реализация timestamps технически звучит хорошо, но процесс верификации ARP не надёжен. Нельзя принять это на основе слов ARP - нужна независимая live verification и исправление prettier issues перед commit.
