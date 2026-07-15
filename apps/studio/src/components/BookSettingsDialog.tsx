"use client";

import { useState } from "react";
import type { Book, BookStatus, Series } from "@/domain/model";

type BookSettingsDialogProps = {
  book: Book | null;
  series: Series | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Book>) => Promise<void>;
};

type TabType = "basic" | "bible" | "constraints" | "meta";

export function BookSettingsDialog({
  book,
  series,
  isOpen,
  onClose,
  onSave,
}: BookSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Book>>(() => ({
    title: book?.title ?? "",
    workingTitle: book?.workingTitle ?? "",
    shortAnnotation: book?.shortAnnotation ?? "",
    targetAudience: book?.targetAudience ?? "",
    genreArray: book?.genreArray ?? [],
    storyBibleStatus: book?.storyBibleStatus ?? "outline",
    mainPlotlines: book?.mainPlotlines ?? [],
    principle: book?.principle ?? "",
    escalation: book?.escalation ?? "",
    themes: book?.themes ?? [],
    bookConstraints: book?.bookConstraints ?? [],
    estimatedWordCount: book?.estimatedWordCount,
    estimatedChapters: book?.estimatedChapters,
    isbn: book?.isbn ?? "",
    notes: book?.notes ?? "",
  }));

  // Input states
  const [genreInput, setGenreInput] = useState("");
  const [plotlineInput, setPlotlineInput] = useState("");
  const [themeInput, setThemeInput] = useState("");
  const [constraintInput, setConstraintInput] = useState("");

  if (!isOpen || !book) return null;

  async function handleSave() {
    if (!book) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        ...formData,
        id: book.id,
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
    const current = Array.isArray(formData.genreArray)
      ? formData.genreArray
      : [];
    if (!current.includes(trimmed)) {
      setFormData({
        ...formData,
        genreArray: [...current, trimmed],
      });
    }
    setGenreInput("");
  }

  function handleRemoveGenre(genreToRemove: string) {
    const current = Array.isArray(formData.genreArray)
      ? formData.genreArray
      : [];
    setFormData({
      ...formData,
      genreArray: current.filter((g) => g !== genreToRemove),
    });
  }

  function handleAddPlotline() {
    const trimmed = plotlineInput.trim();
    if (!trimmed) return;
    const current = Array.isArray(formData.mainPlotlines)
      ? formData.mainPlotlines
      : [];
    if (!current.includes(trimmed)) {
      setFormData({
        ...formData,
        mainPlotlines: [...current, trimmed],
      });
    }
    setPlotlineInput("");
  }

  function handleRemovePlotline(plotlineToRemove: string) {
    const current = Array.isArray(formData.mainPlotlines)
      ? formData.mainPlotlines
      : [];
    setFormData({
      ...formData,
      mainPlotlines: current.filter((p) => p !== plotlineToRemove),
    });
  }

  function handleAddTheme() {
    const trimmed = themeInput.trim();
    if (!trimmed) return;
    const current = Array.isArray(formData.themes) ? formData.themes : [];
    if (!current.includes(trimmed)) {
      setFormData({
        ...formData,
        themes: [...current, trimmed],
      });
    }
    setThemeInput("");
  }

  function handleRemoveTheme(themeToRemove: string) {
    const current = Array.isArray(formData.themes) ? formData.themes : [];
    setFormData({
      ...formData,
      themes: current.filter((t) => t !== themeToRemove),
    });
  }

  function handleAddConstraint() {
    const trimmed = constraintInput.trim();
    if (!trimmed) return;
    const current = Array.isArray(formData.bookConstraints)
      ? formData.bookConstraints
      : [];
    if (!current.includes(trimmed)) {
      setFormData({
        ...formData,
        bookConstraints: [...current, trimmed],
      });
    }
    setConstraintInput("");
  }

  function handleRemoveConstraint(constraintToRemove: string) {
    const current = Array.isArray(formData.bookConstraints)
      ? formData.bookConstraints
      : [];
    setFormData({
      ...formData,
      bookConstraints: current.filter((c) => c !== constraintToRemove),
    });
  }

  const genres = Array.isArray(formData.genreArray) ? formData.genreArray : [];
  const plotlines = Array.isArray(formData.mainPlotlines)
    ? formData.mainPlotlines
    : [];
  const themes = Array.isArray(formData.themes) ? formData.themes : [];
  const constraints = Array.isArray(formData.bookConstraints)
    ? formData.bookConstraints
    : [];

  // Helper to show inherited value
  const inheritedAudience =
    !formData.targetAudience && series?.targetAudience
      ? ` (наследуется из серии: ${series.targetAudience})`
      : "";
  const inheritedGenres =
    !genres.length && series?.genre?.length
      ? ` (наследуется из серии: ${series.genre.join(", ")})`
      : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
          Настройки книги: {book.title}
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
                  Название
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
                  Рабочее название (черновик)
                </span>
                <input
                  type="text"
                  value={formData.workingTitle ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, workingTitle: e.target.value })
                  }
                  placeholder="Временное название..."
                  className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Описание
                </span>
                <textarea
                  value={formData.shortAnnotation ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shortAnnotation: e.target.value,
                    })
                  }
                  rows={3}
                  className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Целевая аудитория{inheritedAudience}
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
                  <option value="">
                    {series?.targetAudience
                      ? `Как в серии (${series.targetAudience})`
                      : "-- Выбрать --"}
                  </option>
                  <option value="Children">Дети</option>
                  <option value="YA">YA (подростки)</option>
                  <option value="Teen">Teen (молодежь)</option>
                  <option value="Adult">Взрослые</option>
                  <option value="Academic">Научно-популярное</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Жанры{inheritedGenres}
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
                  {series?.genre &&
                    series.genre.length > 0 &&
                    !genres.length && (
                      <div className="text-xs text-zinc-500 italic">
                        Используются жанры из серии
                      </div>
                    )}
                </div>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Статус
                </span>
                <select
                  value={formData.storyBibleStatus ?? "outline"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      storyBibleStatus: e.target.value as BookStatus,
                    })
                  }
                  className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                >
                  <option value="outline">На рассмотрении (outline)</option>
                  <option value="draft">Черновик</option>
                  <option value="editing">Редактирование</option>
                  <option value="beta">Бета</option>
                  <option value="published">Опубликована</option>
                </select>
              </label>

              <div className="flex gap-4">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Прогноз слов
                  </span>
                  <input
                    type="number"
                    value={formData.estimatedWordCount ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedWordCount: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="Например: 80000"
                    className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </label>

                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Прогноз глав
                  </span>
                  <input
                    type="number"
                    value={formData.estimatedChapters ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedChapters: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="Например: 30"
                    className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </label>
              </div>
            </>
          )}

          {/* Tab 2: Story Bible */}
          {activeTab === "bible" && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Главные сюжетные линии
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={plotlineInput}
                    onChange={(e) => setPlotlineInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddPlotline();
                      }
                    }}
                    placeholder="Добавить сюжетную линию и нажать Enter..."
                    className="flex-1 rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                  <button
                    onClick={handleAddPlotline}
                    className="rounded-md bg-zinc-200 px-3 py-2 text-sm font-medium text-black hover:bg-zinc-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {plotlines.map((plotline) => (
                    <div
                      key={plotline}
                      className="flex items-center gap-1 rounded-full bg-green-200 px-3 py-1 text-sm dark:bg-green-900"
                    >
                      {plotline}
                      <button
                        onClick={() => handleRemovePlotline(plotline)}
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
                  Главный принцип
                </span>
                <textarea
                  value={formData.principle ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, principle: e.target.value })
                  }
                  rows={3}
                  placeholder="Напр.: Контраст. Главы постоянно меняют POV..."
                  className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Эскалация
                </span>
                <textarea
                  value={formData.escalation ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, escalation: e.target.value })
                  }
                  rows={3}
                  placeholder="Напр.: Палки → Дельфины → Ксеносы → Медведи"
                  className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Темы
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={themeInput}
                    onChange={(e) => setThemeInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTheme();
                      }
                    }}
                    placeholder="Добавить тему и нажать Enter..."
                    className="flex-1 rounded-md border border-zinc-300 bg-white p-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                  <button
                    onClick={handleAddTheme}
                    className="rounded-md bg-zinc-200 px-3 py-2 text-sm font-medium text-black hover:bg-zinc-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {themes.map((theme) => (
                    <div
                      key={theme}
                      className="flex items-center gap-1 rounded-full bg-purple-200 px-3 py-1 text-sm dark:bg-purple-900"
                    >
                      {theme}
                      <button
                        onClick={() => handleRemoveTheme(theme)}
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

          {/* Tab 3: Constraints */}
          {activeTab === "constraints" && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Ограничения книги
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Что НЕЛЬЗЯ делать в этой книге
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
                  ISBN
                </span>
                <input
                  type="text"
                  value={formData.isbn ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, isbn: e.target.value })
                  }
                  placeholder="Для опубликованных книг..."
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
