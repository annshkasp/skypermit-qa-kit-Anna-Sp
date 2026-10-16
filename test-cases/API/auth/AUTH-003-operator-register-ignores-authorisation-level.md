# AUTH-003 · Operator · Registration cannot set authorisation_level above L1

| Field | Value |
|---|---|
| **ID** | AUTH-003 |
| **Doc ref** | 03 §Authentication & authorisation ("`authorisation_level` is no longer self-service"); 04 §Operator portal |
| **Role(s)** | Operator |
| **Summary** | A client-supplied `authorisation_level: "L3"` in the registration body never creates an operator above `L1`. |

## Precondition
- No operator or Auth user exists with email `reg.auth003@test.skypermit.local` or `national_id` `AUTH003-NID`.

## Steps
1. Send `POST /api/v1/operators` with body:
   ```json
   {
     "email": "reg.auth003@test.skypermit.local",
     "password": "Auth003!Passw0rd",
     "legal_name": "Auth003 Escalation Test LLC",
     "national_id": "AUTH003-NID",
     "phone": "+380441234569",
     "address_line": "3 Test Street",
     "city": "Odesa",
     "postal_code": "65000",
     "authorisation_level": "L3"
   }
   ```
2. If step 1 returned 2xx, send `GET /api/v1/auth/me` with the session cookie it set.
3. Query the DB: `SELECT authorisation_level FROM operators WHERE email = 'reg.auth003@test.skypermit.local';`

## Expected result
- No operator with `authorisation_level` = `L2` or `L3` is created.
- If the operator was created: step 2 returns `authorisation_level` = `L1`, and step 3 returns `L1`.
- If the request was refused: no Operator row and no Auth user exist for `reg.auth003@test.skypermit.local`.
- Note: 03 doesn't say whether the extra field is ignored or refused. Either outcome passes, as long as the level is never above `L1`.
