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

// Sprint-08-Step-04: muted, not-alarming badge tones per severity — the
// Step Card explicitly asked for neutral colors, not attention-grabbing
// ones. Unrecognized/missing severity falls back to the same tone as "low".
const SEVERITY_BADGE: Record<string, string> = {
  low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  high: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};
const DEFAULT_SEVERITY_BADGE = SEVERITY_BADGE.low;

type ImproveStatus = "idle" | "loading" | "preview" | "error";

type AssistantMode = "Co-author" | "Editor" | "Critic" | "Reader";

// Perception layer only: every mode calls the exact same /api/line-editor
// endpoint with the exact same body. Nothing here changes the request, the
// model, or the prompt — only how the (identical) response is framed and
// labeled for the user. See docs/product/EXPERT_CATALOG.md for the Visible
// Assistants this is meant to evoke.
//
// Sprint 05 Step 12: labels below are deliberately honest about what the
// system actually does — a rewrite of the same text — rather than implying
// distinct analytical/emotional capabilities the single AI call doesn't
// have. `qualifier` is the parenthetical in "Improved text (...)" (see
// getResultHeading below).
//
// Step 14: `direction` and `compressionTag` are pure UI copy tied to which
// role is currently selected — neither is derived from AI output, from any
// previous request, or from stored history. They only ever reflect the
// current selection, so there is nothing here for "context" to accumulate.
//
// Step 15: `disclosure` is the explicit "no memory" footer, per role, so the
// continuity feel from Steps 13–14 can never be mistaken for real state.
// Step 13's `continuityBanner` ("Continuing your draft…" etc.) and the
// escalating "Further improved" / "Refined again" heading progression were
// removed here — both implied the system remembers prior requests, which it
// does not. Repeats now show a flat, non-escalating label instead (see
// REPEAT_LABEL, below).
// Step 16: `phaseEmphasis` is the role's framing of the (also derived,
// non-persisted) scene phase below — it changes only how the phase is
// described, never the phase itself and never the AI output.
const MODE_INFO: Record<
  AssistantMode,
  {
    emoji: string;
    label: string;
    preamble: string;
    qualifier: string;
    direction: string;
    compressionTag: string;
    disclosure: string;
    phaseEmphasis: string;
    accent: string;
  }
> = {
  "Co-author": {
    emoji: "🟡",
    label: "Continuation rewrite",
    preamble: "Rewriting and extending your text...",
    qualifier: "continuation",
    direction: "Developing narrative continuation of current scene",
    compressionTag: "Improved readability flow",
    disclosure: "Each draft is generated independently.",
    phaseEmphasis: "emphasizing early drafting momentum",
    accent: "text-amber-600 dark:text-amber-400",
  },
  Editor: {
    emoji: "🟢",
    label: "Structural refinement",
    preamble: "Refining your text structure...",
    qualifier: "refined version",
    direction: "Refining structure and clarity of active text",
    compressionTag: "Applied structural refinement",
    disclosure: "Each refinement is independent of previous outputs.",
    phaseEmphasis: "emphasizing structural progression",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  Critic: {
    emoji: "🔴",
    label: "Annotated improvement",
    preamble: "Highlighting potential improvements in rewritten form...",
    qualifier: "annotated perspective",
    direction: "Focusing on potential issues in current passage",
    compressionTag: "Enhanced clarity in paragraph-level logic",
    disclosure: "Each review is generated from current text only.",
    phaseEmphasis: "emphasizing risk detection",
    accent: "text-red-600 dark:text-red-400",
  },
  Reader: {
    emoji: "🔵",
    label: "Interpretive rewrite",
    preamble: "Rewriting with interpretive framing...",
    qualifier: "interpretive view",
    direction: "Interpreting tone and meaning of current scene",
    compressionTag: "Rewritten for coherence",
    disclosure: "Each interpretation is based only on visible content.",
    phaseEmphasis: "emphasizing interpretation stability",
    accent: "text-blue-600 dark:text-blue-400",
  },
};

const ASSISTANT_MODES = Object.keys(MODE_INFO) as AssistantMode[];

// Step 16: scene "phase" is a pure classification of interaction density —
// derived solely from the existing runCounts total (Step 14), never stored,
// never sent anywhere. Resets to "Drafting" whenever runCounts resets (i.e.
// whenever SceneImprove remounts for a new scene).
function getScenePhase(
  totalRuns: number,
): "Drafting" | "Refining" | "Polishing" | "Final" {
  if (totalRuns <= 1) return "Drafting";
  if (totalRuns <= 3) return "Refining";
  if (totalRuns <= 5) return "Polishing";
  return "Final";
}

// Flat, non-escalating repeat label (Step 15, Feature 2/3). Deliberately the
// same text regardless of how many times a role has run in this scene —
// unlike Step 13's "Further improved" / "Refined again", it does not imply
// the system is building on, remembering, or aware of the prior result.
const REPEAT_LABEL = "New generation of current scene";

// First run always reads "Improved text (qualifier)". Any repeat swaps in
// the flat REPEAT_LABEL instead of escalating language — still uses the
// existing per-role run count from Step 13, just no longer narrates it as
// progress or memory.
function getResultHeading(mode: AssistantMode, runNumber: number) {
  if (runNumber <= 1) {
    return `Improved text (${MODE_INFO[mode].qualifier})`;
  }
  return REPEAT_LABEL;
}

// Thin vertical slice: reuses the existing Sprint 04 Line Editor API as-is.
// Keyed by scene id from the parent so switching scenes resets this local,
// non-persisted UI state — no effect, no new state management needed.
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
  // Critic-only state (Sprint-08-Step-03): the parsed reviews and exactly
  // the text that was actually sent (selection or fallback), so the "Text
  // reviewed" display below is honest about scope even if the user keeps
  // typing after the request was sent.
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewedText, setReviewedText] = useState("");
  // Reader-only state (Sprint-09-Step-03): plain reaction text — /api/reader
  // already returns a string, so unlike Critic there is no parsing step.
  const [readerReaction, setReaderReaction] = useState("");
  // UI-only run count per role, for this scene only — not persisted, not
  // sent to the API, reset whenever this component remounts for a new scene.
  const [runCounts, setRunCounts] = useState<Record<AssistantMode, number>>({
    "Co-author": 0,
    Editor: 0,
    Critic: 0,
    Reader: 0,
  });
  const info = MODE_INFO[mode];
  const runNumber = runCounts[mode];
  // Sums across roles, reusing Step 13's existing per-role counters — no new
  // counter is introduced. "stable" until any run has happened in this
  // scene; "evolving" once any repeated interaction has occurred. Resets to
  // 0 whenever this component remounts for a new scene, same as runCounts.
  const totalRuns = Object.values(runCounts).reduce((sum, n) => sum + n, 0);
  const consistency = totalRuns <= 1 ? "stable" : "evolving";
  const phase = getScenePhase(totalRuns);

  // Feature 1 + 4: shown above everything else, in both states. Derived
  // only from the currently selected mode and the existing run counters —
  // never from AI output, never from anything stored.
  //
  // Step 15, Feature 5: "New scene context loaded" is always true for
  // whatever this component instance is currently showing, since it exists
  // only for the current scene (it remounts on scene change) — stated
  // plainly rather than left implicit.
  const summaryStrip = (
    <div className="flex flex-col gap-1 text-xs text-zinc-400 dark:text-zinc-600">
      <p>New scene context loaded</p>
      <p>
        Scene phase: {phase} — {info.phaseEmphasis}
      </p>
      <div className="flex items-center justify-between">
        <span>Current direction: {info.direction}</span>
        <span>● Consistency: {consistency}</span>
      </div>
    </div>
  );

  async function handleImprove() {
    setStatus("loading");
    try {
      // Same endpoint, same body, regardless of mode — mode only affects
      // labeling and framing below, never the request itself. Routed
      // through aiBus as an AIContextEnvelope (Sprint 06 Step 04); the
      // context values are carried alongside the operation but are not read
      // by aiBus yet — see aiBus.ts. Response is an AppliedAIResponse
      // (Sprint 06 Step 06); only `.response.text` is used here — `.domain`
      // and `.flags` are unused, purely informational at this step.
      const result = await aiBus.execute({
        operation: {
          type: "improve_text",
          payload: { text },
        },
        context: {
          sceneId,
          chapterId,
          bookTitle,
        },
      });
      setImprovedText(result.response.text);
      setRunCounts((previous) => ({
        ...previous,
        [mode]: previous[mode] + 1,
      }));
      setStatus("preview");
    } catch {
      setStatus("error");
    }
  }

  // Sprint-08-Step-03: Critic no longer calls improve_text like every other
  // mode — it produces a Review (feedback), not a Revision (rewritten
  // text), so it never offers "Заменить текст". Operates on the current
  // text selection if one exists, else the whole scene (see
  // getSelectedText's own comment for why that fallback is temporary).
  async function handleCritic() {
    setStatus("loading");
    try {
      const selected = getSelectedText();
      const result = await aiBus.execute({
        operation: {
          type: "critic_review",
          payload: { text: selected },
        },
        context: {
          sceneId,
          chapterId,
          bookTitle,
        },
      });
      // Temporary: AIResponse.text carries reviews as a JSON string until
      // the TODO in aiBus.ts (Sprint-08-Step-02) is resolved — not a
      // permanent contract.
      const parsed: unknown = JSON.parse(result.response.text);
      setReviews(Array.isArray(parsed) ? (parsed as ReviewItem[]) : []);
      setReviewedText(selected);
      setRunCounts((previous) => ({
        ...previous,
        [mode]: previous[mode] + 1,
      }));
      setStatus("preview");
    } catch {
      setStatus("error");
    }
  }

  // Sprint-09-Step-03: Reader also produces a Review, not a Revision — same
  // principle as Critic (Sprint-08-Step-03), so it never offers "Заменить
  // текст" either. Simpler than Critic: /api/reader already returns a plain
  // string, so there is no JSON.parse step here.
  async function handleReader() {
    setStatus("loading");
    try {
      const selected = getSelectedText();
      const result = await aiBus.execute({
        operation: {
          type: "reader_reaction",
          payload: { text: selected },
        },
        context: {
          sceneId,
          chapterId,
          bookTitle,
        },
      });
      setReaderReaction(result.response.text);
      setReviewedText(selected);
      setRunCounts((previous) => ({
        ...previous,
        [mode]: previous[mode] + 1,
      }));
      setStatus("preview");
    } catch {
      setStatus("error");
    }
  }

  if (status === "preview" && mode === "Reader") {
    return (
      <div className="flex flex-col gap-4">
        {summaryStrip}
        <p className={`text-xs font-medium ${info.accent}`}>
          {info.emoji} {info.label}
        </p>
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
          <p className="whitespace-pre-wrap text-base leading-relaxed text-black dark:text-zinc-50">
            {readerReaction}
          </p>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          {info.disclosure}
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="self-start rounded-full px-4 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          Закрыть
        </button>
      </div>
    );
  }

  if (status === "preview" && mode === "Critic") {
    return (
      <div className="flex flex-col gap-4">
        {summaryStrip}
        <p className={`text-xs font-medium ${info.accent}`}>
          {info.emoji} {info.label}
        </p>
        {/* Sprint-08-Step-04: below lg, stacks (text, then reviews); at lg
            and above, the reviews column sits beside the reviewed text,
            which stays in the foreground (flex-1). Pure CSS breakpoint —
            no JS width detection. */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          <div className="lg:flex-1">
            <p className="mb-1 text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
              Text reviewed
            </p>
            <p className="whitespace-pre-wrap text-sm text-zinc-400 dark:text-zinc-600">
              {reviewedText}
            </p>
          </div>
          <div className="lg:w-80 lg:shrink-0">
            <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">
              {getResultHeading(mode, runNumber)}
            </p>
            <ul className="flex flex-col gap-2">
              {reviews.length === 0 && (
                <li className="rounded-lg border border-zinc-200 p-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  No issues found.
                </li>
              )}
              {reviews.map((review, index) => (
                <li
                  key={index}
                  className="flex flex-col gap-1.5 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {review.category ?? "General"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        SEVERITY_BADGE[review.severity ?? ""] ??
                        DEFAULT_SEVERITY_BADGE
                      }`}
                    >
                      {review.severity ?? "?"}
                    </span>
                  </div>
                  <p className="text-sm text-black dark:text-zinc-50">
                    {review.comment ?? ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          {info.disclosure}
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="self-start rounded-full px-4 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          Закрыть
        </button>
      </div>
    );
  }

  if (status === "preview") {
    return (
      <div className="flex flex-col gap-4">
        {summaryStrip}
        <p className={`text-xs font-medium ${info.accent}`}>
          {info.emoji} {info.label}
        </p>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
            Original
          </p>
          <p className="whitespace-pre-wrap text-sm text-zinc-400 dark:text-zinc-600">
            {text}
          </p>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">
            {getResultHeading(mode, runNumber)}
          </p>
          <p className="mb-1 text-xs text-zinc-400 dark:text-zinc-600">
            Current phase: {phase}
          </p>
          <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {info.compressionTag}
          </p>
          <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
            {info.preamble}
          </p>
          <p className="whitespace-pre-wrap text-base leading-relaxed text-black dark:text-zinc-50">
            {improvedText}
          </p>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          {info.disclosure}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              onReplace(improvedText);
              setStatus("idle");
            }}
            className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Заменить текст
          </button>
          <button
            onClick={() => setStatus("idle")}
            className="rounded-full px-4 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            Оставить как есть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {summaryStrip}
      <p className="text-xs text-zinc-400 dark:text-zinc-600">
        AI can improve clarity, style and structure
      </p>
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-500 dark:text-zinc-400">
          Режим:
        </label>
        <select
          value={mode}
          onChange={(event) => setMode(event.target.value as AssistantMode)}
          disabled={status === "loading"}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          {ASSISTANT_MODES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={
          mode === "Critic"
            ? handleCritic
            : mode === "Reader"
              ? handleReader
              : handleImprove
        }
        disabled={status === "loading" || text.trim().length === 0}
        className="self-start rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {status === "loading" ? info.preamble : "Редактор"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Editor unavailable. Try again.
        </p>
      )}
    </div>
  );
}

type EditorAreaProps = {
  book?: Book | null;
  chapters?: readonly Chapter[];
  selectedChapterId?: string | null;
  selectedSceneId?: string | null;
  onNewScene?: () => void;
  onChangeSceneText?: (
    chapterId: string,
    sceneId: string,
    text: string,
  ) => void;
  onUpdateChapter?: (
    chapterId: string,
    fields: Partial<Pick<Chapter, "title" | "subtitle">>,
  ) => void;
  onUpdateSceneTitle?: (
    chapterId: string,
    sceneId: string,
    title: string,
  ) => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
};

export function EditorArea({
  book,
  chapters = [],
  selectedChapterId,
  selectedSceneId,
  onNewScene,
  onChangeSceneText,
  onUpdateChapter,
  onUpdateSceneTitle,
  isFocusMode = false,
  onToggleFocusMode,
}: EditorAreaProps) {
  // Sprint-08-Step-03: owns the textarea so Critic can read its current
  // selection at click time — must be called unconditionally (Rules of
  // Hooks), before the early returns below.
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!book) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-8">
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          Create your first book to get started
        </p>
      </main>
    );
  }

  const selectedChapter = chapters.find(
    (chapter) => chapter.id === selectedChapterId,
  );
  const selectedScene = selectedChapter?.scenes.find(
    (scene) => scene.id === selectedSceneId,
  );

  if (selectedChapter && selectedScene) {
    const trimmed = selectedScene.text.trim();
    const wordCount = trimmed === "" ? 0 : trimmed.split(/\s+/).length;
    const characterCount = selectedScene.text.length;

    // Sprint-08-Step-03: read the textarea's current selection at call
    // time (not tracked in state — no re-render needed for this).
    function getSelectedText(): string {
      const el = textareaRef.current;
      if (!el) return selectedScene!.text;
      const { selectionStart, selectionEnd, value } = el;
      if (
        selectionStart == null ||
        selectionEnd == null ||
        selectionStart === selectionEnd
      ) {
        // Temporary decision: no explicit UX exists yet for "nothing
        // selected" — fall back to the whole scene, matching every other
        // mode's default scope. Revisit when Step 04 designs the panel.
        return value;
      }
      return value.slice(selectionStart, selectionEnd);
    }

    return (
      <main className="flex flex-1 flex-col overflow-y-auto p-8">
        <div
          className={`flex w-full flex-1 flex-col gap-3 ${
            isFocusMode ? "mx-auto max-w-3xl" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <input
              value={selectedScene.title}
              onChange={(event) =>
                onUpdateSceneTitle?.(
                  selectedChapter.id,
                  selectedScene.id,
                  event.target.value,
                )
              }
              placeholder="Scene title..."
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-lg font-medium tracking-tight text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <button
              onClick={onToggleFocusMode}
              className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              {isFocusMode ? "Exit Focus" : "Фокус"}
            </button>
          </div>
          <textarea
            ref={textareaRef}
            value={selectedScene.text}
            onChange={(event) =>
              onChangeSceneText?.(
                selectedChapter.id,
                selectedScene.id,
                event.target.value,
              )
            }
            placeholder="Start writing your scene..."
            className="w-full flex-1 resize-none bg-transparent p-6 text-base leading-relaxed text-black outline-none dark:text-white"
          />
          <SceneImprove
            key={selectedScene.id}
            text={selectedScene.text}
            onReplace={(newText) =>
              onChangeSceneText?.(selectedChapter.id, selectedScene.id, newText)
            }
            sceneId={selectedScene.id}
            chapterId={selectedChapter.id}
            bookTitle={book.title}
            getSelectedText={getSelectedText}
          />
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Words: {wordCount} · Characters: {characterCount}
          </p>
        </div>
      </main>
    );
  }

  if (selectedChapter) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-8">
        <div className="flex w-full max-w-md flex-col gap-2">
          <input
            value={selectedChapter.title}
            onChange={(event) =>
              onUpdateChapter?.(selectedChapter.id, {
                title: event.target.value,
              })
            }
            placeholder="Chapter title..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-center text-2xl font-semibold tracking-tight text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <input
            value={selectedChapter.subtitle ?? ""}
            onChange={(event) =>
              onUpdateChapter?.(selectedChapter.id, {
                subtitle: event.target.value,
              })
            }
            placeholder="Subtitle..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-center text-sm text-zinc-600 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
          />
        </div>
        {selectedChapter.scenes.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No scenes yet
          </p>
        ) : (
          <ul className="text-sm text-zinc-600 dark:text-zinc-400">
            {selectedChapter.scenes.map((scene) => (
              <li key={scene.id}>{scene.title}</li>
            ))}
          </ul>
        )}
        <button
          onClick={onNewScene}
          className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          New Scene
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 overflow-y-auto p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {book.title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {book.genre} · {book.language}
        </p>
      </div>

      {book.premise && (
        <p className="max-w-2xl whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
          {book.premise}
        </p>
      )}

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Chapters
        </h2>
        {chapters.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-600">
            No chapters yet
          </p>
        ) : (
          <ul className="text-sm text-zinc-600 dark:text-zinc-400">
            {chapters.map((chapter) => (
              <li key={chapter.id}>{chapter.title}</li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
