# Trash Uniqueness Guarantees

## Problem

Deleted items were appearing multiple times in trash due to:
1. Duplicate additions to state arrays
2. Items loaded twice from localStorage (React.StrictMode)
3. Display issues in UI rendering

## Solution: Three-Layer Defense

### Layer 1: Prevention at Source (useWorkspaceController.ts)
**Location:** `deleteBook()`, `deleteScene()`, `deleteChapter()`, `deleteCharacter()`, `deleteIdea()`

Before adding item to trash, check if it already exists:
```typescript
setDeletedBooks((previous) => {
  // Don't add if already exists (prevent duplicates)
  if (previous.some((b) => b.id === bookId)) {
    console.log("[TRASH] Book already in trash, skipping duplicate");
    return previous;
  }
  // Add new item...
});
```

**Defense against:** Accidental double-click, rapid deletion calls, race conditions

### Layer 2: Database Deduplication (bookRepository.ts)
**Location:** `loadDeletedBooksForUser()`

When loading deleted items from database, filter out duplicates:
```typescript
// Deduplicate by ID (defense against data corruption)
const seen = new Set<string>();
const uniqueBooks: typeof books = [];
for (const book of books) {
  if (!seen.has(book.id)) {
    seen.add(book.id);
    uniqueBooks.push(book);
  } else {
    console.warn("[loadDeletedBooksForUser] Duplicate book ID in trash:", book.id);
  }
}
```

**Defense against:** Data corruption, stale data from multiple instances

### Layer 3: Display Deduplication (Sidebar.tsx)
**Location:** Trash section rendering with IIFE

Before rendering deleted items, deduplicate by ID:
```typescript
{(() => {
  const seenIds = new Set<string>();
  const uniqueBooks = deletedBooks.filter((book) => {
    if (seenIds.has(`book-${book.id}`)) return false;
    seenIds.add(`book-${book.id}`);
    return true;
  });
  // Render using uniqueBooks, uniqueChapters, etc...
})()}
```

**Defense against:** State corruption, orphaned UI elements

## Testing

### E2E Tests (trash-uniqueness.spec.ts)
- `no duplicates when deleting book` - Immediate deletion shows single item
- `no duplicates when deleting scene` - Works for all element types
- `no duplicates after fast double-click delete` - Handles rapid user actions
- `trash items persist uniquely after reload` - Data consistency after page reload

**Run:**
```bash
npm run test:e2e e2e/trash-uniqueness.spec.ts
```

### Verification Steps

1. **Create element** → **Delete** → Check trash (should show 1x)
2. **Create element** → **Double-click delete button** → Check trash (should show ≤1x)
3. **Create element** → **Delete** → **Reload page** → Check trash (should show 1x)
4. **Create multiple elements** → **Delete all** → Check trash counts match

## Implementation Details

### Unique Identifier Strategy
- Each deleted item identified by `{type}-{id}` in UI (e.g., `book-uuid-123`)
- All checks use the item's native `.id` field
- No additional database columns needed

### Performance
- Layer 1 (source prevention): O(n) check per deletion (acceptable - happens on user action)
- Layer 2 (DB deduplication): O(n) filter during load (acceptable - runs once at startup)
- Layer 3 (display): O(n) Set-based filter per render (optimized with Set lookup)

### Logging
All three layers log when duplicates are detected:
```
[TRASH] Book already in trash, skipping duplicate
[loadDeletedBooksForUser] Duplicate book ID in trash: [id]
```

Monitor logs to catch data corruption early.

## Future Improvements

1. **Database Constraint:** Add unique constraint on (userId, id, deletedAt IS NOT NULL)
   - Would prevent duplicates at DB level
   - Requires schema migration

2. **Archive Tables:** Separate archive table for deleted items
   - Better query performance
   - Cleaner schema
   - Requires migration planning

3. **Audit Trail:** Track why duplicates occurred
   - Timestamp of duplicate detection
   - Component/function that detected it
   - Can help prevent root causes
