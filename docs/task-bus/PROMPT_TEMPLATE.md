# Claude Execution Prompt Template — Task Bus

Use this template to turn the active Step Card ([STEP_CARD_TEMPLATE.yml](STEP_CARD_TEMPLATE.yml))
into an execution prompt for Claude.

## Template

```
# Architecture Task — <Step Card id>

## Scope
You are executing exactly one Step Card: <id> — <name>.

Allowed paths: <scope.allowed_paths>
Forbidden paths: <scope.forbidden_paths>

## Objective
<objective>

## Rules
- Strict scope enforcement: touch only the allowed paths. Do not infer or add scope not
  stated in the Step Card.
- No architectural drift: do not introduce new architecture, dependencies, or patterns beyond
  what this Step Card and existing ADRs already establish.
- Minimal implementation rule: implement the smallest change that satisfies done_when. No
  speculative abstractions, no unrequested cleanup.
- Do not proceed to any other Step Card.

## Validation
Run only: <validation>

## Output
Return an ARP with exactly these sections:
1. Summary
2. Changes
3. Risks
4. Commit message

## Stop Condition
Stop after the ARP is delivered. Do not commit until explicitly instructed, unless the Step
Card's commit policy says otherwise.
```

## Notes

- One prompt corresponds to exactly one Step Card — never bundle multiple steps into one
  prompt.
- The ARP produced from this prompt is what ChatGPT reviews using
  [REVIEW_FORMAT.md](REVIEW_FORMAT.md).
