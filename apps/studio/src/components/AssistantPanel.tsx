"use client";

import { useState } from "react";
import * as aiBus from "@/ai/aiBus";
import type { AssistantThread, Book, ChatMessage } from "@/domain/model";

// Sprint-13-Step-05: single functional AI surface, replacing two previously
// redundant ones — this file's old decorative, unwired card list, and the
// one-shot `SceneImprove` that used to live inside EditorArea.tsx. Consumes
// Sprint-13-Step-01/04's `assistantThreads`/`appendMessage`/`createThread`/
// `activeThreads` directly; no local duplicate of thread state.

export type AssistantMode = "coauthor" | "editor" | "critic" | "reader";

// Sprint-08-Step-03: a Critic review, unlike every other entry here. Shape
// matches /api/critic's response.reviews — not validated at runtime, per
// that route's own documented discovery-stage risk.
type ReviewItem = {
  category?: string;
  severity?: string;
  comment?: string;
};

const SEVERITY_BADGE: Record<string, string> = {
  low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  high: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};
const DEFAULT_SEVERITY_BADGE = SEVERITY_BADGE.low;

// Sprint-19-Step-04: thematic lenses for Critic — see ADR-0009.
const CRITIC_SUBCATEGORIES = [
  { key: undefined, label: "Все" },
  { key: "continuity", label: "Связность" },
  { key: "fact", label: "Достоверность" },
  { key: "developmental", label: "Развитие" },
  { key: "style", label: "Стиль" },
] as const;

// Sprint-13-Step-05: deliberately just display metadata (emoji/label/
// description/accent/placeholder) — the previous MODE_INFO also carried a
// "perception layer" (fake scene phase, consistency indicator, an explicit
// "no memory" disclosure) built specifically to compensate for the absence
// of real chat history. That history is now real and persisted, so the old
// layer would be actively false, not just outdated — removed rather than
// carried forward (confirmed with Product Owner).
const MODE_META: Record<
  AssistantMode,
  {
    emoji: string;
    label: string;
    description: string;
    accent: string;
    activeBorder: string;
    placeholder: string;
  }
> = {
  coauthor: {
    emoji: "🟡",
    label: "Соавтор",
    description: "Пишет и развивает текст вместе с вами.",
    accent: "text-amber-600 dark:text-amber-400",
    activeBorder: "border-amber-400 dark:border-amber-600",
    placeholder: "Что дальше в этой книге? (необязательно)",
  },
  editor: {
    emoji: "🟢",
    label: "Редактор",
    description: "Улучшает грамматику, ясность и стиль.",
    accent: "text-emerald-600 dark:text-emerald-400",
    activeBorder: "border-emerald-400 dark:border-emerald-600",
    placeholder: "Что улучшить в этой сцене? (необязательно)",
  },
  critic: {
    emoji: "🔴",
    label: "Критик",
    description: "Даёт оценку вашему тексту.",
    accent: "text-red-600 dark:text-red-400",
    activeBorder: "border-red-400 dark:border-red-600",
    placeholder: "На что обратить внимание? (необязательно)",
  },
  reader: {
    emoji: "🔵",
    label: "Читатель",
    description: "Показывает, как отреагирует читатель.",
    accent: "text-blue-600 dark:text-blue-400",
    activeBorder: "border-blue-400 dark:border-blue-600",
    placeholder: "Что именно интересует? (необязательно)",
  },
};

const ASSISTANT_MODES = Object.keys(MODE_META) as AssistantMode[];

// Critic's assistant messages carry response.text verbatim, which is a JSON
// string of reviews (aiBus.ts: `resultText = JSON.stringify(data.reviews)`,
// unchanged by this step). Parsed at render time, not at receive time — the
// data is now persisted (localStorage), so a malformed/older entry must not
// crash the whole panel; the original one-shot code had no such boundary to
// defend.
function parseReviews(content: string): ReviewItem[] | null {
  try {
    const parsed: unknown = JSON.parse(content);
    return Array.isArray(parsed) ? (parsed as ReviewItem[]) : null;
  } catch {
    return null;
  }
}

// Sprint-14-Step-02: Reader gets a distinct sub-UI — multiple named,
// comparable instances instead of a single chat. Local state here
// (selected/compared thread ids, the create/rename forms) is ephemeral,
// same treatment as `isFocusMode` in page.tsx — only the threads
// themselves (`book.assistantThreads.reader`) are persisted, via Step 01's
// controller mutations.
function ReaderPanel({
  threads,
  scopedText,
  bookLanguage,
  onAppendMessage,
  onCreateThread,
  onRenameThread,
  onDeleteThread,
}: {
  threads: readonly AssistantThread[];
  scopedText: string;
  bookLanguage: string;
  onAppendMessage: (message: ChatMessage, threadId: string) => void;
  onCreateThread: (options?: { name?: string; persona?: string }) => void;
  onRenameThread: (threadId: string, name: string) => void;
  onDeleteThread: (threadId: string) => void;
}) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>(
    threads.at(-1)?.id,
  );
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPersona, setNewPersona] = useState("");

  const selectedThread =
    threads.find((thread) => thread.id === selectedThreadId) ?? threads.at(-1);
  const canSend = scopedText.trim().length > 0;
  const compareList = threads.filter((thread) => compareIds.has(thread.id));

  function toggleCompare(id: string) {
    setCompareIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleSend() {
    if (!selectedThread) return;
    setStatus("loading");
    try {
      const trimmedInput = input.trim();
      const outgoingMessages: ChatMessage[] = trimmedInput
        ? [...selectedThread.messages, { role: "user", content: trimmedInput }]
        : [...selectedThread.messages];
      if (trimmedInput) {
        onAppendMessage(
          { role: "user", content: trimmedInput },
          selectedThread.id,
        );
      }
      const result = await aiBus.execute({
        operation: {
          type: "reader_reaction",
          payload: {
            sceneText: scopedText,
            messages: outgoingMessages,
            bookLanguage,
            ...(selectedThread.persona
              ? { persona: selectedThread.persona }
              : {}),
          },
        },
        context: {},
      });
      onAppendMessage(
        { role: "assistant", content: result.response.text },
        selectedThread.id,
      );
      setInput("");
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    onCreateThread({ name, persona: newPersona.trim() || undefined });
    setNewName("");
    setNewPersona("");
    setCreating(false);
  }

  function startRename(thread: AssistantThread) {
    setRenamingId(thread.id);
    setRenameValue(thread.name);
  }

  function commitRename() {
    if (renamingId && renameValue.trim()) {
      onRenameThread(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
      <div className="flex flex-wrap gap-2">
        {threads.map((thread) => {
          const isSelected = thread.id === selectedThread?.id;
          const inCompare = compareIds.has(thread.id);
          return (
            <div
              key={thread.id}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                isSelected
                  ? "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950"
                  : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
              }`}
            >
              {renamingId === thread.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") commitRename();
                  }}
                  className="w-24 rounded border border-zinc-300 bg-white px-1 text-xs text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              ) : (
                <button
                  onClick={() => setSelectedThreadId(thread.id)}
                  className="font-medium text-black dark:text-zinc-50"
                >
                  {thread.name}
                </button>
              )}
              <button
                onClick={() => toggleCompare(thread.id)}
                title="Сравнить"
                className={
                  inCompare
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-zinc-400"
                }
              >
                ⇄
              </button>
              <button
                onClick={() => startRename(thread)}
                title="Переименовать"
                className="text-zinc-400"
              >
                ✎
              </button>
              <button
                onClick={() => onDeleteThread(thread.id)}
                disabled={threads.length <= 1}
                title="Удалить"
                className="text-zinc-400 disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          );
        })}
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            + Новый читатель
          </button>
        )}
      </div>

      {creating && (
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Имя (например, Молодой читатель)"
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
          <input
            value={newPersona}
            onChange={(event) => setNewPersona(event.target.value)}
            placeholder="Персонаж (необязательно, например: подросток 16 лет)"
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              Создать
            </button>
            <button
              onClick={() => setCreating(false)}
              className="rounded-full px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {compareList.length >= 2 ? (
        <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto lg:grid-cols-2">
          {compareList.map((thread) => (
            <div
              key={thread.id}
              className="flex flex-col gap-2 overflow-y-auto rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {thread.name}
              </p>
              {thread.persona && (
                <p className="text-xs italic text-zinc-500 dark:text-zinc-400">
                  {thread.persona}
                </p>
              )}
              {thread.messages.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-600">
                  Пока нет сообщений.
                </p>
              ) : (
                thread.messages.slice(-4).map((message, index) => (
                  <p
                    key={index}
                    className={`whitespace-pre-wrap text-sm ${
                      message.role === "user"
                        ? "rounded-lg bg-zinc-200 p-2 text-black dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-black dark:text-zinc-50"
                    }`}
                  >
                    {message.content}
                  </p>
                ))
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          {selectedThread?.persona && (
            <p className="text-xs italic text-zinc-500 dark:text-zinc-400">
              Персонаж: {selectedThread.persona}
            </p>
          )}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
            {(!selectedThread || selectedThread.messages.length === 0) && (
              <p className="text-xs text-zinc-400 dark:text-zinc-600">
                Посмотрите, как читатель отреагирует.
              </p>
            )}
            {selectedThread?.messages.map((message, index) => (
              <p
                key={index}
                className={`whitespace-pre-wrap text-sm leading-relaxed ${
                  message.role === "user"
                    ? "rounded-lg bg-zinc-200 p-2.5 text-black dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-black dark:text-zinc-50"
                }`}
              >
                {message.content}
              </p>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Что именно интересует? (необязательно)"
              rows={2}
              disabled={status === "loading"}
              className="w-full resize-none rounded-md border border-zinc-300 bg-white p-2 text-sm text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
            <button
              onClick={handleSend}
              disabled={status === "loading" || !canSend || !selectedThread}
              className="self-start rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {status === "loading" ? "…" : "Спросить"}
            </button>
            {status === "error" && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Помощник недоступен. Попробуйте ещё раз.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-lg border border-zinc-200 p-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Замечаний не найдено.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
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
                SEVERITY_BADGE[review.severity ?? ""] ?? DEFAULT_SEVERITY_BADGE
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
  );
}

type AssistantPanelProps = {
  book?: Book | null;
  sceneText: string;
  getSelectedText: () => string;
  selectedMode: AssistantMode;
  onSelectMode: (mode: AssistantMode) => void;
  activeThreads?: {
    coauthor?: AssistantThread;
    editor?: AssistantThread;
    critic?: AssistantThread;
    reader?: AssistantThread;
  };
  // Sprint-14-Step-02: threadId lets Reader's multi-instance UI target a
  // specific thread instead of always the last one — omitted, behavior is
  // unchanged for Co-author/Editor/Critic (see useWorkspaceController.ts).
  onAppendMessage: (
    mode: AssistantMode,
    message: ChatMessage,
    threadId?: string,
  ) => void;
  onCreateThread: (
    mode: AssistantMode,
    options?: { name?: string; persona?: string },
  ) => void;
  onRenameThread: (mode: AssistantMode, threadId: string, name: string) => void;
  onDeleteThread: (mode: AssistantMode, threadId: string) => void;
  onReplaceSceneText?: (text: string) => void;
};

export function AssistantPanel({
  book,
  sceneText,
  getSelectedText,
  selectedMode,
  onSelectMode,
  activeThreads,
  onAppendMessage,
  onCreateThread,
  onRenameThread,
  onDeleteThread,
  onReplaceSceneText,
}: AssistantPanelProps) {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [criticSubcategory, setCriticSubcategory] = useState<
    string | undefined
  >(undefined);

  if (!book) {
    return (
      <aside className="flex w-full shrink-0 flex-col gap-2 border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 lg:w-80 lg:border-l lg:border-t-0">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Создайте первую книгу, чтобы поговорить с помощником.
        </p>
      </aside>
    );
  }

  const meta = MODE_META[selectedMode];
  const thread = activeThreads?.[selectedMode];
  const messages = thread?.messages ?? [];
  // Editor/Co-author always work on the whole current scene; Critic/Reader
  // scope to the current text selection, falling back to the whole scene —
  // same split as before this step, just relocated from EditorArea.tsx.
  const scopedText =
    selectedMode === "critic" || selectedMode === "reader"
      ? getSelectedText()
      : sceneText;
  // Sprint-12-Step-04's rule, generalized: only Co-author may run with no
  // source text at all (a blank-page draft is part of its own contract).
  const canSend = selectedMode === "coauthor" || scopedText.trim().length > 0;

  async function handleSend() {
    setStatus("loading");
    try {
      const trimmedInput = input.trim();
      const outgoingMessages: ChatMessage[] = trimmedInput
        ? [...messages, { role: "user", content: trimmedInput }]
        : [...messages];
      if (trimmedInput) {
        onAppendMessage(selectedMode, { role: "user", content: trimmedInput });
      }

      let resultText: string;
      if (selectedMode === "coauthor") {
        const result = await aiBus.execute({
          operation: {
            type: "coauthor_draft",
            payload: {
              sceneText,
              bookContext: book!,
              messages: outgoingMessages,
            },
          },
          context: {},
        });
        resultText = result.response.text;
      } else if (selectedMode === "editor") {
        const result = await aiBus.execute({
          operation: {
            type: "improve_text",
            payload: {
              sceneText,
              bookContext: book!,
              messages: outgoingMessages,
            },
          },
          context: {},
        });
        resultText = result.response.text;
      } else if (selectedMode === "critic") {
        const result = await aiBus.execute({
          operation: {
            type: "critic_review",
            payload: {
              sceneText: scopedText,
              messages: outgoingMessages,
              bookLanguage: book!.language,
              subcategory: criticSubcategory,
            },
          },
          context: {},
        });
        resultText = result.response.text;
      } else {
        // Reader's own send path is ReaderPanel's handleSend below — this
        // branch is unreachable from the UI (Reader renders ReaderPanel
        // instead of the shared input/button), kept only so `handleSend`
        // stays exhaustive over AssistantMode.
        const result = await aiBus.execute({
          operation: {
            type: "reader_reaction",
            payload: {
              sceneText: scopedText,
              messages: outgoingMessages,
              bookLanguage: book!.language,
            },
          },
          context: {},
        });
        resultText = result.response.text;
      }

      onAppendMessage(selectedMode, { role: "assistant", content: resultText });
      setInput("");
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <aside className="flex max-h-96 w-full shrink-0 flex-col gap-3 overflow-y-auto border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 lg:h-full lg:max-h-none lg:w-80 lg:border-l lg:border-t-0">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Assistants
      </h2>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {ASSISTANT_MODES.map((mode) => {
          const info = MODE_META[mode];
          const isActive = mode === selectedMode;
          return (
            <button
              key={mode}
              onClick={() => onSelectMode(mode)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                isActive
                  ? `${info.activeBorder} bg-white dark:bg-black`
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-black dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
              }`}
            >
              <p
                className={`text-sm font-medium ${isActive ? info.accent : "text-black dark:text-zinc-50"}`}
              >
                {info.emoji} {info.label}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {info.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <p className={`text-xs font-medium ${meta.accent}`}>
            {meta.emoji} {meta.label}
          </p>
          {selectedMode === "critic" && (
            <button
              onClick={() => onCreateThread("critic")}
              className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              Начать заново
            </button>
          )}
        </div>

        {selectedMode === "critic" && (
          <div className="flex flex-wrap gap-1.5">
            {CRITIC_SUBCATEGORIES.map((sub) => (
              <button
                key={sub.key ?? "all"}
                onClick={() => setCriticSubcategory(sub.key)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  criticSubcategory === sub.key
                    ? "border-red-400 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-950 dark:text-red-300"
                    : "border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {selectedMode === "reader" ? (
          <ReaderPanel
            threads={book.assistantThreads.reader}
            scopedText={scopedText}
            bookLanguage={book.language}
            onAppendMessage={(message, threadId) =>
              onAppendMessage("reader", message, threadId)
            }
            onCreateThread={(options) => onCreateThread("reader", options)}
            onRenameThread={(threadId, name) =>
              onRenameThread("reader", threadId, name)
            }
            onDeleteThread={(threadId) => onDeleteThread("reader", threadId)}
          />
        ) : (
          <>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
              {messages.length === 0 && (
                <p className="text-xs text-zinc-400 dark:text-zinc-600">
                  {meta.description}
                </p>
              )}
              {messages.map((message, index) => {
                if (message.role === "user") {
                  return (
                    <p
                      key={index}
                      className="whitespace-pre-wrap rounded-lg bg-zinc-200 p-2.5 text-sm text-black dark:bg-zinc-800 dark:text-zinc-50"
                    >
                      {message.content}
                    </p>
                  );
                }
                const reviews =
                  selectedMode === "critic"
                    ? parseReviews(message.content)
                    : null;
                return (
                  <div key={index} className="flex flex-col gap-2">
                    {reviews ? (
                      <ReviewList reviews={reviews} />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-black dark:text-zinc-50">
                        {message.content}
                      </p>
                    )}
                    {(selectedMode === "coauthor" ||
                      selectedMode === "editor") &&
                      onReplaceSceneText && (
                        <button
                          onClick={() => onReplaceSceneText(message.content)}
                          className="self-start rounded-full bg-black px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                        >
                          Вставить в сцену
                        </button>
                      )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={meta.placeholder}
                rows={2}
                disabled={status === "loading"}
                className="w-full resize-none rounded-md border border-zinc-300 bg-white p-2 text-sm text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
              <button
                onClick={handleSend}
                disabled={status === "loading" || !canSend}
                className="self-start rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {status === "loading" ? "…" : "Спросить"}
              </button>
              {status === "error" && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Помощник недоступен. Попробуйте ещё раз.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
