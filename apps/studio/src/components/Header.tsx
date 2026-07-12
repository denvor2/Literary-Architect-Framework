import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Search, LogOut } from "lucide-react";
import type { Book, Chapter, Character, Idea } from "@/domain/model";
import type { User } from "@/hooks/useAuthController";
import {
  SEARCH_MIN_QUERY_LENGTH,
  searchWorkspace,
  type ChapterOrSceneSearchMatch,
} from "@/domain/search";
import { useBillingController } from "@/billing";
import { CurrentPlanDisplay } from "./CurrentPlanDisplay";
import { PlanSelectionDialog } from "./PlanSelectionDialog";

// Sprint-25-Step-01: chrome-only app menu bar — Product Owner explicitly
// confirmed (twice) this is a placeholder for a future full menu (see
// docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md section 11, tentatively
// Sprint 30). Файл/Правка/Вид each open a dropdown with a single disabled
// "Скоро" item — no real Open/Save/Edit/View behavior exists to wire them
// to. The language switcher and "Войти" are the same kind of inert visual
// placeholder (no i18n infrastructure, no auth — auth is Sprint 29).
type MenuKey = "file" | "edit" | "view" | "help" | "about";

const MENUS: ReadonlyArray<{ key: MenuKey; label: string }> = [
  { key: "file", label: "Файл" },
  { key: "edit", label: "Правка" },
  { key: "view", label: "Вид" },
  { key: "help", label: "Руководство" },
  { key: "about", label: "О программе" },
];

// Sprint-25-Step-06: global search over the workspace's books plus the
// active book's chapters/scenes/characters/ideas (see domain/search.ts for
// the actual matching logic — this component only owns query/checkbox/open
// state and renders the results).
type HeaderProps = {
  books?: readonly Book[];
  activeBookId?: string | null;
  chapters?: readonly Chapter[];
  characters?: readonly Character[];
  ideas?: readonly Idea[];
  onSelectBook?: (bookId: string) => void;
  onSelectCharacter?: (characterId: string) => void;
  onSelectSearchMatch?: (chapterId: string, sceneId?: string) => void;
  onSelectIdeaMatch?: (ideaId: string) => void;
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenLogin?: () => void;
};

function SearchResultsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-zinc-100 py-1 last:border-b-0 dark:border-zinc-900">
      <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
        {title}
      </div>
      {children}
    </div>
  );
}

function SearchResultButton({
  label,
  snippet,
  isActive,
  onClick,
}: {
  label: string;
  snippet?: string;
  isActive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full flex-col items-start gap-0.5 px-3 py-1.5 text-left text-sm transition-colors ${
        isActive
          ? "bg-zinc-100 text-black dark:bg-zinc-900 dark:text-white"
          : "text-black hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900"
      }`}
    >
      <span>{label || "Без названия"}</span>
      {snippet && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {snippet}
        </span>
      )}
    </button>
  );
}

function chapterOrSceneKey(match: ChapterOrSceneSearchMatch): string {
  return match.sceneId
    ? `scene-${match.sceneId}`
    : `chapter-${match.chapterId}`;
}

export function Header({
  books = [],
  activeBookId,
  chapters = [],
  characters = [],
  ideas = [],
  onSelectBook,
  onSelectCharacter,
  onSelectSearchMatch,
  onSelectIdeaMatch,
  currentUser,
  onLogout,
  onOpenLogin,
}: HeaderProps) {
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Billing state
  const billingController = useBillingController();
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuBarRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search — ephemeral local state (query/open/checkbox), not part of
  // Workspace, not persisted. See domain/search.ts for the pure matching
  // logic this only calls into.
  const [query, setQuery] = useState("");
  const [mainTextOnly, setMainTextOnly] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const trimmedLength = query.trim().length;
  const hasEnoughQuery = trimmedLength >= SEARCH_MIN_QUERY_LENGTH;

  const results = useMemo(
    () =>
      searchWorkspace({
        query,
        books,
        chapters,
        characters,
        ideas,
        mainTextOnly,
      }),
    [query, books, chapters, characters, ideas, mainTextOnly],
  );

  const hasAnyResults =
    results.books.length > 0 ||
    results.chaptersAndScenes.length > 0 ||
    results.characters.length > 0 ||
    results.ideas.length > 0;

  const showDropdown = isResultsOpen && hasEnoughQuery;

  // Click outside the search form closes the results dropdown — same
  // mousedown-listener pattern as the Файл/Правка/Вид menu bar above, kept
  // as a separate effect/ref (searchRef) rather than folded into
  // handleClickOutside, since the two dropdowns are unrelated UI.
  useEffect(() => {
    function handleClickOutsideSearch(event: MouseEvent) {
      if (!searchRef.current?.contains(event.target as Node)) {
        setIsResultsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsideSearch);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideSearch);
  }, []);

  // Escape closes the results dropdown; Ctrl/Cmd+K focuses the search
  // field — a trivial, optional shortcut per the Step Card's Rules ("включить,
  // только если реализация тривиальна").
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setIsResultsOpen(true);
      } else if (event.key === "Escape") {
        setIsResultsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function closeResults() {
    setIsResultsOpen(false);
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-black">
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
          Literary Studio
        </span>
      </div>

      <nav ref={menuBarRef} className="flex items-center gap-1">
        {MENUS.map((menu) => (
          <div key={menu.key} className="relative">
            <button
              onClick={() =>
                setOpenMenu((current) =>
                  current === menu.key ? null : menu.key,
                )
              }
              className="rounded-md px-2 py-1 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              {menu.label}
            </button>
            {openMenu === menu.key && (
              <div className="absolute left-0 top-full z-10 mt-1 min-w-32 rounded-md border border-zinc-200 bg-white py-1 shadow-md dark:border-zinc-800 dark:bg-zinc-950">
                <button
                  disabled
                  className="w-full cursor-not-allowed px-3 py-1.5 text-left text-sm text-zinc-400 dark:text-zinc-600"
                >
                  Скоро
                </button>
              </div>
            )}
          </div>
        ))}
      </nav>

      <div ref={searchRef} className="relative flex flex-col gap-1">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsResultsOpen(true);
            }}
            onFocus={() => {
              if (hasEnoughQuery) setIsResultsOpen(true);
            }}
            placeholder="Поиск по книге... (Ctrl+K)"
            className="w-64 rounded-md border border-zinc-300 bg-white px-3 py-1.5 pr-9 text-sm text-black outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-600"
          />
          <button
            type="button"
            onClick={() => {
              // Search icon click handler — currently visual affordance
              // If auto-search on input change is disabled in future, this can trigger search
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300"
            title="Поиск"
          >
            <Search size={16} />
          </button>
          {showDropdown && (
            <div className="absolute left-0 top-full z-20 mt-1 max-h-96 w-80 overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-md dark:border-zinc-800 dark:bg-zinc-950">
              {!hasAnyResults && (
                <p className="px-3 py-2 text-sm text-zinc-400 dark:text-zinc-600">
                  Ничего не найдено
                </p>
              )}
              {results.books.length > 0 && (
                <SearchResultsSection title="Книги">
                  {results.books.map((match) => (
                    <SearchResultButton
                      key={match.bookId}
                      label={match.title}
                      isActive={match.bookId === activeBookId}
                      onClick={() => {
                        onSelectBook?.(match.bookId);
                        closeResults();
                      }}
                    />
                  ))}
                </SearchResultsSection>
              )}
              {results.chaptersAndScenes.length > 0 && (
                <SearchResultsSection title="Главы и сцены">
                  {results.chaptersAndScenes.map((match) => (
                    <SearchResultButton
                      key={chapterOrSceneKey(match)}
                      label={match.label}
                      snippet={match.snippet}
                      onClick={() => {
                        onSelectSearchMatch?.(match.chapterId, match.sceneId);
                        closeResults();
                      }}
                    />
                  ))}
                </SearchResultsSection>
              )}
              {results.characters.length > 0 && (
                <SearchResultsSection title="Персонажи">
                  {results.characters.map((match) => (
                    <SearchResultButton
                      key={match.characterId}
                      label={match.label}
                      snippet={match.snippet}
                      onClick={() => {
                        onSelectCharacter?.(match.characterId);
                        closeResults();
                      }}
                    />
                  ))}
                </SearchResultsSection>
              )}
              {results.ideas.length > 0 && (
                <SearchResultsSection title="Идеи и заметки">
                  {results.ideas.map((match) => (
                    <SearchResultButton
                      key={match.ideaId}
                      label={match.snippet}
                      onClick={() => {
                        onSelectIdeaMatch?.(match.ideaId);
                        closeResults();
                      }}
                    />
                  ))}
                </SearchResultsSection>
              )}
            </div>
          )}
        </div>
        <label
          htmlFor="search-main-text-only"
          className="hidden select-none items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400"
        >
          <input
            id="search-main-text-only"
            type="checkbox"
            checked={mainTextOnly}
            onChange={(event) => setMainTextOnly(event.target.checked)}
            className="h-3.5 w-3.5"
          />
          Искать только в основном тексте
        </label>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <button
          disabled
          title="Переключение языка интерфейса — скоро"
          className="cursor-not-allowed rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-400 dark:border-zinc-700 dark:text-zinc-600"
        >
          RU
        </button>
        {currentUser ? (
          <div className="flex items-center gap-4">
            {billingController.currentPlan && (
              <CurrentPlanDisplay
                planName={billingController.currentPlan.name}
                daysUntilExpiry={billingController.daysUntilExpiry}
                isExpired={billingController.isExpired}
                tier={billingController.currentPlan.tier}
                onUpgradeClick={() => setIsPlanDialogOpen(true)}
              />
            )}
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {currentUser.email}
              </span>
              {currentUser.role === "admin" && (
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Admin
                </span>
              )}
            </div>
            <button
              onClick={onLogout}
              title="Выход"
              className="rounded-md border border-zinc-300 p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="rounded-md border border-zinc-300 px-3 py-1 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
          >
            Войти
          </button>
        )}
      </div>

      <PlanSelectionDialog
        isOpen={isPlanDialogOpen}
        onClose={() => setIsPlanDialogOpen(false)}
        currentPlanId={billingController.currentPlan?.id}
        onSelectPlan={billingController.selectPlan}
      />
    </header>
  );
}
