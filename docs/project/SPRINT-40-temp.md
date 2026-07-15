# Sprint 40 — Admin Panel Shell

**Status:** Planned (Step Cards created, awaiting executor)

**Phase:** Phase 2 (Admin & Operations)

**Scope:** Create admin panel structure, layout, and role-based access control. Only shell structure; real functionality deferred to Sprint 45+.

**Context:**
- Sprint-30 completed multi-user auth with role-based access (admin/user roles)
- Sprint-32 completed audit logging system
- Sprint-31 (Billing) frozen until Sprint-45
- Step Card: Sprint-40-Step-01 in docs/task-bus/queue/pending/

## Definition of Done

- [x] Sprint-40-Step-01 Step Card created
- [ ] Step-01 implemented (admin shell, routing, role protection, 4 placeholder sections)
- [ ] Live verification passed
- [ ] Architecture review completed
- [ ] Sprint closed and documented

## Step Cards

### Step-01: Admin Panel Shell
**File:** docs/task-bus/queue/pending/Sprint-40-Step-01.md

Create /admin route with layout, routing, and placeholder sections:
- /admin/layout.tsx — Admin panel layout with navigation
- /admin/page.tsx — Admin panel main dashboard
- /admin/users/page.tsx — User Management (placeholder)
- /admin/logs/page.tsx — Audit Logs (placeholder)
- /admin/billing/page.tsx — Billing & Payments (placeholder)
- /admin/database/page.tsx — Database Inspector (placeholder)
- middleware.ts — Extend to protect /admin/* routes (admin role only)
- Header.tsx — Add Admin button (visible only to admin users)

**Allowed:** Only structure and UI shell; no real CRUD or API logic.

**Dependencies:** Sprint-30 (auth), Sprint-32 (audit logs)

**Questions for PO:**
1. AdminAuditPanel.tsx already exists with full functionality — should we move it to /admin/logs or leave as separate audit route?
2. Non-admin redirect: 403 in middleware + redirect to / or show "Access Denied" message?

## Future Steps (Sprint 45+)

- Step-02: User Management (list, block/unblock, delete)
- Step-03: Billing Dashboard (plan management, payment processing)
- Step-04: Database Inspector (view schema, data integrity checks)
- Step-05: Security & Compliance (rate limiting, export reports)

## Related Sprints

- Sprint-30: Multi-user auth system (foundation)
- Sprint-32: Logging & audit system (foundation)
- Sprint-31: Billing & payments (frozen until Sprint-45)
