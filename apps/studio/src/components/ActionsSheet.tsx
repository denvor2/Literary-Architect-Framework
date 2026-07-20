"use client";

import { BottomSheet } from "./BottomSheet";
import { useLocaleContext } from "@/context/LocaleContext";
import type { Chapter, Scene } from "@/domain/model";
import { Pencil, Copy, ArrowUp, ArrowDown, Trash2 } from "lucide-react";

type ActionType =
  "rename" | "publish" | "move_up" | "move_down" | "delete" | "cancel";

interface ActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  type: "chapter" | "scene";
  data: Chapter | Scene;
  onAction: (action: ActionType, data: Chapter | Scene) => void;
}

export function ActionsSheet({
  isOpen,
  onClose,
  type,
  data,
  onAction,
}: ActionsSheetProps) {
  const { t } = useLocaleContext();

  const handleAction = (action: ActionType) => {
    if (action === "cancel") {
      onClose();
    } else {
      onAction(action, data);
      onClose();
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} showDragHandle={true}>
      <div className="flex flex-col gap-0">
        {/* Main Actions */}
        <button
          onClick={() => handleAction("rename")}
          className="flex items-center gap-3 px-4 py-3 text-left text-base text-black hover:bg-zinc-50 dark:text-white dark:hover:bg-zinc-900"
        >
          <Pencil className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          <span>
            {type === "chapter"
              ? t("actions.chapter_rename") || "Переименовать"
              : t("actions.scene_rename") || "Переименовать"}
          </span>
        </button>

        <button
          onClick={() => handleAction("publish")}
          className="flex items-center gap-3 px-4 py-3 text-left text-base text-black hover:bg-zinc-50 dark:text-white dark:hover:bg-zinc-900"
        >
          <Copy className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          <span>
            {type === "chapter"
              ? t("actions.chapter_publish") || "Опубликовать"
              : t("actions.scene_publish") || "Опубликовать"}
          </span>
        </button>

        <button
          onClick={() => handleAction("move_up")}
          className="flex items-center gap-3 px-4 py-3 text-left text-base text-black hover:bg-zinc-50 dark:text-white dark:hover:bg-zinc-900"
        >
          <ArrowUp className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          <span>
            {type === "chapter"
              ? t("actions.chapter_move_up") || "Переместить выше"
              : t("actions.scene_move_up") || "Переместить выше"}
          </span>
        </button>

        <button
          onClick={() => handleAction("move_down")}
          className="flex items-center gap-3 px-4 py-3 text-left text-base text-black hover:bg-zinc-50 dark:text-white dark:hover:bg-zinc-900"
        >
          <ArrowDown className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          <span>
            {type === "chapter"
              ? t("actions.chapter_move_down") || "Переместить ниже"
              : t("actions.scene_move_down") || "Переместить ниже"}
          </span>
        </button>

        {/* Divider */}
        <div className="my-2 h-px bg-zinc-200 dark:bg-zinc-800" />

        {/* Delete Action */}
        <button
          onClick={() => handleAction("delete")}
          className="flex items-center gap-3 px-4 py-3 text-left text-base text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
        >
          <Trash2 className="h-5 w-5" />
          <span>
            {type === "chapter"
              ? t("actions.chapter_delete") || "Удалить главу"
              : t("actions.scene_delete") || "Удалить сцену"}
          </span>
        </button>

        {/* Divider */}
        <div className="my-2 h-px bg-zinc-200 dark:bg-zinc-800" />

        {/* Cancel Button */}
        <button
          onClick={() => handleAction("cancel")}
          className="w-full rounded-lg bg-zinc-100 px-4 py-3 text-base font-medium text-black hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
        >
          {t("common.cancel") || "Отмена"}
        </button>
      </div>
    </BottomSheet>
  );
}
