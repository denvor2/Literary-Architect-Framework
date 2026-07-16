import { useState } from "react";

export type ExportFormat = "markdown-zip" | "docx";

export interface ExportDialogProps {
  bookTitle: string;
  isOpen: boolean;
  isLoading?: boolean;
  onExport: (format: ExportFormat) => Promise<void>;
  onCancel: () => void;
}

export function ExportDialog({
  bookTitle,
  isOpen,
  isLoading = false,
  onExport,
  onCancel,
}: ExportDialogProps) {
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
      setError(err instanceof Error ? err.message : "Failed to export book");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
          Export {bookTitle}
        </h2>

        <div className="mb-6 space-y-3">
          {/* JSON Format - Hidden for now (TODO: clarify use case) */}
          {/* <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="format"
              value="json"
              checked={selectedFormat === "json"}
              onChange={() => setSelectedFormat("json")}
              disabled={isLoading}
              className="h-4 w-4"
            />
            <span className="flex-1 text-sm">
              <div className="font-medium text-black dark:text-white">
                JSON Format
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Single file with full book data
              </div>
            </span>
          </label> */}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="format"
              value="markdown-zip"
              checked={selectedFormat === "markdown-zip"}
              onChange={() => setSelectedFormat("markdown-zip")}
              disabled={isLoading}
              className="h-4 w-4"
            />
            <span className="flex-1 text-sm">
              <div className="font-medium text-black dark:text-white">
                Markdown ZIP Archive
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Structured folder with chapters, characters, notes
              </div>
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="format"
              value="docx"
              checked={selectedFormat === "docx"}
              onChange={() => setSelectedFormat("docx")}
              disabled={isLoading}
              className="h-4 w-4"
            />
            <span className="flex-1 text-sm">
              <div className="font-medium text-black dark:text-white">
                DOCX (Word Document)
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Formatted document ready for print and publishing
              </div>
            </span>
          </label>

          {/* Both Formats - Hidden when JSON is hidden */}
          {/* <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="format"
              value="both"
              checked={selectedFormat === "both"}
              onChange={() => setSelectedFormat("both")}
              disabled={isLoading}
              className="h-4 w-4"
            />
            <span className="flex-1 text-sm">
              <div className="font-medium text-black dark:text-white">
                Both Formats
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Download JSON and Markdown ZIP together
              </div>
            </span>
          </label> */}
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
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isLoading}
            className="flex-1 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {isLoading ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}
