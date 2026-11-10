# Jerky consignment — three-number metrics (merge checklist)

## What changes

Store cards derive **On shelf**, **Sold not paid**, and **Paid** from `consignment_log` (replay). No new columns are required on `consignment_partners`.

Optional new log note shape (written by the app going forward):

- `Sold N pieces on YYYY-MM-DD`

Existing notes (`Dropped off…`, `Paid…`, `Counted…`, `Closed cycle…`) are unchanged.

## Migration at merge

**No Supabase DDL is required.** Deploy the app only.

Post-deploy validation (read-only SQL you can run in the Jerky project SQL editor):

```sql
-- Spot-check drop dates use `at`, not created_at
select partner_id, at, created_at::date, left(note, 40)
from consignment_log
where note ~ '^Dropped off'
order by at desc
limit 20;
```

Do **not** bulk-insert or rewrite production log rows as part of this release.

## Reversible rollout

- Revert the deployment; numbers fall back to the previous UI logic.
- `Sold …` log lines added after release are ignored by older builds (unstructured notes only).
