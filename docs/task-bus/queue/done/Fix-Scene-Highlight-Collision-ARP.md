# ARP — Fix-Scene-Highlight-Collision

**Задача:** СРОЧНО — фикс одновременной подсветки сцен с одинаковым id в разных главах
**Статус выполнения:** Готово к ревью

## Что сделано

В `apps/studio/src/components/Sidebar.tsx`, условие подсветки кнопки сцены дополнено проверкой
`selectedChapterId === chapter.id` (в дополнение к уже существовавшему `selectedSceneId ===
scene.id`) — `chapter` уже доступен в замыкании (`chapters.map((chapter) => ...
chapter.scenes.map((scene) => ...))`. Правка ровно та, что была продиктована, ничего другого в
файле не менялось.

## Диф

```diff
                         className={`w-full rounded-md px-2 py-1 text-left text-sm transition-colors ${
-                          selectedSceneId === scene.id
+                          selectedChapterId === chapter.id &&
+                          selectedSceneId === scene.id
                             ? "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white"
                             : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-900"
                         }`}
```

## Валидация

```
npm run build → успешно (Compiled successfully, TypeScript без ошибок)
npm run lint  → чисто
git status --short → ровно 1 файл (Sidebar.tsx, M) — единственный Allowed path
```

**Живая проверка (честно, ограничение среды):** нет браузера — та же оговорка, что и всегда.
Код-ревью: до правки `selectedSceneId === scene.id` игнорировал главу, поэтому Scene "1" в
Главе 1 и Scene "1" в Главе 2 подсвечивались одновременно при выборе любой из них (баг чисто в
условии, не в данных — сами данные загружаются через `selectedChapter`, корректно, что и
подтверждает сам Step Card). После правки обе части условия обязательны — подсветка возможна
только для сцены, чей `chapter.id` совпадает с `selectedChapterId`. Прошу лично проверить:
создать вторую главу (у обеих будет Scene 1), выбрать Scene 1 в Главе 1 — подсвечивается только
она, не Scene 1 в Главе 2.

## Отклонения от Step Card

Нет.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect. Понимаю срочность, готов закоммитить
сразу по получении OK. После этого перехожу к `Sprint-10-Step-05.md` (пересекается по
`Sidebar.tsx`, поэтому строго после этой правки).

Жду REVIEW.md.
