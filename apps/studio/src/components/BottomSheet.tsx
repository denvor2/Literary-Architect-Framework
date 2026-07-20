"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showDragHandle?: boolean;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  showDragHandle = true,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll when sheet is open
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-49 bg-black/45"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-50 w-full rounded-t-2xl border-t border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          maxWidth: "500px",
          marginLeft: "auto",
          marginRight: "auto",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        {/* Drag Handle */}
        {showDragHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1 w-9 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-black dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-4 py-4">{children}</div>
      </div>
    </>
  );
}
