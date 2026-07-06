# ARP — Fix-Assistant-Button-Label-Ask

**Задача:** Кнопка помощника: единая подпись "Спросить" вместо названия режима
**Статус выполнения:** Готово к ревью

## Что сделано

В `apps/studio/src/components/EditorArea.tsx` кнопка-триггер: `mode` заменён на константную
строку `"Спросить"` — ровно по Step Card. Название режима уже видно в `<select>` над кнопкой,
дублировать его на самой кнопке избыточно, как и уточнил Product Owner.

## Диф

```diff
       >
-        {status === "loading" ? info.preamble : mode}
+        {status === "loading" ? info.preamble : "Спросить"}
       </button>
```

## Валидация

```
npm run build → успешно (Compiled successfully)
npm run lint  → чисто
npx prettier --check → чисто
git status --short → ровно 1 файл (EditorArea.tsx, M) — единственный Allowed path
```

**Живая проверка (честно):** чисто текстовая константа, без обращения к бэкенду/API. Код-ревью
подтверждает: независимо от значения `mode`, ветка "не loading" теперь всегда рендерит
`"Спросить"`. Прошу лично проверить в браузере: кнопка показывает "Спросить" при любом выбранном
режиме в списке.

## Отклонения от Step Card

Нет.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect.

Жду REVIEW.md.
