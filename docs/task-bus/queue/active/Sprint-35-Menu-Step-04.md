id: Sprint-35-Menu-Step-04
name: "Help & About menus: Docs, Shortcuts, Report Bug, Version"
type: implementation

scope:
  allowed_paths:
    - apps/studio/src/components/Header.tsx
    - apps/studio/src/app/page.tsx
  forbidden_paths:
    - apps/studio/src/domain/

objective: |
  Implement Help and About menus.
  - Help menu: Docs (external link), Keyboard Shortcuts (dialog), Report Bug (external link)
  - About menu: Version (from package.json), Credits, License (external links)

inputs:
  - Sprint-35-Menu-Step-01/02/03 (menu UX pattern established)
  - package.json (version field)
  - CLAUDE.md / PROJECT_CHARTER.md (credits, links)

outputs:
  - Help menu with 3 items: Docs, Keyboard Shortcuts, Report Bug
  - About menu with 3 items: Version, Credits, License
  - Keyboard Shortcuts dialog listing: Ctrl+K, Ctrl+N, Ctrl+S, Escape, Tab navigation
  - External links open in new tab
  - ARP documenting all links and dialog content

validation:
  - npx tsc --noEmit passes
  - npm run build succeeds
  - Browser: Help menu → 3 items visible
  - Click "Docs" → opens https://github.com/.../README.md in new tab
  - Click "Keyboard Shortcuts" → modal dialog with shortcut list
  - Click "Report Bug" → opens GitHub issues in new tab
  - Browser: About menu → 3 items visible
  - Click "Version" → shows version from package.json (e.g., "0.1.0")
  - Click "Credits" → dialog with contributor names
  - Click "License" → opens LICENSE file in new tab

done_when:
  - All 6 items (3 Help + 3 About) functional
  - Keyboard Shortcuts dialog complete and accurate
  - All external links work (GitHub, docs, etc.)
  - ARP filed
  - Step Card archived to done/
