id: Sprint-34-Design-Step-06
name: "Icons, Accessibility, Performance (Lighthouse 90+)"
type: implementation

## Objective

Финальный полиш:

### Icons:
- Audit: все ли иконки lucide-react
- Replace: emoji → lucide где нужно

### Accessibility:
- Keyboard navigation (Tab, Enter, Escape)
- ARIA labels на все interactive
- Focus states видны

### Performance:
- Lighthouse score: 90+ (Performance, Accessibility, Best Practices, SEO)
- Code splitting если нужно
- Lazy loading Sidebar/Editor/Assistant при необходимости

## Scope

### Allowed paths:
- apps/studio/src/components/** (add ARIA, keyboard handlers)
- apps/studio/globals.css (focus states)
- apps/studio/src/app/page.tsx (lazy loading if needed)

## Validation

1. `npx lighthouse --chrome-flags="--headless" http://localhost:3000`
2. Keyboard: Tab → все interactive элементы фокусируются
3. Screen reader: ARIA labels читаются
4. Mobile performance: <3s load time

## Output

ARP в docs/task-bus/queue/active/:
1. Lighthouse report (JSON или screenshot)
2. List of icons replaced
3. Keyboard navigation checklist (✅/❌)
4. ARIA audit results

## Stop Condition

Lighthouse 90+, keyboard navigation OK, icons lucide.
