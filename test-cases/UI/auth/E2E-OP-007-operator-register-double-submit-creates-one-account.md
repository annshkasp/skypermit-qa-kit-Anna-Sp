# E2E-OP-007: Double-submitting the registration form creates exactly one operator

**Doc ref:** `skypermit/docs/01-data-model.md` ("Operator": `email` and `national_id` are unique); `skypermit/docs/03-api-contract.md` ("Authentication & authorisation": `POST /operators` creates one Supabase Auth user and one Operator profile, then signs in)

**Role(s):** Operator

**Preconditions:**
- Logged out.
- Unused email `op-<run-id>@example.test` and national ID `NID-<run-id>`.

**Steps:**
1. Click `operator-register-link`.
2. Fill in `operator-register-email-input`, `operator-register-password-input` (`Sky-Permit-2026!`), `operator-register-legal-name-input` (`Race Ops <run-id>`) and `operator-register-national-id-input` with the unused data.
3. Double-click `operator-register-submit-button`, or click it a second time before the first response arrives.

**Expected result:**
- The operator ends up signed in once: `operator-session-info` shows `Race Ops <run-id>`.
- The UI does not show an error for the first, successful attempt. If a stale `operator-register-error` (for example "already exists") appears next to a signed-in header, that is a failure: the UI would be showing a misleading state.
- Underlying state: exactly one Operator row and one Supabase Auth user exist for `op-<run-id>@example.test` and `NID-<run-id>`.

**Rationale:** This is the re-trigger case the e2e-test-design skill asks for on any action that commits a write. Uniqueness should stop a second account from being created, but the UI must also not show the losing duplicate request as the result.
