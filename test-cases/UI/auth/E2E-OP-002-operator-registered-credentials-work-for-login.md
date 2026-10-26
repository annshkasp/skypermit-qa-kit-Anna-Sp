# E2E-OP-002: Credentials created at registration work for later log out and log in

**Doc ref:** `skypermit/docs/03-api-contract.md` ("Authentication & authorisation": `POST /operators`, `POST /auth/login` with email and password, `POST /auth/logout`); `skypermit/docs/04-frontend-spec.md` ("Operator portal", login and register pages; "Two contracts to hold exactly", header selectors)

**Role(s):** Operator

**Preconditions:**
- Logged out.
- Unused email `op-<run-id>@example.test` and national ID `NID-<run-id>`.

**Steps:**
1. Click `operator-register-link`. Fill in `operator-register-email-input` (`op-<run-id>@example.test`), `operator-register-password-input` (`Sky-Permit-2026!`), `operator-register-legal-name-input` (`Login Check <run-id>`) and `operator-register-national-id-input` (`NID-<run-id>`), then click `operator-register-submit-button`.
2. Confirm `operator-session-info` shows `Login Check <run-id>`.
3. Click `operator-logout-button`.
4. Click `operator-login-link` and log in on `/login` with the same email and password.

**Expected result:**
- After step 3, the header shows `operator-login-link` and `operator-register-link`, and `operator-session-info` is gone.
- After step 4, `operator-session-info` shows `Login Check <run-id>` again. The session belongs to the same Operator that was created in step 1 (same `id` from `GET /api/v1/auth/me`).

**Rationale:** Registration creates a real Supabase Auth user, not just a profile row (`03` "Authentication & authorisation"). The auto sign-in in E2E-OP-001 doesn't prove the stored credentials work. This case checks the full register → logout → login loop.

**Note:** the `/login` page selectors are not listed in `04-frontend-spec.md`. Step 4 should bind to the login form's `data-testid`s once they are confirmed. If they are missing, report it as a bug against `skypermit`.
