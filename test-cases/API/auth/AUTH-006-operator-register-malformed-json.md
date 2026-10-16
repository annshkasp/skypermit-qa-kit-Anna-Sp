# AUTH-006 · Operator · Registration with malformed JSON body is rejected with 400

| Field | Value |
|---|---|
| **ID** | AUTH-006 |
| **Doc ref** | 03 §Error semantics (`400` = malformed request body) |
| **Role(s)** | Operator |
| **Summary** | A body that isn't valid JSON is refused with `400`, and no account is created. |

## Steps
1. Send `POST /api/v1/operators` with `Content-Type: application/json` and the raw body:
   `{"email": "reg.auth006@test.skypermit.local", "password": "Auth006!Passw0rd", "legal_name": `
2. Query the DB for `reg.auth006@test.skypermit.local` in `auth.users` and `operators`.

## Expected result
- Step 1: `400`; no session cookie is set.
- Step 2: no row in either table.
