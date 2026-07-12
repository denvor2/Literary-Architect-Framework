// Sprint-24-Step-03: public entry point for the repository layer. Everything
// downstream (Sprint-24-Step-04's `/api/workspace` route) should import from
// here, not reach into `userRepository`/`bookRepository` directly — those
// are an internal split, not part of the contract.

export {
  getOrCreateDefaultUser,
  findUserByEmail,
  checkPassword,
  createUser,
  getUserById,
  updateUserPassword,
  updateUserStatus,
} from "./userRepository";
export { loadBooksForUser, saveBooksForUser } from "./bookRepository";
export {
  getAssistantSettings,
  getAllAssistantSettings,
  upsertAssistantSettings,
} from "./assistantSettingsRepository";
export type { AssistantSettingsRecord } from "./assistantSettingsRepository";
// Sprint-29-Step-03: series repository layer. Step-04's `/api/series` route
// should import from here, not directly from seriesRepository.ts — same
// internal-split principle as books.
export { loadSeriesForUser, saveSeriesToUser } from "./seriesRepository";
export type { Series } from "./seriesRepository";
