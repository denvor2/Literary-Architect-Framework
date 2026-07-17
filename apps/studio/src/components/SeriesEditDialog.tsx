"use client";

import { useState } from "react";
import type { Series } from "@/domain/model";
import { useLocaleContext } from "@/context/LocaleContext";

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
  const { t } = useLocaleContext();
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
            {t("dialogs.series_edit.delete_confirm")}
          </h2>
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
            Series &ldquo;{series.title}&rdquo; will be deleted. Books in this
            series will remain in your library.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
            >
              {t("dialogs.close_button")}
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              {t("buttons.delete")}
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
          {t("dialogs.series_edit.title")}
        </h2>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("dialogs.series_edit.name_label")}
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
              {t("dialogs.series_edit.description_label")}
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder={t("dialogs.series_settings.description_placeholder")}
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
              {t("buttons.delete")}
            </button>
          )}
          <div className="flex flex-1 justify-end gap-3">
            <button
              onClick={onCancel}
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
            >
              {t("buttons.cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || !titleChanged}
              className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {t("dialogs.series_edit.save_button")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
