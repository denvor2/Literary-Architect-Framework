id: Sprint-34-Step-06
name: "Export: Story Bible.md generation (Markdown архив)"
type: implementation

## Контекст

UI для Story Bible готова (Step 05). Теперь нужна экспортная функция, которая генерирует `StoryBible.md` из Series/Book данных.

Экспорт должен:
1. Собрать все Story Bible данные (Series + Books)
2. Генерировать структурированный Markdown файл
3. Включить его в экспортный ZIP архив

## Scope

### Allowed paths (ТОЛЬКО):
- apps/studio/src/app/api/export/route.ts (обновить экспортер)
- Новый файл: apps/studio/src/lib/exporters/storyBibleExporter.ts

### Forbidden paths:
- API endpoints (уже done)
- UI (уже done)

## Objective

### 1. Story Bible Exporter Function

```typescript
// apps/studio/src/lib/exporters/storyBibleExporter.ts

export function generateStoryBibleMarkdown(
  series: Series,
  books: Book[]
): string {
  // Генерировать Markdown структуру:
  // # Series Title — Bible вселенной
  //
  // ## Серия
  // **Название:** ...
  // ...description...
  //
  // ## Решения
  // ...decisions...
  //
  // ## Сквозные элементы
  // - WildMind
  // - Jordan
  // ...
  //
  // ## Ограничения
  // - Нет абсолютных злодеев
  // ...
  //
  // ---
  //
  // ## Книга 1: Название
  //
  // ### Основные линии
  // - Jordan
  // ...
  //
  // ### Принцип
  // ...principle...
  //
  // ### Эскалация
  // ...escalation...
  //
  // ### Темы
  // - Что такое разум?
  // ...
  //
  // ## Книга 2: ...
  // ...
  
  return markdown;
}
```

### 2. Структура Markdown

```markdown
# Terralia — Bible вселенной

## Серия

**Название:** Terralia

Серия о возникновении новой разумной цивилизации в нашем мире и его последствиях.

**Статус:** in-progress  
**Целевая аудитория:** Adult  
**Жанры:** Fantasy, Sci-Fi, Philosophy

## Решения

Серия строится вокруг идеи возникновения новой разумной цивилизации. Сквозной герой необязателен. Нет абсолютных злодеев. Каждая книга расширяет масштаб мира.

## Сквозные элементы

- WildMind
- Jordan
- Философские вопросы

## Ограничения (что НЕ делать)

- Нет абсолютных злодеев
- Каждая книга расширяет масштаб мира

---

## Книга 1: Terralia: Начало

**Рабочее название:** приквел

### Основные линии

- Jordan (WildMind)
- Профессор-зоолог
- Оперативник ООН

### Принцип

Контраст. Главы постоянно переключают POV между персонажами с противоположными взглядами.

### Эскалация

Палки → Дельфины → Ксносы → Медведи. Медведи — кульминация открытия новой разумности.

### Темы (философские вопросы)

- Что такое разум?
- Нужно ли уничтожать новую разумную жизнь?
- Граница между защитой человечества и преступлением

### Ограничения (что НЕ делать в этой книге)

- Не переусложнять научными терминами
- Не показывать слишком много POV животных

---

## Книга 2: Слон, которого не было

...

---
```

### 3. Интеграция в /api/export

Обновить существующий экспортер:

```typescript
// apps/studio/src/app/api/export/route.ts

export async function POST(request: Request) {
  const { format, bookId, seriesId } = await request.json();
  
  if (format === 'markdown-zip') {
    // Получить Series (если задана) или Book с Series
    const series = seriesId 
      ? await loadSeries(seriesId)
      : activeBook?.seriesId 
        ? await loadSeries(activeBook.seriesId)
        : null;
    
    const books = seriesId
      ? await loadBooksForSeries(seriesId)
      : bookId
        ? [await loadBook(bookId)]
        : [];
    
    // Генерировать StoryBible.md
    const bibleMd = generateStoryBibleMarkdown(series, books);
    
    // Добавить в ZIP архив
    zip.addFile('StoryBible.md', bibleMd);
    
    // Добавить остальные файлы (Characters, Locations, etc)
    // ... существующая логика ...
    
    // Вернуть ZIP
    return new Response(zip.generateSync(), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="export-${timestamp}.zip"`,
      },
    });
  }
}
```

### 4. Handles Edge Cases

```typescript
// Empty arrays → не показывать секцию
if (!series.throughlineElements || series.throughlineElements.length === 0) {
  // Skip "## Сквозные элементы" section
}

// Null fields → show "-" или skip
genre: ["Fantasy"] || genre: [] → "**Жанры:** Fantasy" или skip

// Multiple books
books.forEach(book => {
  // Generate section для каждой книги
});
```

## Validation

1. `npx tsc --noEmit` — TypeScript errors?
2. `npm run build` — production build успешен?
3. **Live-verify:**
   - Открыть меню Файл → Экспорт (Step-05 Sprint-33 тогда будет ready)
   - Выбрать "Markdown ZIP"
   - Скачать
   - Распаковать архив
   - Проверить StoryBible.md:
     - ✅ Все Series данные присутствуют
     - ✅ Все Books данные присутствуют
     - ✅ Markdown правильно форматирован
     - ✅ Массивы (genre, themes, constraints) превращены в список
     - ✅ Пустые секции пропущены
     - ✅ Ссылки между файлами (если есть) рабочие

## Output

ARP файлом в docs/task-bus/queue/active/:
1. Скриншот storyBibleExporter.ts
2. Скриншот сгенерированного StoryBible.md
3. Результат `npm run build`
4. Скриншот экспортного ZIP архива (содержимое)
5. Скриншот открытого StoryBible.md в редакторе
6. Результат живой браузерной проверки

## Stop Condition

Не коммитить без подтверждения Product Owner.
