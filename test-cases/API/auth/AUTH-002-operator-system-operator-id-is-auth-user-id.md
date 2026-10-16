# AUTH-002 · Operator, System · Registered operator's id equals its Supabase Auth user id

| Field | Value |
|---|---|
| **ID** | AUTH-002 |
| **Doc ref** | 01 §Operator (`id`, migration `0004_operators_id_is_auth_user.sql`); 03 §Authentication & authorisation |
| **Role(s)** | Operator, System |
| **Summary** | Registration keys the Operator row by the Auth user's own id, with no separate `user_id` column. |

## Precondition
- No operator or Auth user exists with email `reg.auth002@test.skypermit.local` or `national_id` `AUTH002-NID`.
- Read access to the test database (`auth.users` and `operators`).

## Steps
1. As Operator (not yet registered, no session), send `POST /api/v1/operators` with body:
   ```json
   {
     "email": "reg.auth002@test.skypermit.local",
     "password": "Auth002!Passw0rd",
     "legal_name": "Auth002 Aerial LLC",
     "national_id": "AUTH002-NID",
     "phone": "+380441234568",
     "address_line": "2 Test Street",
     "city": "Lviv",
     "postal_code": "79000"
   }
   ```
2. As System, run `SELECT id FROM auth.users WHERE email = 'reg.auth002@test.skypermit.local';`
3. As System, run `SELECT id FROM operators WHERE email = 'reg.auth002@test.skypermit.local';`
4. As System, inspect the `operators` table's columns.

## Expected result
- Step 1: 2xx success status.
- Steps 2–3: each query returns exactly one row, and the two `id` values are identical.
- Step 4: `operators.id` is a FK to `auth.users(id)` with `ON DELETE CASCADE`, and there is no `user_id` column.
