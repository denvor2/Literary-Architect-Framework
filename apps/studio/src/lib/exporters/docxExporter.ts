import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
} from "docx";
import type { Book, Chapter } from "@/domain/model";

/**
 * Parse markdown-style formatting in text.
 * Supports:
 * - **text** → bold
 * - *text* or _text_ → italic
 *
 * Returns array of TextRun objects with appropriate formatting.
 */
function parseFormattedText(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let currentPos = 0;

  // Regex to match **bold**, *italic*, or _italic_
  const formatRegex = /\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_/g;
  let match;

  while ((match = formatRegex.exec(text)) !== null) {
    // Add plain text before this match
    if (match.index > currentPos) {
      const plainText = text.substring(currentPos, match.index);
      runs.push(new TextRun({ text: plainText }));
    }

    // Add formatted text
    if (match[1]) {
      // **bold**
      runs.push(new TextRun({ text: match[1], bold: true }));
    } else if (match[2] || match[3]) {
      // *italic* or _italic_
      runs.push(new TextRun({ text: match[2] || match[3], italics: true }));
    }

    currentPos = formatRegex.lastIndex;
  }

  // Add remaining plain text
  if (currentPos < text.length) {
    const plainText = text.substring(currentPos);
    runs.push(new TextRun({ text: plainText }));
  }

  // If no formatting found, return single run with original text
  if (runs.length === 0) {
    runs.push(new TextRun({ text }));
  }

  return runs;
}

/**
 * Generate a Paragraph with formatted text.
 * If text is empty, returns an empty paragraph for spacing.
 */
function createFormattedParagraph(
  text: string,
  options?: {
    heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
  },
): Paragraph {
  if (!text) {
    return new Paragraph({ text: "" });
  }

  const runs = parseFormattedText(text);
  return new Paragraph({
    children: runs,
    heading: options?.heading,
    alignment: options?.alignment || AlignmentType.LEFT,
  });
}

/**
 * Generate title page with book metadata.
 */
function generateTitlePage(book: Book): Paragraph[] {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return [
    // Spacing before title
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),

    // Title
    new Paragraph({
      text: book.title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),

    // Genre (if available)
    ...(book.genre
      ? [
          new Paragraph({
            children: [new TextRun({ text: book.genre, italics: true })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
        ]
      : []),

    // Spacing
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),

    // Author
    new Paragraph({
      text: "Author: Anonymous",
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),

    // Date
    new Paragraph({
      text: dateStr,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),

    // Page break after title page
    new Paragraph({ pageBreakBefore: true, text: "" }),
  ];
}

/**
 * Generate table of contents.
 */
function generateTableOfContents(chapters: readonly Chapter[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      text: "Table of Contents",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  );

  chapters.forEach((chapter, index) => {
    const chapterNum = index + 1;
    paragraphs.push(
      new Paragraph({
        text: `Chapter ${chapterNum}: ${chapter.title}`,
        spacing: { after: 100 },
        indent: { left: 360 },
      }),
    );
  });

  paragraphs.push(new Paragraph({ pageBreakBefore: true, text: "" }));

  return paragraphs;
}

/**
 * Generate chapter sections with scenes and formatted text.
 */
function generateChapters(chapters: readonly Chapter[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  chapters.forEach((chapter, chapterIndex) => {
    const chapterNum = chapterIndex + 1;

    // Chapter heading
    paragraphs.push(
      new Paragraph({
        text: `Chapter ${chapterNum}: ${chapter.title}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 },
      }),
    );

    // Chapter subtitle (if available)
    if (chapter.subtitle) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: chapter.subtitle, italics: true })],
          spacing: { after: 200 },
        }),
      );
    }

    // Scenes
    chapter.scenes.forEach((scene) => {
      // Scene title
      paragraphs.push(
        new Paragraph({
          text: scene.title,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 100, after: 100 },
        }),
      );

      // Scene text (split into paragraphs by line breaks)
      const lines = scene.text.split("\n");
      lines.forEach((line) => {
        if (line.trim()) {
          paragraphs.push(createFormattedParagraph(line));
        } else {
          // Empty line creates paragraph break
          paragraphs.push(new Paragraph({ text: "" }));
        }
      });

      // Spacing after scene
      paragraphs.push(new Paragraph({ text: "" }));
    });

    // Page break between chapters (except after last chapter)
    if (chapterIndex < chapters.length - 1) {
      paragraphs.push(new Paragraph({ pageBreakBefore: true, text: "" }));
    }
  });

  return paragraphs;
}

/**
 * Generate character reference section.
 */
function generateCharacterReference(book: Book): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  if (!book.characters || book.characters.length === 0) {
    return paragraphs;
  }

  paragraphs.push(new Paragraph({ pageBreakBefore: true, text: "" }));

  paragraphs.push(
    new Paragraph({
      text: "Character Reference",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
  );

  book.characters.forEach((character) => {
    // Character name
    paragraphs.push(
      new Paragraph({
        text: character.name,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 100, after: 50 },
      }),
    );

    // Character description
    if (character.description) {
      paragraphs.push(
        createFormattedParagraph(character.description, {
          alignment: AlignmentType.LEFT,
        }),
      );
      paragraphs.push(new Paragraph({ text: "" }));
    }

    // Character notes
    if (character.notes) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: "Notes:", italics: true })],
          spacing: { before: 50, after: 50 },
        }),
      );
      paragraphs.push(
        createFormattedParagraph(character.notes, {
          alignment: AlignmentType.LEFT,
        }),
      );
      paragraphs.push(new Paragraph({ text: "" }));
    }
  });

  return paragraphs;
}

/**
 * Generate a complete DOCX document for the given book and chapters.
 * Returns a Buffer that can be sent as a file response.
 */
export async function generateDOCX(
  book: Book,
  chapters: readonly Chapter[] = [],
): Promise<Buffer> {
  const sections: Paragraph[] = [];

  // Add title page
  sections.push(...generateTitlePage(book));

  // Add table of contents
  const chaptersToUse = chapters.length > 0 ? chapters : book.chapters;
  sections.push(...generateTableOfContents(chaptersToUse));

  // Add chapters
  sections.push(...generateChapters(chaptersToUse));

  // Add character reference
  sections.push(...generateCharacterReference(book));

  // Create document
  const doc = new Document({
    sections: [
      {
        children: sections,
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
      },
    ],
  });

  // Convert to buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
