type HeaderProps = {
  onNewBook: () => void;
};

export function Header({ onNewBook }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-black">
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
          Literary Studio
        </span>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Untitled Book
        </span>
      </div>
      <button
        onClick={onNewBook}
        className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        New Book
      </button>
    </header>
  );
}
