id: Sprint-34-Design-Step-02
name: "Desktop layout fix: spacing, typography, colors (1200px+)"
type: implementation

## Objective

Привести Desktop layout в соответствие с целевым состоянием. Fix:
- Header (menu, search, controls)
- Sidebar (spacing, widths)
- Editor (text scaling, line height, margins)
- Assistant Panel (width, spacing)
- Footer (status bar, word count)

## Scope

### Allowed paths:
- apps/studio/src/app/page.tsx
- apps/studio/src/components/Header.tsx
- apps/studio/src/components/Sidebar.tsx
- apps/studio/src/components/EditorArea.tsx
- apps/studio/src/components/AssistantPanel.tsx
- apps/studio/globals.css (if needed)

## Validation

1. Desktop 1200px+ — скриншот целевого состояния
2. Spacing: 8px grid, gaps соответствуют
3. Typography: line-height, letter-spacing правильно
4. Colors: zinc palette, dark mode работает
5. `npx tsc --noEmit` ✅
6. `npm run build` ✅

## Output

ARP в docs/task-bus/queue/active/:
1. Before/After скриншоты (desktop)
2. Результат build

## Stop Condition

Desktop выглядит как макет.
