"use client";

import { useState } from "react";
import type { Series } from "@/domain/model";

type SeriesEditDialogProps = {
  series: Series;
  onCancel: () => void;
  onSave: (title: string, description: string) => void;
  onDelete?: () => void;
};

export function SeriesEditDialog({
  series,
  onCancel,
  onSave,
  onDelete,
}: SeriesEditDialogProps) {
  const [title, setTitle] = useState(series.title);
  const [description, setDescription] = useState(series.description);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canSave = title.trim().length > 0;
  const titleChanged =
    title !== series.title || description !== series.description;

  function handleSave() {
    if (!canSave) return;
    onSave(title.trim(), description.trim());
  }

  function handleDeleteConfirm() {
    onDelete?.();
  }

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
            Удалить серию?
          </h2>
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
            Серия &ldquo;{series.title}&rdquo; будет удалена. Книги в этой серии
            останутся в библиотеке.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
            >
              Отмена
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
          Редактировать серию
        </h2>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Название серии
            </span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Введите название серии..."
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Описание (опционально)
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Описание серии..."
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-between gap-3">
          {onDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              Удалить
            </button>
          )}
          <div className="flex flex-1 justify-end gap-3">
            <button
              onClick={onCancel}
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || !titleChanged}
              className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
