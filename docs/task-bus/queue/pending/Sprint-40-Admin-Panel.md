id: Sprint-40-Admin-Panel
name: "Sprint 40: Admin Panel (Users, Logs, Plans, Payments)"
type: epic

## Vision

Create comprehensive admin dashboard accessible via Admin button in header. Admins get:
1. **User Management** — list, block/unblock, view roles, delete
2. **Audit Logs** — view system events (logins, workspace updates, etc)
3. **Billing Management** — view/manage subscription plans, process payments
4. **Database Inspector** — view actual books saved in DB (Books/Series/Chapters)

## Scope (Planned for Sprint 40+)

### Step-01: Admin Panel Layout
- New `/admin` route (protected, admin-only)
- Header "Admin" button (only visible to admin users)
- Tab navigation (Users, Logs, Billing, Database)
- Base UI structure

### Step-02: User Management
- List all users with roles
- Block/unblock user
- Delete user (soft/permanent)
- View user workspace stats

### Step-03: Audit Logs Viewer
- Real-time log viewer
- Filter by user, event type, date range
- Search and pagination

### Step-04: Billing Dashboard
- View all subscription plans
- Manage plan tiers
- View payment history
- Manual payment processing

### Step-05: Database Inspector
- View Book/Series/Chapter/Scene structure
- Show what's saved in PostgreSQL
- Validate data integrity
- Export DB snapshot

### Step-06: Security & Permissions
- Rate limiting for admin endpoints
- Audit trail for admin actions
- Export compliance reports

## Related

- Sprint-31: Billing/Payments (provides foundation)
- Sprint-32: Logging/Audit (provides foundation)
- Sprint-30: Multi-user auth (provides foundation)

## Priority

**CRITICAL** — needed for production readiness and operational visibility
