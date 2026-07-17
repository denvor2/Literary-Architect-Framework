import JSZip from "jszip";
import type { Book, Series } from "@/domain/model";

export interface ImportResult {
  success: boolean;
  book?: Book;
  series?: Series | null;
  errors: string[];
  warnings: string[];
}

interface HybridMetadata {
  version: string;
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

function validateMetadata(metadata: unknown): metadata is HybridMetadata {
  if (!metadata || typeof metadata !== "object") return false;

  const m = metadata as Record<string, unknown>;
  return (
    typeof m.version === "string" &&
    typeof m.exportDate === "string" &&
    typeof m.book === "object" &&
    typeof m.structure === "object"
  );
}

function validateBook(book: unknown): book is Book {
  if (!book || typeof book !== "object") return false;

  const b = book as Record<string, unknown>;
  return (
    typeof b.id === "string" &&
    typeof b.title === "string" &&
    Array.isArray(b.chapters) &&
    Array.isArray(b.characters) &&
    Array.isArray(b.ideas)
  );
}

export async function importHybridArchive(
  arrayBuffer: ArrayBuffer,
): Promise<ImportResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Parse ZIP archive
    const zip = new JSZip();
    await zip.loadAsync(arrayBuffer);

    // Read and validate metadata.json
    const metadataFile = zip.file("metadata.json");
    if (!metadataFile) {
      return {
        success: false,
        errors: ["metadata.json not found in archive"],
        warnings: [],
      };
    }

    let metadata: HybridMetadata;
    try {
      const metadataContent = await metadataFile.async("text");
      const parsed = JSON.parse(metadataContent);
      if (!validateMetadata(parsed)) {
        return {
          success: false,
          errors: ["metadata.json validation failed"],
          warnings: [],
        };
      }
      metadata = parsed;
    } catch (err) {
      return {
        success: false,
        errors: [
          `Failed to parse metadata.json: ${err instanceof Error ? err.message : "Unknown error"}`,
        ],
        warnings: [],
      };
    }

    // Read book.json
    const bookFile = zip.file("book.json");
    if (!bookFile) {
      return {
        success: false,
        errors: ["book.json not found in archive"],
        warnings: [],
      };
    }

    let book: Book;
    try {
      const bookContent = await bookFile.async("text");
      const parsed = JSON.parse(bookContent);
      if (!validateBook(parsed)) {
        return {
          success: false,
          errors: ["book.json validation failed"],
          warnings: [],
        };
      }
      book = parsed as Book;
    } catch (err) {
      return {
        success: false,
        errors: [
          `Failed to parse book.json: ${err instanceof Error ? err.message : "Unknown error"}`,
        ],
        warnings: [],
      };
    }

    // Validate structure matches metadata
    if (book.chapters.length !== metadata.structure.chapters.length) {
      warnings.push(
        `Chapter count mismatch: metadata says ${metadata.structure.chapters.length}, but book.json has ${book.chapters.length}`,
      );
    }

    if (book.characters.length !== metadata.structure.characterCount) {
      warnings.push(
        `Character count mismatch: metadata says ${metadata.structure.characterCount}, but book.json has ${book.characters.length}`,
      );
    }

    if (book.ideas.length !== metadata.structure.ideaCount) {
      warnings.push(
        `Idea count mismatch: metadata says ${metadata.structure.ideaCount}, but book.json has ${book.ideas.length}`,
      );
    }

    // Validate total scene count
    const totalScenes = book.chapters.reduce(
      (sum, ch) => sum + ch.scenes.length,
      0,
    );
    const expectedScenes = metadata.structure.chapters.reduce(
      (sum, ch) => sum + ch.sceneCount,
      0,
    );
    if (totalScenes !== expectedScenes) {
      warnings.push(
        `Scene count mismatch: metadata expects ${expectedScenes}, but book.json has ${totalScenes}`,
      );
    }

    // Convert chapters to proper array format if needed
    const chapters = Array.isArray(book.chapters) ? book.chapters : [];
    const processedBook: Book = {
      ...book,
      chapters: chapters.map((ch) => ({
        ...ch,
        scenes: Array.isArray(ch.scenes) ? ch.scenes : [],
      })),
      characters: Array.isArray(book.characters) ? book.characters : [],
      ideas: Array.isArray(book.ideas) ? book.ideas : [],
    };

    // Series is optional (not returned, just noted for reference)
    const series: Series | null = null;
    if (metadata.series) {
      console.log("[IMPORT] Archive references series:", metadata.series);
    }

    return {
      success: true,
      book: processedBook,
      series,
      errors,
      warnings,
    };
  } catch (err) {
    return {
      success: false,
      errors: [
        `Failed to import archive: ${err instanceof Error ? err.message : "Unknown error"}`,
      ],
      warnings,
    };
  }
}

export function validateImportResult(result: ImportResult): {
  isValid: boolean;
  message: string;
} {
  if (!result.success) {
    return {
      isValid: false,
      message: `Import failed: ${result.errors.join("; ")}`,
    };
  }

  if (!result.book) {
    return {
      isValid: false,
      message: "No book data in archive",
    };
  }

  if (result.book.chapters.length === 0) {
    return {
      isValid: false,
      message: "Book has no chapters",
    };
  }

  if (result.warnings.length > 0) {
    return {
      isValid: true,
      message: `Import successful with warnings: ${result.warnings.join("; ")}`,
    };
  }

  return {
    isValid: true,
    message: "Import successful",
  };
}
