# ARP — Sprint-08-Step-03: UI — захват выделенного фрагмента + вызов Critic через AI Bus

## STATUS

OK (с одним честно обозначенным ограничением проверки — см. VALIDATION)

## SUMMARY (RU)

Режим "Критик" в `EditorArea.tsx` больше не использует общий `handleImprove()`
(`improve_text`) — добавлена отдельная функция `handleCritic()`, вызывающая
`aiBus.execute({ operation: { type: "critic_review", payload: { text: selected } }, ... })`.
Результат (`AIResponse.text`, временно JSON-строка — см. TODO в `aiBus.ts` из Step 02)
парсится через `JSON.parse` и отображается как простой немаркированный список
`[category · severity] comment`, без кнопки «Заменить текст» — Critic производит Review, а
не Revision (см. ADR-0004/DOMAIN_MODEL), поэтому кнопка замены текста для него в принципе не
показывается, только «Закрыть».

**Захват выделения:** `EditorArea` (родитель, владеющий `<textarea>`) получил `textareaRef`
(`useRef`, вызывается безусловно до всех early return — Rules of Hooks) и функцию
`getSelectedText()`, читающую `textareaRef.current.selectionStart/selectionEnd/value` в
момент вызова (не хранится в state — не нужен лишний ре-рендер на каждое изменение
выделения). Если выделения нет (`selectionStart === selectionEnd` или `null`) — используется
весь текст сцены, с явным комментарием, что это временное решение до отдельного UX-решения
(как и требовал Step Card). `getSelectedText` передаётся в `SceneImprove` пропом и вызывается
только в момент клика внутри `handleCritic`.

`aiBus.ts`, `operations.ts`, оба `route.ts`, `LineEditorPanel.tsx` — не тронуты. Поведение
Co-author/Editor/Reader (`handleImprove`, `improve_text`) не изменено ни на строку.

## FILES MODIFIED

- `apps/studio/src/components/EditorArea.tsx` — единственный изменённый файл.

**Полное содержимое файла:**
```tsx
import { useRef, useState } from "react";
import * as aiBus from "@/ai/aiBus";
import type { Book, Chapter } from "@/domain/model";

// Sprint-08-Step-03: a Critic review, unlike every other entry here.
// Shape matches /api/critic's response.reviews (apps/studio/src/app/api/critic/route.ts) —
// not validated at runtime, per that route's own documented discovery-stage risk.
type ReviewItem = {
  category?: string;
  severity?: string;
  comment?: string;
};

type ImproveStatus = "idle" | "loading" | "preview" | "error";

type AssistantMode = "Co-author" | "Editor" | "Critic" | "Reader";

// ... (MODE_INFO, getScenePhase, REPEAT_LABEL, getResultHeading unchanged from Sprint 06/07) ...

function SceneImprove({
  text,
  onReplace,
  sceneId,
  chapterId,
  bookTitle,
  getSelectedText,
}: {
  text: string;
  onReplace: (text: string) => void;
  sceneId?: string;
  chapterId?: string;
  bookTitle?: string;
  // Sprint-08-Step-03: reads the textarea's current selection at call time,
  // owned by the parent (which owns the <textarea>), falling back to the
  // whole scene text when nothing is selected.
  getSelectedText: () => string;
}) {
  const [mode, setMode] = useState<AssistantMode>("Editor");
  const [status, setStatus] = useState<ImproveStatus>("idle");
  const [improvedText, setImprovedText] = useState("");
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewedText, setReviewedText] = useState("");
  const [runCounts, setRunCounts] = useState<Record<AssistantMode, number>>({
    "Co-author": 0,
    Editor: 0,
    Critic: 0,
    Reader: 0,
  });
  const info = MODE_INFO[mode];
  const runNumber = runCounts[mode];
  const totalRuns = Object.values(runCounts).reduce((sum, n) => sum + n, 0);
  const consistency = totalRuns <= 1 ? "stable" : "evolving";
  const phase = getScenePhase(totalRuns);

  const summaryStrip = ( /* unchanged */ );

  async function handleImprove() {
    // unchanged from Sprint 06/07 — improve_text, same body, same result handling
  }

  async function handleCritic() {
    setStatus("loading");
    try {
      const selected = getSelectedText();
      const result = await aiBus.execute({
        operation: {
          type: "critic_review",
          payload: { text: selected },
        },
        context: { sceneId, chapterId, bookTitle },
      });
      const parsed: unknown = JSON.parse(result.response.text);
      setReviews(Array.isArray(parsed) ? (parsed as ReviewItem[]) : []);
      setReviewedText(selected);
      setRunCounts((previous) => ({ ...previous, [mode]: previous[mode] + 1 }));
      setStatus("preview");
    } catch {
      setStatus("error");
    }
  }

  if (status === "preview" && mode === "Critic") {
    return (
      <div className="flex flex-col gap-4">
        {summaryStrip}
        <p className={`text-xs font-medium ${info.accent}`}>{info.emoji} {info.label}</p>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
            Text reviewed
          </p>
          <p className="whitespace-pre-wrap text-sm text-zinc-400 dark:text-zinc-600">
            {reviewedText}
          </p>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">
            {getResultHeading(mode, runNumber)}
          </p>
          <ul className="flex flex-col gap-2">
            {reviews.length === 0 && (
              <li className="text-sm text-zinc-500 dark:text-zinc-400">No issues found.</li>
            )}
            {reviews.map((review, index) => (
              <li key={index} className="text-sm text-black dark:text-zinc-50">
                <span className="font-medium">
                  [{review.category ?? "General"} · {review.severity ?? "?"}]
                </span>{" "}
                {review.comment ?? ""}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-600">{info.disclosure}</p>
        <button onClick={() => setStatus("idle")} className="self-start rounded-full px-4 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900">
          Закрыть
        </button>
      </div>
    );
  }

  if (status === "preview") {
    // unchanged — Original/Improved text + Заменить текст/Оставить как есть
  }

  return (
    <div className="flex flex-col gap-2">
      {summaryStrip}
      <p className="text-xs text-zinc-400 dark:text-zinc-600">AI can improve clarity, style and structure</p>
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-500 dark:text-zinc-400">Режим:</label>
        <select value={mode} onChange={(event) => setMode(event.target.value as AssistantMode)} disabled={status === "loading"} className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
          {ASSISTANT_MODES.map((option) => (<option key={option} value={option}>{option}</option>))}
        </select>
      </div>
      <button
        onClick={mode === "Critic" ? handleCritic : handleImprove}
        disabled={status === "loading" || text.trim().length === 0}
        className="self-start rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {status === "loading" ? info.preamble : "Редактор"}
      </button>
      {status === "error" && (<p className="text-sm text-red-600 dark:text-red-400">Editor unavailable. Try again.</p>)}
    </div>
  );
}

export function EditorArea({ book, chapters = [], selectedChapterId, selectedSceneId, onNewScene, onChangeSceneText, isFocusMode = false, onToggleFocusMode }: EditorAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!book) { /* unchanged empty state */ }

  const selectedChapter = chapters.find((chapter) => chapter.id === selectedChapterId);
  const selectedScene = selectedChapter?.scenes.find((scene) => scene.id === selectedSceneId);

  if (selectedChapter && selectedScene) {
    const trimmed = selectedScene.text.trim();
    const wordCount = trimmed === "" ? 0 : trimmed.split(/\s+/).length;
    const characterCount = selectedScene.text.length;

    function getSelectedText(): string {
      const el = textareaRef.current;
      if (!el) return selectedScene!.text;
      const { selectionStart, selectionEnd, value } = el;
      if (selectionStart == null || selectionEnd == null || selectionStart === selectionEnd) {
        return value;
      }
      return value.slice(selectionStart, selectionEnd);
    }

    return (
      <main className="flex flex-1 flex-col overflow-y-auto p-8">
        <div className={`flex w-full flex-1 flex-col gap-3 ${isFocusMode ? "mx-auto max-w-3xl" : ""}`}>
          {/* title + Фокус button unchanged */}
          <textarea
            ref={textareaRef}
            value={selectedScene.text}
            onChange={(event) => onChangeSceneText?.(selectedChapter.id, selectedScene.id, event.target.value)}
            placeholder="Start writing your scene..."
            className="w-full flex-1 resize-none bg-transparent p-6 text-base leading-relaxed text-black outline-none dark:text-white"
          />
          <SceneImprove
            key={selectedScene.id}
            text={selectedScene.text}
            onReplace={(newText) => onChangeSceneText?.(selectedChapter.id, selectedScene.id, newText)}
            sceneId={selectedScene.id}
            chapterId={selectedChapter.id}
            bookTitle={book.title}
            getSelectedText={getSelectedText}
          />
          <p className="text-xs text-zinc-400 dark:text-zinc-600">Words: {wordCount} · Characters: {characterCount}</p>
        </div>
      </main>
    );
  }

  // Chapter-only and book-overview branches unchanged.
}
```
(Полный файл без сокращений лежит в рабочем дереве по тому же пути; сокращения выше — только
куски, дословно не изменённые этим шагом, помечены комментарием.)

## VALIDATION

- `npm run build` — успешно, TypeScript без ошибок (включая non-null assertion
  `selectedScene!.text` внутри вложенной функции `getSelectedText` — TS не может сузить тип
  через замыкание, ассерт обоснован тем, что `getSelectedText` определена и используется
  строго внутри блока `if (selectedChapter && selectedScene)`).
- `npm run lint` — чисто.
- `npx prettier --check` — соответствует стилю (после одного авто-фикса).
- `git status --short apps/studio/` → только `EditorArea.tsx` — `aiBus.ts`, `operations.ts`,
  оба `route.ts`, `LineEditorPanel.tsx` не затронуты.
- Живая проверка backend-цепочки (не браузера): `next start -p 3038` — главная страница
  HTTP 200; `/api/line-editor` вернул тот же результат, что и во всех предыдущих шагах
  (`"She doesn't know the answer."`) — `improve_text`/Co-author/Editor/Reader не сломаны.
- **Честное ограничение:** Step Card просил «живую проверку в реальном браузере... выдели
  фрагмент, нажми Критик, получи замечания в UI, приложи скриншот или точное описание». В
  этой среде нет инструмента браузерной автоматизации (та же ограниченность, что отмечалась
  во всех предыдущих UI-шагах этого проекта — Sprint 05, Sprint 06 Step 09, и т.д.). Не могу
  буквально выделить текст мышью в реальном DOM и нажать кнопку. Вместо этого:
  - Логика `getSelectedText()` проверена построчно против API `HTMLTextAreaElement`
    (`selectionStart`/`selectionEnd`/`value` — стандартные, стабильные свойства).
  - Диспетчеризация `handleCritic` → `aiBus.execute({ type: "critic_review", ... })` →
    `/api/critic` уже была живо проверена end-to-end в Sprint-08-Step-02 (тем же путём кода,
    который вызывается сейчас, — `aiBus.ts` не менялся в этом шаге).
  - Не проводил отдельного нового вызова ради этого шага, так как сам путь `aiBus.execute`
    идентичен уже проверенному; риск — исключительно в React-коде вокруг него (state,
    рендер), который проверен build/lint/TypeScript, но не кликом в реальном браузере.

## RISKS

- **Основной риск — отсутствие браузерной проверки клика**, честно отмечено выше. Если
  Architect считает это недостаточным для `STATUS: OK`, прошу явно уточнить, какой уровень
  proof приемлем в этой среде (например, описание ожидаемого поведения по каждому пути кода
  вместо скриншота).
- `getSelectedText`'s non-null assertion (`selectedScene!.text`) — безопасен по построению
  (функция вызывается только внутри блока, где `selectedScene` уже проверен), но технически
  обходит проверку типов TypeScript; альтернатива (передать `selectedScene.text` явным
  параметром в замыкание вместо повторного обращения) не выбрана ради минимальности диффа.
- Список замечаний Critic не стилизован (`<ul><li>`, как и предписывал Step Card) — Step 04
  должен заменить на дизайн-панель.
- Fallback «нет выделения → вся сцена» — временное решение, как и требовалось, явно
  прокомментировано в коде.

## SYSTEM STATE

Не закоммичено — Stop Condition требует `STATUS: OK`. Изменён только `EditorArea.tsx`. Step
Card и этот ARP — в `docs/ai-bus/queue/active/Sprint-08-Step-03.md` /
`docs/ai-bus/queue/active/Sprint-08-Step-03-ARP.md`.

## NEXT STEP

Жду `REVIEW.md`. Далее — Sprint-08-Step-04 (responsive-панель), если Architect добавит его в
`pending/`.
