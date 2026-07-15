# Sprint-37-Step-04: Export to FB2 (e-book format)

## Objective
Добавить экспорт в FB2. FB2 - популярный формат e-book в России и постсоветском пространстве.

## Why Now
- FB2 поддерживается всеми e-readers (Kobo, PocketBook, Apple Books)
- Стандартный формат для распространения электронных книг
- XML-based, легко генерировать

## Acceptance Criteria
- [ ] Диалог экспорта показывает опцию "FB2"
- [ ] Скачивается файл `book_2026-07-16_14-35-42.fb2`
- [ ] Структура: metadata + chapters + scenes
- [ ] Поддержка Unicode (кириллица, спецсимволы)
- [ ] Валидный XML (parseable в любом читалке)
- [ ] Тесты: FB2 генерируется и скачивается

## FB2 Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.1">
  <description>
    <title-info>
      <book-title>Book Title</book-title>
      <author>
        <first-name>First</first-name>
        <last-name>Last</last-name>
      </author>
      <date>2026-07-16</date>
      <lang>ru</lang>
    </title-info>
    <document-info>
      <author>Literary Studio</author>
      <date>2026-07-16</date>
      <version>1.0</version>
    </document-info>
  </description>
  
  <body>
    <section>
      <title>
        <p>Chapter 1</p>
      </title>
      <section>
        <title>
          <p>Scene 1.1</p>
        </title>
        <p>Scene content...</p>
      </section>
    </section>
  </body>
</FictionBook>
```

## Implementation

### Library
No special library needed - generate XML directly with:
- `xml` npm package for proper escaping
- или просто string concatenation с escaping

### Key Elements
- `<book-title>`: название книги
- `<author>`: автор (если указан)
- `<section>` для глав
- `<section>` nested для сцен
- `<p>` для параграфов (сцены)
- Proper XML escaping (& → &amp;, < → &lt;, etc.)

### Metadata Mapping
```
Book Title → <book-title>
[Author if exists] → <author>
Export date → <date>
Language → <lang> (ru or en based on i18n)
```

## Changed Files
- `apps/studio/src/components/ExportDialog.tsx` (add FB2 option)
- `apps/studio/src/lib/exporters/fb2Exporter.ts` (new)

## Testing
- [ ] E2E: Export Dialog shows FB2 option
- [ ] E2E: click FB2 → downloads `book_*.fb2`
- [ ] E2E: FB2 is valid XML (can parse)
- [ ] Manual: open FB2 in e-reader → looks good
- [ ] Manual: FB2 renders correctly (chapters, scenes)

## Complexity Estimate
- 3-4 hours (XML generation is straightforward)

## Notes
FB2 достаточно простой формат. Основное - правильный XML.

Возможные улучшения (future):
- Cover image
- Footnotes/annotations
- Table of contents (тоже XML)
- Author bio (автор-info)
- Genre tagging
