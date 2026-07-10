---
name: literary-studio-live-verify
description: The Literary Studio (Literary-Architect-Framework) project's standing technique for verifying a code change actually works, without mocks — real HTTP calls against a real running server with real Claude responses, or pure-reducer scripts with function bodies copied verbatim for logic with no network. Use for every Step Card's Validation section in this project; use this instead of inventing a new verification approach or settling for "it compiles."
---

# Live verification without mocks

This project has required real, non-mocked verification for every
code-touching Step Card since Sprint 09 — "it typechecks" or "the test suite
passes" is explicitly *not* sufficient here (there is no unit test suite for
the AI Bus routes; the API surface is thin wrappers around a real Anthropic
call, and mocking that call would verify nothing about whether the actual
prompt/response contract works). Two concrete shapes, pick whichever fits the
change:

## Shape 1 — real server, real network call

For anything that touches an API route, the AI Bus, or a component that
calls `aiBus.execute()`:

1. Start a real server on a scratch port — see `literary-studio-run` for the
   exact commands (`npm run build && npx next start -p <port>`, backgrounded,
   poll for `"Ready"` in the log or a `200` from `curl`).
2. Write a small Node ESM script in the session's scratchpad directory
   (never in the repo) that does a real `fetch()` against the route(s) you
   changed, with realistic fixture data — not `{}`, not placeholder strings.
   For AI Expert routes specifically, use fixture text substantial enough
   that a real model response can be meaningfully checked (a one-word scene
   won't let you tell if a persona/language instruction actually worked).
3. **Assert on content, not just status.** A `200 OK` proves the route
   didn't crash — it proves nothing about whether the change does what it
   claims. Concrete examples from this project's own history:
   - Verifying a `bookLanguage` field actually changes model output: call
     the same route with two different languages, assert the real response
     text is genuinely in each (e.g. Cyrillic-detection regex, or literal
     phrase checks) — not just that the request was accepted.
   - Verifying `persona` changes Reader's behavior: call with two very
     different personas on identical input, assert the two responses are
     substantively different in tone, and print a snippet of each so a
     human reviewer can also judge it.
   - Verifying backward compatibility: call once with the new optional
     field, once without it, assert the without-it case matches
     pre-existing behavior.
4. Print short snippets of real model output in the script's console log —
   the ARP should quote them, not just say "verified."
5. **Tear down the server** when done (see `literary-studio-run`).

## Shape 2 — pure-reducer / pure-logic script, no network

For controller mutations, state-transform logic, or any pure function with
no I/O (e.g. `useWorkspaceController.ts`'s `setWorkspace` updater functions):

1. Copy the function body **verbatim** into a small Node script in
   scratchpad — not a reimplementation, not "logically equivalent" code.
   The point is proving the actual shipped code behaves correctly, not a
   model of it that could silently diverge.
2. Build small, realistic fixture data matching the real domain shape
   (`Book`/`AssistantThread`/etc.) — include edge cases the Step Card's own
   Validation section calls out (e.g. "refuses to delete the last
   remaining thread," "empty input doesn't create a spurious message").
3. Assert with plain `console.log("PASS: ...")`/`"FAIL: ..."` per scenario
   and a final pass/fail count — makes the ARP's Validation section easy to
   write accurately and easy for `architect-reviewer` to check.
4. Also assert **immutability** where the code claims it (original object
   unchanged, a new array/object reference returned) — this project's
   controller code is written to be immutable throughout; a script that
   doesn't check for it misses a real class of bug.

## What NOT to do

- Don't accept "the build succeeded" alone as verification for anything
  that has actual runtime behavior to observe (this mirrors the project's
  own `verify` skill principle, applied specifically to this codebase's AI
  Bus / controller shape).
- Don't mock `fetch` or the Anthropic client for Shape 1 — this project
  deliberately tests against the real API to catch prompt-contract issues a
  mock would hide (e.g. the model genuinely ignoring an instruction).
- Don't leave a scratch server running after verification — check with
  `netstat`/`curl` that the port is free again before ending the turn.
