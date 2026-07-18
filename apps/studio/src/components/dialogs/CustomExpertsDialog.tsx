"use client";

import { useState, useEffect } from "react";
import { useLocaleContext } from "@/context/LocaleContext";
import type { CustomExpert, PublicExpert } from "@/generated/prisma/client";

interface CustomExpertsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type Expert = CustomExpert & { isOwn?: boolean };

export function CustomExpertsDialog({
  isOpen,
  onClose,
}: CustomExpertsDialogProps) {
  const { t } = useLocaleContext();
  const [tab, setTab] = useState<"mine" | "available">("mine");
  const [myExperts, setMyExperts] = useState<Expert[]>([]);
  const [publicExperts, setPublicExperts] = useState<PublicExpert[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    systemPrompt: "",
    typicalRequests: [""],
    icon: "🤖",
    isPublic: false,
  });

  useEffect(() => {
    if (isOpen) {
      loadExperts();
    }
  }, [isOpen]);

  const loadExperts = async () => {
    setLoading(true);
    try {
      const [myRes, pubRes] = await Promise.all([
        fetch("/api/experts", { credentials: "include" }),
        fetch("/api/experts/public", { credentials: "include" }),
      ]);

      if (myRes.ok) {
        const data = (await myRes.json()) as { experts: Expert[] };
        setMyExperts(data.experts);
      }
      if (pubRes.ok) {
        const data = (await pubRes.json()) as { experts: PublicExpert[] };
        setPublicExperts(data.experts);
      }
    } catch (error) {
      console.error("Failed to load experts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.systemPrompt.trim()) {
      alert("Заполните имя и промпт");
      return;
    }

    try {
      const res = await fetch("/api/experts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          systemPrompt: formData.systemPrompt,
          typicalRequests: formData.typicalRequests.filter((r) => r.trim()),
          icon: formData.icon,
          isPublic: formData.isPublic,
        }),
      });

      if (res.ok) {
        await loadExperts();
        setFormData({
          name: "",
          systemPrompt: "",
          typicalRequests: [""],
          icon: "🤖",
          isPublic: false,
        });
        setShowForm(false);
      } else {
        const error = await res.json();
        alert(`Ошибка: ${(error as { error?: string }).error}`);
      }
    } catch (error) {
      console.error("Failed to create expert:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить эксперта?")) return;

    try {
      await fetch(`/api/experts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await loadExperts();
    } catch (error) {
      console.error("Failed to delete expert:", error);
    }
  };

  const handleAddPublic = async (id: string) => {
    try {
      await fetch(`/api/experts/public/${id}`, {
        method: "POST",
        credentials: "include",
      });
      await loadExperts();
    } catch (error) {
      console.error("Failed to add expert:", error);
    }
  };

  const handleRemovePublic = async (id: string) => {
    try {
      await fetch(`/api/experts/public/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await loadExperts();
    } catch (error) {
      console.error("Failed to remove expert:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="h-full max-h-screen w-full max-w-3xl flex flex-col rounded-lg bg-white dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-xl font-bold">Мои эксперты</h2>
        </div>

        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setTab("mine")}
            className={`flex-1 px-6 py-3 font-medium ${
              tab === "mine"
                ? "border-b-2 border-black dark:border-white"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Мои
          </button>
          <button
            onClick={() => setTab("available")}
            className={`flex-1 px-6 py-3 font-medium ${
              tab === "available"
                ? "border-b-2 border-black dark:border-white"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Доступные
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === "mine" && (
            <div className="space-y-3">
              {loading && <p className="text-sm text-zinc-500">Загрузка...</p>}
              {myExperts.map((e) => (
                <div
                  key={e.id}
                  className="flex justify-between rounded border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {e.icon} {e.name}
                    </p>
                    {e.isPublic && (
                      <p className="text-xs text-green-600">✓ Публичный</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="text-sm text-red-600"
                  >
                    Удалить
                  </button>
                </div>
              ))}

              {showForm && (
                <div className="space-y-2 rounded border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Имя"
                    maxLength={50}
                    className="w-full rounded border px-2 py-1 dark:bg-zinc-900 dark:text-white"
                  />
                  <textarea
                    value={formData.systemPrompt}
                    onChange={(e) =>
                      setFormData({ ...formData, systemPrompt: e.target.value })
                    }
                    placeholder="Промпт"
                    maxLength={5000}
                    rows={3}
                    className="w-full rounded border px-2 py-1 dark:bg-zinc-900 dark:text-white"
                  />
                  <label className="flex gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) =>
                        setFormData({ ...formData, isPublic: e.target.checked })
                      }
                    />
                    <span className="text-sm">Доступен другим</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreate}
                      className="flex-1 rounded bg-black px-2 py-1 text-white"
                    >
                      Создать
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      className="flex-1 rounded border px-2 py-1"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}

              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full rounded bg-black px-3 py-2 text-white"
                >
                  + Новый эксперт
                </button>
              )}
            </div>
          )}

          {tab === "available" && (
            <div className="space-y-3">
              {loading && <p className="text-sm text-zinc-500">Загрузка...</p>}
              {publicExperts.map((e) => {
                const isAdded = myExperts.some((m) => m.id === e.id);
                return (
                  <div
                    key={e.id}
                    className="flex justify-between rounded border border-zinc-200 p-3 dark:border-zinc-800"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {e.icon} {e.name}
                      </p>
                    </div>
                    {isAdded ? (
                      <button
                        onClick={() => handleRemovePublic(e.id)}
                        className="text-sm text-red-600"
                      >
                        Удалить
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddPublic(e.id)}
                        className="text-sm text-green-600"
                      >
                        + Добавить
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <button onClick={onClose} className="w-full rounded border px-3 py-2">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
