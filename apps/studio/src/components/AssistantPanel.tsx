"use client";

import { useEffect, useState } from "react";
import * as aiBus from "@/ai/aiBus";
import type { AssistantThread, Book, ChatMessage } from "@/domain/model";
import { useLocaleContext } from "@/context/LocaleContext";
import { CustomExpertsDialog } from "@/components/dialogs/CustomExpertsDialog";
import {
  Pen,
  Wand2,
  Eye,
  BookOpen,
  Settings,
  ArrowLeftRight,
  Pencil,
  Trash2,
} from "lucide-react";

// Sprint-13-Step-05: single functional AI surface, replacing two previously
// redundant ones — this file's old decorative, unwired card list, and the
// one-shot `SceneImprove` that used to live inside EditorArea.tsx. Consumes
// Sprint-13-Step-01/04's `assistantThreads`/`appendMessage`/`createThread`/
// `activeThreads` directly; no local duplicate of thread state.

export type AssistantMode = "coauthor" | "editor" | "critic" | "reader";

// Hotfix: localStorage fallback for AssistantSettings when database is unavailable
// Matches the dual-mode storage pattern from workspaceStorage.ts
const ASSISTANT_SETTINGS_STORAGE_KEY = "literary-studio:assistant-settings";

function getAssistantSettingsFromLocalStorage(): Record<
  AssistantMode,
  AssistantSettingsEntry | null
> {
  try {
    const stored = window.localStorage.getItem(ASSISTANT_SETTINGS_STORAGE_KEY);
    if (!stored)
      return { coauthor: null, editor: null, critic: null, reader: null };
    const parsed = JSON.parse(stored);
    return parsed;
  } catch {
    return { coauthor: null, editor: null, critic: null, reader: null };
  }
}

function saveAssistantSettingsToLocalStorage(
  mode: AssistantMode,
  settings: AssistantSettingsEntry,
) {
  try {
    const current = getAssistantSettingsFromLocalStorage();
    const updated = { ...current, [mode]: settings };
    window.localStorage.setItem(
      ASSISTANT_SETTINGS_STORAGE_KEY,
      JSON.stringify(updated),
    );
  } catch {
    // localStorage write failed, silently continue without persistence
  }
}

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
function getCriticSubcategories(t: (key: string) => string) {
  return [
    { key: undefined, label: t("panels.assistant.all") },
    { key: "continuity", label: t("panels.assistant.continuity") },
    { key: "fact", label: t("panels.assistant.fact") },
    { key: "developmental", label: t("panels.assistant.developmental") },
    { key: "style", label: t("panels.assistant.style") },
  ] as const;
}

// Sprint-13-Step-05: deliberately just display metadata (icon/label/
// description/accent/placeholder) — the previous MODE_INFO also carried a
// "perception layer" (fake scene phase, consistency indicator, an explicit
// "no memory" disclosure) built specifically to compensate for the absence
// of real chat history. That history is now real and persisted, so the old
// layer would be actively false, not just outdated — removed rather than
// carried forward (confirmed with Product Owner).
// Sprint-25-Step-05: emoji replaced with lucide-react icons (Pen, Wand2, Eye,
// BookOpen) for design consistency and accessibility. Icons are 18px (text-lg)
// to match the previous emoji glyph size.
function getModeMeta(t: (key: string) => string): Record<
  AssistantMode,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
    accent: string;
    activeBorder: string;
    placeholder: string;
  }
> {
  return {
    coauthor: {
      icon: Pen,
      label: t("panels.assistant.coauthor"),
      description: t("panels.assistant.coauthor_desc"),
      accent: "text-amber-600 dark:text-amber-400",
      activeBorder: "border-amber-400 dark:border-amber-600",
      placeholder: t("panels.assistant.coauthor_placeholder"),
    },
    editor: {
      icon: Wand2,
      label: t("panels.assistant.editor"),
      description: t("panels.assistant.editor_desc"),
      accent: "text-emerald-600 dark:text-emerald-400",
      activeBorder: "border-emerald-400 dark:border-emerald-600",
      placeholder: t("panels.assistant.editor_placeholder"),
    },
    critic: {
      icon: Eye,
      label: t("panels.assistant.critic"),
      description: t("panels.assistant.critic_desc"),
      accent: "text-red-600 dark:text-red-400",
      activeBorder: "border-red-400 dark:border-red-600",
      placeholder: t("panels.assistant.critic_placeholder"),
    },
    reader: {
      icon: BookOpen,
      label: t("panels.assistant.reader"),
      description: t("panels.assistant.reader_desc"),
      accent: "text-blue-600 dark:text-blue-400",
      activeBorder: "border-blue-400 dark:border-blue-600",
      placeholder: t("panels.assistant.reader_placeholder"),
    },
  };
}

const ASSISTANT_MODES: AssistantMode[] = [
  "coauthor",
  "editor",
  "critic",
  "reader",
];

// Sprint-25-Step-03 (ADR-0013): per-mode customization (display name/prompt
// suffix/typical requests), one row per AssistantMode, instance-wide — see
// docs/adr/ADR-0013-assistant-settings.md and
// apps/studio/src/app/api/assistant-settings/route.ts. `promptSuffix` is
// only ever read here to show it back in the settings dialog for editing —
// it is never sent to any Expert route from the client; each route reads
// its own mode's suffix itself (server-side), append-only onto its existing
// hardcoded system prompt.
type AssistantSettingsEntry = {
  displayName: string | null;
  promptSuffix: string | null;
  typicalRequests: string[];
};

const EMPTY_SETTINGS_MAP: Record<AssistantMode, AssistantSettingsEntry | null> =
  {
    coauthor: null,
    editor: null,
    critic: null,
    reader: null,
  };

// Sprint-25-Step-03: gear icon opening the per-mode settings dialog — a
// plain overlay button on each of the 4 mode icons (Step Card's Allowed
// paths note: "gear-иконка на каждом режиме"), not just on the currently
// selected one.
// Sprint-25-Step-05: replaced emoji gear with lucide Settings icon.
function GearButton({
  onOpen,
  label,
  t,
}: {
  onOpen: () => void;
  label: string;
  t: (key: string) => string;
}) {
  return (
    <button
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
      title={`${t("panels.assistant.settings")}: ${label}`}
      aria-label={`${t("panels.assistant.settings")} режима «${label}»`}
      className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-500 shadow-sm transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
    >
      <Settings className="h-3 w-3" />
    </button>
  );
}

// Sprint-25-Step-03: the "gear" settings dialog for a single mode — display
// name (pure UI label, never sent to the model), prompt suffix (appended,
// not replacing, the mode's hardcoded base prompt — ADR-0013's Override
// semantics), and typical requests (one per line; rendered as pill buttons
// that pre-fill the chat input, same UX pattern as CRITIC_SUBCATEGORIES
// above). No permission check of any kind — ADR-0013's Implementation
// constraint for this step: the single current user has full access.
function AssistantSettingsDialog({
  mode,
  initial,
  onCancel,
  onSaved,
  t,
}: {
  mode: AssistantMode;
  initial: AssistantSettingsEntry | null;
  onCancel: () => void;
  onSaved: (mode: AssistantMode, settings: AssistantSettingsEntry) => void;
  t: (key: string) => string;
}) {
  const meta = getModeMeta(t)[mode];
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [promptSuffix, setPromptSuffix] = useState(initial?.promptSuffix ?? "");
  const [typicalRequestsText, setTypicalRequestsText] = useState(
    (initial?.typicalRequests ?? []).join("\n"),
  );
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  async function handleSave() {
    setStatus("saving");
    const typicalRequests = typicalRequestsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const settingsToSave = {
      displayName: displayName.trim() || null,
      promptSuffix: promptSuffix.trim() || null,
      typicalRequests,
    };

    try {
      const response = await fetch("/api/assistant-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          ...settingsToSave,
        }),
      });
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error);
      }
      // Success: server saved, update UI and clear localStorage override
      onSaved(mode, {
        displayName: data.settings.displayName,
        promptSuffix: data.settings.promptSuffix,
        typicalRequests: data.settings.typicalRequests,
      });
    } catch {
      // API failed: save to localStorage as fallback and still update UI
      // This ensures Settings are not lost when database is unavailable (ADR-0012 pattern)
      try {
        saveAssistantSettingsToLocalStorage(mode, settingsToSave);
        // Update UI with the settings we just saved locally
        onSaved(mode, settingsToSave);
      } catch {
        // localStorage also failed, show error
        setStatus("error");
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
          {t("dialogs.assistant_settings.title")} «{meta.label}»
        </h2>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("dialogs.assistant_settings.display_name_label")}
            </span>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={meta.label}
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-zinc-400"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("dialogs.assistant_settings.prompt_suffix_label")}
            </span>
            <textarea
              value={promptSuffix}
              onChange={(event) => setPromptSuffix(event.target.value)}
              rows={4}
              placeholder={t(
                "dialogs.assistant_settings.prompt_suffix_placeholder",
              )}
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-zinc-400"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("dialogs.assistant_settings.typical_requests_label")}
            </span>
            <textarea
              value={typicalRequestsText}
              onChange={(event) => setTypicalRequestsText(event.target.value)}
              rows={3}
              placeholder={t(
                "dialogs.assistant_settings.typical_requests_placeholder",
              )}
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-zinc-400"
            />
          </label>

          {typicalRequestsText.trim() && (
            <div className="flex flex-wrap gap-1.5">
              {typicalRequestsText
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line.length > 0)
                .map((request, index) => (
                  <div
                    key={index}
                    className="rounded-full border border-zinc-300 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    {request}
                  </div>
                ))}
            </div>
          )}

          {status === "error" && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Не удалось сохранить настройки. Попробуйте ещё раз.
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
          >
            {t("dialogs.cancel_button")}
          </button>
          <button
            onClick={handleSave}
            disabled={status === "saving"}
            className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {status === "saving"
              ? t("dialogs.assistant_settings.saving")
              : t("dialogs.assistant_settings.save_button")}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  typicalRequests,
  onAppendMessage,
  onCreateThread,
  onRenameThread,
  onDeleteThread,
  t,
}: {
  threads: readonly AssistantThread[];
  scopedText: string;
  bookLanguage: string;
  // Sprint-25-Step-03 (ADR-0013): optional preset "typical request" buttons
  // for this mode's gear settings — absent/empty renders nothing, identical
  // to this panel's behavior before this step.
  typicalRequests?: string[];
  onAppendMessage: (message: ChatMessage, threadId: string) => void;
  onCreateThread: (options?: { name?: string; persona?: string }) => void;
  onRenameThread: (threadId: string, name: string) => void;
  onDeleteThread: (threadId: string) => void;
  t: (key: string) => string;
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
                  className="w-24 rounded border border-zinc-300 bg-white px-1 text-xs text-black outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-zinc-400"
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
                title={t("buttons.compare")}
                className={
                  inCompare
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-zinc-400 dark:text-zinc-600"
                }
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => startRename(thread)}
                title={t("buttons.rename")}
                className="text-zinc-400 dark:text-zinc-600"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDeleteThread(thread.id)}
                disabled={threads.length <= 1}
                title="Удалить"
                className="text-zinc-400 dark:text-zinc-600 disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            {t("sidebar.new_reader")}
          </button>
        )}
      </div>

      {creating && (
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder={t("placeholders.reader_name")}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-zinc-400"
          />
          <input
            value={newPersona}
            onChange={(event) => setNewPersona(event.target.value)}
            placeholder={t("placeholders.character_persona")}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-zinc-400"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {t("buttons.create")}
            </button>
            <button
              onClick={() => setCreating(false)}
              className="rounded-full px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              {t("buttons.cancel")}
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
                  {t("panels.assistant.no_messages")}
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
              {t("panels.assistant.character_label")} {selectedThread.persona}
            </p>
          )}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
            {(!selectedThread || selectedThread.messages.length === 0) && (
              <p className="text-xs text-zinc-400 dark:text-zinc-600">
                {t("panels.assistant.see_reader_reaction")}
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
            {typicalRequests && typicalRequests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {typicalRequests.map((request) => (
                  <button
                    key={request}
                    onClick={() => {
                      setInput((prev) => {
                        if (!prev.trim()) {
                          return request;
                        }
                        return `${prev} ${request}`;
                      });
                    }}
                    className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  >
                    {request}
                  </button>
                ))}
              </div>
            )}
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Что именно интересует? (необязательно)"
              rows={2}
              disabled={status === "loading"}
              className="w-full resize-none rounded-md border border-zinc-300 bg-white p-2 text-sm text-black outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-zinc-400"
            />
            <button
              onClick={handleSend}
              disabled={status === "loading" || !canSend || !selectedThread}
              className="self-start rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {status === "loading" ? "…" : t("buttons.ask")}
            </button>
            {status === "error" && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {t("panels.assistant.error_unavailable")}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ReviewList({
  reviews,
  t,
}: {
  reviews: ReviewItem[];
  t: (key: string) => string;
}) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-lg border border-zinc-200 p-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        {t("panels.assistant.no_reviews")}
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
  // Sprint-20-Step-03: accepts a structure proposal from Co-author, adding
  // selected chapters/scenes to the book. See ADR-0010.
  onAcceptStructureProposal?: (
    proposal: {
      chapters: Array<{
        title: string;
        subtitle?: string;
        scenes: Array<{ title: string; description: string }>;
      }>;
    },
    selectedKeys: Set<string>,
  ) => void;
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
  onAcceptStructureProposal,
}: AssistantPanelProps) {
  const { t } = useLocaleContext();
  const MODE_META = getModeMeta(t);

  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [criticSubcategory, setCriticSubcategory] = useState<
    string | undefined
  >(undefined);
  const [isExpertsDialogOpen, setIsExpertsDialogOpen] = useState(false);
  const [editingExpertId, setEditingExpertId] = useState<string | undefined>();
  const [personalExperts, setPersonalExperts] = useState<Array<{ id: string; name: string; icon: string; systemPrompt?: string; typicalRequests?: string[] }>>(
    []
  );
  const [loadingExperts, setLoadingExperts] = useState(false);
  const [selectedExpertId, setSelectedExpertId] = useState<string | null>(null);

  // Загрузить личных экспертов при монтировании
  useEffect(() => {
    const loadExperts = async () => {
      setLoadingExperts(true);
      try {
        const res = await fetch("/api/experts", { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as { experts: Array<{ id: string; name: string; icon: string; systemPrompt?: string; typicalRequests?: string[] }> };
          setPersonalExperts(data.experts);
        }
      } catch (error) {
        console.error("Ошибка загрузки экспертов:", error);
      } finally {
        setLoadingExperts(false);
      }
    };

    loadExperts();
  }, [isExpertsDialogOpen]); // Перезагружаем после закрытия диалога (если изменения)

  // Sprint-20-Step-03: structure proposal state — ephemeral, not persisted.
  const [structureProposal, setStructureProposal] = useState<{
    chapters: Array<{
      title: string;
      subtitle?: string;
      scenes: Array<{ title: string; description: string }>;
    }>;
  } | null>(null);
  const [selectedProposalKeys, setSelectedProposalKeys] = useState<Set<string>>(
    new Set(),
  );
  const [proposalStatus, setProposalStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");

  // Sprint-25-Step-03 (ADR-0013): per-mode settings (gear dialog), loaded
  // once on mount — instance-wide, not tied to the current book, so this
  // does not depend on `book.id`.
  const [settingsMap, setSettingsMap] =
    useState<Record<AssistantMode, AssistantSettingsEntry | null>>(
      EMPTY_SETTINGS_MAP,
    );
  const [settingsDialogMode, setSettingsDialogMode] =
    useState<AssistantMode | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/assistant-settings")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) {
          if (data.ok) {
            // Database available: use server settings
            setSettingsMap(data.settings);
          } else {
            // Database unavailable (503, etc.): fallback to localStorage
            // (hotfix for Settings persistence when database is unavailable)
            const localSettings = getAssistantSettingsFromLocalStorage();
            setSettingsMap(localSettings);
          }
        }
      })
      .catch(() => {
        // Fetch failed entirely: fallback to localStorage
        if (!cancelled) {
          const localSettings = getAssistantSettingsFromLocalStorage();
          setSettingsMap(localSettings);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!book) {
    return (
      <aside className="flex w-full shrink-0 flex-col gap-2 border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 lg:border-l lg:border-t-0">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Создайте первую книгу, чтобы поговорить с помощником.
        </p>
      </aside>
    );
  }

  const meta = MODE_META[selectedMode];
  // Sprint-25-Step-03: a customized displayName overrides MODE_META's
  // hardcoded label everywhere it's shown — falls back to it whenever no
  // customization exists yet (backward compatible, per the Step Card).
  function displayNameFor(mode: AssistantMode): string {
    return settingsMap[mode]?.displayName?.trim() || MODE_META[mode].label;
  }
  const selectedTypicalRequests =
    settingsMap[selectedMode]?.typicalRequests ?? [];

  // Показывать типовые запросы эксперта если он выбран, иначе режима
  const displayedTypicalRequests = selectedExpertId
    ? (personalExperts.find((e) => e.id === selectedExpertId)?.typicalRequests as string[] | undefined) ?? []
    : selectedTypicalRequests;
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
    // Если выбран личный эксперт - использовать его системный промпт
    const selectedExpert = selectedExpertId ? personalExperts.find((e) => e.id === selectedExpertId) : null;
    if (selectedExpert?.systemPrompt) {
      // Для личного эксперта просто добавляем его промпт как контекст в сообщение
      const expertContext = `[Используется эксперт: ${selectedExpert.name}]\n${selectedExpert.systemPrompt}\n\n`;
      const enhancedInput = expertContext + (input.trim() || "Помогите");

      setStatus("loading");
      try {
        const outgoingMessages: ChatMessage[] = [
          ...messages,
          { role: "user", content: enhancedInput },
        ];
        onAppendMessage(selectedMode, { role: "user", content: enhancedInput });

        // Использовать первый системный режим (coauthor) для запроса
        const result = await aiBus.execute({
          operation: {
            type: "coauthor_draft",
            payload: {
              sceneText: sceneText || "",
              bookContext: book!,
              messages: outgoingMessages,
            },
          },
          context: {},
        });

        onAppendMessage(selectedMode, { role: "assistant", content: result.response.text });
        setInput("");
        setStatus("idle");
      } catch (error) {
        console.error("Ошибка запроса к эксперту:", error);
        setStatus("error");
      }
      return;
    }

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

  // Sprint-20-Step-03: request a structure proposal from Co-author.
  async function handleProposeStructure() {
    if (!book) return;
    setProposalStatus("loading");
    try {
      const result = await aiBus.execute({
        operation: {
          type: "coauthor_propose_structure",
          payload: {
            bookContext: book,
            messages: [],
          },
        },
        context: {},
      });
      const parsed = JSON.parse(result.response.text);
      setStructureProposal(parsed);
      // Default all keys to selected.
      const allKeys = new Set<string>();
      parsed.chapters.forEach((ch: { scenes: Array<unknown> }, ci: number) => {
        allKeys.add(String(ci));
        ch.scenes.forEach((_: unknown, si: number) => {
          allKeys.add(`${ci}-${si}`);
        });
      });
      setSelectedProposalKeys(allKeys);
      setProposalStatus("idle");
    } catch {
      setProposalStatus("error");
    }
  }

  function toggleProposalKey(key: string) {
    setSelectedProposalKeys((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleChapterKeys(chapterIndex: number, sceneCount: number) {
    setSelectedProposalKeys((previous) => {
      const next = new Set(previous);
      const chapterKey = String(chapterIndex);
      const allScenesSelected = Array.from({ length: sceneCount }, (_, si) =>
        next.has(`${chapterIndex}-${si}`),
      ).every(Boolean);
      if (allScenesSelected) {
        next.delete(chapterKey);
        for (let si = 0; si < sceneCount; si++) {
          next.delete(`${chapterIndex}-${si}`);
        }
      } else {
        next.add(chapterKey);
        for (let si = 0; si < sceneCount; si++) {
          next.add(`${chapterIndex}-${si}`);
        }
      }
      return next;
    });
  }

  function handleAcceptProposal(all: boolean) {
    if (!structureProposal || !onAcceptStructureProposal) return;
    const keys = all
      ? (() => {
          const allKeys = new Set<string>();
          structureProposal.chapters.forEach(
            (ch: { scenes: Array<unknown> }, ci: number) => {
              allKeys.add(String(ci));
              ch.scenes.forEach((_: unknown, si: number) => {
                allKeys.add(`${ci}-${si}`);
              });
            },
          );
          return allKeys;
        })()
      : selectedProposalKeys;
    onAcceptStructureProposal(structureProposal, keys);
    setStructureProposal(null);
    setSelectedProposalKeys(new Set());
  }

  async function handleDeleteExpert(expertId: string, expertName: string) {
    if (!confirm(`Удалить эксперта "${expertName}"?`)) return;

    try {
      const res = await fetch(`/api/experts/${expertId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setPersonalExperts((prev) => prev.filter((e) => e.id !== expertId));
      } else {
        alert("Ошибка удаления эксперта");
      }
    } catch (error) {
      console.error("Ошибка при удалении эксперта:", error);
      alert("Ошибка при удалении");
    }
  }

  return (
    <>
      <aside className="flex max-h-96 w-full shrink-0 flex-col gap-3 overflow-y-auto border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 lg:h-full lg:max-h-none lg:w-80 lg:border-l lg:border-t-0">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {t("sections.helpers")}
        </h2>
        {/* Sprint-25-Step-02: square icon buttons + hover tooltip, replacing
          the previous 2-column card grid with a description in every card —
          Product Owner decision (see this step's Step Card, "Часть 2").
          Sprint-25-Step-05: emoji glyph replaced with lucide-react icon
          components (Pen, Wand2, Eye, BookOpen). Native `title` supplies the
          hover tooltip. */}
        <div className="flex gap-2">
          {ASSISTANT_MODES.map((mode) => {
            const info = MODE_META[mode];
            // Режим не активен если выбран эксперт
            const isActive = selectedExpertId === null && mode === selectedMode;
            const label = displayNameFor(mode);
            return (
              <div key={mode} className="relative">
                <button
                  onClick={() => {
                    setSelectedExpertId(null);
                    onSelectMode(mode);
                  }}
                  title={selectedExpertId && !isActive ? "Отменить выбор эксперта для изменения режима" : label}
                  aria-label={label}
                  aria-pressed={isActive}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-lg transition-colors ${
                    isActive
                      ? `${info.activeBorder} bg-white dark:bg-black`
                      : selectedExpertId
                        ? "border-zinc-200 bg-zinc-50 opacity-40 dark:border-zinc-800 dark:bg-zinc-900"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-black dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                  }`}
                >
                  <info.icon className={`h-5 w-5 ${selectedExpertId && !isActive ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-700 dark:text-zinc-300"}`} />
                </button>
                <GearButton
                  label={label}
                  onOpen={() => setSettingsDialogMode(mode)}
                  t={t}
                />
              </div>
            );
          })}
          <button
            onClick={() => setIsExpertsDialogOpen(true)}
            title="Управлять экспертами"
            aria-label="Управлять экспертами"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-lg transition-colors hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-black dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
          >
            ⚙️
          </button>
        </div>

        {/* Личные эксперты - отображение в виде дополнительных опций */}
        {personalExperts.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Мои эксперты</p>
            <div className="flex flex-wrap gap-1">
              {personalExperts.map((expert) => {
                const isSelected = selectedExpertId === expert.id;
                return (
                  <button
                    key={expert.id}
                    onClick={() => setSelectedExpertId(isSelected ? null : expert.id)}
                    className={`flex items-center gap-1 rounded border px-2 py-1 transition-colors ${
                      isSelected
                        ? "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950"
                        : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                    }`}
                  >
                    <span className="text-sm">{expert.icon} {expert.name}</span>
                    <div className="flex gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingExpertId(expert.id);
                          setIsExpertsDialogOpen(true);
                        }}
                        title="Редактировать"
                        className="rounded px-1 py-0.5 text-xs text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        ⚙️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteExpert(expert.id, expert.name);
                        }}
                        title="Удалить"
                        className="rounded px-1 py-0.5 text-xs text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        🗑️
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Description now shown only for the currently active mode, moved
          out from inside every card (Product Owner's stated goal: reclaim
          vertical space in the ~320px-wide panel). Hidden when expert is selected. */}
        {selectedExpertId === null && (
          <p className={`text-xs ${meta.accent}`}>{meta.description}</p>
        )}

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center gap-1.5 text-xs font-medium ${
                selectedExpertId ? "text-blue-600 dark:text-blue-400" : meta.accent
              }`}
            >
              {selectedExpertId ? (
                <>
                  <span className="text-sm">
                    {personalExperts.find((e) => e.id === selectedExpertId)?.icon}
                  </span>
                  <span>{personalExperts.find((e) => e.id === selectedExpertId)?.name}</span>
                </>
              ) : (
                <>
                  <meta.icon className="h-4 w-4" />
                  <span>{displayNameFor(selectedMode)}</span>
                </>
              )}
            </div>
            <div className="ml-auto flex gap-1.5">
              {selectedMode === "coauthor" && (
                <button
                  onClick={handleProposeStructure}
                  disabled={proposalStatus === "loading"}
                  className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  {proposalStatus === "loading"
                    ? "…"
                    : t("panels.assistant.propose_structure")}
                </button>
              )}
              {selectedMode === "critic" && (
                <button
                  onClick={() => onCreateThread("critic")}
                  className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  {t("panels.assistant.start_over")}
                </button>
              )}
            </div>
          </div>

          {/* Sprint-33-Step-06: Display typicalRequests as clickable pills below mode name.
            For Critic, typicalRequests typically match CRITIC_SUBCATEGORIES labels
            but serve a different purpose: prepopulating input, not filtering results.
            Sprint-38-Step-02-Cont: Also show typicalRequests from selected personal expert */}
          {displayedTypicalRequests.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {displayedTypicalRequests.map((request) => (
                <button
                  key={request}
                  onClick={() => {
                    setInput((prev) => {
                      if (!prev.trim()) {
                        return request;
                      }
                      return `${prev} ${request}`;
                    });
                  }}
                  className="rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  {request}
                </button>
              ))}
            </div>
          )}

          {selectedMode === "critic" && (
            <div className="flex flex-wrap gap-1.5">
              {getCriticSubcategories(t).map((sub) => (
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

          {selectedMode === "coauthor" && proposalStatus === "error" && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {t("panels.assistant.error_proposal_failed")}
            </p>
          )}

          {selectedMode === "coauthor" && structureProposal && (
            <div className="flex flex-col gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {t("panels.assistant.proposed_structure")}
              </p>
              <div className="flex flex-col gap-2">
                {structureProposal.chapters.map((ch, ci) => {
                  const chapterKey = String(ci);
                  const isChapterChecked = selectedProposalKeys.has(chapterKey);
                  return (
                    <div key={ci} className="flex flex-col gap-1">
                      <label className="flex items-center gap-2 text-sm font-medium text-black dark:text-zinc-50">
                        <input
                          type="checkbox"
                          checked={isChapterChecked}
                          onChange={() =>
                            toggleChapterKeys(ci, ch.scenes.length)
                          }
                          className="h-3.5 w-3.5 rounded border-zinc-300"
                        />
                        {ch.title}
                        {ch.subtitle && (
                          <span className="text-xs text-zinc-400 dark:text-zinc-600">
                            — {ch.subtitle}
                          </span>
                        )}
                      </label>
                      <div className="flex flex-col gap-0.5 pl-5">
                        {ch.scenes.map((scene, si) => {
                          const sceneKey = `${ci}-${si}`;
                          return (
                            <label
                              key={si}
                              className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400"
                            >
                              <input
                                type="checkbox"
                                checked={selectedProposalKeys.has(sceneKey)}
                                onChange={() => toggleProposalKey(sceneKey)}
                                className="mt-0.5 h-3 w-3 rounded border-zinc-300"
                              />
                              <span>
                                <span className="font-medium">
                                  {scene.title}
                                </span>{" "}
                                — {scene.description}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAcceptProposal(false)}
                  disabled={selectedProposalKeys.size === 0}
                  className="rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  {t("panels.assistant.add_selected")}
                </button>
                <button
                  onClick={() => handleAcceptProposal(true)}
                  className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  {t("panels.assistant.add_all")}
                </button>
              </div>
            </div>
          )}

          {selectedMode === "reader" ? (
            <ReaderPanel
              threads={book.assistantThreads.reader}
              scopedText={scopedText}
              bookLanguage={book.language}
              typicalRequests={selectedTypicalRequests}
              onAppendMessage={(message, threadId) =>
                onAppendMessage("reader", message, threadId)
              }
              onCreateThread={(options) => onCreateThread("reader", options)}
              onRenameThread={(threadId, name) =>
                onRenameThread("reader", threadId, name)
              }
              onDeleteThread={(threadId) => onDeleteThread("reader", threadId)}
              t={t}
            />
          ) : (
            <>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
                {messages.length === 0 && selectedExpertId === null && (
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
                        <ReviewList reviews={reviews} t={t} />
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
                            {t("panels.assistant.insert_into_scene")}
                          </button>
                        )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2">
                {/* Sprint-25-Step-03 (ADR-0013): "typical request" preset
                  buttons — pre-fill the chat input, same UX pattern as
                  CRITIC_SUBCATEGORIES above; not a new AI Bus operation.
                  Sprint-33-Step-06: Updated to append instead of replace. */}
                {selectedTypicalRequests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTypicalRequests.map((request) => (
                      <button
                        key={request}
                        onClick={() => {
                          setInput((prev) => {
                            if (!prev.trim()) {
                              return request;
                            }
                            return `${prev} ${request}`;
                          });
                        }}
                        className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                      >
                        {request}
                      </button>
                    ))}
                  </div>
                )}
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={meta.placeholder}
                  rows={2}
                  disabled={status === "loading"}
                  className="w-full resize-none rounded-md border border-zinc-300 bg-white p-2 text-sm text-black outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-zinc-400"
                />
                <button
                  onClick={handleSend}
                  disabled={status === "loading" || !canSend}
                  className="self-start rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  {status === "loading" ? "…" : t("buttons.ask")}
                </button>
                {status === "error" && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {t("panels.assistant.error_unavailable")}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
      {settingsDialogMode && (
        <AssistantSettingsDialog
          mode={settingsDialogMode}
          initial={settingsMap[settingsDialogMode]}
          onCancel={() => setSettingsDialogMode(null)}
          onSaved={(mode, settings) => {
            setSettingsMap((previous) => ({ ...previous, [mode]: settings }));
            setSettingsDialogMode(null);
          }}
          t={t}
        />
      )}
      <CustomExpertsDialog
        isOpen={isExpertsDialogOpen}
        onClose={() => {
          setIsExpertsDialogOpen(false);
          setEditingExpertId(undefined);
        }}
        editingExpertId={editingExpertId}
      />
    </>
  );
}
