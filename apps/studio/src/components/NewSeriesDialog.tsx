"use client";

import { useState } from "react";
import { useLocaleContext } from "@/context/LocaleContext";

type NewSeriesDialogProps = {
  onCancel: () => void;
  onCreate: (title: string, description: string) => void;
};

export function NewSeriesDialog({ onCancel, onCreate }: NewSeriesDialogProps) {
  const { t } = useLocaleContext();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const canCreate = title.trim().length > 0;

  function handleCreate() {
    if (!canCreate) return;
    onCreate(title.trim(), description.trim());
    setTitle("");
    setDescription("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
          {t("dialogs.new_series.title")}
        </h2>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("dialogs.new_series.title_label")}
            </span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("dialogs.new_series.title_placeholder")}
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("dialogs.new_series.description_label")}
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder={t("dialogs.new_series.description_placeholder")}
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
            {t("dialogs.new_series.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
