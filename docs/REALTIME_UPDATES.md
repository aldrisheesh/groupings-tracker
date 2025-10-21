# Supabase Realtime Updates

## Overview
The Groupings Tracker keeps every connected client in sync by listening to Supabase Realtime broadcasts. Whenever a user adds a subject, updates a group, or modifies membership, the UI reflects the change immediately without requiring a manual refresh.

## Subscribed Tables
Realtime subscriptions are registered for the following public tables:

- `subjects`
- `students`
- `groupings`
- `groups`
- `group_members`

Each subscription listens for `INSERT`, `UPDATE`, and `DELETE` events so all CRUD operations are mirrored in the React state tree.

## Implementation Details
- **Entry point:** `src/App.tsx`
- **Helper hook:** `src/hooks/useRealtime.ts`
- **Supabase client:** `src/utils/supabase/client.ts`

`App.tsx` loads the initial data via Supabase RPC helpers and then registers realtime listeners with the reusable `useRealtime` hook. The hook:

1. Creates a dedicated channel per table (`supabase.channel('public:<table>')`).
2. Subscribes to `postgres_changes` events.
3. Dispatches the payload to the appropriate handler (`onInsert`, `onUpdate`, `onDelete`).
4. Removes the channel on cleanup (`supabase.removeChannel`).

State update logic lives alongside each subscription so that nested data (for example, students nested under a subject or members nested under a group) stays consistent. Defensive checks prevent duplicates when the local user already applied the change.

## Testing Realtime Behaviour
1. Run the Vite dev server (`npm run dev`).
2. Open the app in **two** different browser tabs.
3. Perform an action in tab A (e.g., add a student, join a group, rename a grouping).
4. Observe tab B update instantly without a refresh.
5. Repeat for deletes and edits to confirm all event types propagate.

If you need to inspect the raw payloads, temporarily add `console.log(payload)` within the handlers in `App.tsx`.

## Extending or Disabling Realtime
- **Disable for a table:** remove or comment out the corresponding `useRealtime` call in `App.tsx`.
- **Add a new table:**
  1. Create `onInsert/onUpdate/onDelete` handlers that mutate React state appropriately.
  2. Call `useRealtime({ table: '<table_name>', ...handlers })` in `App.tsx`.
  3. Ensure the new table is added to the Supabase publication (`ALTER PUBLICATION supabase_realtime ADD TABLE ...;`).

Because the logic is centralized in `useRealtime`, additional tables only require a concise handler block, keeping the subscription footprint maintainable.
