import type { Book, Series } from "@/domain/model";

/**
 * Generate Story Bible Markdown from Series and Books data.
 * Creates a structured markdown document with series-level and book-level story bible information.
 */
export function generateStoryBibleMarkdown(
  series: Series | null,
  books: readonly Book[],
): string {
  let content = "";

  // Title
  if (series) {
    content += `# ${series.title} — Bible вселенной\n\n`;
  } else if (books.length > 0) {
    content += `# ${books[0].title} — Story Bible\n\n`;
  } else {
    content += `# Story Bible\n\n`;
  }

  // Series section
  if (series) {
    content += `## Серия\n\n`;
    content += `**Название:** ${series.title}\n\n`;

    if (series.description) {
      content += `${series.description}\n\n`;
    }

    // Series metadata
    const metadata = [];
    if (series.status) {
      metadata.push(`**Статус:** ${series.status}`);
    }
    if (series.targetAudience) {
      metadata.push(`**Целевая аудитория:** ${series.targetAudience}`);
    }
    if (series.genre && series.genre.length > 0) {
      metadata.push(`**Жанры:** ${series.genre.join(", ")}`);
    }
    if (series.estimatedTotalWordCount) {
      metadata.push(
        `**Примерный объём:** ${series.estimatedTotalWordCount.toLocaleString()} слов`,
      );
    }

    if (metadata.length > 0) {
      content += metadata.join("  \n");
      content += "\n\n";
    }

    // Decisions
    if (series.decisions) {
      content += `## Решения\n\n`;
      content += series.decisions;
      content += "\n\n";
    }

    // Throughline elements
    if (series.throughlineElements && series.throughlineElements.length > 0) {
      content += `## Сквозные элементы\n\n`;
      series.throughlineElements.forEach((element) => {
        content += `- ${element}\n`;
      });
      content += "\n";
    }

    // Series constraints
    if (series.seriesConstraints && series.seriesConstraints.length > 0) {
      content += `## Ограничения (что НЕ делать)\n\n`;
      series.seriesConstraints.forEach((constraint) => {
        content += `- ${constraint}\n`;
      });
      content += "\n";
    }

    // Series notes
    if (series.notes) {
      content += `## Заметки\n\n`;
      content += series.notes;
      content += "\n\n";
    }

    // Separator before books
    if (books.length > 0) {
      content += `---\n\n`;
    }
  }

  // Books sections
  books.forEach((book, bookIndex) => {
    const bookNumber = bookIndex + 1;
    const bookTitle = book.workingTitle || book.title;
    content += `## Книга ${bookNumber}: ${bookTitle}\n\n`;

    // Book metadata
    if (
      book.targetAudience ||
      book.estimatedWordCount ||
      book.storyBibleStatus
    ) {
      if (book.storyBibleStatus) {
        content += `**Статус:** ${book.storyBibleStatus}  \n`;
      }
      if (book.targetAudience) {
        content += `**Целевая аудитория:** ${book.targetAudience}  \n`;
      }
      if (book.estimatedWordCount) {
        content += `**Примерный объём:** ${book.estimatedWordCount.toLocaleString()} слов  \n`;
      }
      content += "\n";
    }

    // Main plotlines
    if (book.mainPlotlines && book.mainPlotlines.length > 0) {
      content += `### Основные линии\n\n`;
      book.mainPlotlines.forEach((plotline) => {
        content += `- ${plotline}\n`;
      });
      content += "\n";
    }

    // Principle
    if (book.principle) {
      content += `### Принцип\n\n`;
      content += `\`\`\`\n${book.principle}\n\`\`\`\n\n`;
    }

    // Escalation
    if (book.escalation) {
      content += `### Эскалация\n\n`;
      content += `\`\`\`\n${book.escalation}\n\`\`\`\n\n`;
    }

    // Themes
    if (book.themes && book.themes.length > 0) {
      content += `### Темы (философские вопросы)\n\n`;
      book.themes.forEach((theme) => {
        content += `- ${theme}\n`;
      });
      content += "\n";
    }

    // Book constraints
    if (book.bookConstraints && book.bookConstraints.length > 0) {
      content += `### Ограничения (что НЕ делать в этой книге)\n\n`;
      book.bookConstraints.forEach((constraint) => {
        content += `- ${constraint}\n`;
      });
      content += "\n";
    }

    // Book notes
    if (book.notes) {
      content += `### Заметки\n\n`;
      content += book.notes;
      content += "\n\n";
    }

    // Separator between books (except last book)
    if (bookIndex < books.length - 1) {
      content += `---\n\n`;
    }
  });

  return content;
}
