id: Sprint-36-Export-Step-01
name: "Export to Markdown ZIP: структура архива (StoryBible.md, Chapters, Characters)"
type: implementation

## Objective

Генерировать Markdown ZIP архив при экспорте:

```
export-book.zip
├── README.md                    (metadata + краткое описание)
├── StoryBible.md               (decisions, themes, constraints)
├── 00_Structure/
│   ├── Chapters.md             (план глав/сцен)
│   └── Timeline.md             (if available)
├── 01_Chapters/
│   ├── Chapter-01-Отъезд.md    (full text)
│   ├── Chapter-02-...md
│   └── ...
├── Characters/
│   ├── Index.md                (список персонажей)
│   ├── Anna.md
│   ├── Mark.md
│   └── ...
└── Ideas/
    ├── Active.md
    └── Archive.md
```

## Scope

### Allowed paths:
- apps/studio/src/app/api/export/route.ts (обновить)
- Новый файл: apps/studio/src/lib/exporters/markdownExporter.ts
- apps/studio/src/lib/exporters/storyBibleExporter.ts (может быть переиспользован)

### Forbidden:
- Менять Domain Model
- API endpoints (уже done в Sprint-34)

## Implementation

**markdownExporter.ts:**
```typescript
export function generateMarkdownZip(
  series: Series | null,
  book: Book,
  chapters: Chapter[],
  characters: Character[],
  ideas: Idea[]
): JSZip {
  const zip = new JSZip();
  
  // README.md
  zip.file('README.md', generateREADME(book));
  
  // StoryBible.md
  zip.file('StoryBible.md', generateStoryBible(book));
  
  // 00_Structure/
  zip.folder('00_Structure')?.file('Chapters.md', generateChaptersStructure(chapters));
  
  // 01_Chapters/
  const chaptersFolder = zip.folder('01_Chapters');
  chapters.forEach(ch => {
    chaptersFolder?.file(
      `Chapter-${ch.order}-${slugify(ch.title)}.md`,
      generateChapterMarkdown(ch)
    );
  });
  
  // Characters/
  const charsFolder = zip.folder('Characters');
  charsFolder?.file('Index.md', generateCharacterIndex(characters));
  characters.forEach(char => {
    charsFolder?.file(`${char.name}.md`, generateCharacterMarkdown(char));
  });
  
  // Ideas/
  const ideasFolder = zip.folder('Ideas');
  ideasFolder?.file('Active.md', generateIdeasMarkdown(ideas));
  
  return zip;
}
```

**API Route:**
```typescript
// POST /api/export
if (format === 'markdown-zip') {
  const zip = generateMarkdownZip(series, book, chapters, characters, ideas);
  const blob = await zip.generateAsync({ type: 'blob' });
  return new Response(blob, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="export-${book.title}.zip"`,
    },
  });
}
```

## Validation

1. Export → Markdown ZIP загружается
2. Распаковать архив → структура правильная
3. StoryBible.md содержит decisions, themes, constraints
4. Chapters.md показывает структуру глав/сцен
5. Chapter-*.md содержит full text с форматированием
6. Characters/Index.md списывает персонажей
7. Ideas/Active.md список идей

## Output

ARP в docs/task-bus/queue/active/:
1. Скриншот Export меню (выбор формата)
2. Скриншот загруженного архива в file explorer
3. Скриншот содержимого StoryBible.md
4. Скриншот Chapter-*.md
5. Результат build

## Stop Condition

Markdown ZIP экспортируется и распаковывается правильно.
