# Sprint-37-Step-02: Complete UI Localization — TEST REPORT

**Дата**: 2026-07-18  
**Статус**: FAIL  
**Язык отчёта**: Русский

---

## Резюме

ARP claims о полной локализации не выдерживают независимую проверку. Хотя **основная проблема (JSON дублирование) была корректно исправлена**, тестирование выявило **критические ошибки в полноте переводов**:

1. **КРИТИЧЕСКАЯ**: Русская локаль **отсутствует ключ** `editor.create_book`, который используется в `EditorArea.tsx`
2. **КРИТИЧЕСКАЯ**: `ExportDialog.tsx` использует 4 ключа, которые **не существуют ни в русской, ни в английской локали**
3. **Минор**: Английская локаль содержит экстра-ключ `dialogs.book_settings.estimated_words_label_alt`, которого нет в русской

---

## Детали проверки

### 1. Static Validation ✅ PASS

```bash
✅ npx tsc --noEmit         — No errors
✅ npx prettier --check     — All matched files use Prettier code style!
✅ npm run build            — Build successful (40+ routes compiled)
```

**Заключение**: TypeScript, формирование и build работают корректно.

---

### 2. JSON Валидность ✅ PASS

**JSON Parsing**:
```
✅ Russian JSON parses successfully
✅ English JSON parses successfully
```

**Структура JSON**:
```
Russian root keys: 19  
English root keys: 19  
Russian dialogs keys: 13
English dialogs keys: 13
```

**Дублирование - ИСПРАВЛЕНО ✅**:
```
Russian JSON "dialogs": appears 1 time(s)     [было 2, теперь 1]
English JSON "dialogs": appears 1 time(s)     [было 2, теперь 1]
```

**Вывод**: ARP корректно объединил два объекта `dialogs` в один. Дублирование устранено.

---

### 3. Наличие Критических Ключей ✅ PARTIAL PASS

**Ключи dialogs.* восстановлены корректно**:
```
✅ dialogs.save_error
✅ dialogs.close_button
✅ dialogs.back_button
✅ dialogs.cancel_button
✅ dialogs.assistant_settings
✅ dialogs.plan_selection
✅ dialogs.payment
✅ dialogs.new_book
✅ dialogs.book_settings
✅ dialogs.series_settings
✅ dialogs.series_edit
✅ dialogs.import
```

**НО: EN/RU структурная рассинхронизация**:
```
⚠️  Found 3 mismatch(es) between EN and RU:
  - editor.create_book (EN only)
  - editor.talk_to_assistant (EN only)
  - dialogs.book_settings.estimated_words_label_alt (EN only)
```

---

### 4. Компоненты используют Undefined Keys ❌ FAIL

**Скан кода показал: компоненты используют ключи, которые не существуют в locale файлах**:

#### 4.1 EditorArea.tsx - ИСПОЛЬЗУЕТСЯ UNDEFINED KEY

Файл: `apps/studio/src/components/EditorArea.tsx` (line ~200)
```typescript
<p className="text-lg text-zinc-500 dark:text-zinc-400">
  {t("editor.create_book")}
</p>
```

**Проблема**:
- Русская локаль: `editor.create_book` **НЕ СУЩЕСТВУЕТ**
- Английская локаль: `editor.create_book = "Create a book to start"`
- **Результат**: На русском языке пользователь увидит `"editor.create_book"` вместо текста

#### 4.2 ExportDialog.tsx - 4 UNDEFINED KEYS

Файл: `apps/studio/src/components/ExportDialog.tsx`

```typescript
// Line 49
setError(err instanceof Error ? err.message : t("export.messages.error"));

// Line 118
{t("export.buttons.cancel")}

// Line 126-127
{isLoading
  ? t("export.messages.exporting")
  : t("export.buttons.export")}
```

**Проблема**:
Ни один из этих 4 ключей **не существует** ни в русской, ни в английской локали:
- `export.buttons.cancel` — **НЕ ОПРЕДЕЛЁН**
- `export.buttons.export` — **НЕ ОПРЕДЕЛЁН**
- `export.messages.error` — **НЕ ОПРЕДЕЛЁН**
- `export.messages.exporting` — **НЕ ОПРЕДЕЛЁН**

Текущее содержимое `export` в обеих локалях:
```json
"export": {
  "title": "Экспорт|Export",
  "error_generic": "Ошибка экспорта|Export error"
}
```

---

### 5. Анализ Ошибок Верификации ARP

**Почему ARP пропустил эти ошибки?**

Из ARP (строка 157-159):
```
**Build успешен:**
✓ Build successful
Route (app) ├ ○ /...
```

ARP проверил:
- ✅ JSON парсится
- ✅ Build компилируется  
- ✅ Дублирование исправлено
- ❌ **НЕ проверил**: Используются ли ключи в коде?
- ❌ **НЕ проверил**: Все ли используемые ключи определены в обеих локалях?
- ❌ **НЕ проверил**: EN/RU пarity на уровне component usage

**Вывод**: Верификация была поверхностной. Сборка может пройти, но runtime будет показывать translation keys вместо текста.

---

## Expected vs Observed

### Scenario 1: EditorArea на русском языке

**Expected**:
```
"Создайте первую книгу, чтобы начать"
```

**Observed** (если бы запустить):
```
"editor.create_book"
```

---

### Scenario 2: ExportDialog — попытка экспорта

**Expected** (кнопка):
```
"Экспортировать"
```

**Observed**:
```
"export.buttons.export"
```

---

## Соответствие Step Card Acceptance Criteria

| Критерий | Статус | Примечание |
|---|---|---|
| Все компоненты с UI используют `useLocaleContext()` | ❌ PARTIAL | Используют, но обращаются к undefined keys |
| Locale файлы имеют ПОЛНОЕ покрытие | ❌ FAIL | Русской локали не хватает ключей; экспорт ключи в обеих отсутствуют |
| Нет "translation key" фраз типа "login.title" в UI | ❌ FAIL | На русском: `editor.create_book` и 4 экспорт-ключа покажут key names вместо текста |
| `npm run validate` проходит | ⚠️ PARTIAL | Сборка проходит, но runtime будет с ошибками локализации |
| E2E тесты - language toggle работает | ⚠️ NOT TESTED | Live server не доступен для Playwright тестирования |

---

## Repro Steps для Verification Нарушений

### Нарушение 1: Missing `editor.create_book` (RU)

1. Start dev server
2. Open app without creating any books
3. Switch to Russian language
4. **Expected**: Русский текст "Создайте первую книгу, чтобы начать"
5. **Actual**: Translation key `"editor.create_book"`

### Нарушение 2: Missing export keys

1. Start dev server
2. Create/open a book
3. Open File → Export
4. Try to export
5. **Expected**: Кнопки и сообщения на русском
6. **Actual**: Translation keys `"export.buttons.export"`, `"export.messages.exporting"`, etc.

---

## Исправления, Требуемые

### Fix 1: Добавить в Russian locale

```json
{
  "editor": {
    "create_book": "Создайте первую книгу, чтобы начать",
    "talk_to_assistant": "Создайте первую книгу, чтобы поговорить с помощником",
    ...
  },
  "export": {
    "title": "Экспорт",
    "error_generic": "Ошибка экспорта",
    "buttons": {
      "cancel": "Отмена",
      "export": "Экспортировать"
    },
    "messages": {
      "error": "Ошибка при экспорте",
      "exporting": "Экспортирование..."
    }
  }
}
```

### Fix 2: Добавить export.format.* в обе локали (если используется)

```json
{
  "export": {
    ...
    "format": {
      "markdown-zip": { "name": "Markdown (ZIP)", "description": "..." },
      "docx": { "name": "DOCX", "description": "..." },
      ...
    }
  }
}
```

---

## Дополнительные Findings

### Положительное
- ✅ BookSettingsDialog.tsx корректно использует `dialogs.book_settings.*` ключи
- ✅ SeriesSettingsDialog.tsx корректно использует `dialogs.series_settings.*` ключи
- ✅ Большинство компонентов (21+) уже используют `useLocaleContext()`

### Отрицательное
- ❌ Не все ключи, используемые в коде, синхронизированы между EN и RU
- ❌ Нет автоматической проверки: "ключ используется в коде → ключ должен быть в обеих локалях"
- ❌ Старый тест-скрипт ARP не проверил component usage

---

## Conclusio

**Основная проблема (JSON дублирование) решена ✅**, но **локализация неполна ❌**.

**STATUS: FAIL**

Требуется:
1. Добавить недостающие keys в Russian locale
2. Добавить export.* структуру в обе локали
3. Повторная проверка пarity EN/RU
4. Вторая run `npm run validate` и live testing на обоих языках перед commit

---

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
