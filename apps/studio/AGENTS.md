<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Validation Commands

Always run after code changes:

```bash
npx tsc --noEmit          # type check
npx eslint src            # lint
npx prettier --check "src/**/*.{ts,tsx}"  # formatting
npm run build             # production build
```

## E2E Testing (Playwright)

Tests live in `e2e/` directory. Uses system Chrome (no Chromium download).

```bash
npm run test:e2e          # run all tests headless
npm run test:e2e:ui       # interactive UI mode
npm run test:e2e:debug    # step-by-step debug
```

**Writing tests:**
- Use `page.getByRole()`, `page.getByText()`, `page.getByLabel()` — not CSS selectors
- Each test must be independent (no shared state)
- Clean up: tests run on empty localStorage by default
- API tests (Line Editor, Critic, etc.) require `ANTHROPIC_API_KEY` in `.env.local`

**Test categories:**
- `e2e/smoke.spec.ts` — basic loading, CRUD, navigation, persistence
- Add new test files as `e2e/<feature>.spec.ts`
