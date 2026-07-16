id: Sprint-37-Step-01-ARP
title: "ARP: i18n Framework Infrastructure"
status: work-in-progress

## Summary

✅ Completed i18n framework infrastructure foundation for export localization.

**Acceptance Criteria Progress:**
- ✅ i18n library chosen & installed: next-intl@4.13.2 (Next.js native)
- ✅ Language files structured: JSON-based (en/, ru/)
- ✅ Russian (ru) & English (en) languages: common.json + export.json
- ⏳ Language switcher component: Created (LanguageSwitcher.tsx)
- ⏳ All UI text migrated: Partial (infrastructure ready, migration needed)
- ⏳ Экспорт диалоги use i18n: Structure ready (ExportDialog integration pending)
- ⏳ localStorage persistence: Hook created, integration needed
- ⏳ Tests: E2E tests for language switching (pending)

## Code Changes

### 1. Installed Dependencies ✅
```bash
npm install next-intl@4.13.2
```

### 2. Locale Files Structure ✅

**public/locales/en/**
- `common.json` — Header, Sidebar, Editor, Buttons, Menu UI strings
- `export.json` — Export dialog titles, formats, options, messages

**public/locales/ru/**
- `common.json` — Russian translations of common strings
- `export.json` — Russian translations for export dialogs

### 3. i18n Infrastructure ✅

**src/lib/i18n.ts** (Core library)
- `Locale` type: 'en' | 'ru'
- `getMessages(locale)`: Load language JSON files
- `getLocaleFromStorage()`: Read saved locale from localStorage
- `setLocaleInStorage(locale)`: Persist locale choice
- `getMessage(messages, key)`: Resolve dot-notation keys

**src/hooks/useLocale.ts** (React hook)
- `useLocale()`: Provides `locale`, `messages`, `isLoading`, `switchLocale()`, `t()`
- Automatic hydration from localStorage
- Fallback to Russian (ru) as default

**src/context/LocaleContext.tsx** (Global state)
- `LocaleContext`: Provides locale state globally
- `LocaleProvider`: Wrap app components
- `useLocaleContext()`: Access locale in any component

**src/components/LanguageSwitcher.tsx** (UI component)
- EN | РУ toggle buttons
- Active state styling
- Integrates with LocaleContext
- Dark mode support

### 4. Acceptance Criteria Breakdown

#### ✅ Completed
- Library selection: next-intl (recommended, Next.js native)
- Language file structure: en/, ru/ with common.json, export.json
- Core library functions implemented
- React hooks + Context API for state management
- LanguageSwitcher component created

#### ⏳ Pending (Next Steps)
1. **Integrate LocaleProvider in page.tsx/layout.tsx**
   - Wrap main app with locale context
   - Initialize locale on app startup

2. **Add LanguageSwitcher to Header**
   - Import in Header.tsx
   - Place in top-right (where "RU" button was)
   - Remove hardcoded "RU" text button

3. **Migrate UI text to i18n**
   - Sidebar: "Книги", "Серии", "Главы", etc. → use `t()`
   - Header: Menu labels, search placeholder
   - Dialogs: NewBookDialog, ExportDialog, etc.
   - Buttons: Common button labels

4. **localStorage integration**
   - Verify locale persists across page reloads
   - Test with different browsers

5. **E2E Tests**
   - Language switcher visible in Header
   - Click EN → UI updates to English
   - Click РУ → UI updates to Russian
   - Reload page → language persisted

## Technical Implementation

### Architecture
```
App (page.tsx)
  └─ LocaleProvider [value: { locale, messages, switchLocale, t }]
      ├─ Header
      │  └─ LanguageSwitcher (EN | РУ toggle)
      ├─ Sidebar
      │  └─ Uses t("sidebar.books"), etc.
      └─ ExportDialog
         └─ Uses t("export.title"), etc.
```

### Key Design Decisions
1. **Context API over Redux**: Simpler, no external dependency
2. **JSON files over JS objects**: Easier to maintain, standard i18n format
3. **localStorage for persistence**: Built-in browser API, no DB needed
4. **Dot-notation keys**: `t("sidebar.books")` — intuitive, composable

## Validation Results

### Compilation ✅
- TypeScript: ✅ (checked earlier)
- ESLint: ✅ (no issues)
- Build: ⏳ (pending full build after Header integration)

### File Structure ✅
```
✅ public/locales/en/common.json (1252 bytes)
✅ public/locales/en/export.json (738 bytes)
✅ public/locales/ru/common.json (1718 bytes)
✅ public/locales/ru/export.json (1104 bytes)
✅ src/lib/i18n.ts
✅ src/hooks/useLocale.ts
✅ src/context/LocaleContext.tsx
✅ src/components/LanguageSwitcher.tsx
```

## Open Questions / Blockers

1. **Where to wrap LocaleProvider?**
   - Option A: In page.tsx (requires lifting locale state)
   - Option B: In layout.tsx (preferred, SSR-friendly)
   - Recommended: Option B (page is already complex with many hooks)

2. **ExportDialog localization**
   - Should use `useLocaleContext()` hook
   - Requires updating ExportDialog.tsx props/logic

## Next Steps (for Step-02 or continuation)

1. Update layout.tsx or create RootLayout wrapper
2. Add LocaleProvider with initial locale state
3. Add LanguageSwitcher to Header.tsx
4. Update ExportDialog to use i18n
5. Create E2E tests
6. Full build + live verification

## Commit

`2cb2b7f` — Sprint-37-Step-01: i18n Framework Infrastructure (wip)
- Added next-intl library
- Created locale files (en/, ru/)
- Implemented i18n library + hooks + context
- Created LanguageSwitcher component

## Status

📋 **Work-in-Progress: Framework Foundation Complete**

Core i18n infrastructure is in place and validated. Ready for integration into Header/Layout and migration of existing UI text. Estimated 2-3 additional steps for full completion and E2E testing.

---

**Date:** 2026-07-17  
**Step ID:** Sprint-37-Step-01  
**Commit:** 2cb2b7f  
**Status:** Ready for integration work
