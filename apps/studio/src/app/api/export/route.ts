import { NextRequest, NextResponse } from "next/server";
import { generateDOCX } from "@/lib/exporters/docxExporter";
import { generateHybridArchive } from "@/lib/exporters/hybridArchiveExporter";
import { generatePDF } from "@/lib/exporters/pdfExporter";
import { generateFB2 } from "@/lib/exporters/fb2Exporter";
import type { Book, Series } from "@/domain/model";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      format: "markdown-zip" | "docx" | "pdf" | "fb2";
      book: Book;
      series?: Series | null;
      filename?: string;
    };

    const { format, book, series = null, filename } = body;

    const getFilename = (ext: string) => {
      return filename || `${book.title || "export"}.${ext}`;
    };

    if (format === "markdown-zip") {
      const zip = generateHybridArchive(series, book);
      const blob = await zip.generateAsync({ type: "blob" });

      return new NextResponse(blob, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${getFilename("zip")}"`,
        },
      });
    }

    if (format === "docx") {
      const buffer = await generateDOCX(book, book.chapters);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${getFilename("docx")}"`,
        },
      });
    }

    if (format === "pdf") {
      const pdfBuffer = await generatePDF(book, book.chapters, {
        includeMetadata: true,
        includeTableOfContents: book.chapters.length > 0,
      });

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${getFilename("pdf")}"`,
        },
      });
    }

    if (format === "fb2") {
      const fb2Content = generateFB2(book);
      const fb2Bytes = new TextEncoder().encode(fb2Content);

      return new NextResponse(new Uint8Array(fb2Bytes), {
        status: 200,
        headers: {
          "Content-Type": "application/x-fb2+xml",
          "Content-Disposition": `attachment; filename="${getFilename("fb2")}"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid format. Use 'markdown-zip', 'docx', 'pdf', or 'fb2'." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to generate export." },
      { status: 500 },
    );
  }
}
