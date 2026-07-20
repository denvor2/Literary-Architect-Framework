"use client";

import { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { useLocaleContext } from "@/context/LocaleContext";
import { Wand2, Shuffle, Eye, AlignLeft } from "lucide-react";
import type { Scene } from "@/domain/model";

type CommandType = "rewrite" | "continue" | "show_tell" | "shorten";

interface AIToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  scene?: Scene | null;
  onCommand: (command: CommandType, customText: string) => void;
}

export function AIToolsPanel({
  isOpen,
  onClose,
  scene,
  onCommand,
}: AIToolsPanelProps) {
  const { t } = useLocaleContext();
  const [customText, setCustomText] = useState("");

  const handleCommand = (command: CommandType) => {
    onCommand(command, customText);
    setCustomText("");
    onClose();
  };

  const sceneTitle = scene?.title || "Сцена";

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`AI-инструменты · ${sceneTitle}`}
      showDragHandle={true}
    >
      <div className="flex flex-col gap-4">
        {/* Grid of AI Commands */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleCommand("rewrite")}
            className="flex flex-col items-center gap-2 rounded-lg border border-zinc-300 bg-white p-3 text-black transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
          >
            <Wand2 className="h-5 w-5" />
            <span className="text-xs font-medium text-center">
              {t("ai_tools.rewrite") || "Переписать"}
            </span>
          </button>

          <button
            onClick={() => handleCommand("continue")}
            className="flex flex-col items-center gap-2 rounded-lg border border-zinc-300 bg-white p-3 text-black transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
          >
            <Shuffle className="h-5 w-5" />
            <span className="text-xs font-medium text-center">
              {t("ai_tools.continue") || "Продолжить"}
            </span>
          </button>

          <button
            onClick={() => handleCommand("show_tell")}
            className="flex flex-col items-center gap-2 rounded-lg border border-zinc-300 bg-white p-3 text-black transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
          >
            <Eye className="h-5 w-5" />
            <span className="text-xs font-medium text-center">
              {t("ai_tools.show_tell") || "Показать vs рассказать"}
            </span>
          </button>

          <button
            onClick={() => handleCommand("shorten")}
            className="flex flex-col items-center gap-2 rounded-lg border border-zinc-300 bg-white p-3 text-black transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
          >
            <AlignLeft className="h-5 w-5" />
            <span className="text-xs font-medium text-center">
              {t("ai_tools.shorten") || "Сократить"}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

        {/* Custom Instructions Textarea */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-black dark:text-white">
            {t("ai_tools.custom_instructions") ||
              "Дополнительные инструкции (опционально)"}
          </label>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder={
              t("ai_tools.custom_placeholder") || "Что слушать в этой сцене?"
            }
            className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm text-black placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-600"
            style={{ minHeight: "60px" }}
          />
        </div>

        {/* Apply Button */}
        <button
          onClick={() => handleCommand("rewrite")}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          {t("ai_tools.apply") || "Применить к выделению"}
        </button>
      </div>
    </BottomSheet>
  );
}
