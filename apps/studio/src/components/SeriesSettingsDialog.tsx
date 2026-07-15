"use client";

import { useState } from "react";
import type { Series, SeriesStatus } from "@/domain/model";

type SeriesSettingsDialogProps = {
  series: Series | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Series>) => Promise<void>;
};

type TabType = "basic" | "bible" | "constraints" | "meta";

export function SeriesSettingsDialog({
  series,
  isOpen,
  onClose,
  onSave,
}: SeriesSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Series>>(() => ({
    title: series?.title ?? "",
    description: series?.description ?? "",
    targetAudience: series?.targetAudience ?? "",
    genre: series?.genre ?? [],
    status: series?.status ?? "outline",
    decisions: series?.decisions ?? "",
    throughlineElements: series?.throughlineElements ?? [],
    seriesConstraints: series?.seriesConstraints ?? [],
    estimatedTotalWordCount: series?.estimatedTotalWordCount,
    author: series?.author ?? "",
    notes: series?.notes ?? "",
  }));

  // Genre input state
  const [genreInput, setGenreInput] = useState("");
  // Throughline input state
  const [throughlineInput, setThroughlineInput] = useState("");
  // Constraint input state
  const [constraintInput, setConstraintInput] = useState("");

  if (!isOpen || !series) return null;

  async function handleSave() {
    if (!series) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        ...formData,
        id: series.id,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при сохранении");
    } finally {
      setIsSaving(false);
    }
  }

  function handleAddGenre() {
    const trimmed = genreInput.trim();
    if (!trimmed) return;
    const current = Array.isArray(formData.genre) ? formData.genre : [];
    if (!current.includes(trimmed)) {
      setFormData({
        ...formData,
        genre: [...current, trimmed],
      });
    }
    setGenreInput("");
  }

  function handleRemoveGenre(genreToRemove: string) {
    const current = Array.isArray(formData.genre) ? formData.genre : [];
    setFormData({
      ...formData,
      genre: current.filter((g) => g !== genreToRemove),
    });
  }

  function handleAddThroughline() {
    const trimmed = throughlineInput.trim();
    if (!trimmed) return;
    const current = Array.isArray(formData.throughlineElements)
      ? formData.throughlineElements
      : [];
    if (!current.includes(trimmed)) {
      setFormData({
        ...formData,
        throughlineElements: [...current, trimmed],
      });
    }
    setThroughlineInput("");
  }

  function handleRemoveThroughline(elementToRemove: string) {
    const current = Array.isArray(formData.throughlineElements)
      ? formData.throughlineElements
      : [];
    setFormData({
      ...formData,
      throughlineElements: current.filter((e) => e !== elementToRemove),
    });
  }

  function handleAddConstraint() {
    const trimmed = constraintInput.trim();
    if (!trimmed) return;
    const current = Array.isArray(formData.seriesConstraints)
      ? formData.seriesConstraints
      : [];
    if (!current.includes(trimmed)) {
      setFormData({
        ...formData,
        seriesConstraints: [...current, trimmed],
      });
    }
    setConstraintInput("");
  }

  function handleRemoveConstraint(constraintToRemove: string) {
    const current = Array.isArray(formData.seriesConstraints)
      ? formData.seriesConstraints
      : [];
    setFormData({
      ...formData,
      seriesConstraints: current.filter((c) => c !== constraintToRemove),
    });
  }

  const genres = Array.isArray(formData.genre) ? formData.genre : [];
  const throughlines = Array.isArray(formData.throughlineElements)
    ? formData.throughlineElements
    : [];
  const constraints = Array.isArray(formData.seriesConstraints)
    ? formData.seriesConstraints
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
          Настройки серии: {series.title}
        </h2>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
          {[
            { key: "basic", label: "Основное" },
            { key: "bible", label: "Story Bible" },
            { key: "constraints", label: "Ограничения" },
            { key: "meta", label: "Метаданные" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-black text-black dark:border-white dark:text-white"
                  : "text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex flex-col gap-4">
          {/* Tab 1: Basic */}
          {activeTab === "basic" && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Название серии
                </span>
                <input
                  type="text"
                  value={formData.title ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Описание
                </span>
                <textarea
                  value={formData.description ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Целевая аудитория
                </span>
                <select
                  value={formData.targetAudience ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetAudience: e.target.value,
                    })
                  }
                  className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                >
                  <option value="">-- Выбрать --</option>
                  <option value="Children">Дети</option>
                  <option value="YA">YA (подростки)</option>
                  <option value="Teen">Teen (молодежь)</option>
                  <option value="Adult">Взрослые</option>
                  <option value="Academic">Научно-популярное</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Жанры
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={genreInput}
                    onChange={(e) => setGenreInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddGenre();
                      }
                    }}
                    placeholder="Введите жанр и нажмите Enter..."
                    className="flex-1 rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                  <button
                    onClick={handleAddGenre}
                    className="rounded-md bg-zinc-200 px-3 py-2 text-sm font-medium text-black hover:bg-zinc-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <div
                      key={genre}
                      className="flex items-center gap-1 rounded-full bg-zinc-200 px-3 py-1 text-sm dark:bg-zinc-800"
                    >
                      {genre}
                      <button
                        onClick={() => handleRemoveGenre(genre)}
                        className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Статус
                </span>
                <select
                  value={formData.status ?? "outline"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as SeriesStatus,
                    })
                  }
                  className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                >
                  <option value="outline">На рассмотрении (outline)</option>
                  <option value="in_progress">В разработке</option>
                  <option value="complete">Завершена</option>
                  <option value="published">Опубликована</option>
                </select>
              </label>
            </>
          )}

          {/* Tab 2: Story Bible */}
          {activeTab === "bible" && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Главные решения
                </span>
                <textarea
                  value={formData.decisions ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, decisions: e.target.value })
                  }
                  rows={4}
                  placeholder="Ключевые творческие решения для всей серии..."
                  className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Элементы сквозной линии
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={throughlineInput}
                    onChange={(e) => setThroughlineInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddThroughline();
                      }
                    }}
                    placeholder="Добавить элемент и нажать Enter..."
                    className="flex-1 rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                  <button
                    onClick={handleAddThroughline}
                    className="rounded-md bg-zinc-200 px-3 py-2 text-sm font-medium text-black hover:bg-zinc-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {throughlines.map((element) => (
                    <div
                      key={element}
                      className="flex items-center gap-1 rounded-full bg-blue-200 px-3 py-1 text-sm dark:bg-blue-900"
                    >
                      {element}
                      <button
                        onClick={() => handleRemoveThroughline(element)}
                        className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Прогноз общего объема слов
                </span>
                <input
                  type="number"
                  value={formData.estimatedTotalWordCount ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedTotalWordCount: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="Например: 250000"
                  className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </label>
            </>
          )}

          {/* Tab 3: Constraints */}
          {activeTab === "constraints" && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Ограничения серии
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Что НЕЛЬЗЯ делать в этой серии
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={constraintInput}
                    onChange={(e) => setConstraintInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddConstraint();
                      }
                    }}
                    placeholder="Добавить ограничение и нажать Enter..."
                    className="flex-1 rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                  <button
                    onClick={handleAddConstraint}
                    className="rounded-md bg-zinc-200 px-3 py-2 text-sm font-medium text-black hover:bg-zinc-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {constraints.map((constraint) => (
                    <div
                      key={constraint}
                      className="flex items-center gap-1 rounded-full bg-red-200 px-3 py-1 text-sm dark:bg-red-900"
                    >
                      {constraint}
                      <button
                        onClick={() => handleRemoveConstraint(constraint)}
                        className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </label>
            </>
          )}

          {/* Tab 4: Metadata */}
          {activeTab === "meta" && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Автор
                </span>
                <input
                  type="text"
                  value={formData.author ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  placeholder="Имя автора (если отличается от пользователя)..."
                  className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Заметки
                </span>
                <textarea
                  value={formData.notes ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={4}
                  placeholder="Внутренние заметки..."
                  className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </label>

              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                <p>
                  Создано: {new Date(series.createdAt).toLocaleDateString("ru")}
                </p>
                <p>
                  Обновлено:{" "}
                  {new Date(series.updatedAt).toLocaleDateString("ru")}
                </p>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {isSaving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
