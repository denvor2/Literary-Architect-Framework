import { useState } from "react";
import * as aiBus from "@/ai/aiBus";
import type { Book, Chapter } from "@/domain/model";

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
}: {
  text: string;
  onReplace: (text: string) => void;
  sceneId?: string;
  chapterId?: string;
  bookTitle?: string;
}) {
  const [mode, setMode] = useState<AssistantMode>("Editor");
  const [status, setStatus] = useState<ImproveStatus>("idle");
  const [improvedText, setImprovedText] = useState("");
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
        onClick={handleImprove}
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
  isFocusMode = false,
  onToggleFocusMode,
}: EditorAreaProps) {
  if (!book) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-8">
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          Create your first scene
        </p>
        <button className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
          New Scene
        </button>
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

    return (
      <main className="flex flex-1 flex-col overflow-y-auto p-8">
        <div
          className={`flex w-full flex-1 flex-col gap-3 ${
            isFocusMode ? "mx-auto max-w-3xl" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              {selectedScene.title}
            </h1>
            <button
              onClick={onToggleFocusMode}
              className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              {isFocusMode ? "Exit Focus" : "Фокус"}
            </button>
          </div>
          <textarea
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
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {selectedChapter.title}
        </h1>
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
