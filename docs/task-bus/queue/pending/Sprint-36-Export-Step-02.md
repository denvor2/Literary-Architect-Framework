id: Sprint-36-Export-Step-02
name: "Export to DOCX: книга с форматированием (стили, title page)"
type: implementation

## Objective

Генерировать DOCX файл готовый к публикации:

```
book.docx
├── Title page (название, автор, дата)
├── Table of Contents
├── Главы с сценами
│   ├── # Глава 1
│   │   Текст со стилями (bold, italic, etc)
│   │
│   └── # Глава 2
│       ...
├── Справочник персонажей (опционально)
└── Metadata (автор, дата)
```

## Scope

### Allowed paths:
- apps/studio/src/app/api/export/route.ts (добавить DOCX handler)
- Новый файл: apps/studio/src/lib/exporters/docxExporter.ts

### Forbidden:
- Менять Domain Model
- Новые зависимости (используем существующие)

## Dependencies

Нужна библиотека: `docx` (npm install docx)

## Implementation

**docxExporter.ts:**
```typescript
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';

export function generateDOCX(
  book: Book,
  chapters: Chapter[]
): Promise<Buffer> {
  const sections = [];
  
  // Title page
  sections.push(
    new Paragraph({
      text: book.title,
      heading: HeadingLevel.HEADING_1,
      alignment: 'center',
    })
  );
  
  sections.push(
    new Paragraph({
      text: `Автор: ${book.author || 'Anonymous'}`,
      alignment: 'center',
    })
  );
  
  // Chapters
  chapters.forEach(chapter => {
    sections.push(
      new Paragraph({
        text: chapter.title,
        heading: HeadingLevel.HEADING_2,
      })
    );
    
    // Chapter text (parse markdown-like bold/italic)
    const paragraphs = parseChapterText(chapter.text);
    sections.push(...paragraphs);
  });
  
  const doc = new Document({ sections: [{ children: sections }] });
  return Packer.toBuffer(doc);
}
```

**API Route:**
```typescript
if (format === 'docx') {
  const buffer = await generateDOCX(book, chapters);
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${book.title}.docx"`,
    },
  });
}
```

## Text Parsing

Простой парсер для сохранения форматирования:
- `**текст**` → bold
- `*текст*` или `_текст_` → italic
- Сохранить переносы строк

## Validation

1. Export → DOCX загружается
2. Открыть в MS Word / LibreOffice — читается
3. Title page содержит название, автора, дату
4. Главы структурированы (заголовки)
5. Текст отформатирован (bold, italic)
6. Подходит для печати (margins, page breaks)

## Output

ARP в docs/task-bus/queue/active/:
1. Скриншот Export меню (DOCX option)
2. Скриншот открытого DOCX в Word
3. Скриншот title page
4. Скриншот главы с форматированием
5. Результат build

## Stop Condition

DOCX экспортируется и открывается в Word/LibreOffice.
