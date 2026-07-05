# ARP — Sprint-09-Step-03: UI — подключить Reader через AI Bus

## STATUS

OK (с тем же принятым ограничением проверки, что и в Sprint-08-Step-03/04 — см. VALIDATION)

## SUMMARY (RU)

Режим "Reader" в `EditorArea.tsx` больше не использует общий `handleImprove()`
(`improve_text`) — добавлена `handleReader()`, вызывающая
`aiBus.execute({ operation: { type: "reader_reaction", ... } })`. Проще, чем Critic:
`/api/reader` уже возвращает обычную строку, поэтому `result.response.text` кладётся в новое
состояние `readerReaction` напрямую, без `JSON.parse`. Reader, как и Critic, производит
Review, а не Revision — новый превью-блок для Reader показывает реакцию как есть, без кнопки
«Заменить текст», только «Закрыть». Захват выделения переиспользует уже существующую
`getSelectedText()` (Sprint-08-Step-03) без изменений — тот же fallback на весь текст сцены
при пустом выделении.

Кнопка теперь диспетчеризирует на три обработчика: `handleCritic` / `handleReader` /
`handleImprove`, в зависимости от `mode`. Вывод Editor/Co-author (`handleImprove`,
`improve_text`) и Critic не тронуты — подтверждено пустым диффом вокруг них и живой
регрессионной проверкой. `ai/**`, `api/**`, `LineEditorPanel.tsx` не затронуты.

## FILES MODIFIED

- `apps/studio/src/components/EditorArea.tsx` — единственный изменённый файл.

**Ключевые добавленные фрагменты** (полный файл — в рабочем дереве):

```tsx
const [readerReaction, setReaderReaction] = useState("");
```

```tsx
async function handleReader() {
  setStatus("loading");
  try {
    const selected = getSelectedText();
    const result = await aiBus.execute({
      operation: {
        type: "reader_reaction",
        payload: { text: selected },
      },
      context: { sceneId, chapterId, bookTitle },
    });
    setReaderReaction(result.response.text);
    setReviewedText(selected);
    setRunCounts((previous) => ({ ...previous, [mode]: previous[mode] + 1 }));
    setStatus("preview");
  } catch {
    setStatus("error");
  }
}
```

Превью-блок для Reader (без кнопки замены текста) и обновлённый диспетчер кнопки
(`mode === "Critic" ? handleCritic : mode === "Reader" ? handleReader : handleImprove`) —
по аналогии с Critic-блоком, добавлены тем же паттерном.

## VALIDATION

- `npm run build` — успешно, TypeScript без ошибок.
- `npm run lint` — чисто.
- `npx prettier --check` — соответствует стилю.
- `git status --short apps/studio/` → только `EditorArea.tsx`; `ai/**`, `api/**`,
  `LineEditorPanel.tsx` не изменены.
- **Живая проверка настоящего `aiBus.execute()`** (тот же метод, что в Sprint-08-Step-02/03):
  временный `tsx`-скрипт против `next start -p 3042`, импортирующий реальный `aiBus.ts`:
  - `operation.type: "reader_reaction"` дошёл до `/api/reader`, вернул обычную строку на
    русском: *«Честно говоря, всего одна фраза, а зацепить уже успела — есть в ней что-то
    кинематографичное...»* — звучит как впечатление читателя, без редактуры/категоризации.
  - Регрессия: `improve_text` → `"She doesn't know the answer."` (идентично всем предыдущим
    шагам); `critic_review` → валидный JSON-массив, парсится (`Array.isArray` → `true`). Оба
    пути не сломаны этим изменением.
- **Честное ограничение (как в Step 03/04 для Critic):** нет инструмента браузерной
  автоматизации в этой среде — не могу буквально выделить фрагмент мышью, нажать «Reader» и
  снять скриншот. Проверка ограничена прямым вызовом настоящего `aiBus.execute()` (тот же
  код-путь, что вызывает `handleReader`) плюс построчным код-ревью нового блока. Fallback без
  выделения не тестировался отдельно в этом шаге — переиспользует уже проверенную в
  Sprint-08-Step-03 функцию `getSelectedText()` без единого изменения в ней.

## RISKS

- То же принятое ограничение проверки, что и в предыдущих UI-шагах для Critic — Architect уже
  подтверждал приемлемость такого уровня proof в этой среде (Sprint-08-Step-03/04 REVIEW).
- `readerReaction` и `reviewedText` — раздельные state-переменные, но `reviewedText`
  переиспользуется и Critic'ом, и Reader'ом (оба хранят «что было реально отправлено») — не
  создаёт коллизии, так как только один режим активен единовременно и оба обработчика
  устанавливают `reviewedText` перед переходом в `"preview"`.

## SYSTEM STATE

Не закоммичено — Stop Condition требует `STATUS: OK`. Изменён только `EditorArea.tsx`. Step
Card и этот ARP — в `docs/task-bus/queue/active/Sprint-09-Step-03.md` /
`docs/task-bus/queue/active/Sprint-09-Step-03-ARP.md`.

## NEXT STEP

Жду `REVIEW.md`.
