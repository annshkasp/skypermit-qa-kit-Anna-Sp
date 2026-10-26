# E2E-OP-006: Registration without an email or a password creates no account

**Doc ref:** `skypermit/docs/04-frontend-spec.md` ("Operator portal": registration form = "auth credentials (email, password) plus the Operator profile fields"); `skypermit/docs/03-api-contract.md` ("Authentication & authorisation": `POST /auth/login` logs in "with email + password")

**Role(s):** Operator

**Preconditions:**
- Logged out.
- Unused email `op-<run-id>@example.test` and national ID `NID-<run-id>`.

**Steps:**
Run each variant from a fresh `/register` page (click `operator-register-link`):
1. **Variant (a), no email:** leave `operator-register-email-input` empty. Fill in `operator-register-password-input` (`Sky-Permit-2026!`), `operator-register-legal-name-input` (`No Email <run-id>`) and `operator-register-national-id-input` (`NID-<run-id>`). Click `operator-register-submit-button`.
2. **Variant (b), no password:** fill in `operator-register-email-input` (`op-<run-id>@example.test`), legal name and national ID. Leave `operator-register-password-input` empty. Click `operator-register-submit-button`.

**Expected result (both variants):**
- Registration does not go through. The page stays on `/register` with the entered values kept, either because the browser blocks the submit or because `operator-register-error` is shown.
- The operator is not signed in: `operator-session-info` is not shown.
- Underlying state: no Operator row exists for `NID-<run-id>`, and no Supabase Auth user exists for `op-<run-id>@example.test`.

**Rationale:** Email and password are the operator's only login credentials (`03` `/auth/login`). An account created without one of them could never be used to log in.

**Note:** the expected outcome allows either browser-side or server-side blocking on purpose. The docs don't say where required fields are enforced, so the test should check only that no account is created and no session starts.
