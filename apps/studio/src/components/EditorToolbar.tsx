"use client";

import React from "react";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Quote,
  Search,
  Sparkles,
  MessageCircle,
} from "lucide-react";

interface EditorToolbarProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onBold?: () => void;
  onItalic?: () => void;
  onQuote?: () => void;
  onFind?: () => void;
  onOpenAITools?: () => void;
  onOpenAssistants?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

/**
 * Sprint-39-Step-05: Responsive editor toolbar with formatting buttons
 * - Horizontally scrollable on mobile (375px)
 * - All tap targets 44×44px minimum
 * - Icons 16-20px visual size
 * - Default color: --text-secondary
 * - AI icon: always --text-accent
 * - Disabled state: --text-muted, opacity-40
 */
export function EditorToolbar({
  onUndo,
  onRedo,
  onBold,
  onItalic,
  onQuote,
  onFind,
  onOpenAITools,
  onOpenAssistants,
  canUndo = false,
  canRedo = false,
}: EditorToolbarProps) {
  return (
    <div className="border-b border-zinc-200 bg-white px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-950 sm:px-3.5 sm:py-2">
      {/* Horizontally scrollable container for mobile */}
      <div className="flex overflow-x-auto">
        {/* Undo / Redo Group */}
        <div className="flex shrink-0 gap-1">
          <ToolbarButton
            icon={Undo2}
            onClick={onUndo}
            disabled={!canUndo}
            title="Отменить (Ctrl+Z)"
            ariaLabel="Undo"
          />
          <ToolbarButton
            icon={Redo2}
            onClick={onRedo}
            disabled={!canRedo}
            title="Повторить (Ctrl+Y)"
            ariaLabel="Redo"
          />
        </div>

        {/* Divider */}
        <div className="mx-1 h-5 w-px shrink-0 bg-zinc-300 dark:bg-zinc-700" />

        {/* Text Format Group */}
        <div className="flex shrink-0 gap-1">
          <ToolbarButton
            icon={Bold}
            onClick={onBold}
            title="Жирный (Ctrl+B)"
            ariaLabel="Bold"
          />
          <ToolbarButton
            icon={Italic}
            onClick={onItalic}
            title="Курсив (Ctrl+I)"
            ariaLabel="Italic"
          />
          <ToolbarButton
            icon={Quote}
            onClick={onQuote}
            title="Цитата"
            ariaLabel="Quote"
          />
        </div>

        {/* Divider */}
        <div className="mx-1 h-5 w-px shrink-0 bg-zinc-300 dark:bg-zinc-700" />

        {/* Find */}
        <div className="flex shrink-0">
          <ToolbarButton
            icon={Search}
            onClick={onFind}
            title="Поиск и замена (Ctrl+H)"
            ariaLabel="Find & Replace"
          />
        </div>

        {/* AI & Assistants Group */}
        <div className="flex shrink-0 gap-1">
          <ToolbarButton
            icon={Sparkles}
            onClick={onOpenAITools}
            title="AI инструменты"
            ariaLabel="AI Tools"
            isAccent
          />
          <ToolbarButton
            icon={MessageCircle}
            onClick={onOpenAssistants}
            title="Помощники"
            ariaLabel="Assistants"
          />
        </div>
      </div>
    </div>
  );
}

interface ToolbarButtonProps {
  icon: React.ComponentType<{ size: number; className?: string }>;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
  isAccent?: boolean;
}

/**
 * Individual toolbar button with 44×44px tap target
 * - Visual icon: 18px
 * - Padding: 6px 8px creates the 44×44 target with margin
 * - Default: --text-secondary
 * - Disabled: --text-muted, opacity-40
 * - AI icon: --text-accent (always prominent)
 */
function ToolbarButton({
  icon: Icon,
  onClick,
  disabled = false,
  title,
  ariaLabel,
  isAccent = false,
}: ToolbarButtonProps) {
  const baseColor = isAccent
    ? "text-blue-500 dark:text-blue-400"
    : "text-zinc-500 dark:text-zinc-400";
  const hoverColor = isAccent
    ? "hover:text-blue-600 dark:hover:text-blue-300"
    : "hover:text-zinc-700 dark:hover:text-zinc-200";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={`flex items-center justify-center rounded p-1.5 transition-colors ${
        disabled
          ? "cursor-not-allowed text-zinc-400 opacity-40 dark:text-zinc-600"
          : `${baseColor} ${hoverColor}`
      }`}
      // Ensure minimum 44×44px tap target (6px padding = 12px extra, 18px icon = 30px, add margin if needed)
      style={{ minWidth: "44px", minHeight: "44px" }}
    >
      <Icon size={18} className="shrink-0" />
    </button>
  );
}
