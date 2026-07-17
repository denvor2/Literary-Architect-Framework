"use client";

import { useState } from "react";
import type { Book, Series } from "@/domain/model";
import { GENRES } from "@/lib/genres";
import { GenreAutocomplete } from "./GenreAutocomplete";
import { useLocaleContext } from "@/context/LocaleContext";

export const LANGUAGES = [
  "Russian",
  "English",
  "Ukrainian",
  "Belarusian",
  "Kazakh",
];

type NewBookDialogProps = {
  onCancel: () => void;
  series?: readonly Series[];
  onCreate: (
    book: Omit<
      Book,
      | "id"
      | "chapters"
      | "characters"
      | "tags"
      | "shortAnnotation"
      | "fullAnnotation"
      | "assistantThreads"
      | "ideas"
    >,
  ) => void;
};

export function NewBookDialog({
  onCancel,
  series = [],
  onCreate,
}: NewBookDialogProps) {
  const { t } = useLocaleContext();
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState(GENRES[0]);
  const [language, setLanguage] = useState("Russian");
  const [premise, setPremise] = useState("");
  const [seriesId, setSeriesId] = useState<string | undefined>(undefined);

  const canCreate = title.trim().length > 0;

  function handleCreate() {
    if (!canCreate) return;
    onCreate({ title: title.trim(), genre, language, premise, seriesId });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
          {t("dialogs.new_book.title")}
        </h2>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("dialogs.new_book.title_label")}
            </span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("dialogs.new_book.title_placeholder")}
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("dialogs.new_book.genre_label")}
            </span>
            <GenreAutocomplete
              value={genre}
              onChange={setGenre}
              placeholder={t("dialogs.new_book.genre_placeholder")}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("dialogs.new_book.language_label")}
            </span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              {LANGUAGES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("dialogs.new_book.series_label")}
            </span>
            <select
              value={seriesId ?? ""}
              onChange={(event) => setSeriesId(event.target.value || undefined)}
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              <option value="">—</option>
              {series.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title || "—"}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("dialogs.new_book.premise_label")}
            </span>
            <textarea
              value={premise}
              onChange={(event) => setPremise(event.target.value)}
              rows={4}
              placeholder={t("dialogs.new_book.premise_placeholder")}
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
          >
            {t("buttons.cancel")}
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {t("dialogs.new_book.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
