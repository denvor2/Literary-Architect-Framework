# ARP — Fix-Scene-Title-Enter-To-Textarea

**Задача:** UX — Enter в поле названия сцены переводит фокус на текст сцены
**Статус выполнения:** Готово к ревью

## Что сделано

В `apps/studio/src/components/EditorArea.tsx` на `<input>` названия сцены добавлен `onKeyDown`:
по нажатию `Enter` — `event.preventDefault()` и `textareaRef.current?.focus()`. `textareaRef`
уже существовал в этой области видимости (объявлен в начале компонента, используется тем же
компонентом для чтения выделения текста для Critic/Reader с Sprint 08 Step 03) — доступен без
дополнительных изменений, как и предполагал Step Card. Tab-порядок/`tabIndex` не тронуты.

## Диф

```diff
             <input
               value={selectedScene.title}
               onChange={(event) =>
                 onUpdateSceneTitle?.(
                   selectedChapter.id,
                   selectedScene.id,
                   event.target.value,
                 )
               }
+              onKeyDown={(event) => {
+                if (event.key === "Enter") {
+                  event.preventDefault();
+                  textareaRef.current?.focus();
+                }
+              }}
               placeholder="Scene title..."
               className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-lg font-medium tracking-tight text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
             />
```

## Валидация

```
npm run build → успешно (Compiled successfully, TypeScript без ошибок)
npm run lint  → чисто
npx prettier --check → чисто (перепроверил заранее, учитывая прошлый эпизод с
                 форматированием)
git status --short → ровно 1 файл (EditorArea.tsx, M) — единственный Allowed path
```

**Живая проверка (честно, ограничение среды):** нет браузера — та же оговорка, что и всегда.
Код-ревью: `textareaRef` — тот же `useRef<HTMLTextAreaElement>` объект, к которому уже привязан
`ref={textareaRef}` на самой textarea текста сцены (не показано в этом дифе — не менялось);
`.focus()` на нём при нажатии Enter в поле названия корректно переводит фокус клавиатурой.
Прошу лично проверить: создать сцену (автофокус на названии) или кликнуть в поле названия
существующей сцены, нажать Enter — фокус переходит в textarea текста сцены, курсор готов к вводу.

## Отклонения от Step Card

Нет.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect.

Жду REVIEW.md.
