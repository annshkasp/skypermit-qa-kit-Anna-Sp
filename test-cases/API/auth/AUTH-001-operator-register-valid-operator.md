# AUTH-001 · Operator · Register operator with valid data creates profile at L1 and signs in

| Field | Value |
|---|---|
| **ID** | AUTH-001 |
| **Doc ref** | 03 §Authentication & authorisation; 01 §Operator; 04 §Operator portal |
| **Role(s)** | Operator |
| **Summary** | A caller with no session registers via `POST /api/v1/operators` and gets an Auth user, an Operator profile at `L1`, and a session in one request. |

## Precondition
- No operator or Supabase Auth user exists with email `reg.auth001@test.skypermit.local` or `national_id` `AUTH001-NID`.
- Client holds no session cookie and sends no `X-Reviewer-Id` header.

## Steps
1. Send `POST /api/v1/operators` with `Content-Type: application/json` and body:
   ```json
   {
     "email": "reg.auth001@test.skypermit.local",
     "password": "Auth001!Passw0rd",
     "legal_name": "Auth001 Drone Services LLC",
     "national_id": "AUTH001-NID",
     "phone": "+380441234567",
     "address_line": "1 Test Street",
     "city": "Kyiv",
     "postal_code": "01001"
   }
   ```
2. Keep the session cookie from the step 1 response and send `GET /api/v1/auth/me` with it.

## Expected result
- Step 1: 2xx success status; the response sets a session cookie.
- Step 2: `200`; the body is the new operator's profile with `email` = `reg.auth001@test.skypermit.local`, `legal_name` = `Auth001 Drone Services LLC`, `national_id` = `AUTH001-NID`, `phone`, `address_line`, `city` and `postal_code` as sent, and `authorisation_level` = `L1`.
- Exactly one Operator row and one Supabase Auth user exist for `reg.auth001@test.skypermit.local`.
