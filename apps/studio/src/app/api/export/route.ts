import { NextRequest, NextResponse } from "next/server";
import { generateMarkdownZip } from "@/lib/exporters/markdownExporter";
import type { Book, Series } from "@/domain/model";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      format: "json" | "markdown-zip";
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
      { error: "Invalid format. Use 'json' or 'markdown-zip'." },
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
