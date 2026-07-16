import JSZip from "jszip";
import type { Book, Chapter, Character, Idea, Series } from "@/domain/model";

interface HybridMetadata {
  version: "1.0";
  exportDate: string;
  book: {
    id: string;
    title: string;
    genre?: string;
    language?: string;
    premise?: string;
    shortAnnotation?: string;
    fullAnnotation?: string;
    tags?: readonly string[];
    seriesId?: string;
  };
  series?: {
    id: string;
    title: string;
  };
  structure: {
    chapters: Array<{
      id: string;
      title: string;
      subtitle?: string;
      order: number;
      sceneCount: number;
    }>;
    characterCount: number;
    ideaCount: number;
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function padOrder(order: number): string {
  return String(order).padStart(2, "0");
}

function generateChapterMarkdown(chapter: Chapter, chapterIndex: number): string {
  const chapterOrder = chapterIndex + 1;
  let content = `# Chapter ${padOrder(chapterOrder)}: ${chapter.title}\n\n`;

  if (chapter.subtitle) {
    content += `*${chapter.subtitle}*\n\n`;
  }

  const scenes = Array.from(chapter.scenes);
  scenes.forEach((scene) => {
    content += `## ${scene.title}\n\n`;
    content += scene.text;
    content += "\n\n---\n\n";
  });

  return content;
}

function generateCharacterMarkdown(character: Character): string {
  let content = `# ${character.name}\n\n`;

  if (character.photoUrl) {
    content += `![${character.name}](${character.photoUrl})\n\n`;
  }

  if (character.description) {
    content += `## Description\n\n${character.description}\n\n`;
  }

  if (character.notes) {
    content += `## Notes\n\n${character.notes}\n\n`;
  }

  return content;
}

function generateIdeaMarkdown(idea: Idea): string {
  const date = new Date(idea.createdAt).toISOString().split("T")[0];
  let content = `# Idea — ${date}\n\n`;
  content += idea.text;
  return content;
}

function generateHybridMetadata(
  series: Series | null,
  book: Book,
): HybridMetadata {
  const sceneCount = book.chapters.reduce((sum, ch) => sum + ch.scenes.length, 0);

  return {
    version: "1.0",
    exportDate: new Date().toISOString(),
    book: {
      id: book.id,
      title: book.title,
      genre: book.genre,
      language: book.language,
      premise: book.premise,
      shortAnnotation: book.shortAnnotation,
      fullAnnotation: book.fullAnnotation,
      tags: book.tags,
      seriesId: book.seriesId,
    },
    series: series
      ? {
          id: series.id,
          title: series.title,
        }
      : undefined,
    structure: {
      chapters: book.chapters.map((ch, idx) => ({
        id: ch.id,
        title: ch.title,
        subtitle: ch.subtitle,
        order: idx + 1,
        sceneCount: ch.scenes.length,
      })),
      characterCount: book.characters.length,
      ideaCount: book.ideas.length,
    },
  };
}

export function generateHybridArchive(
  series: Series | null,
  book: Book,
): JSZip {
  const zip = new JSZip();

  // metadata.json — структура и метаданные для импорта
  const metadata = generateHybridMetadata(series, book);
  zip.file("metadata.json", JSON.stringify(metadata, null, 2));

  // book.json — полные данные книги
  const bookData = {
    ...book,
    chapters: book.chapters.map((ch) => ({
      ...ch,
      scenes: Array.from(ch.scenes),
    })),
    characters: Array.from(book.characters),
    ideas: Array.from(book.ideas),
  };
  zip.file("book.json", JSON.stringify(bookData, null, 2));

  // chapters/ — MD файлы глав
  const chaptersFolder = zip.folder("chapters");
  if (chaptersFolder) {
    const chapters = Array.from(book.chapters);
    chapters.forEach((chapter, chapterIndex) => {
      const filename = `${padOrder(chapterIndex + 1)}-${slugify(
        chapter.title,
      )}.md`;
      chaptersFolder.file(
        filename,
        generateChapterMarkdown(chapter, chapterIndex),
      );
    });
  }

  // characters/ — MD файлы персонажей
  const charactersFolder = zip.folder("characters");
  if (charactersFolder) {
    const characters = Array.from(book.characters);
    characters.forEach((character) => {
      const filename = `${slugify(character.name)}.md`;
      charactersFolder.file(filename, generateCharacterMarkdown(character));
    });
  }

  // ideas/ — MD файлы идей
  const ideasFolder = zip.folder("ideas");
  if (ideasFolder) {
    const ideas = Array.from(book.ideas);
    ideas.forEach((idea, index) => {
      const date = new Date(idea.createdAt).toISOString().split("T")[0];
      const filename = `${padOrder(index + 1)}-${date}.md`;
      ideasFolder.file(filename, generateIdeaMarkdown(idea));
    });
  }

  return zip;
}
