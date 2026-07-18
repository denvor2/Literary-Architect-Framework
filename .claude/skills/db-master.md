# DB Master Skill — Database Backup, Cleanup & Restore

**Purpose:** Safely manage database state without data loss — backup → clean duplicates → fix migrations → restore.

**When to use:**
- Before major schema migrations
- When migration conflicts block `prisma migrate dev`
- Before destructive operations (reset, seed changes)
- To preserve test data across development sessions

---

## Workflow: Backup → Clean → Restore

### 1. Dump Current Database

Create a SQL backup snapshot:

```bash
cd apps/studio

# Dump entire database (schema + data)
PGPASSWORD=postgres pg_dump \
  -h 127.0.0.1 \
  -U postgres \
  -d literary_studio \
  --no-password \
  > db_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify dump file size (should be >50KB if data exists)
ls -lh db_backup_*.sql
```

**Output:** `db_backup_YYYYMMDD_HHMMSS.sql` (keep this file!)

---

### 2. Identify Duplicate Records

Connect to database and check for duplicates:

```bash
# Launch psql shell
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d literary_studio

-- Inside psql:

-- Check Plan table for duplicates (grouped by name)
SELECT name, COUNT(*) as count FROM "Plan" GROUP BY name HAVING COUNT(*) > 1;

-- Check User table for duplicates (should be unique per email)
SELECT email, COUNT(*) as count FROM "User" GROUP BY email HAVING COUNT(*) > 1;

-- View all records with their IDs (to see which ones to keep)
SELECT id, name, tier, price FROM "Plan" ORDER BY name, createdAt;

-- Exit psql
\q
```

---

### 3. Clean Duplicate Data

If duplicates found, remove them (keep earliest by createdAt):

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d literary_studio <<'EOF'

-- Example: Remove duplicate Plan records (keep only first)
DELETE FROM "Plan" p1
WHERE p1.id NOT IN (
  SELECT MIN(id) FROM "Plan" p2 
  GROUP BY p2.name
);

-- Verify cleanup
SELECT name, COUNT(*) as count FROM "Plan" GROUP BY name;

-- Check data integrity
SELECT COUNT(*) as total_plans FROM "Plan";

EOF
```

---

### 4. Fix Migration Issues

Prisma migration conflicts resolution:

```bash
cd apps/studio

# Option A: Fix broken migration SQL directly
# Edit prisma/migrations/MIGRATION_NAME/migration.sql
# - Comment out problematic lines
# - Add proper ON CONFLICT clauses
# Example:
#   Before: INSERT INTO "Plan" VALUES (...)
#   After:  INSERT INTO "Plan" VALUES (...) ON CONFLICT (name) DO NOTHING;

# Option B: Regenerate Prisma client after schema changes
npx prisma generate

# Option C: View migration status without applying
npx prisma migrate status
```

---

### 5. Restore from Backup

When you need to roll back to a clean state:

```bash
cd apps/studio

# Get list of backups
ls -1t db_backup_*.sql | head -5

# Restore from specific backup (replace FILENAME)
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres \
  -d literary_studio \
  < db_backup_YYYYMMDD_HHMMSS.sql

# Verify restoration
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d literary_studio \
  -c "SELECT COUNT(*) as user_count FROM \"User\"; SELECT COUNT(*) as book_count FROM \"Book\";"
```

---

## Complete Workflow Example

**Scenario:** Migration conflicts, need to clean and continue.

```bash
cd apps/studio

# 1. Backup current state
PGPASSWORD=postgres pg_dump -h 127.0.0.1 -U postgres -d literary_studio --no-password > db_backup_clean.sql

# 2. Identify duplicates
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d literary_studio -c \
  "SELECT name, COUNT(*) FROM \"Plan\" GROUP BY name HAVING COUNT(*) > 1;"

# 3. Clean up (if needed)
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d literary_studio <<'CLEANUP'
DELETE FROM "Plan" WHERE id IN (
  SELECT id FROM "Plan" 
  WHERE id NOT IN (SELECT MIN(id) FROM "Plan" GROUP BY name)
);
CLEANUP

# 4. Fix migrations
# Edit prisma/migrations/BROKEN_NAME/migration.sql
# Make it safe (add ON CONFLICT, comment unused lines)

# 5. Try Prisma again
npx prisma generate
npx prisma migrate dev --name custom_assistant

# 6. Verify success
npm run validate
```

---

## Key Principles

| Principle | Why |
|---|---|
| **Always backup first** | Can't undo if something goes wrong |
| **Check duplicates before migrate** | Duplicate keys block schema changes |
| **Use ON CONFLICT in migrations** | Idempotent — safe to rerun |
| **Keep backup files for 7 days** | Recovery window for production issues |
| **Test restore on empty DB** | Verify backup file is valid |
| **Document why you cleaned** | Future you needs context |

---

## Migration Best Practices

**✅ Good migration SQL:**
```sql
INSERT INTO "Plan" (id, name, tier, price, ...) VALUES (...)
ON CONFLICT (name) DO NOTHING;  -- Safe if rerun

UPDATE "Plan" SET price = 0 WHERE id = 'xxx';
-- Idempotent: same result if run twice
```

**❌ Bad migration SQL:**
```sql
INSERT INTO "Plan" VALUES (...);  -- Fails on duplicate!

UPDATE "Plan" SET counter = counter + 1;  -- Runs twice = wrong value!
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `column X does not exist` | Migration ran out of order. Check timestamps. Fix with ON CONFLICT. |
| `duplicate key violates unique` | Duplicate records exist. Run cleanup step. |
| `relation does not exist` | Migration not applied. Run `prisma migrate deploy`. |
| `migration conflicts` | Restore from backup, fix migrations, try again. |

---

## Commands Reference

```bash
# Fast reference
pg_dump -h 127.0.0.1 -U postgres -d literary_studio --no-password > backup.sql
psql -h 127.0.0.1 -U postgres -d literary_studio < backup.sql
psql -h 127.0.0.1 -U postgres -d literary_studio -c "SELECT COUNT(*) FROM \"Plan\";"
prisma migrate status
prisma migrate dev --name feature_name
prisma generate
```

---

**Last Updated:** 2026-07-18  
**DB Connection:** literary_studio @ 127.0.0.1:5432 (dev)
