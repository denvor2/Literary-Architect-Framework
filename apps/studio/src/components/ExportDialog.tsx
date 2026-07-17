import { useState } from "react";
import { useLocaleContext } from "@/context/LocaleContext";

export type ExportFormat = "markdown-zip" | "docx" | "pdf" | "fb2";

export interface ExportDialogProps {
  bookTitle: string;
  isOpen: boolean;
  isLoading?: boolean;
  onExport: (format: ExportFormat) => Promise<void>;
  onCancel: () => void;
}

// Generate filename with date-time: "book-title_2026-07-16_14-30-45"
function generateFilename(bookTitle: string, extension: string): string {
  const now = new Date();
  const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS
  const sanitized = bookTitle
    .toLowerCase()
    .replace(/[^a-z0-9а-я]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${sanitized}_${date}_${time}.${extension}`;
}

export function ExportDialog({
  bookTitle,
  isOpen,
  isLoading = false,
  onExport,
  onCancel,
}: ExportDialogProps) {
  const { t } = useLocaleContext();
  const [selectedFormat, setSelectedFormat] =
    useState<ExportFormat>("markdown-zip");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleExport() {
    setError(null);
    try {
      await onExport(selectedFormat);
      onCancel(); // Close dialog after successful export
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("export.messages.error"),
      );
    }
  }

  const formats: ExportFormat[] = ["markdown-zip", "docx", "pdf", "fb2"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
          Экспорт «{bookTitle}»
        </h2>

        <div className="mb-6 space-y-3">
          {formats.map((format) => {
            const name = t(`export.format.${format}.name`);
            const description = t(`export.format.${format}.description`);
            return (
              <label
                key={format}
                className="flex cursor-pointer items-center gap-3"
              >
                <input
                  type="radio"
                  name="format"
                  value={format}
                  checked={selectedFormat === format}
                  onChange={() => setSelectedFormat(format)}
                  disabled={isLoading}
                  className="h-4 w-4"
                />
                <span className="flex-1 text-sm">
                  <div className="font-medium text-black dark:text-white">
                    {name}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {description}
                  </div>
                  {format !== "markdown-zip" && (
                    <div className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
                      📝{" "}
                      {generateFilename(
                        bookTitle,
                        format === "docx"
                          ? "docx"
                          : format === "pdf"
                            ? "pdf"
                            : "fb2",
                      )}
                    </div>
                  )}
                </span>
              </label>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
          >
            {t("export.buttons.cancel")}
          </button>
          <button
            onClick={handleExport}
            disabled={isLoading}
            className="flex-1 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {isLoading ? t("export.messages.exporting") : t("export.buttons.export")}
          </button>
        </div>
      </div>
    </div>
  );
}
