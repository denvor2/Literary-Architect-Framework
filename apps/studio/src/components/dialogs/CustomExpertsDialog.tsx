"use client";

import { useState, useEffect, useRef } from "react";
import type { CustomExpert, PublicExpert } from "@/generated/prisma/client";

interface CustomExpertsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingExpertId?: string; // ID эксперта для редактирования
}

type Expert = CustomExpert & { isOwn?: boolean };

export function CustomExpertsDialog({
  isOpen,
  onClose,
  editingExpertId,
}: CustomExpertsDialogProps) {
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

  const hasLoadedRef = useRef(false);

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

  useEffect(() => {
    if (isOpen && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadExperts();
    } else if (!isOpen) {
      hasLoadedRef.current = false; // Сбросить флаг при закрытии
    }
  }, [isOpen]);

  // Отдельный эффект для обработки редактирования
  useEffect(() => {
    if (isOpen && editingExpertId) {
      const expert = myExperts.find((e) => e.id === editingExpertId);
      if (expert) {
        setFormData({
          name: expert.name,
          systemPrompt: expert.systemPrompt,
          typicalRequests: expert.typicalRequests || [""],
          icon: expert.icon,
          isPublic: expert.isPublic,
        });
        setShowForm(true);
      }
    } else if (isOpen && !editingExpertId) {
      setShowForm(false);
      setFormData({
        name: "",
        systemPrompt: "",
        typicalRequests: [""],
        icon: "🤖",
        isPublic: false,
      });
    }
  }, [isOpen, editingExpertId, myExperts]);

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.systemPrompt.trim()) {
      alert("Заполните имя и промпт");
      return;
    }

    try {
      const isEditing = !!editingExpertId;
      const url = isEditing ? `/api/experts/${editingExpertId}` : "/api/experts";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
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
        if (isEditing) {
          onClose(); // Закрыть диалог после редактирования
        }
      } else {
        const error = await res.json();
        alert(`Ошибка: ${(error as { error?: string }).error}`);
      }
    } catch (error) {
      console.error("Failed to save expert:", error);
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
                <div className="space-y-3 rounded border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                  {/* Иконка и имя */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) =>
                        setFormData({ ...formData, icon: e.target.value.slice(0, 2) })
                      }
                      placeholder="🤖"
                      maxLength={2}
                      className="w-12 rounded border px-2 py-1 text-center dark:bg-zinc-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Имя эксперта (напр. Эксперт по боевикам)"
                      maxLength={50}
                      className="flex-1 rounded border px-2 py-1 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>

                  {/* Промпт с примером */}
                  <div>
                    <label className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Системный промпт
                    </label>
                    <textarea
                      value={formData.systemPrompt}
                      onChange={(e) =>
                        setFormData({ ...formData, systemPrompt: e.target.value })
                      }
                      placeholder={`Пример хорошего промпта:

Ты опытный редактор боевиков с 10-летним опытом. Твоя роль — улучшать боевые сцены, делая их более захватывающими и реалистичными. Проверь пунктуацию, логику развития событий и темп действия.`}
                      maxLength={5000}
                      rows={4}
                      className="w-full rounded border px-2 py-1 text-xs dark:bg-zinc-900 dark:text-white"
                    />
                  </div>

                  {/* Типовые запросы */}
                  <div>
                    <label className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Типовые запросы (10-200 символов)
                    </label>
                    <div className="space-y-1">
                      {formData.typicalRequests.map((request, idx) => (
                        <div key={idx} className="flex gap-1">
                          <input
                            type="text"
                            value={request}
                            onChange={(e) => {
                              const newRequests = [...formData.typicalRequests];
                              newRequests[idx] = e.target.value;
                              setFormData({ ...formData, typicalRequests: newRequests });
                            }}
                            placeholder="напр. Улучшить боевую сцену"
                            maxLength={200}
                            className="flex-1 rounded border px-2 py-1 text-xs dark:bg-zinc-900 dark:text-white"
                          />
                          <button
                            onClick={() => {
                              const newRequests = formData.typicalRequests.filter(
                                (_, i) => i !== idx
                              );
                              setFormData({ ...formData, typicalRequests: newRequests });
                            }}
                            className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {formData.typicalRequests.length < 10 && (
                        <button
                          onClick={() => {
                            setFormData({
                              ...formData,
                              typicalRequests: [...formData.typicalRequests, ""],
                            });
                          }}
                          className="w-full rounded border border-dashed border-zinc-300 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                        >
                          + Добавить
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Видимость и кнопки */}
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
                      className="flex-1 rounded bg-black px-2 py-1 text-white dark:bg-white dark:text-black"
                    >
                      {formData.name ? "Сохранить" : "Создать"}
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
