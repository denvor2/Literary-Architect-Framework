id: Sprint-33-Step-01
name: "Система корзины: добавление deletedAt в Book + мягкое удаление"
type: implementation

## Контекст

Sprint 32 добавил систему аудита логирования (Event таблица). В Sidebar уже есть кнопка 
удаления книги (Trash2 иконка), но она выполняет hard delete (полное удаление). 

Sprint 33 должна добавить систему корзины с восстановлением:
- Книги помечаются как удалённые (deletedAt), а не полностью удаляются
- Sidebar показывает только активные книги
- Отдельный раздел "Корзина" для восстановления или окончательного удаления

Этот Step — первый из цепочки trash-системы. Он касается только схемы Prisma, 
репозитория и логики контроллера. UI идёт в Step следующих.

## Scope

### Allowed paths (ТОЛЬКО):

- apps/studio/prisma/schema.prisma (добавить deletedAt поле в Book model)
- apps/studio/prisma/migrations/ (новая миграция для добавления deletedAt)
- apps/studio/src/repositories/bookRepository.ts (изменить loadBooksForUser, добавить новые методы)
- apps/studio/src/workspace/useWorkspaceController.ts (изменить deleteBook, добавить restoreBook/permanentlyDeleteBook)
- apps/studio/src/app/api/workspace/route.ts (обновить GET/POST для фильтрации deleted books)

### Forbidden paths:

- apps/studio/src/components/** (UI идёт в Step-02)
- любые другие файлы в domain/

## Objective

Реализовать мягкое удаление книг (soft delete) на уровне доменной модели, репозитория и API:

1. **Prisma schema:** добавить поле `deletedAt?: DateTime` в model Book
2. **Миграция:** запустить `prisma migrate dev --name add-book-soft-delete`
3. **Repository:** 
   - `loadBooksForUser()` возвращает только active books (WHERE deletedAt IS NULL)
   - Добавить `loadDeletedBooksForUser()` (WHERE deletedAt IS NOT NULL)
   - Добавить `restoreBook(bookId)` (SET deletedAt = NULL)
   - Добавить `permanentlyDeleteBook(bookId)` (hard delete)
4. **Workspace Controller:**
   - `deleteBook()` → soft delete (SET deletedAt = now())
   - `restoreBook(bookId)` → новый метод (SET deletedAt = NULL)
   - `permanentlyDeleteBook(bookId)` → новый метод (hard delete)
5. **API /api/workspace:**
   - GET: возвращает только active books (как раньше)
   - POST: при сохранении, не трогать deleted books (уже исключены)

## Rules

1. Мягкое удаление: только SET deletedAt, никогда не трогать chapters/scenes/characters/ideas
2. Данные не удаляются: если пользователь восстановит книгу, всё содержимое вернётся неизменным
3. loadBooksForUser() должна фильтровать WHERE deletedAt IS NULL автоматически
4. Логирование: при deleteBook — логировать book_deleted событие (EventType.book_deleted)
5. Нет UI — это Step только для логики; кнопки/dialogs идут дальше

## Validation

Все из apps/studio/:

1. **Миграция:**
```bash
npx prisma migrate dev --name add-book-soft-delete
```
- Успешный запуск без ошибок
- Таблица book получает колонку deleted_at (nullable DateTime)

2. **Тип-чекинг:**
```bash
npx tsc --noEmit
```
- Book.deletedAt: DateTime | undefined распознана
- Все функции repos/bookRepository.ts типизированы правильно

3. **Функциональность (psql или дебаг-лог):**
   - Создать книгу → loadBooksForUser() возвращает её
   - deleteBook(bookId) → deletedAt становится not null
   - loadBooksForUser() больше не возвращает её
   - loadDeletedBooksForUser() возвращает её
   - restoreBook(bookId) → deletedAt становится null, loadBooksForUser() возвращает её снова
   - permanentlyDeleteBook(bookId) → полное удаление из БД

4. **Логирование:**
   - При deleteBook → логируется EVENT с type='book_deleted', metadata={bookId, title}

## Output

ARP файлом в docs/task-bus/queue/active/:
1. Полный вывод `npx prisma migrate dev`
2. Содержимое migration.sql файла
3. Результат `npx tsc --noEmit`
4. Тестовые логи доказывающие soft delete работает (не требует UI тестирования)
5. Результат `git status --short`

## Stop Condition

Не коммитить без подтверждения Product Owner.
