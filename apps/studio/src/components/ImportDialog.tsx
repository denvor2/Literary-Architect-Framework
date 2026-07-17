import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import { useLocaleContext } from "@/context/LocaleContext";

export interface ImportDialogProps {
  isOpen: boolean;
  isLoading?: boolean;
  onImport: (file: File) => Promise<void>;
  onCancel: () => void;
}

export function ImportDialog({
  isOpen,
  isLoading = false,
  onImport,
  onCancel,
}: ImportDialogProps) {
  const { t } = useLocaleContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleImport() {
    if (!selectedFile) return;

    setError(null);
    try {
      await onImport(selectedFile);
      setSuccess(true);
      setTimeout(() => {
        onCancel();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dialogs.import.error"));
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".zip")) {
        setError(t("dialogs.import.error_only_zip"));
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.endsWith(".zip")) {
        setError(t("dialogs.import.error_only_zip"));
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
          {t("dialogs.import.title")}
        </h2>

        {success ? (
          <div className="mb-4 flex items-center gap-3 rounded-md bg-green-100 p-4 dark:bg-green-900">
            <CheckCircle className="h-5 w-5 text-green-700 dark:text-green-300" />
            <span className="text-sm text-green-700 dark:text-green-300">
              {t("dialogs.import.success")}
            </span>
          </div>
        ) : (
          <>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="mb-4 border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center dark:border-zinc-700"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                disabled={isLoading}
                className="hidden"
              />

              <Upload className="mx-auto mb-2 h-8 w-8 text-zinc-400" />

              <div className="mb-3">
                <p className="text-sm font-medium text-black dark:text-white">
                  {t("dialogs.import.description")}
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="inline-block rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
              >
                {t("dialogs.import.submit")}
              </button>
            </div>

            {selectedFile && (
              <div className="mb-4 rounded-md bg-blue-50 p-3 dark:bg-blue-900">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  📁 {selectedFile.name}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-md bg-red-100 p-3 dark:bg-red-900">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-700 dark:text-red-300" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            )}
          </>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading || success}
            className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
          >
            {t("buttons.cancel")}
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile || isLoading || success}
            className="flex-1 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {isLoading
              ? `${t("dialogs.import.submit")}...`
              : t("dialogs.import.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
