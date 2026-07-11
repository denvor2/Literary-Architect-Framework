// Sprint-24-Step-03: public entry point for the repository layer. Everything
// downstream (Sprint-24-Step-04's `/api/workspace` route) should import from
// here, not reach into `userRepository`/`bookRepository` directly — those
// are an internal split, not part of the contract.

export { getOrCreateDefaultUser } from "./userRepository";
export { loadBooksForUser, saveBooksForUser } from "./bookRepository";
export {
  getAssistantSettings,
  getAllAssistantSettings,
  upsertAssistantSettings,
} from "./assistantSettingsRepository";
export type { AssistantSettingsRecord } from "./assistantSettingsRepository";
