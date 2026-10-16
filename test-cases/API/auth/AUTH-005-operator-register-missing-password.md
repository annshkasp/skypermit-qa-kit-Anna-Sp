# AUTH-005 · Operator · Registration without password is rejected with 400

| Field | Value |
|---|---|
| **ID** | AUTH-005 |
| **Doc ref** | 03 §Authentication & authorisation; 03 §Error semantics (`400`); 04 §Operator portal |
| **Role(s)** | Operator |
| **Summary** | A body without `password` is a malformed request: neither an Auth user nor an Operator profile is created. |

## Precondition
- No operator or Auth user exists with email `reg.auth005@test.skypermit.local`.

## Steps
1. Send `POST /api/v1/operators` with body (no `password`):
   ```json
   {
     "email": "reg.auth005@test.skypermit.local",
     "legal_name": "Auth005 No Password LLC",
     "national_id": "AUTH005-NID",
     "phone": "+380441234571",
     "address_line": "5 Test Street",
     "city": "Kharkiv",
     "postal_code": "61000"
   }
   ```
2. Query the DB for `reg.auth005@test.skypermit.local` in `auth.users` and `operators`.

## Expected result
- Step 1: `400` with validation detail; no session cookie is set.
- Step 2: no row in either table. A half-created state, with an Auth user but no profile, must not exist.
