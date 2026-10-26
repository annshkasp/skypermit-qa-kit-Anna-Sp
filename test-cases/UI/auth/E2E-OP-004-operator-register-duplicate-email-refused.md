# E2E-OP-004: Registration with an email already in use is refused, and the operator stays logged out

**Doc ref:** `skypermit/docs/01-data-model.md` ("Operator": `email` is unique); `skypermit/docs/03-api-contract.md` ("Authentication & authorisation": `POST /operators` creates the auth user and the profile together)

**Role(s):** Operator

**Preconditions:**
- An Operator already exists with email `dup-<run-id>@example.test` (for example, created by E2E-OP-001's steps or by `POST /api/v1/operators`).
- Logged out.
- National ID `NID-B-<run-id>` is not in use.

**Steps:**
1. Click `operator-register-link`.
2. Fill in `operator-register-email-input` with `dup-<run-id>@example.test` (the existing email), `operator-register-password-input` with `Another-Pass-2026!`, `operator-register-legal-name-input` with `Second Ops <run-id>` and `operator-register-national-id-input` with `NID-B-<run-id>` (unused).
3. Click `operator-register-submit-button`.

**Expected result:**
- `operator-register-error` is shown, and the browser stays on the register page with the form still visible.
- The operator is not signed in: `operator-session-info` is not shown, and `operator-login-link` and `operator-register-link` are still visible.
- Underlying state: no new Operator row exists for `NID-B-<run-id>`. The existing operator's profile and password are unchanged, so logging in with `dup-<run-id>@example.test` and `Another-Pass-2026!` fails.

**Rationale:** Email is a unique key in the data model and is also the login identity. A duplicate that partly succeeded would either take over the existing account or leave an orphaned auth user behind.

**Not asserted:** the error text and the HTTP status. The docs don't define either for a uniqueness violation (see Blocked in the reply).
