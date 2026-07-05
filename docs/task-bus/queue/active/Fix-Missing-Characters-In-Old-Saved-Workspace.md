id: Fix-Missing-Characters-In-Old-Saved-Workspace
name: "СРОЧНО: чинить краш characters.find на старых сохранённых Workspace"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/storage/workspaceStorage.ts

Forbidden paths:
- всё остальное

## Objective

Реальная ошибка воспроизведена в браузере Product Owner (скриншот):
`Cannot read properties of undefined (reading 'find')` в
`useWorkspaceController.ts:61` (`characters.find(...)`).

Причина: `loadWorkspace()` делает `JSON.parse(raw) as Workspace` без
проверки полноты полей. Workspace, сохранённый в localStorage ДО
Sprint 10 (когда полей `characters`/`selectedCharacterId` ещё не
существовало), при загрузке не содержит их — отсюда `undefined`.

Исправление — в `loadWorkspace()`, при успешном парсинге, слить
результат поверх `EMPTY_WORKSPACE` (а не подставлять его только при
отсутствии/ошибке raw), чтобы отсутствующие в старых данных поля
получали дефолт, а не оставались `undefined`:

```typescript
export function loadWorkspace(): Workspace {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_WORKSPACE;
    return { ...EMPTY_WORKSPACE, ...(JSON.parse(raw) as Partial<Workspace>) };
  } catch {
    return EMPTY_WORKSPACE;
  }
}
```

Это неглубокое (shallow) слияние — достаточно, так как все поля
Workspace верхнего уровня независимы (book, chapters, characters и
т.д. не вложены друг в друга структурно для этой цели). Не вводи
версионирование схемы или более сложную миграцию — это осознанно
за пределами scope (принцип "No versioning" остаётся в силе,
дефолт-слияние — минимальная защита от undefined, не полноценная
система миграций).

## Rules

- Минимальное изменение — только loadWorkspace().
- saveWorkspace() не менять.
- Не вводи новых зависимостей/библиотек валидации.

## Validation

- npm run build / npm run lint — чисто.
- Живая проверка: вручную положить в localStorage (через DevTools)
  JSON старого формата (без characters/selectedCharacterId) под
  ключом literary-studio-workspace, перезагрузить страницу — приложение
  должно открыться без краша, с characters: [] по умолчанию.
- Проверить, что обычная загрузка уже полного (нового формата)
  Workspace продолжает работать как раньше (регрессия).
- Приложи изменённый файл целиком.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect. Это приоритетная задача —
блокирует реальное использование приложения прямо сейчас.
