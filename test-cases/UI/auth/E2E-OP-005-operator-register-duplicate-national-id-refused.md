# E2E-OP-005: Registration with a national ID already in use is refused, with no orphaned login left behind

**Doc ref:** `skypermit/docs/01-data-model.md` ("Operator": `national_id` is unique; `id` is the Supabase Auth user's own id); `skypermit/docs/03-api-contract.md` ("Authentication & authorisation": `POST /operators` creates the Supabase Auth user *and* the Operator profile in one request)

**Role(s):** Operator

**Preconditions:**
- An Operator already exists with national ID `NID-<run-id>`.
- Logged out.
- Email `fresh-<run-id>@example.test` is not in use.

**Steps:**
1. Click `operator-register-link`.
2. Fill in `operator-register-email-input` with `fresh-<run-id>@example.test` (unused), `operator-register-password-input` with `Sky-Permit-2026!`, `operator-register-legal-name-input` with `Clone Ops <run-id>` and `operator-register-national-id-input` with `NID-<run-id>` (already in use).
3. Click `operator-register-submit-button`.
4. Click `operator-login-link` and try to log in with `fresh-<run-id>@example.test` and `Sky-Permit-2026!`.

**Expected result:**
- After step 3: `operator-register-error` is shown, the browser stays on the register page, and `operator-session-info` is not shown.
- After step 4: login fails, and no session is created.
- Underlying state: no Operator row and no Supabase Auth user exist for `fresh-<run-id>@example.test`.

**Rationale:** The national ID clash is found only when the profile is saved, after the auth user has already been created. Because the spec defines registration as one action that creates both, a failure must leave neither behind. Step 4 shows that from the UI: a leftover auth user would block that email from registering again, and could log in with no profile.

**Not asserted:** the error text and the HTTP status (see Blocked in the reply).
