id: Sprint-34-API-Fix-01
name: "Fix missing and failing API routes"
type: implementation

scope:
  allowed_paths:
    - apps/studio/src/app/api/
    - apps/studio/src/repositories/
  forbidden_paths:
    - apps/studio/src/domain/
    - docs/
    - package.json

objective: |
  Fix critical API failures discovered during Sprint-34 UI testing:
  - /api/workspace (GET/PUT) returns 500 — route missing or logic error
  - /api/billing/plan (GET) returns 404 — endpoint misconfigured or missing

inputs:
  - Console error logs from http://localhost:3000 (2026-07-15)
  - sprint-34 UI verification findings

outputs:
  - Created or fixed /api/workspace/route.ts with GET/PUT handlers
  - Verified /api/billing/plan returns 200 with plan data
  - No red ❌ errors in browser console (F12) after login
  - ARP documenting what was broken and why

validation:
  - npx tsc --noEmit passes (no type errors)
  - npm run build succeeds
  - curl -s http://localhost:3000/api/workspace returns valid JSON (not 500)
  - curl -s http://localhost:3000/api/billing/plan returns valid plan object (not 404)
  - Browser F12 console shows no GET/PUT errors to /api/workspace or /api/billing/plan

done_when:
  - All API endpoints return 200/201 status codes
  - No 500 or 404 errors in browser console during normal use
  - ARP filed with root cause analysis for each endpoint
  - Step Card archived to done/
