id: Sprint-35-Menu-Step-03
name: "View menu: Theme, Font Size, Sidebar Toggle, Focus Mode"
type: implementation

scope:
  allowed_paths:
    - apps/studio/src/components/Header.tsx
    - apps/studio/src/app/page.tsx
    - apps/studio/src/hooks/
  forbidden_paths:
    - apps/studio/src/domain/

objective: |
  Implement View menu with theme selector, font size control, sidebar toggle, and focus mode.
  - Theme toggle: Light/Dark (already partially works, wire to Header)
  - Font Size: +/- buttons or dropdown (10px to 18px)
  - Sidebar Toggle: collapse/expand (already works via Sidebar)
  - Focus Mode: hide sidebar, maximize editor (placeholder for now)

inputs:
  - Sprint-35-Menu-Step-01 & Step-02 (menu UX pattern)
  - Theme system (already exists, needs UI wiring)
  - Sidebar collapse (already works via click, just need menu item)
  - Focus Mode (future feature, placeholder for now)

outputs:
  - View menu with 4 items: Theme, Font Size, Sidebar Toggle, Focus Mode
  - Theme submenu: Light / Dark / Auto (with check mark on current)
  - Font Size submenu or dialog: 10px, 12px, 14px (default), 16px, 18px
  - Sidebar Toggle: immediate collapse/expand
  - Focus Mode: placeholder (marked "Скоро")
  - ARP documenting theme persistence (localStorage + DB)

validation:
  - npx tsc --noEmit passes
  - npm run build succeeds
  - Browser: View menu opens → 4 items visible
  - Click "Theme" → submenu shows Light/Dark/Auto with current check mark
  - Click theme → page background changes immediately
  - Theme preference persists on reload (localStorage)
  - Click "Font Size" → options 10px-18px
  - Select font size → text resizes immediately
  - Font preference persists on reload
  - Click "Sidebar Toggle" → sidebar collapses/expands
  - "Focus Mode" is disabled placeholder

done_when:
  - All 4 items wired and functional (except Focus Mode placeholder)
  - Theme/Font Size persist across sessions
  - ARP filed with UX decisions
  - Step Card archived to done/
