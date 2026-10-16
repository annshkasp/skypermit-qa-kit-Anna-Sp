# UIO-001 · Operator · Registering via /register form logs the operator in immediately

| Field | Value |
|---|---|
| **ID** | UIO-001 |
| **Doc ref** | 04 §Operator portal (Login and register); 04 §Two contracts to hold exactly (Selector stability); 03 §Authentication & authorisation (`POST /operators`); 01 §Operator |
| **Role(s)** | Operator |
| **Summary** | The single combined register form creates the account and profile in one submit, and the header switches to the logged-in state. |

## Precondition
- No operator or Auth user exists with email `reg.uio001@test.skypermit.local` or `national_id` `UIO001-NID`.
- Browser has no SkyPermit session (fresh profile or cookies cleared).

## Steps
1. Open the app home page.
2. Click `operator-register-link`.
3. On `/register`, fill the form (field testids not specified in 04):
   - email: `reg.uio001@test.skypermit.local`
   - password: `Uio001!Passw0rd`
   - legal name: `UIO001 Flights LLC`
   - national ID: `UIO001-NID`
   - phone: `+380441234572`
   - address line: `6 Test Street`
   - city: `Kyiv`
   - postal code: `01001`
4. Submit the form once (submit button testid not specified in 04).

## Expected result
- After step 1, `operator-login-link` and `operator-register-link` are visible, and `operator-session-info` and `operator-logout-button` are not.
- After step 2, the browser is on `/register`, showing one form with both the credential fields and the operator profile fields.
- After step 4, the operator is logged in without visiting `/login`: `operator-session-info` and `operator-logout-button` are visible, and `operator-login-link` and `operator-register-link` are not.
- No element with testid `operator-id-input` exists on any page visited.

## Open question
- 04 §Selector stability says `operator-session-info` / `operator-logout-button` are "shown when logged in", with no mention of routes, and 04 doesn't say where the operator lands after registering. The current UI renders them only on `/operator/*` pages, so the step 4 result relies on the post-register redirect to `/operator/pilots`. Confirm whether the logged-in header must show on every page, and where registration should land.
