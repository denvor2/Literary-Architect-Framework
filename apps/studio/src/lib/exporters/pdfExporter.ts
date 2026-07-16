import PDFDocument from "pdfkit";
import type { Book, Chapter } from "@/domain/model";

type PDFDocumentType = InstanceType<typeof PDFDocument>;

interface PDFOptions {
  includeMetadata?: boolean;
  includeTableOfContents?: boolean;
  fontSize?: number;
  titleFontSize?: number;
}

function createPDFDocument(): PDFDocumentType {
  return new PDFDocument({
    bufferPages: true,
    size: "A4",
    margin: 50,
  });
}

function addTitle(doc: PDFDocumentType, title: string, fontSize = 24): void {
  doc.fontSize(fontSize).font("Helvetica-Bold").text(title, { align: "center" });
  doc.moveDown(0.5);
}

function addSubtitle(doc: PDFDocumentType, subtitle: string): void {
  doc
    .fontSize(14)
    .font("Helvetica-Oblique")
    .text(subtitle, { align: "center" });
  doc.moveDown(1);
}

function addMetadata(doc: PDFDocumentType, book: Book): void {
  doc.fontSize(10).font("Helvetica");

  if (book.genre) {
    doc.text(`Genre: ${book.genre}`);
  }

  if (book.language) {
    doc.text(`Language: ${book.language}`);
  }

  const wordCount = book.chapters.reduce((sum, ch) => {
    return (
      sum +
      ch.scenes.reduce((sceneSum, scene) => {
        return sceneSum + (scene.text.match(/\b\w+\b/g) || []).length;
      }, 0)
    );
  }, 0);

  const sceneCount = book.chapters.reduce((sum, ch) => sum + ch.scenes.length, 0);

  doc.text(`Chapters: ${book.chapters.length}`);
  doc.text(`Scenes: ${sceneCount}`);
  doc.text(`Characters: ${book.characters.length}`);
  doc.text(`Words: ${wordCount.toLocaleString()}`);

  if (book.tags && book.tags.length > 0) {
    doc.text(`Tags: ${Array.from(book.tags).join(", ")}`);
  }

  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);
}

function addPremise(doc: PDFDocumentType, book: Book): void {
  if (!book.premise) return;

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Premise", { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(11).font("Helvetica").text(book.premise);
  doc.moveDown(1);
}

function addAnnotations(doc: PDFDocumentType, book: Book): void {
  if (book.shortAnnotation) {
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Short Annotation", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11).font("Helvetica").text(book.shortAnnotation);
    doc.moveDown(1);
  }

  if (book.fullAnnotation) {
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Full Annotation", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11).font("Helvetica").text(book.fullAnnotation);
    doc.moveDown(1);
  }
}

function addTableOfContents(doc: PDFDocumentType, book: Book): void {
  addTitle(doc, "Table of Contents", 18);
  doc.fontSize(11).font("Helvetica");

  const chapters = Array.from(book.chapters);
  chapters.forEach((chapter, idx) => {
    const chapterNum = String(idx + 1).padStart(2, "0");
    doc.text(`${chapterNum}. ${chapter.title}`);

    const scenes = Array.from(chapter.scenes);
    if (scenes.length > 0) {
      scenes.forEach((scene, sceneIdx) => {
        const sceneNum = String(sceneIdx + 1).padStart(2, "0");
        doc.fontSize(10).text(`     ${sceneNum}. ${scene.title}`);
      });
    }
  });

  doc.addPage();
}

function addChapters(doc: PDFDocumentType, book: Book): void {
  const chapters = Array.from(book.chapters);

  chapters.forEach((chapter, chapterIdx) => {
    const chapterNum = String(chapterIdx + 1).padStart(2, "0");
    const chapterTitle = `Chapter ${chapterNum}: ${chapter.title}`;

    // Check if we need a new page
    if (doc.y > 400) {
      doc.addPage();
    }

    addTitle(doc, chapterTitle, 18);

    if (chapter.subtitle) {
      addSubtitle(doc, chapter.subtitle);
    }

    doc.fontSize(11).font("Helvetica");

    const scenes = Array.from(chapter.scenes);
    scenes.forEach((scene, sceneIdx) => {
      if (doc.y > 700) {
        doc.addPage();
      }

      const sceneNum = String(sceneIdx + 1).padStart(2, "0");
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text(`${sceneNum}. ${scene.title}`);
      doc.moveDown(0.3);

      doc.fontSize(11).font("Helvetica").text(scene.text, {
        align: "justify",
      });
      doc.moveDown(0.5);

      // Scene separator
      if (sceneIdx < scenes.length - 1) {
        doc.moveTo(100, doc.y).lineTo(500, doc.y).stroke();
        doc.moveDown(0.5);
      }
    });

    doc.moveDown(1);
  });
}

function addCharacters(doc: PDFDocumentType, book: Book): void {
  const characters = Array.from(book.characters);
  if (characters.length === 0) return;

  doc.addPage();
  addTitle(doc, "Characters", 18);
  doc.fontSize(11).font("Helvetica");

  characters.forEach((character, idx) => {
    if (doc.y > 650) {
      doc.addPage();
    }

    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .text(character.name);
    doc.moveDown(0.2);

    if (character.description) {
      doc.fontSize(10).font("Helvetica").text(character.description);
      doc.moveDown(0.3);
    }

    if (character.notes) {
      doc
        .fontSize(9)
        .font("Helvetica-Oblique")
        .text(`Notes: ${character.notes}`);
      doc.moveDown(0.3);
    }

    if (idx < characters.length - 1) {
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
    }
  });
}

export async function generatePDF(
  book: Book,
  chapters: readonly Chapter[],
  options: PDFOptions = {},
): Promise<Buffer> {
  const {
    includeMetadata = true,
    includeTableOfContents = true,
  } = options;

  return new Promise((resolve, reject) => {
    try {
      const doc = createPDFDocument();
      const buffers: Buffer[] = [];

      // Collect PDF output
      doc.on("data", (chunk: unknown) => {
        buffers.push(chunk as Buffer);
      });

      doc.on("end", () => {
        resolve(Buffer.concat(buffers));
      });

      doc.on("error", (err: Error) => {
        reject(err);
      });

      // Title page
      doc.fontSize(32).font("Helvetica-Bold").text(book.title, { align: "center" });
      doc.moveDown(1);

      if (includeMetadata) {
        addMetadata(doc, book);
      }

      addPremise(doc, book);
      addAnnotations(doc, book);

      // Table of contents
      if (includeTableOfContents && book.chapters.length > 0) {
        doc.addPage();
        addTableOfContents(doc, book);
      }

      // Chapters
      if (book.chapters.length > 0) {
        doc.addPage();
        addChapters(doc, book);
      }

      // Characters
      addCharacters(doc, book);

      // Add page numbers
      const pages = doc.bufferedPageRange().count;
      for (let i = 0; i < pages; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(`${i + 1}`, 50, 750, { align: "center" });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
