# Sprint-36-Step-02: Global Accordion for Sidebar Sections

## Objective
Реализовать глобальный аккордеон для боковой панели.
Только одна секция может быть развернута одновременно.

## Context
- Sprint 16: Collapse был реализован
- Спринты 17-35: Был удален/забыт при реорганизациях
- Sprint 35: Восстановлен для каждого элемента (chapters, characters, ideas)
- **Sprint 36:** Превратить в глобальный аккордеон для СЕКЦИЙ

## What Is Global Accordion
```
Sidebar:
━━━━━━━━━━━━━━━━
▾ Книги (3)           ← EXPANDED
  - Chapter 1
  - Chapter 2
  - Chapter 3

▸ Персонажи (5)       ← COLLAPSED
▸ Идеи (12)           ← COLLAPSED
▸ Серии (2)           ← COLLAPSED
▸ Корзина (1)         ← COLLAPSED

// Click "Персонажи" → персонажи раскрываются, Книги закрываются
```

## Acceptance Criteria
- [ ] Only one sidebar section expanded at a time
- [ ] Click section header → toggle that section
- [ ] Expand chapters → characters/ideas/series/trash collapse
- [ ] Section state persists in localStorage
- [ ] After reload → same section still expanded
- [ ] E2E tests pass
- [ ] Tester verifies live
- [ ] CRITICAL_FEATURES.md updated

## Implementation Plan

### Step 1: Add State in page.tsx
```typescript
type SidebarSection = 'chapters' | 'characters' | 'ideas' | 'series' | 'trash';
const [expandedSidebarSection, setExpandedSidebarSection] = useState<SidebarSection | null>('chapters');

// Persist to localStorage
useEffect(() => {
  if (expandedSidebarSection) {
    localStorage.setItem('sidebar-expanded', expandedSidebarSection);
  }
}, [expandedSidebarSection]);

// Load from localStorage
useEffect(() => {
  const stored = localStorage.getItem('sidebar-expanded');
  if (stored) setExpandedSidebarSection(stored as SidebarSection);
}, []);
```

### Step 2: Update Sidebar Props
```typescript
type SidebarProps = {
  expandedSidebarSection?: SidebarSection | null;
  onToggleSidebarSection?: (section: SidebarSection) => void;
  // ... other props
};
```

### Step 3: Update Each Section Header
For each section (Chapters, Characters, Ideas, Series, Trash):
```tsx
<button
  onClick={() => onToggleSidebarSection?.('chapters')}
  className="flex justify-between w-full"
>
  <h2>Главы ({chapters.length})</h2>
  <span>{expandedSidebarSection === 'chapters' ? '▾' : '▸'}</span>
</button>

{expandedSidebarSection === 'chapters' && (
  // Section content
)}
```

### Step 4: Remove Individual Element Collapse
- Remove `selectedChapterId` from controlling expansion
- selectedChapterId still controls selection/highlight, NOT expansion
- Only section expanded/collapsed controls visibility

### Step 5: Update CRITICAL_FEATURES.md
```
| 8 | Global Accordion: one section expanded | e2e/sidebar-accordion.spec.ts | ✅ VERIFIED |
| 9 | Global Accordion: persist in localStorage | e2e/sidebar-accordion.spec.ts | ✅ VERIFIED |
```

## Changed Files
- `apps/studio/src/app/page.tsx`
  - Add expandedSidebarSection state
  - Add toggleSidebarSection function
  - Pass to Sidebar component
  - Persist to localStorage

- `apps/studio/src/components/Sidebar.tsx`
  - Update all 5 section headers (chapters, characters, ideas, series, trash)
  - Wrap section content with `{expandedSidebarSection === 'section' && (...)}`
  - Show expand/collapse indicator

## Testing
- [ ] E2E: Click section → expands, others collapse
- [ ] E2E: Reload page → same section still expanded
- [ ] E2E: localStorage has correct value
- [ ] E2E: All sections can be expanded
- [ ] Live verification: click through all sections, verify collapse/expand works

## Complexity Estimate
- 2-3 hours (relatively straightforward)

## Risk Areas
- ⚠️ Individual element selection still works (chapters, characters)
- ⚠️ EditorArea still shows selected chapter/character
- ⚠️ Sections must conditionally render content

## Notes
This is restoration + improvement from Sprint 16.
Much better UX - less visual clutter, more focused.
Prevent future regression: test is required.
