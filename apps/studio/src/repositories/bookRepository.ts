// Sprint-24-Step-03: book repository — reads/writes the whole `Book[]` tree
// for a user against Prisma, per ADR-0012 Decision 3 (coarse contract, same
// semantics as today's `loadWorkspace()`/`saveWorkspace()`).
//
// Only `books` moves to the database (ADR-0012 Decision 2) — this module
// knows nothing about `Workspace`'s ephemeral UI-state fields
// (`activeBookId` etc.), and nothing about HTTP.
// Sprint-34-Step-03: Extended with Story Bible functions for book planning.

import { prisma } from "@/lib/db";
import { AssistantRole } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import type {
  AssistantThread as DomainAssistantThread,
  AssistantThreads as DomainAssistantThreads,
  Book as DomainBook,
  ChatMessage as DomainChatMessage,
  BookStatus,
  Series as DomainSeries,
} from "@/domain/model";

// The four `AssistantThreads` role keys, in a fixed iteration order — used
// both to flatten the domain's per-role grouping into a flat list for
// writes and to rebuild the grouping on reads.
const ASSISTANT_ROLES = [
  AssistantRole.coauthor,
  AssistantRole.editor,
  AssistantRole.critic,
  AssistantRole.reader,
] as const;

// Shared `include` shape for both the read query and its payload type below
// — keeps the two in sync by construction instead of by hand.
const bookInclude = {
  Chapter: {
    orderBy: { order: "asc" },
    include: {
      Scene: { orderBy: { order: "asc" } },
    },
  },
  // No explicit `order` column on Character (none exists in the domain
  // model either) — ordering by `id` is a technical judgment call for
  // deterministic reads, not a value carried by the domain data itself.
  Character: { orderBy: { id: "asc" } },
  // `createdAt` is meaningful domain data for Idea (unlike ChatMessage) —
  // order by it, with `id` as a tiebreaker for ideas created in the same
  // save (see the ChatMessage note below for why a tiebreaker is needed).
  Idea: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
  // No explicit order field on AssistantThread either — `id` ordering is a
  // judgment call, same reasoning as Character above.
  AssistantThread: {
    orderBy: { id: "asc" },
    include: {
      // Every message written by `saveBooksForUser` in the same call lands
      // in the same transaction, and Postgres's `now()` (Prisma's
      // `createdAt` default) is constant for the whole transaction — so
      // `createdAt` alone cannot distinguish messages written together.
      // `id` (cuid, generated client-side in call order) is the real
      // ordering signal; `createdAt` is kept first only to order across
      // separate saves correctly.
      ChatMessage: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
    },
  },
} satisfies Prisma.BookInclude;

type BookWithRelations = Prisma.BookGetPayload<{ include: typeof bookInclude }>;

function toDomainAssistantThread(
  thread: BookWithRelations["AssistantThread"][number],
): DomainAssistantThread {
  const messages: DomainChatMessage[] = thread.ChatMessage.map((message) => ({
    role: message.role,
    content: message.content,
  }));
  return {
    id: thread.id,
    name: thread.name,
    messages,
    // Prisma `persona: string | null` <-> domain `persona?: string`
    // (ADR field-mapping note): null must become undefined, not be kept as
    // null, so the domain shape never sees `persona: null`.
    ...(thread.persona !== null ? { persona: thread.persona } : {}),
  };
}

function toDomainAssistantThreads(
  threads: BookWithRelations["AssistantThread"],
): DomainAssistantThreads {
  const grouped: Record<
    (typeof ASSISTANT_ROLES)[number],
    DomainAssistantThread[]
  > = {
    coauthor: [],
    editor: [],
    critic: [],
    reader: [],
  };
  for (const thread of threads) {
    grouped[thread.role].push(toDomainAssistantThread(thread));
  }
  return grouped;
}

function toDomainBook(book: BookWithRelations): DomainBook {
  return {
    id: book.id,
    title: book.title,
    genre: book.genre as string,
    language: book.language,
    premise: book.premise,
    shortAnnotation: book.shortAnnotation,
    fullAnnotation: book.fullAnnotation,
    tags: book.tags,
    chapters: book.Chapter.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      subtitle: chapter.subtitle,
      scenes: chapter.Scene.map((scene) => ({
        id: scene.id,
        title: scene.title,
        text: scene.text,
      })),
    })),
    characters: book.Character.map((character) => ({
      id: character.id,
      name: character.name,
      description: character.description,
      notes: character.notes,
      photoUrl: character.photoUrl,
    })),
    assistantThreads: toDomainAssistantThreads(book.AssistantThread),
    ideas: book.Idea.map((idea) => ({
      id: idea.id,
      text: idea.text,
      createdAt: idea.createdAt.toISOString(),
    })),
    // Sprint-34-Step-03: Story Bible fields
    seriesId: book.seriesId ?? undefined,
    deletedAt: book.deletedAt ?? undefined,
    workingTitle: book.workingTitle ?? undefined,
    targetAudience: book.targetAudience ?? undefined,
    genreArray:
      book.genre && Array.isArray(book.genre)
        ? (book.genre as string[])
        : undefined,
    estimatedWordCount: book.estimatedWordCount ?? undefined,
    estimatedChapters: book.estimatedChapters ?? undefined,
    storyBibleStatus: book.status ?? undefined,
    mainPlotlines: book.mainPlotlines
      ? (book.mainPlotlines as string[])
      : undefined,
    principle: book.principle ?? undefined,
    escalation: book.escalation ?? undefined,
    themes: book.themes ? (book.themes as string[]) : undefined,
    bookConstraints: book.bookConstraints
      ? (book.bookConstraints as string[])
      : undefined,
    notes: book.notes ?? undefined,
    publishedDate: book.publishedDate ?? undefined,
    isbn: book.isbn ?? undefined,
  };
}

export async function loadBooksForUser(userId: string): Promise<DomainBook[]> {
  if (!prisma) {
    throw new Error("Database connection unavailable. Cannot load books.");
  }
  const books = await prisma.book.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: bookInclude,
  });
  return books.map(toDomainBook);
}

export async function loadDeletedBooksForUser(
  userId: string,
): Promise<DomainBook[]> {
  if (!prisma) {
    throw new Error(
      "Database connection unavailable. Cannot load deleted books.",
    );
  }
  const books = await prisma.book.findMany({
    where: { userId, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    include: bookInclude,
  });

  // Deduplicate by ID (defense against data corruption)
  const seen = new Set<string>();
  const uniqueBooks: typeof books = [];
  for (const book of books) {
    if (!seen.has(book.id)) {
      seen.add(book.id);
      uniqueBooks.push(book);
    } else {
      console.warn(
        "[loadDeletedBooksForUser] Duplicate book ID in trash:",
        book.id,
        book.title,
      );
    }
  }

  return uniqueBooks.map(toDomainBook);
}

export async function saveBooksForUser(
  userId: string,
  books: readonly DomainBook[],
): Promise<void> {
  if (!prisma) {
    throw new Error("Database connection unavailable. Cannot save books.");
  }

  await prisma.$transaction(
    async (tx) => {
      const incomingBookIds = books.map((book) => book.id);

      // Coarse contract (ADR-0012 Decision 3): the passed-in `books[]` is
      // the full, authoritative state for this user — anything not present
      // gets deleted. Chapter/Scene/Character/AssistantThread all cascade
      // from Book (see schema.prisma `onDelete: Cascade`), so deleting a
      // removed book here is enough to remove its whole subtree.
      await tx.book.deleteMany({
        where: { userId, id: { notIn: incomingBookIds } },
      });

      for (const book of books) {
        await tx.book.upsert({
          where: { id: book.id },
          create: {
            id: book.id,
            userId,
            title: book.title,
            genre: book.genre,
            language: book.language,
            premise: book.premise,
            shortAnnotation: book.shortAnnotation,
            fullAnnotation: book.fullAnnotation,
            tags: [...book.tags],
            seriesId: book.seriesId,
            updatedAt: new Date(),
          },
          update: {
            title: book.title,
            genre: book.genre,
            language: book.language,
            premise: book.premise,
            shortAnnotation: book.shortAnnotation,
            fullAnnotation: book.fullAnnotation,
            tags: [...book.tags],
            seriesId: book.seriesId,
          },
        });

        const incomingChapterIds = book.chapters.map((chapter) => chapter.id);
        await tx.chapter.deleteMany({
          where: { bookId: book.id, id: { notIn: incomingChapterIds } },
        });

        for (const [chapterIndex, chapter] of book.chapters.entries()) {
          await tx.chapter.upsert({
            where: { id: chapter.id },
            create: {
              id: chapter.id,
              bookId: book.id,
              title: chapter.title,
              subtitle: chapter.subtitle,
              order: chapterIndex,
            },
            update: {
              title: chapter.title,
              subtitle: chapter.subtitle,
              order: chapterIndex,
            },
          });

          const incomingSceneIds = chapter.scenes.map((scene) => scene.id);
          await tx.scene.deleteMany({
            where: { chapterId: chapter.id, id: { notIn: incomingSceneIds } },
          });

          for (const [sceneIndex, scene] of chapter.scenes.entries()) {
            await tx.scene.upsert({
              where: { id: scene.id },
              create: {
                id: scene.id,
                chapterId: chapter.id,
                title: scene.title,
                text: scene.text,
                order: sceneIndex,
              },
              update: {
                title: scene.title,
                text: scene.text,
                order: sceneIndex,
              },
            });
          }
        }

        const incomingCharacterIds = book.characters.map(
          (character) => character.id,
        );
        await tx.character.deleteMany({
          where: { bookId: book.id, id: { notIn: incomingCharacterIds } },
        });

        for (const character of book.characters) {
          await tx.character.upsert({
            where: { id: character.id },
            create: {
              id: character.id,
              bookId: book.id,
              name: character.name,
              description: character.description,
              notes: character.notes,
              photoUrl: character.photoUrl,
            },
            update: {
              name: character.name,
              description: character.description,
              notes: character.notes,
              photoUrl: character.photoUrl,
            },
          });
        }

        const incomingIdeaIds = book.ideas.map((idea) => idea.id);
        await tx.idea.deleteMany({
          where: { bookId: book.id, id: { notIn: incomingIdeaIds } },
        });

        for (const idea of book.ideas) {
          await tx.idea.upsert({
            where: { id: idea.id },
            create: {
              id: idea.id,
              bookId: book.id,
              text: idea.text,
              createdAt: new Date(idea.createdAt),
            },
            update: {
              text: idea.text,
              createdAt: new Date(idea.createdAt),
            },
          });
        }

        // Flatten the domain's per-role grouping into one list — the
        // Prisma model stores `role` as a plain field per row (Step Card
        // field-mapping note).
        const incomingThreads = ASSISTANT_ROLES.flatMap((role) =>
          book.assistantThreads[role].map((thread) => ({ role, thread })),
        );
        const incomingThreadIds = incomingThreads.map(
          ({ thread }) => thread.id,
        );
        await tx.assistantThread.deleteMany({
          where: { bookId: book.id, id: { notIn: incomingThreadIds } },
        });

        for (const { role, thread } of incomingThreads) {
          await tx.assistantThread.upsert({
            where: { id: thread.id },
            create: {
              id: thread.id,
              bookId: book.id,
              role,
              name: thread.name,
              // domain `persona?: string` <-> Prisma `persona: String?`
              // (ADR field-mapping note): undefined must become null.
              persona: thread.persona ?? null,
            },
            update: {
              role,
              name: thread.name,
              persona: thread.persona ?? null,
            },
          });

          // Domain ChatMessage carries no id — there is nothing to diff
          // against, so each save replaces a thread's messages wholesale
          // (Step Card field-mapping note: let Prisma generate id/createdAt
          // on write).
          await tx.chatMessage.deleteMany({ where: { threadId: thread.id } });
          for (const message of thread.messages) {
            const { customAlphabet } = await import("nanoid");
            const nanoid = customAlphabet(
              "0123456789abcdefghijklmnopqrstuvwxyz",
              21,
            );
            await tx.chatMessage.create({
              data: {
                id: nanoid(),
                threadId: thread.id,
                role: message.role,
                content: message.content,
              },
            });
          }
        }
      }
    },
    { maxWait: 10_000, timeout: 30_000 },
  );
}

export async function softDeleteBook(bookId: string): Promise<void> {
  if (!prisma) {
    throw new Error(
      "Database connection unavailable. Cannot soft delete book.",
    );
  }
  console.log("[softDeleteBook] Attempting to soft-delete book:", bookId);

  try {
    const result = await prisma.book.update({
      where: { id: bookId },
      data: { deletedAt: new Date() },
    });
    console.log("[softDeleteBook] Success, updated book:", result.id);
  } catch (error) {
    // If book not found, that's OK - it may exist only in client state
    if (
      error instanceof Error &&
      error.message.includes("No record was found")
    ) {
      console.warn(
        "[softDeleteBook] Book not found in DB (client-only state):",
        bookId,
      );
      return;
    }
    console.error("[softDeleteBook] Prisma error:", error);
    throw error;
  }
}

export async function restoreBook(bookId: string): Promise<void> {
  if (!prisma) {
    throw new Error("Database connection unavailable. Cannot restore book.");
  }
  await prisma.book.update({
    where: { id: bookId },
    data: { deletedAt: null },
  });
}

export async function permanentlyDeleteBook(bookId: string): Promise<void> {
  if (!prisma) {
    throw new Error(
      "Database connection unavailable. Cannot permanently delete book.",
    );
  }
  await prisma.book.delete({
    where: { id: bookId },
  });
}

// Sprint-34-Step-03: Story Bible functions for Book

type BookStoryBibleInput = {
  workingTitle?: string;
  targetAudience?: string;
  genre?: string[];
  estimatedWordCount?: number;
  estimatedChapters?: number;
  status?: BookStatus;
  mainPlotlines?: string[];
  principle?: string;
  escalation?: string;
  themes?: string[];
  bookConstraints?: string[];
  notes?: string;
  publishedDate?: Date;
  isbn?: string;
};

/**
 * Update Book Story Bible fields
 * Sprint-34-Step-03: Persist Story Bible metadata for book-level planning
 */
export async function updateBookStoryBible(
  bookId: string,
  data: BookStoryBibleInput,
): Promise<DomainBook> {
  if (!prisma) {
    throw new Error(
      "Database connection unavailable. Cannot update book story bible.",
    );
  }

  const updated = await prisma.book.update({
    where: { id: bookId },
    data: {
      workingTitle: data.workingTitle ?? undefined,
      targetAudience: data.targetAudience ?? undefined,
      genre: data.genre ?? undefined,
      estimatedWordCount: data.estimatedWordCount,
      estimatedChapters: data.estimatedChapters,
      status: data.status,
      mainPlotlines: data.mainPlotlines ?? undefined,
      principle: data.principle,
      escalation: data.escalation,
      themes: data.themes ?? undefined,
      bookConstraints: data.bookConstraints ?? undefined,
      notes: data.notes,
      publishedDate: data.publishedDate,
      isbn: data.isbn,
      updatedAt: new Date(),
    },
    include: bookInclude,
  });

  return toDomainBook(updated);
}

/**
 * Get Book with all Story Bible fields
 * Sprint-34-Step-03: Retrieve complete book metadata for planning and display
 */
export async function getBookWithStoryBible(
  bookId: string,
): Promise<DomainBook> {
  if (!prisma) {
    throw new Error(
      "Database connection unavailable. Cannot get book story bible.",
    );
  }

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: bookInclude,
  });

  if (!book) {
    throw new Error(`Book not found: ${bookId}`);
  }

  return toDomainBook(book);
}

/**
 * Get Book with inherited Series Story Bible context
 * Sprint-34-Step-03: Retrieve book with inherited fields from series for hierarchical planning
 *
 * Returns book data with inherited series fields (targetAudience, genre)
 * if the book-level fields are empty. Enables series-level defaults while
 * allowing per-book overrides.
 */
export async function getBookWithSeriesContext(bookId: string): Promise<{
  book: DomainBook;
  inherited: {
    targetAudience?: string;
    genre?: string[];
  };
}> {
  if (!prisma) {
    throw new Error(
      "Database connection unavailable. Cannot get book with series context.",
    );
  }

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      ...bookInclude,
      Series: true,
    },
  });

  if (!book) {
    throw new Error(`Book not found: ${bookId}`);
  }

  const domainBook = toDomainBook(book);
  const seriesData = book.Series;

  // Compute inherited fields: use series values if book values are empty
  const inherited: {
    targetAudience?: string;
    genre?: string[];
  } = {};

  if (!domainBook.targetAudience && seriesData?.targetAudience) {
    inherited.targetAudience = seriesData.targetAudience;
  }

  if (
    (!domainBook.genreArray || domainBook.genreArray.length === 0) &&
    seriesData?.genre
  ) {
    inherited.genre = seriesData.genre as string[];
  }

  return {
    book: domainBook,
    inherited,
  };
}

/**
 * Helper function to get effective audience
 * Sprint-34-Step-03: Resolve target audience with series fallback
 * Returns book audience if set, otherwise series audience
 */
export function getEffectiveAudience(
  book: DomainBook,
  series?: DomainSeries,
): string | undefined {
  return book.targetAudience ?? series?.targetAudience;
}

/**
 * Helper function to get effective genre
 * Sprint-34-Step-03: Resolve genre array with series fallback
 * Returns book genres if set, otherwise series genres
 */
export function getEffectiveGenre(
  book: DomainBook,
  series?: DomainSeries,
): string[] {
  return book.genreArray && book.genreArray.length > 0
    ? (book.genreArray as string[])
    : series?.genre
      ? (series.genre as string[])
      : [];
}
