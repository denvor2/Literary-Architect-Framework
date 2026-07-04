# ChatGPT Review Format — AI Bus

Used by the Chief Software Architect to review a completed Step Card's ARP and diff.

## Format

```
STATUS: OK | FIX | STOP

SUMMARY (RU, максимум 7 строк):
<up to 7 lines, in Russian>

RISKS:
- <risk 1>
- <risk 2>

NEXT STEP:
<the next Step Card id, or the required fix, or the reason for STOP>
```

## Status meanings

- **OK** — the step matches its Step Card, validation passed, safe to advance to the next
  step.
- **FIX** — the step is close but needs a specific, named correction before it can be
  accepted; the same Step Card remains active.
- **STOP** — the step reveals a problem (scope violation, architectural drift, failed
  validation) serious enough to halt execution until a human decides.

## Notes

- The review always evaluates against the active Step Card's `done_when` criteria — not
  against general code quality or unrelated preferences.
- `NEXT STEP` must always name something concrete: a Step Card id to advance to, the specific
  fix required, or the reason execution stopped.
