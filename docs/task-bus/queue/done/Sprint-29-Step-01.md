id: Sprint-29-Step-01
name: "ADR-0014: Архитектурное решение о Series (группы книг)"
type: adr

## Контекст

Product Owner добавил Book Series (групп книг с общими персонажами и миром) в ROADMAP_18-27.md
как Sprint 29 с низкой уверенностью ("Требует расширения доменной модели"). 

Прочтение текущего кода показывает:
- Book сейчас не имеет никаких ссылок на Series
- Workspace (domain/model.ts) не содержит Series
- Нет ни Prisma-таблицы, ни repository-кода под это
- Нет API-маршрутов для Series CRUD

Как при Sprint 24 (ADR-0012) и Sprint 25 (ADR-0013), перед началом реализации нужно:
1. Зафиксировать архитектурное решение письменно
2. Выявить genuine product fork-и, требующие Product Owner'а, а не implementation choices
3. Заморозить spec для остальных Step Card'ов этого спринта

Этот ADR существует для этого — как чистое архитектурное решение, без кода.

## Decision

### Определение Series (Group of Books)

Series — группа книг (2+ книги), объединённые общей тематикой, персонажами, миром или
циклом. Примеры: «Гарри Поттер» (7 книг), «Одинокий волк» (серия из ~30 романов).

### Модель данных

```
Series {
  id: string (CUID, globally unique)
  userId: string (который пользователь владеет этой серией)
  title: string (название серии, e.g. "Гарри Поттер")
  description: string (опциональное — кратко о серии)
  createdAt: DateTime (auto)
  updatedAt: DateTime (auto)
}

Book {
  // существующие поля...
  seriesId?: string | null (опциональная ссылка на Series, many-to-one)
}
```

**Ключевые решения:**
1. **Опциональность:** Book.seriesId — nullable. Не всякая книга принадлежит серии.
2. **Ownership:** Series привязана к userId (как Book) — каждый пользователь видит/редактирует
   только свои серии (начальный stopgap перед Sprint 30 Multi-user). Пользователь может
   добавлять в свою серию только свои же книги.
3. **Каскадное удаление:** при удалении Series книги остаются (просто teряют seriesId).
   При удалении Book из БД она просто удаляется, seriesId никого не касается. Это предполагает
   DELETE ... SET seriesId = NULL или просто оставляет orphaned reference — решит Step-02
   в точном синтаксисе Prisma.
4. **Ordering:** Series может иметь опциональное поле `order: Int` (порядок серий в боковой панели).
   Если не будет, используется createdAt. Решает Product Owner в этом ADR (см. ниже).

### Доменная модель

Series добавляется в domain/model.ts как новый типе:

```typescript
export type Series = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly description: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};
```

Workspace расширяется с новым полем (опциональное):

```typescript
export type Workspace = {
  // существующие поля...
  readonly series?: readonly Series[];
};
```

Или как часть Workspace.books, или как отдельный top-level массив? **Это вопрос для Product
Owner — но рекомендуемый выбор:** Series как отдельный top-level массив в Workspace, параллельно
books, потому что:
- Series это не book, это container для books
- UI-дерево (Sidebar) может показывать Series -> Books иерархию
- Запросы "все books" и "все series" не требуют друг друга

Если Product Owner хочет иначе (например, Book.series inline), этот ADR пересматривается.

### Repo/API контракты (только контуры, детали — Step-02 и далее)

- Repository: `loadSeriesForUser(userId)`, `saveSeriesToUser(userId, series, books)`
- API: `GET /api/series` (список), `POST /api/series` (создать), `PUT /api/series/{id}` (обновить),
  `DELETE /api/series/{id}` (удалить), `POST /api/series/{id}/add-book` (добавить книгу),
  `POST /api/series/{id}/remove-book` (убрать книгу).

Или все CRUD книги-в-серии через PUTодержа series-объект целиком, как в Book? Рекомендация:
зеркалировать контракт Series (целый объект через PUT) плюс добавить два convenience-endpoints
для быстрого добавления/удаления книги без перезагрузки всей серии. Product Owner подтверждает.

### UI контуры (только vision, не реализация)

- NewSeriesDialog (создать серию)
- Series list в Sidebar (как Books list, но раскрывается tree)
- SeriesEditDialog (переименовать/описание)
- Drag-drop Book в Series в Sidebar (опциональное — на усмотрение Product Owner)

## Открытые вопросы для Product Owner

1. **Порядок (ordering):** нужно ли поле `order: Int` на Series, или `createdAt` достаточно?
2. **Book-in-Series удаление:** если пользователь удаляет Book, которая в Series, что должно
   произойти?
   - Опция A: Book удаляется целиком (текущее поведение), Series остаётся
   - Опция B: подтверждение перед удалением ("эта книга в серии, удалить её из серии?")
   
   Рекомендация: Опция A (simple), с явным warning в UI если захочется позже.

3. **Иерархия в Workspace:** Series как отдельный top-level массив, или inline с Books?
   Рекомендация: top-level (см. выше).

4. **Редактирование Series сейчас (до Sprint 30 Multi-user):** может ли текущий единственный
   пользователь редактировать любую Series, или только свои (по userId)?
   
   Рекомендация: только свои, для согласованности с Book (все books текущего пользователя, все
   series текущего пользователя). Когда Sprint 30 добавит реальных пользователей, это станет
   прозрачным.

**Эти три вопроса должны быть решены перед Step-02.**

## Consequences

- Prisma schema будет расширена с таблицей Series + миграция
- domain/model.ts добавит тип Series и расширит Workspace
- Все четыре слоя (Repository, API, Controller, UI) могут строиться независимо поверх этого
  решения, зная точно форму данных
- Нет breaking changes в существующей Book-структуре (seriesId — optional)

## Known Gaps / Triggers for Future ADRs

- Полная иерархия (Series -> Book -> Chapter -> Scene) в UI не спроектирована — это Step-06 (UI)
- Совместное редактирование Series (что если два пользователя одновременно редактируют одну
  Series) — Sprint 30 (Multi-user) и позже
- Экспорт/импорт Series — остаётся вне scope (документ vision, раздел 8)
- Поиск по Series — не спроектирован, может быть дополнением позже

## Stop Condition

Не создавать Step-02 (Prisma) без явного подтверждения Product Owner на три открытых вопроса выше.
