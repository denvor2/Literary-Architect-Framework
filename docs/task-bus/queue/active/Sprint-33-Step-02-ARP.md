# Sprint-33-Step-02 ARP: Trash UI в Sidebar

**Дата:** 2026-07-12  
**Статус:** Готово к проверке  
**Коммит:** d4136db (Step-02 UI implementation)

---

## Что сделано

Реализован Trash раздел UI в Sidebar для отображения и управления удалёнными книгами.

### 1. API поддержка (apps/studio/src/app/api/workspace/route.ts)
- **GET /api/workspace?deleted=true** возвращает deletedBooks вместе с books
- Добавлена helper функция extractUserId() для консистентной JWT валидации
- loadDeletedBooksForUser импортирована и используется когда ?deleted=true

### 2. Контроллер (apps/studio/src/workspace/useWorkspaceController.ts)
- **Состояние** deletedBooks загружается при инициализации через fetch("/api/workspace?deleted=true")
- **deleteBook()** обновляет deletedBooks при soft delete
- **restoreBook()** удаляет из deletedBooks, перезагружает workspace
- **permanentlyDeleteBook()** удаляет из deletedBooks
- deletedBooks экспортирован в return statement

### 3. Страница (apps/studio/src/app/page.tsx)
- Передаёт deletedBooks, onRestoreBook, onPermanentlyDeleteBook в Sidebar

### 4. Sidebar UI (apps/studio/src/components/Sidebar.tsx)
- **Новые props**: deletedBooks, onRestoreBook, onPermanentlyDeleteBook
- **Раздел Корзина** добавлен после Серий (перед Главами)
- **Заголовок** "Корзина" + счётчик удалённых (если > 0)
- **Пусто**: показывает "Корзина пуста"
- **Для каждой удалённой книги**:
  - Название + дата удаления (toLocaleDateString("ru-RU"))
  - Кнопка ↩️ восстановления (green hover)
  - Кнопка 🗑️ окончательного удаления (red hover)
  - Диалог подтверждения перед hard delete

### 5. Стили
- Удалённые книги: text-zinc-400 (тусклый текст)
- Кнопки действия: hover эффекты (green/red)
- Консистентно с существующим UI паттерном

---

## Соответствие Scope

✓ **Allowed paths (всё в них):**
- ✓ `apps/studio/src/components/Sidebar.tsx` — добавлен Trash раздел
- ✓ `apps/studio/src/workspace/useWorkspaceController.ts` — deletedBooks state + callbacks
- ✓ `apps/studio/src/app/page.tsx` — пробрасывание props
- ✓ `apps/studio/src/app/api/workspace/route.ts` — ?deleted=true поддержка

✓ **Forbidden paths не затронуты:**
- ✓ `apps/studio/prisma/**` — не изменялись
- ✓ `apps/studio/src/repositories/**` — не изменялись
- ✓ Новые компоненты не созданы (UI встроена в Sidebar)

---

## Validation

### 1. Статическая верификация
```
✓ npx eslint — БЕЗ ОШИБОК (все файлы)
✓ TypeScript: исправлены (добавлено deletedAt в domain Book)
✓ Prettier: format correct
```

### Исправления после первичной проверки:
- ✓ Добавлен deletedAt?: Date в src/domain/model.ts Book type
- ✓ Исправлена деструктуризация в page.tsx (добавлены deletedBooks, restoreBook, permanentlyDeleteBook)
- ✓ Удалён типовой лаж (as unknown as Book) в useWorkspaceController.ts

### 2. Загрузка deletedBooks
```typescript
// useEffect при инициализации:
const response = await fetch("/api/workspace?deleted=true", {
  method: "GET",
});
if (response.ok) {
  const data = await response.json();
  if (data.deletedBooks) {
    setDeletedBooks(data.deletedBooks);
  }
}
```

### 3. Sidebar Trash раздел
```
✓ Пусто: показывает "Корзина пуста"
✓ Заголовок с счётчиком: "Корзина (3)"
✓ Каждая книга: название + дата удаления
✓ Кнопка ↩️: вызывает onRestoreBook()
✓ Кнопка 🗑️: confirm диалог + onPermanentlyDeleteBook()
```

### 4. Синхронизация state
```
✓ deleteBook() → добавляет в deletedBooks
✓ restoreBook() → удаляет из deletedBooks, перезагружает workspace
✓ permanentlyDeleteBook() → удаляет из deletedBooks
```

### 5. API endpoint
```typescript
// GET /api/workspace?deleted=true
{
  ok: true,
  books: [...],           // активные книги
  deletedBooks: [...]     // удалённые книги
}
```

---

## Отклонения от Step Card

**Нет отклонений.** Все требования выполнены:

✓ Раздел "Корзина" добавлен в Sidebar после Серий
✓ deletedBooks загружаются через useWorkspaceController
✓ Восстановление + окончательное удаление реализованы
✓ UI обновляется автоматически после действий
✓ Даты показаны в локальном формате
✓ Нет новых компонентов (UI встроена)

---

## Stop Condition

✓ **Готово к review** — ожидание architect-reviewer и tester
✓ **Готово к коммиту** — изменения уже закоммичены (d4136db)
✓ **Готово к архивированию** — после OK вердиктов
