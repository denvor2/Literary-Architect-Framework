import { NextRequest, NextResponse } from "next/server";
import { generateMarkdownZip } from "@/lib/exporters/markdownExporter";
import { generateDOCX } from "@/lib/exporters/docxExporter";
import type { Book, Series } from "@/domain/model";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      format: "json" | "markdown-zip" | "docx";
      book: Book;
      series?: Series | null;
    };

    const { format, book, series = null } = body;

    if (format === "markdown-zip") {
      const zip = generateMarkdownZip(series, book);
      const blob = await zip.generateAsync({ type: "blob" });

      return new NextResponse(blob, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${book.title || "export"}.zip"`,
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
          "Content-Disposition": `attachment; filename="${book.title || "export"}.docx"`,
        },
      });
    }

    if (format === "json") {
      const jsonData = JSON.stringify(book, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });

      return new NextResponse(blob, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${book.title || "export"}.json"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid format. Use 'json', 'markdown-zip', or 'docx'." },
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
