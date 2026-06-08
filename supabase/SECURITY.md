# Supabase Row Level Security — KNSL Legal Intelligence

## Migrations (run in order)

1. `migrations/20240608000000_auth_profiles_data.sql` — base schema
2. `migrations/20240608120000_rls_production.sql` — production RLS + chat/project tables

## Security model

| Role | Access |
|------|--------|
| `anon` | **No** direct access to application tables |
| `authenticated` | Only rows where `user_id = auth.uid()` (or `profiles.id = auth.uid()`) |
| `service_role` | Bypasses RLS — **server only**, never in frontend |

The frontend uses the **anon key** with the user's JWT. Postgres evaluates `auth.uid()` from that JWT on every query.

## Tables & policies

### `profiles`

- **Key:** `id` = `auth.users.id`
- **SELECT / INSERT / UPDATE:** own row only
- **DELETE:** not allowed via client (account deletion via Auth API + CASCADE)

**Why:** Profile row is 1:1 with auth identity; no user should read or edit another user's name, firm, or role.

### `projects`

- **Ownership:** `user_id`
- Full CRUD on own projects only

**Why:** Workspaces/perkara are tenant-isolated at the user level.

### `documents`

- **Ownership:** `user_id`
- Optional `project_id` — if set, `user_owns_project(project_id)` must be true

**Why:** Prevents attaching a document to another user's project while spoofing only `project_id`.

### `conversations`

- Same pattern as documents (user + optional project)

**Why:** Legal chat threads are private per account.

### `messages`

- **Ownership:** `user_id` **and** parent `conversation_id` must belong to `auth.uid()`

**Why:** This blocks the most common chat leak: inserting or reading messages by guessing a `conversation_id` UUID. Even with a valid `conversation_id` from another user, `user_owns_conversation()` returns false.

### `usage_tracking`

- **SELECT / INSERT:** own rows only
- **UPDATE / DELETE:** no client policies (immutable usage log)

**Why:** Users can report their own AI usage; they cannot tamper with or delete historical usage.

### `case_analyses` / `contract_reviews` (legacy)

- Replaced single `FOR ALL` policies with per-operation policies
- Same `user_id = auth.uid()` on USING and WITH CHECK

**Why:** `WITH CHECK` on UPDATE stops changing `user_id` to another account after insert.

### `audit_log`

- **SELECT / INSERT:** own rows only
- Removed admin-wide SELECT (cross-user access)

**Why:** Aligns with "users only access their own data." Admin dashboards should use `service_role` on a secure backend, not the browser.

## Hardening choices

1. **`FORCE ROW LEVEL SECURITY`** — policies apply even to table owner roles (except superuser/service_role).
2. **`TO authenticated`** — policies do not grant `anon` accidental access.
3. **`REVOKE ALL … FROM anon`** — defense in depth if RLS is misconfigured.
4. **Separate INSERT policies with `WITH CHECK`** — blocks `user_id` spoofing in request body.
5. **Helper functions** `user_owns_project` / `user_owns_conversation` — consistent nested ownership checks.

## Verify RLS (SQL Editor, as test user)

```sql
-- Should return only your row
SELECT * FROM profiles;

-- Should return empty (not another user's id)
SELECT * FROM messages WHERE user_id != auth.uid();
```

## Client requirements

Always set ownership from the session, never trust client input alone:

```js
const { data: { user } } = await supabase.auth.getUser();
await supabase.from("messages").insert({
  user_id: user.id,  // must match JWT; RLS rejects otherwise
  conversation_id,
  role: "user",
  content: "...",
});
```

## Service role

Use **only** on Vercel serverless / trusted workers for:

- Admin analytics
- Batch jobs
- Migrations

Never expose `SUPABASE_SERVICE_ROLE_KEY` in `VITE_*` env vars.
