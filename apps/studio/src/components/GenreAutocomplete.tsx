"use client";

import { useState, useEffect, useRef } from "react";
import { GENRES } from "@/lib/genres";

type GenreAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function GenreAutocomplete({
  value,
  onChange,
  placeholder = "Выберите или введите жанр...",
}: GenreAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [genres, setGenres] = useState<string[]>([...GENRES]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch genres from API on mount, fall back to local GENRES on error
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch("/api/genres");
        if (!response.ok) {
          throw new Error("API request failed");
        }
        const data = (await response.json()) as {
          ok: boolean;
          genres: string[];
        };
        if (data.ok && Array.isArray(data.genres)) {
          setGenres(data.genres);
        }
      } catch {
        // Silently fall back to local GENRES (already set in useState)
      }
    };

    fetchGenres();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute filtered genres on the fly (not in state)
  const filteredGenres = genres.filter((genre) =>
    genre.toLowerCase().includes(value.toLowerCase()),
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
    setIsOpen(true);
  }

  function handleSelectGenre(genre: string) {
    onChange(genre);
    setIsOpen(false);
  }

  function handleInputFocus() {
    setIsOpen(true);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown" && filteredGenres.length > 0) {
      e.preventDefault();
      // Focus first item in dropdown if needed
      const items = containerRef.current?.querySelectorAll("[data-genre-item]");
      if (items && items.length > 0) {
        (items[0] as HTMLElement).focus();
      }
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-500"
        autoComplete="off"
      />

      {isOpen && filteredGenres.length > 0 && (
        <ul className="absolute top-full z-50 mt-1 w-full rounded-md border border-zinc-300 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {filteredGenres.map((genre) => (
            <li key={genre}>
              <button
                data-genre-item
                type="button"
                onClick={() => handleSelectGenre(genre)}
                className="w-full px-3 py-2 text-left text-sm text-black transition-colors hover:bg-zinc-100 dark:text-white dark:hover:bg-zinc-800"
              >
                {genre}
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && value.length > 0 && filteredGenres.length === 0 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 text-center text-sm text-zinc-500 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          Нет совпадений. Можно ввести своё значение.
        </div>
      )}

      {filteredGenres.length === 0 && value.length === 0 && isOpen && (
        <ul className="absolute top-full z-50 mt-1 w-full rounded-md border border-zinc-300 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {genres.slice(0, 10).map((genre) => (
            <li key={genre}>
              <button
                data-genre-item
                type="button"
                onClick={() => handleSelectGenre(genre)}
                className="w-full px-3 py-2 text-left text-sm text-black transition-colors hover:bg-zinc-100 dark:text-white dark:hover:bg-zinc-800"
              >
                {genre}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
