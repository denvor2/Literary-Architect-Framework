id: Sprint-35-Menu-Step-02
name: "Edit menu: Undo, Redo, Find, Replace"
type: implementation

scope:
  allowed_paths:
    - apps/studio/src/components/Header.tsx
    - apps/studio/src/hooks/useWorkspaceController.ts
    - apps/studio/src/storage/workspaceStorage.ts
  forbidden_paths:
    - apps/studio/src/domain/

objective: |
  Implement Edit menu with Undo, Redo, Find, Replace.
  - Undo/Redo: wire to workspace action history (or placeholder if not yet implemented)
  - Find: open search panel (already exists via Ctrl+K)
  - Replace: future feature placeholder (mark as "Скоро" for now)

inputs:
  - Sprint-35-Menu-Step-01 (File menu establishes menu UX pattern)
  - Workspace Controller undo/redo state (if exists, else TBD)
  - Search functionality (Ctrl+K already works)

outputs:
  - Edit menu with 4 items: Undo, Redo, Find, Replace
  - Undo/Redo wire to workspace history (or disable with "Скоро")
  - Find → opens search (Ctrl+F)
  - Replace → placeholder (Ctrl+H reserved, not implemented)
  - ARP documenting decisions on undo/redo implementation

validation:
  - npx tsc --noEmit passes
  - npm run build succeeds
  - Browser: Edit menu opens → 4 items visible
  - Ctrl+Z triggers Undo (or disabled if not implemented)
  - Ctrl+Y triggers Redo (or disabled if not implemented)
  - Ctrl+F opens search panel
  - Ctrl+H reserved for Replace (disabled for now)

done_when:
  - All 4 items present and wired (or marked "Скоро" with reason)
  - ARP filed with undo/redo decision
  - Step Card archived to done/
