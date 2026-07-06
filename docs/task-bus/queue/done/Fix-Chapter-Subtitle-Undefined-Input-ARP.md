# ARP — Fix-Chapter-Subtitle-Undefined-Input

**Задача:** СРОЧНО — чинить controlled/uncontrolled warning для старых глав без subtitle
**Статус выполнения:** Готово к ревью

## Что сделано

В `apps/studio/src/components/EditorArea.tsx`, поле Subtitle: `value={selectedChapter.subtitle}`
→ `value={selectedChapter.subtitle ?? ""}`. Точечная правка на месте использования, ровно как
предписано — `loadWorkspace()`/форма хранения не тронуты (там уместен только уже существующий
верхнеуровневый merge, вложенная миграция полей — отдельная тема, не в этом Step Card).

Проверил `value={selectedChapter.title}` чуть выше, как и просил Step Card: `title` — поле
Chapter с самого начала (Sprint 06), для старых сохранённых данных не может быть `undefined` —
оставлен без изменений, без `?? ""`.

## Диф

```diff
           <input
-            value={selectedChapter.subtitle}
+            value={selectedChapter.subtitle ?? ""}
             onChange={(event) =>
               onUpdateChapter?.(selectedChapter.id, {
                 subtitle: event.target.value,
               })
             }
             placeholder="Subtitle..."
             className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-center text-sm text-zinc-600 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
           />
```

## Валидация

```
npm run build → успешно (Compiled successfully, TypeScript без ошибок)
npm run lint  → чисто
git status --short → ровно 1 файл (EditorArea.tsx, M) — единственный Allowed path
```

**Живая проверка — выполнена по-настоящему, не только код-ревью.** Тот же приём, что и в
`Fix-Missing-Characters-In-Old-Saved-Workspace`: временный tsx-скрипт мокает
`global.window.localStorage` JSON-ом главы в формате ДО Sprint-10-Step-05 (без поля `subtitle`),
импортирует реальный, скомпилированный `loadWorkspace()` напрямую через `file://` и проверяет
результат:

- `chapter.subtitle` после загрузки — реально `undefined` (подтверждает предпосылку бага:
  верхнеуровневый merge в `loadWorkspace()` не восстанавливает поля ВНУТРИ вложенных объектов
  массива `chapters`, только на уровне самого `Workspace`).
- `chapter.subtitle ?? ""` — то, что теперь реально рендерит `EditorArea` — `""`, то есть
  controlled input с самого первого рендера, без переключения controlled/uncontrolled.

Оба факта подтверждены реальным вызовом реального кода, не предположением. Это не замена
буквальному ручному тесту в браузере (открыть DevTools, положить старые данные, увидеть
отсутствие warning в консоли) — прошу вас лично в этом убедиться.

## Отклонения от Step Card

Нет.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect. Понимаю срочность, готов закоммитить
сразу по получении OK. После этого перехожу к `Sprint-10-Step-06.md` (пересекается по
`EditorArea.tsx`, поэтому строго после этой правки).

Жду REVIEW.md.
