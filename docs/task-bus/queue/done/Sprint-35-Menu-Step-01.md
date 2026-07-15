id: Sprint-35-Menu-Step-01
name: "File menu: New Book, Open, Save, Export, Exit"
type: implementation

scope:
  allowed_paths:
    - apps/studio/src/components/Header.tsx
    - apps/studio/src/hooks/useWorkspaceController.ts
    - apps/studio/src/app/page.tsx
  forbidden_paths:
    - apps/studio/src/domain/

objective: |
  Implement File menu with 5 functional items (New Book, Open, Save, Export, Exit).
  Replace current disabled "Скоро" placeholder with real menu items that trigger workspace actions.

inputs:
  - Sprint-33+ Roadmap (Phase 2, item 4)
  - Workspace Controller (useWorkspaceController.ts — already has createBook, saveBook)
  - Sprint-34 Design: ARIA labels, keyboard navigation, z-index fix

outputs:
  - File menu with 5 items: New Book, Open, Save, Export, Exit
  - Click handlers wired to workspace controller
  - Keyboard shortcuts: Ctrl+N (New), Ctrl+S (Save), Ctrl+E (Export)
  - ARP documenting menu item UX and workspace integration

validation:
  - npx tsc --noEmit passes
  - npm run build succeeds
  - Browser: File menu opens → 5 items visible (not disabled)
  - Click "New Book" → creates new book in sidebar
  - Click "Save" → workspace persists to DB/localStorage
  - Click "Export" → exports active book as JSON/TXT
  - Ctrl+S triggers Save
  - Click "Exit" → logout or close (TBD by Product Owner)

done_when:
  - All 5 menu items are functional (not "Скоро")
  - Keyboard shortcuts work
  - ARP filed with UX decisions
  - Step Card archived to done/
