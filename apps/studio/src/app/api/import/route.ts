import { NextRequest, NextResponse } from "next/server";
import { importHybridArchive } from "@/lib/importers/hybridArchiveImporter";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided or invalid file" },
        { status: 400 },
      );
    }

    // Only accept ZIP files
    if (file.type !== "application/zip" && !file.name.endsWith(".zip")) {
      return NextResponse.json(
        { error: "Only ZIP archives are supported" },
        { status: 400 },
      );
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Import archive
    const result = await importHybridArchive(arrayBuffer);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Import failed",
          details: result.errors,
        },
        { status: 400 },
      );
    }

    if (!result.book) {
      return NextResponse.json(
        { error: "No book data found in archive" },
        { status: 400 },
      );
    }

    // Return imported data
    return NextResponse.json(
      {
        success: true,
        book: result.book,
        series: result.series,
        warnings: result.warnings,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      {
        error: "Failed to import archive",
        details: [error instanceof Error ? error.message : "Unknown error"],
      },
      { status: 500 },
    );
  }
}
