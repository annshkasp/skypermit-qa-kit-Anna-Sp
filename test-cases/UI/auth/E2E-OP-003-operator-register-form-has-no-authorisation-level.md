# E2E-OP-003: Registration form offers no authorisation level, and every new operator starts at L1

**Doc ref:** `skypermit/docs/04-frontend-spec.md` ("Operator portal": "`authorisation_level` is not a field on this form — registration always starts an operator at `L1`"); `skypermit/docs/03-api-contract.md` ("Authentication & authorisation": "`authorisation_level` is no longer self-service"); `skypermit/docs/01-data-model.md` ("Operator", `authorisation_level`)

**Role(s):** Operator

**Preconditions:**
- Logged out.
- Unused email `op-<run-id>@example.test` and national ID `NID-<run-id>`.

**Steps:**
1. Click `operator-register-link`.
2. Inspect `operator-register-form`: list every element in it that has a `data-testid`.
3. Fill in the email, password, legal name and national ID inputs with the unused test data and click `operator-register-submit-button`.

**Expected result:**
- Step 2: the form contains no control for authorisation level (no `data-testid` that refers to authorisation or level, and no select or input for it).
- Step 3: registration succeeds. `GET /api/v1/auth/me` returns `authorisation_level = L1`.

**Rationale:** `authorisation_level` controls the `ZONE` gate (`OH-1 §4`, `06-business-rules.md` §6). If an operator could choose their own level, they could skip a documented business rule. The spec removed it from self-service on purpose, so this case guards against it coming back into the form.
