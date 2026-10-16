# AUTH-004 · Operator · Registration without email is rejected with 400

| Field | Value |
|---|---|
| **ID** | AUTH-004 |
| **Doc ref** | 03 §Authentication & authorisation; 03 §Error semantics (`400`); 04 §Operator portal |
| **Role(s)** | Operator |
| **Summary** | Registration needs auth credentials, so a body without `email` is a malformed request and nothing is created. |

## Precondition
- No operator exists with `national_id` `AUTH004-NID`.

## Steps
1. Send `POST /api/v1/operators` with body (no `email`):
   ```json
   {
     "password": "Auth004!Passw0rd",
     "legal_name": "Auth004 No Email LLC",
     "national_id": "AUTH004-NID",
     "phone": "+380441234570",
     "address_line": "4 Test Street",
     "city": "Dnipro",
     "postal_code": "49000"
   }
   ```
2. Query the DB: `SELECT count(*) FROM operators WHERE national_id = 'AUTH004-NID';`

## Expected result
- Step 1: `400` with validation detail; no session cookie is set.
- Step 2: `0`. No Auth user was created either.
