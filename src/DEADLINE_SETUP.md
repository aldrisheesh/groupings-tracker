# Optional registration deadlines

Deadline controls are on each grouping page in admin mode. Students see a quiet countdown only when a deadline is enabled. Dates use the viewer's time zone and are stored as absolute timestamps. “2 days” means 48 hours from the time the preset is selected.

## Deployment

1. Enable **Supabase Cron** in the project's Integrations page. See [Supabase's installation instructions](https://supabase.com/docs/guides/cron/install).
2. Run `src/supabase/migrations/004_optional_deadlines.sql` in the Supabase SQL editor after migrations 001–003. Run it once, as a whole transaction. It creates the fields, database checks, protected settings function, and the once-per-minute `assign-expired-groupings` job.
3. Configure these server-only Vercel environment variables: `ADMIN_PASSWORD` (existing), `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`. Never use a `VITE_` prefix for the service role key. Redeploy the application after configuring them.
4. Sign out of admin mode and back in to establish the new eight-hour HttpOnly admin session.
5. On a test grouping, set a deadline a few minutes ahead. Confirm that registration closes at the chosen time and assignment finishes on the next cron run. The job works without an open browser. Inspect Cron job history for failures.

For local end-to-end testing, use a Vercel development server with these environment variables. Plain `npm run dev` serves the frontend but does not serve the `/api` handlers.

## Behavior

- No deadline: existing manual grouping behavior.
- With a deadline: members must use an exact enrolled name (case and repeated whitespace are normalized). Enabling the deadline validates existing memberships and links them to student IDs. Ambiguous, abbreviated, unenrolled, or duplicate legacy memberships must be corrected first; the app never guesses their identities.
- At expiry: database time closes member additions/removals, including direct browser requests. Existing members stay in place. The job shuffles remaining enrolled students and fills smaller groups first, randomly breaking ties, without exceeding capacity.
- Insufficient space: assign as many students as fit and display the number remaining. Add seats and set a new future deadline to run another assignment. Existing assignments are preserved.
- Assignment errors: roll back that grouping's entire assignment, record a visible delayed status, and retry on the next minute. Inspect the database job logs for the detailed exception.
- Repeated job execution never reshuffles a completed grouping. A grouping that is manually locked is still automatically assigned when its deadline arrives.
- To change membership after expiry, remove or extend the deadline first. The separate manual lock is preserved. Disabling a deadline does not undo assignments already made.
- New students enrolled after completion wait for a newly configured deadline; they are not silently assigned by an already completed job.
- Existing realtime subscriptions deliver assignments and status. While a deadline is pending, the active page also refreshes every 30 seconds and on window focus in case a realtime update was missed.

The migration protects deadline configuration and the member cutoff. It does not convert the application's existing permissive database policies for other administrative actions into a full role-based authorization system.

## Verification

`npm test` runs the SQL migrations against an isolated PostgreSQL-compatible PGlite database and checks assignment, capacity shortages, optional/cancelled deadlines, duplicate membership rejection, exact cutoff enforcement, authorization, rollback/retry, and idempotence. Cron scheduling is stubbed in that local test; the actual hosted scheduler must be checked after deployment. The tests also cover signed admin sessions. `npm run build` verifies the frontend production bundle.
