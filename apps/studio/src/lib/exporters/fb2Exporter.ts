import type { Book } from "@/domain/model";

function escapeXML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getGenreCode(genre?: string): string {
  if (!genre) return "sf_action"; // default: science fiction action

  const genreMap: Record<string, string> = {
    fantasy: "sf_fantasy",
    science_fiction: "sf_science",
    sf: "sf_science",
    mystery: "det_classic",
    detective: "det_classic",
    thriller: "thriller",
    action: "sf_action",
    adventure: "sf_adventure",
    romance: "love",
    historical: "historical",
    fiction: "sf",
  };

  const normalized = genre.toLowerCase();
  return genreMap[normalized] || "sf";
}

export function generateFB2(book: Book): string {
  const today = formatDate(new Date());
  const escapedTitle = escapeXML(book.title);
  const escapedGenre = escapeXML(book.genre || "Fiction");
  const escapedPremise = escapeXML(book.premise || "");
  const escapedAnnotation = escapeXML(
    book.fullAnnotation || book.shortAnnotation || "",
  );
  const genreCode = getGenreCode(book.genre);

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0">\n';

  // Description section
  xml += "  <description>\n";
  xml += "    <title-info>\n";
  xml += `      <book-title>${escapedTitle}</book-title>\n`;
  xml += "      <author>\n";
  xml += "        <first-name>Unknown</first-name>\n";
  xml += "        <last-name>Author</last-name>\n";
  xml += "      </author>\n";
  xml += `      <date>${today}</date>\n`;
  xml += "      <genres>\n";
  xml += `        <genre>${genreCode}</genre>\n`;
  xml += "      </genres>\n";

  if (escapedAnnotation) {
    xml += "      <annotation>\n";
    xml += "        <p>" + escapedAnnotation + "</p>\n";
    xml += "      </annotation>\n";
  }

  xml += "      <lang>en</lang>\n";
  xml += "    </title-info>\n";

  xml += "    <document-info>\n";
  xml += "      <author>\n";
  xml += "        <nickname>Literary Studio</nickname>\n";
  xml += "      </author>\n";
  xml += `      <date>${today}</date>\n`;
  xml += "      <src-url>https://literary-studio.com</src-url>\n";
  xml += "      <version>1.0</version>\n";
  xml += "    </document-info>\n";

  xml += "    <publish-info>\n";
  xml += `      <publisher>Literary Studio</publisher>\n`;
  xml += `      <year>${new Date().getFullYear()}</year>\n`;
  xml += "    </publish-info>\n";

  xml += "  </description>\n";

  // Body section
  xml += "  <body>\n";

  const chapters = Array.from(book.chapters);
  chapters.forEach((chapter, chapterIdx) => {
    const chapterNum = String(chapterIdx + 1).padStart(2, "0");
    const escapedChapterTitle = escapeXML(chapter.title);

    xml += "    <section>\n";
    xml += "      <title>\n";
    xml += `        <p>${chapterNum}. ${escapedChapterTitle}</p>\n`;
    xml += "      </title>\n";

    const scenes = Array.from(chapter.scenes);
    scenes.forEach((scene) => {
      const escapedSceneTitle = escapeXML(scene.title);
      const escapedSceneText = escapeXML(scene.text);

      xml += "      <section>\n";
      xml += "        <title>\n";
      xml += `          <p>${escapedSceneTitle}</p>\n`;
      xml += "        </title>\n";

      // Split scene text into paragraphs
      const paragraphs = escapedSceneText.split(/\n\n+/);
      paragraphs.forEach((para) => {
        if (para.trim()) {
          xml += "        <p>" + para.trim() + "</p>\n";
        }
      });

      xml += "      </section>\n";
    });

    xml += "    </section>\n";
  });

  xml += "  </body>\n";
  xml += "</FictionBook>\n";

  return xml;
}
