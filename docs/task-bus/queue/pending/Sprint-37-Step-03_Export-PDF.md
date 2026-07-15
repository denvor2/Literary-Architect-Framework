# Sprint-37-Step-03: Export to PDF

## Objective
Добавить экспорт в PDF. PDF - стандартный формат для печати и распространения книг.

## Why Now
- Пользователь хочет печатать книги
- PDF - универсальный формат
- Используется для отправки издателям

## Acceptance Criteria
- [ ] Диалог экспорта показывает опцию "PDF"
- [ ] Скачивается файл `book_2026-07-16_14-35-42.pdf`
- [ ] Содержимое: все главы + сцены + форматирование
- [ ] Шрифты встроены в PDF
- [ ] Page breaks между главами
- [ ] Оглавление (ToC) 
- [ ] Тесты: PDF генерируется и скачивается

## Implementation

### Library Choice
Рекомендуется: **pdfkit** или **html2pdf**
- pdfkit: низкоуровневое управление, красивый вывод
- html2pdf: конвертит HTML → PDF, проще

### Structure
```
Book Title
Автор: [author if available]
Дата экспорта: [date]
---

Оглавление:
Chapter 1 ....... 5
Chapter 2 ....... 15
...

---

# Chapter 1
Scene 1.1 content...
Scene 1.2 content...

---

# Chapter 2
Scene 2.1 content...
```

### Styling
- Font: reasonable serif (Times, Garamond)
- Margins: 1 inch (25mm)
- Line height: 1.5
- Page size: A4 or Letter (user choice?)
- Headers/footers: page numbers

## Changed Files
- `apps/studio/package.json` (add pdf library)
- `apps/studio/src/components/ExportDialog.tsx` (add PDF option)
- `apps/studio/src/lib/exporters/pdfExporter.ts` (new)

## Testing
- [ ] E2E: Export Dialog shows PDF option
- [ ] E2E: click PDF → downloads `book_*.pdf`
- [ ] E2E: PDF contains all chapters
- [ ] E2E: PDF has page breaks between chapters
- [ ] Manual: open PDF in reader → looks good

## Complexity Estimate
- 4-5 hours (including testing)

## Notes
Этап 1: Basic PDF (chapters + scenes)
Этап 2 (future): Styling, fonts, advanced formatting
