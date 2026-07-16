"use client";

import { useState } from "react";
import type { Book, Series } from "@/domain/model";
import { GENRES } from "@/lib/genres";
import { GenreAutocomplete } from "./GenreAutocomplete";

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
          Новая книга
        </h2>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Название книги
            </span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Введите название..."
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Жанр
            </span>
            <GenreAutocomplete
              value={genre}
              onChange={setGenre}
              placeholder="Выберите или введите жанр..."
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Язык
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
              Серия (опционально)
            </span>
            <select
              value={seriesId ?? ""}
              onChange={(event) => setSeriesId(event.target.value || undefined)}
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              <option value="">Без серии</option>
              {series.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title || "Без названия"}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Премиса / Идея
            </span>
            <textarea
              value={premise}
              onChange={(event) => setPremise(event.target.value)}
              rows={4}
              placeholder="О чём эта книга?"
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
          >
            Отмена
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Создать книгу
          </button>
        </div>
      </div>
    </div>
  );
}
