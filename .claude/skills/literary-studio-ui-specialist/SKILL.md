---
name: literary-studio-ui-specialist
description: The Literary Studio (Literary-Architect-Framework) project's actual UI/design system for apps/studio — a minimal, Claude-inspired visual language (neutral zinc scale, pill-shaped primary actions, subtle 1px borders, restrained mode-accent colors) discovered from the components that already ship it, not invented upfront. Use whenever reviewing or making a UI/usability change in apps/studio/src/components — to judge whether new markup matches the existing system, or to spot a real usability gap (missing disabled/error state, dark-mode gap, inconsistent spacing).
---

# Literary Studio UI system

This is not an aspirational design system — it is the vocabulary already
present in every component under `apps/studio/src/components/` (verified
across `AssistantPanel.tsx`, `EditorArea.tsx`, `Sidebar.tsx`, `Header.tsx`,
`CharacterPanel.tsx`, `IdeasPanel.tsx`, `NewBookDialog.tsx` as of Sprint 24).
Per this project's evolutionary-architecture rule (ADR-0002), the job is to
extend this vocabulary consistently, not to import a new one.

## The vocabulary

- **Base palette:** neutral `zinc` scale only. No gray/slate/stone mixed in.
  Light mode: `bg-white` surfaces, `text-black` primary text, `zinc-500`
  secondary text, `zinc-200` borders. Dark mode mirrors it one-to-one:
  `dark:bg-black`/`dark:bg-zinc-950`, `dark:text-zinc-50`,
  `dark:text-zinc-400`, `dark:border-zinc-800`. Every color utility that
  appears in light mode has a `dark:` counterpart in the same className —
  never ship one without the other.
- **Primary action = inverted pill:** `rounded-full bg-black px-4 py-1.5
  text-sm font-medium text-white` in light mode, flipping to `dark:bg-white
  dark:text-black`. This is the single most repeated pattern in the app
  (send buttons, accept/create actions) — reuse it verbatim rather than
  inventing a new button treatment.
- **Secondary action = outlined pill:** `rounded-full border border-zinc-300
  px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100
  dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900`. Used for
  anything reversible/optional (retry, cancel, secondary filters).
- **Cards/panels:** `rounded-lg border border-zinc-200 p-3
  dark:border-zinc-800` — a single 1px border, no shadows, no elevation
  tricks. Nesting depth is expressed with padding and border only.
- **Accent colors are scoped, never global:** each Assistant mode
  (`coauthor`/`editor`/`critic`/`reader`) owns one accent
  (amber/emerald/red/blue respectively — see `MODE_META` in
  `AssistantPanel.tsx`) applied only to that mode's own active state,
  label, and border. Don't introduce a new global accent color; if a new
  mode/feature needs one, give it its own scoped constant the same way.
- **Typography scale:** `text-xs` (labels, meta, badges) → `text-sm`
  (body/buttons) → occasional `text-sm font-medium` for emphasis. No
  larger sizes appear in panel chrome — this is a dense, information-tool
  UI, not a marketing page. Uppercase section labels use
  `text-xs font-semibold uppercase tracking-wide text-zinc-500`.
- **Feedback states:** loading collapses button label to `"…"` rather than
  a spinner component; errors render as `text-sm text-red-600
  dark:text-red-400` inline text below the control that failed, not a
  toast/modal. Disabled state is always `disabled:opacity-50` (or `-30`
  for icon-only affordances) — never a color swap.
- **Interactive transitions:** `transition-colors` on anything with a
  `hover:`/active state — bare hover-color flips without it are a
  regression, not a stylistic variant.

## Why this reads as "Claude-inspired"

The resemblance the Product Owner is pointing at is structural, not a
literal reused palette: restrained neutral canvas, one strong
black/white/inverted action per view, information carried by shape (pills,
thin borders) rather than color or shadow, and color spent deliberately
(one accent per semantic context) instead of decoratively. When asked to
make something "feel more like Claude's own product," the lever is
*reducing* visual noise and reusing the existing pill/border vocabulary
above — not adding gradients, shadows, or a new brand color.

## Using this for review or implementation

When reviewing or writing UI code in `apps/studio/src/components/`, check:

1. **Vocabulary match** — does new markup reuse the pill/card/typography
   classes above, or does it introduce a one-off pattern? A one-off is a
   finding unless the Step Card explicitly calls for a new pattern.
2. **Dark-mode parity** — every light-mode color utility has a `dark:`
   pair. Grep the diff for `bg-|text-|border-` utilities without a
   neighboring `dark:` variant.
3. **State completeness** — interactive elements handle loading, disabled,
   and error the established way (see Feedback states above), not silently
   omitted.
4. **Accent scoping** — a new accent color is justified only if it's
   scoped to one semantic context, the same way mode accents are.
5. **Live-verify visually** — per `literary-studio-run`, start the app and
   actually look at the change in both light and dark mode before calling
   a UI change done; a passing `tsc`/`build` says nothing about whether it
   looks right.

## What NOT to do

- Don't pull in a component library (shadcn/Radix/MUI) to "fix" this —
  the app deliberately hand-rolls Tailwind utility markup; introducing a
  library is an architectural decision for the Architect, not a UI tweak.
- Don't invent a new neutral color scale (gray/slate/stone) alongside
  `zinc` — pick `zinc`, always.
- Don't add global accent colors, shadows, or gradients "for polish" —
  the restraint is the design decision, not an oversight to correct.
