"use client";

import { useState, useEffect } from "react";
import { useLocaleContext } from "@/context/LocaleContext";
import type { CustomAssistant } from "@/generated/prisma/client";

interface CustomAssistantsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomAssistantsDialog({
  isOpen,
  onClose,
}: CustomAssistantsDialogProps) {
  const { t } = useLocaleContext();
  const [assistants, setAssistants] = useState<CustomAssistant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", systemPrompt: "" });

  useEffect(() => {
    if (isOpen) {
      loadAssistants();
    }
  }, [isOpen]);

  const loadAssistants = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assistants", { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as { assistants: CustomAssistant[] };
        setAssistants(data.assistants);
      }
    } catch (error) {
      console.error("Failed to load assistants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/assistants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newAssistant = (await res.json()) as CustomAssistant;
        setAssistants([...assistants, newAssistant]);
        setFormData({ name: "", systemPrompt: "" });
        setShowForm(false);
      }
    } catch (error) {
      console.error("Failed to create assistant:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить?")) return;

    try {
      await fetch(`/api/assistants/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setAssistants(assistants.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Failed to delete assistant:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-zinc-900">
        <h2 className="mb-4 text-xl font-bold">Мои помощники</h2>

        <div className="mb-6 max-h-64 space-y-2 overflow-y-auto">
          {loading && <p className="text-sm text-zinc-500">Загрузка...</p>}
          {!loading && assistants.length === 0 && (
            <p className="text-sm text-zinc-500">Нет помощников</p>
          )}
          {assistants.map((assistant) => (
            <div
              key={assistant.id}
              className="flex justify-between rounded border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div>
                <p className="font-medium">{assistant.name}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(assistant.createdAt).toLocaleDateString("ru-RU")}
                </p>
              </div>
              <button
                onClick={() => handleDelete(assistant.id)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="mb-6 space-y-3 rounded border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Имя помощника"
              maxLength={50}
              className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <textarea
              value={formData.systemPrompt}
              onChange={(e) =>
                setFormData({ ...formData, systemPrompt: e.target.value })
              }
              placeholder="Системный промпт"
              maxLength={5000}
              rows={4}
              className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 rounded bg-black px-3 py-2 text-white hover:bg-zinc-800"
              >
                Создать
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData({ name: "", systemPrompt: "" });
                }}
                className="flex-1 rounded border border-zinc-300 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-4 w-full rounded bg-black px-3 py-2 text-white hover:bg-zinc-800"
          >
            + Новый помощник
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full rounded border border-zinc-300 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
