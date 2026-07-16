# Sprint-37-Step-01: Export Localization & i18n Framework

## Objective
Подготовить проект к локализации. Сейчас весь текст UI и экспорта на русском жестко. Нужна система для переключения языков (i18n).

## Why Now
- Экспорт диалоги на русском
- Названия кнопок на русском
- PDF/FB2 экспорт будет нужен multilingual support
- Лучше сделать framework сейчас, чем потом рефакторить

## Acceptance Criteria
- [ ] i18n framework выбран (next-intl или react-i18next)
- [ ] Языковые файлы структурированы (JSON)
- [ ] Русский (ru) и Английский (en) языки
- [ ] Language switcher в Header
- [ ] Все UI текст перемещено в языковые файлы
- [ ] Экспорт диалоги используют i18n
- [ ] localStorage сохраняет выбранный язык
- [ ] Тесты написаны (language switching works)

## Implementation Plan

### Step 1: Выбрать i18n library
- next-intl (Next.js native) - рекомендуется
- или react-i18next (более универсальная)

### Step 2: Структура языковых файлов
```
public/locales/
├── en/
│   ├── common.json         # общие термины
│   ├── export.json         # экспорт диалоги
│   ├── sidebar.json        # боковая панель
│   └── editor.json         # редактор
└── ru/
    ├── common.json
    ├── export.json
    ├── sidebar.json
    └── editor.json
```

### Step 3: Language Switcher
- Добавить в Header (右верхний угол)
- Кнопка "EN | РУ"
- Сохранять в localStorage

### Step 4: Миграция текста
- Экспорт диалоги (Export.tsx)
- Sidebar заголовки (Главы, Персонажи, Идеи и т.д.)
- Кнопки и labels
- Placeholder texts

### Step 5: Testing
- E2E: switch language → UI updates
- E2E: reload page → сохранён выбранный язык

## Changed Files (estimated)
- `apps/studio/package.json` (add next-intl)
- `apps/studio/next.config.js` (i18n config)
- `apps/studio/src/middleware.ts` (language detection)
- `apps/studio/src/app/layout.tsx` (add LocaleProvider)
- `apps/studio/src/components/Header.tsx` (LanguageSwitcher)
- `apps/studio/src/components/ExportDialog.tsx` (use i18n)
- `public/locales/**/*.json` (new files)

## Risk Areas
- ⚠️ Performance: lazy loading language files
- ⚠️ SEO: language routing if needed
- ⚠️ Backwards compatibility: existing localStorage

## Testing
- [ ] E2E: language switcher appears in Header
- [ ] E2E: click "EN" → UI changes to English
- [ ] E2E: reload page → language persisted
- [ ] E2E: all UI text translated (no untranslated keys)

## Validation
```bash
npm run test:e2e e2e/localization.spec.ts
```

## Notes
После этого Step Card:
- Sprint-37-Step-02: Export filenames with timestamps
- Sprint-37-Step-03: PDF export
- Sprint-37-Step-04: FB2 export
