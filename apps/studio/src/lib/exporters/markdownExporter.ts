import JSZip from "jszip";
import type { Book, Chapter, Character, Idea, Series } from "@/domain/model";

/**
 * Slugify a string for use in filenames.
 * Converts spaces to hyphens, removes special characters, converts to lowercase.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Pad chapter/scene order numbers with leading zeros.
 */
function padOrder(order: number): string {
  return String(order).padStart(2, "0");
}

/**
 * Generate README.md with book metadata and summary.
 */
function generateREADME(series: Series | null, book: Book): string {
  const wordCount = calculateWordCount(book);
  const sceneCount = book.chapters.reduce(
    (sum, ch) => sum + ch.scenes.length,
    0,
  );

  let content = `# ${book.title}\n\n`;

  if (series) {
    content += `**Series:** ${series.title}\n\n`;
  }

  if (book.genre) {
    content += `**Genre:** ${book.genre}\n\n`;
  }

  if (book.language) {
    content += `**Language:** ${book.language}\n\n`;
  }

  if (book.premise) {
    content += `## Premise\n\n${book.premise}\n\n`;
  }

  if (book.shortAnnotation) {
    content += `## Short Annotation\n\n${book.shortAnnotation}\n\n`;
  }

  if (book.fullAnnotation) {
    content += `## Full Annotation\n\n${book.fullAnnotation}\n\n`;
  }

  // Statistics
  content += `## Statistics\n\n`;
  content += `- **Chapters:** ${book.chapters.length}\n`;
  content += `- **Scenes:** ${sceneCount}\n`;
  content += `- **Characters:** ${book.characters.length}\n`;
  content += `- **Ideas/Notes:** ${book.ideas.length}\n`;
  content += `- **Estimated Word Count:** ${wordCount.toLocaleString()}\n`;

  if (book.tags && book.tags.length > 0) {
    content += `\n## Tags\n\n`;
    content += book.tags.map((tag) => `- ${tag}`).join("\n");
    content += "\n";
  }

  return content;
}

/**
 * Generate Chapters.md with structure outline.
 */
function generateChaptersStructure(book: Book): string {
  let content = `# Book Structure: ${book.title}\n\n`;

  const chapters = Array.from(book.chapters);
  chapters.forEach((chapter, chapterIndex) => {
    const chapterOrder = chapterIndex + 1;
    content += `## ${padOrder(chapterOrder)}. ${chapter.title}`;
    if (chapter.subtitle) {
      content += ` — ${chapter.subtitle}`;
    }
    content += "\n\n";

    const scenes = Array.from(chapter.scenes);
    if (scenes.length > 0) {
      scenes.forEach((scene, sceneIndex) => {
        content += `- **${padOrder(sceneIndex + 1)}. ${scene.title}**`;
        const sceneWordCount = (scene.text.match(/\b\w+\b/g) || []).length;
        content += ` (${sceneWordCount} words)\n`;
      });
    } else {
      content += "  (No scenes)\n";
    }
    content += "\n";
  });

  return content;
}

/**
 * Generate a single chapter in Markdown format.
 */
function generateChapterMarkdown(
  chapter: Chapter,
  chapterIndex: number,
): string {
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

/**
 * Generate Characters/Index.md with list of all characters.
 */
function generateCharacterIndex(characters: readonly Character[]): string {
  let content = `# Characters\n\n`;

  const chars = Array.from(characters);
  if (chars.length === 0) {
    content += `No characters defined.\n`;
    return content;
  }

  chars.forEach((character) => {
    content += `## [${character.name}](#${slugify(character.name)})\n\n`;
    if (character.description) {
      content += `${character.description}\n\n`;
    }
  });

  return content;
}

/**
 * Generate a single character profile in Markdown format.
 */
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

/**
 * Generate Ideas/Active.md with all ideas.
 */
function generateIdeasMarkdown(ideas: readonly Idea[]): string {
  let content = `# Active Ideas & Notes\n\n`;

  const ideaList = Array.from(ideas);
  if (ideaList.length === 0) {
    content += `No ideas recorded.\n`;
    return content;
  }

  ideaList.forEach((idea) => {
    const date = new Date(idea.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    content += `## ${date}\n\n${idea.text}\n\n`;
  });

  return content;
}

/**
 * Calculate total word count for a book.
 */
function calculateWordCount(book: Book): number {
  let totalWords = 0;
  for (const chapter of book.chapters) {
    for (const scene of chapter.scenes) {
      const words = (scene.text.match(/\b\w+\b/g) || []).length;
      totalWords += words;
    }
  }
  return totalWords;
}

/**
 * Generate a Markdown ZIP archive for the given book.
 * Returns a JSZip instance that can be converted to Blob via generateAsync().
 */
export function generateMarkdownZip(series: Series | null, book: Book): JSZip {
  const zip = new JSZip();

  // README.md — book metadata and summary
  zip.file("README.md", generateREADME(series, book));

  // 00_Structure folder
  const structureFolder = zip.folder("00_Structure");
  if (structureFolder) {
    structureFolder.file("Chapters.md", generateChaptersStructure(book));
  }

  // 01_Chapters folder — full chapter text
  const chaptersFolder = zip.folder("01_Chapters");
  if (chaptersFolder) {
    const chapters = Array.from(book.chapters);
    chapters.forEach((chapter, chapterIndex) => {
      const filename = `Chapter-${padOrder(chapterIndex + 1)}-${slugify(
        chapter.title,
      )}.md`;
      chaptersFolder.file(
        filename,
        generateChapterMarkdown(chapter, chapterIndex),
      );
    });
  }

  // Characters folder
  const charactersFolder = zip.folder("Characters");
  if (charactersFolder) {
    charactersFolder.file("Index.md", generateCharacterIndex(book.characters));
    const characters = Array.from(book.characters);
    characters.forEach((character) => {
      const filename = `${character.name.replace(/[/\\]/g, "-")}.md`;
      charactersFolder.file(filename, generateCharacterMarkdown(character));
    });
  }

  // Ideas folder
  const ideasFolder = zip.folder("Ideas");
  if (ideasFolder) {
    ideasFolder.file("Active.md", generateIdeasMarkdown(book.ideas));
  }

  return zip;
}
