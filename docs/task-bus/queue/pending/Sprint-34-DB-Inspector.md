id: Sprint-34-DB-Inspector
name: "Database Inspector: View saved books in PostgreSQL"
type: feature

## Objective

Add Database Inspector UI section to verify that books are actually being saved to PostgreSQL. Shows real data from DB to validate persistence layer.

## Scope

### Admin-only Feature

- New tab or section in admin panel (or accessible via gear settings)
- Show real database content (Books, Series, Chapters, Scenes)
- Validate data integrity
- Help with debugging sync issues

### Features

1. **Books View**
   - List all books for current user in database
   - Show: id, title, seriesId, createdAt, updatedAt
   - Compare with in-memory books (show sync status)
   - Link to Series if book belongs to one

2. **Series View**
   - List all series for current user
   - Show books count per series
   - Show: id, title, description, order, createdAt

3. **Chapters/Scenes View**
   - Expandable tree (like editor)
   - Show count of chapters per book
   - Show count of scenes per chapter

4. **Sync Status**
   - Show which books are in localStorage only (not in DB)
   - Show which books are in DB only (not in memory)
   - Highlight discrepancies

## Implementation Notes

- Uses `/api/workspace` GET to fetch actual DB data
- Read-only (no edits from this view)
- Helpful for debugging autosave issues
- Can be toggled via dev menu or admin panel

## Validation

- Admin can see real database state
- Can verify that books persisted after creating/editing
- Can identify sync issues between localStorage and DB

## Timeline

- Can be part of Sprint-34 (bonus) or moved to Sprint-40 (Admin Panel)
- Low priority but high diagnostic value

## Related

- Sprint-34-Step-02: Prisma schema (DB foundation)
- Sprint-40: Admin Panel (where this could live)
