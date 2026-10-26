# E2E-OP-001: Register a new operator with all fields, signed in at L1

**Doc ref:** `skypermit/docs/04-frontend-spec.md` ("Operator portal", login and register pages; "Two contracts to hold exactly", header selectors); `skypermit/docs/03-api-contract.md` ("Authentication & authorisation": `POST /operators` creates the auth user and the Operator profile and signs in; registration always creates `L1`); `skypermit/docs/01-data-model.md` ("Operator" fields)

**Role(s):** Operator

**Preconditions:**
- Logged out (no operator session cookie).
- Unused test data: email `op-<run-id>@example.test`, national ID `NID-<run-id>` (no existing Operator has either).

**Steps:**
1. Open the app home page and confirm `operator-register-link` and `operator-login-link` are visible and `operator-session-info` is not.
2. Click `operator-register-link`.
3. Fill in the `operator-register-form`:
   - `operator-register-email-input`: `op-<run-id>@example.test`
   - `operator-register-password-input`: `Sky-Permit-2026!`
   - `operator-register-legal-name-input`: `Test Drone Ops <run-id>`
   - `operator-register-national-id-input`: `NID-<run-id>`
   - `operator-register-phone-input`: `+380441234567`
   - `operator-register-address-line-input`: `1 Test Street`
   - `operator-register-city-input`: `Kyiv`
   - `operator-register-postal-code-input`: `01001`
4. Click `operator-register-submit-button`.

**Expected result:**
- No `operator-register-error` is shown.
- The operator is signed in straight away, with no separate login step: the header shows `operator-session-info` containing `Test Drone Ops <run-id>` and `operator-logout-button`. `operator-login-link` and `operator-register-link` are no longer shown.
- Underlying state: one Operator row and one Supabase Auth user were created with the same id, and the profile fields match the input. `GET /api/v1/auth/me` in the same browser context returns that profile with `authorisation_level = L1`.

**Rationale:** This is the baseline happy path for the single combined form. One submit must create both the credentials and the profile and sign the operator in (`04` "Operator portal"; `03` "Authentication & authorisation"). It also checks the header's logged-out and logged-in selector swap that replaced `operator-id-input`. The other registration cases are compared against this one.
