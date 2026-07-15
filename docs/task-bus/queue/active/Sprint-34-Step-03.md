id: Sprint-34-Step-03
name: "Domain Model: Story Bible types + Repository functions"
type: implementation

## Контекст

Prisma schema обновлена (Step 02). Теперь нужны TypeScript типы и функции Repository для работы со Story Bible.

## Scope

### Allowed paths (ТОЛЬКО):
- apps/studio/src/domain/model.ts (добавить типы)
- apps/studio/src/repositories/seriesRepository.ts (добавить функции)
- apps/studio/src/repositories/bookRepository.ts (добавить функции)

### Forbidden paths:
- apps/studio/src/app/api/** (API идёт в Step 04)
- apps/studio/src/app/page.tsx (UI идёт в Step 05)

## Objective

### 1. Domain Model (model.ts)

Обновить типы Series и Book:

```typescript
interface Series {
  id: string;
  userId: string;
  title: string;
  description: string;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Story Bible
  targetAudience?: string;
  genre?: string[];
  estimatedTotalWordCount?: number;
  status?: "outline" | "in-progress" | "complete" | "published";
  decisions?: string;
  throughlineElements?: string[];
  seriesConstraints?: string[];
  notes?: string;
  firstPublishedDate?: Date;
  author?: string;
}

interface Book {
  id: string;
  userId: string;
  seriesId?: string;
  title: string;
  description: string;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Story Bible
  workingTitle?: string;
  targetAudience?: string;
  genre?: string[];
  estimatedWordCount?: number;
  estimatedChapters?: number;
  status?: "outline" | "draft" | "editing" | "beta" | "published";
  mainPlotlines?: string[];
  principle?: string;
  escalation?: string;
  themes?: string[];
  bookConstraints?: string[];
  notes?: string;
  publishedDate?: Date;
  isbn?: string;
}
```

### 2. Repository Functions (seriesRepository.ts)

Добавить функции для работы со Story Bible:

```typescript
// Обновить Series Story Bible
export async function updateSeriesStoryBible(
  seriesId: string,
  data: {
    targetAudience?: string;
    genre?: string[];
    estimatedTotalWordCount?: number;
    status?: string;
    decisions?: string;
    throughlineElements?: string[];
    seriesConstraints?: string[];
    notes?: string;
    firstPublishedDate?: Date;
    author?: string;
  }
): Promise<Series>

// Получить Series со Story Bible
export async function getSeriesWithBible(seriesId: string): Promise<Series>
```

### 3. Repository Functions (bookRepository.ts)

Добавить функции для работы со Story Bible:

```typescript
// Обновить Book Story Bible
export async function updateBookStoryBible(
  bookId: string,
  data: {
    workingTitle?: string;
    targetAudience?: string;
    genre?: string[];
    estimatedWordCount?: number;
    estimatedChapters?: number;
    status?: string;
    mainPlotlines?: string[];
    principle?: string;
    escalation?: string;
    themes?: string[];
    bookConstraints?: string[];
    notes?: string;
    publishedDate?: Date;
    isbn?: string;
  }
): Promise<Book>

// Получить Book со Story Bible
export async function getBookWithBible(bookId: string): Promise<Book>

// Получить Book с inherited Series Story Bible
export async function getBookWithInheritedBible(bookId: string): Promise<{
  book: Book;
  inherited: {
    targetAudience?: string;  // из Series если Book.targetAudience null
    genre?: string[];         // из Series если Book.genre empty
  };
}>
```

### 4. Helper functions (model.ts или новый файл)

```typescript
// Normalize Series — default missing fields
export function normalizeSeries(data: any): Series { ... }

// Normalize Book — default missing fields
export function normalizeBook(data: any): Book { ... }

// Get inherited audience (Book override Series)
export function getEffectiveAudience(book: Book, series?: Series): string | undefined {
  return book.targetAudience ?? series?.targetAudience;
}

// Get inherited genre
export function getEffectiveGenre(book: Book, series?: Series): string[] {
  return book.genre && book.genre.length > 0 ? book.genre : series?.genre ?? [];
}
```

## Validation

1. `npx tsc --noEmit` — TypeScript типы правильные?
2. Функции Repository используют Prisma client правильно?
3. Normalize функции обрабатывают null/undefined корректно?

## Output

ARP файлом в docs/task-bus/queue/active/:
1. Скриншот model.ts (новые типы)
2. Скриншот seriesRepository.ts (новые функции)
3. Скриншот bookRepository.ts (новые функции)
4. Результат `npx tsc --noEmit` (успешно)

## Stop Condition

Не коммитить без подтверждения Product Owner.
