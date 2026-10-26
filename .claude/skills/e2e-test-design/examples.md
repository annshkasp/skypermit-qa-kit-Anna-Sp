# Worked examples

Six test cases in the format defined by `templates.md`, covering the
patterns called out in `SKILL.md`. These are design artifacts (what to
test and why), not implementation code — no framework is chosen yet.
Selectors below are illustrative `data-testid` names; confirm actual
values against `skypermit/docs/04-frontend-spec.md` before writing real
code. `E2E-OP-002` (illegal re-submit) is filled out in `templates.md`
itself — not repeated here.

### E2E-OP-001: Legal transition, DRAFT through submit to UNDER_REVIEW

**Doc ref:** `skypermit/docs/02-state-machine.md` (transition table,
`DRAFT`→submit→`SUBMITTED`→`UNDER_REVIEW`)

**Role(s):** Operator

**Preconditions:**
- Logged-in operator with one registered pilot (current certification,
  matches a permitted zone class) and one registered aircraft (weight band
  within a zone's `permitted_bands`).
- No existing request for that aircraft overlapping the chosen window.

**Steps:**
1. Fill the request creation form: `zone-picker`, `pilot-picker`,
   `aircraft-picker`, `window-start-input`, `window-end-input`,
   `altitude-input`, `purpose-input` — a combination expected to pass all
   four gates.
2. Click `flight-request-submit-button`.

**Expected result:**
- UI shows the request detail view in `UNDER_REVIEW` state.
- "My requests" list, filtered to `UNDER_REVIEW`, includes it.

**Rationale:** Establishes the baseline legal transition that every
gate-failure case below is contrasted against.

---

### E2E-OP-003: PILOT gate failure surfaced via "Check before submitting"

**Doc ref:** `skypermit/docs/06-business-rules.md` — `OH-1 §2.3`
("Certification not current", §6 rule_reference table)

**Role(s):** Operator

**Preconditions:**
- Logged-in operator with a pilot whose certification lapsed (>18 months
  since `certified_on` relative to the chosen `window_start`) — designed to
  fail `PILOT` specifically.
- Aircraft, zone, and time window all otherwise valid, so no earlier gate
  in the pipeline order fires first.

**Steps:**
1. Fill the form with that pilot and an otherwise-valid combination.
2. Click `flight-request-check-button` (validate), not submit.

**Expected result:**
- UI shows a per-gate result with `PILOT` marked failing, citing the
  currency rule's `rule_reference` from `06-business-rules.md` §6.
- Request state remains `DRAFT` — validate never changes state.

**Rationale:** Exercises the "gates stop at first failure" ordering
deliberately — everything before `PILOT` in the pipeline passes, isolating
it cleanly. Also exercises `validate` as the low-cost gate-assertion path
called out in `SKILL.md`.

---

### E2E-OP-004: Form does not pre-filter an invalid aircraft/zone pairing

**Doc ref:** `skypermit/docs/04-frontend-spec.md` ("The form does not
pre-filter"); gate assignment confirmed in `skypermit/docs/07-clarifications.md`
item 1 — `rule_reference` is `ZC-2026.1 §2` (per `06-business-rules.md` §6)

**Role(s):** Operator

**Preconditions:**
- Logged-in operator with an aircraft whose weight band is not in the
  target zone's `permitted_bands`.

**Steps:**
1. In the request creation form, select that zone (`zone-picker`) and that
   aircraft (`aircraft-picker`) together.
2. Confirm the picker does not prevent or grey out the combination.
3. Click `flight-request-check-button`.

**Expected result:**
- The picker allows the selection — no client-side filtering.
- `validate` reports `AIRCRAFT` as the failing gate (per
  `07-clarifications.md` item 1, this rule lives in the aircraft gate, not
  the zone gate, despite `ZC-2026.1 §2`'s literal wording).

**Rationale:** Directly tests the documented "form does not pre-filter"
contract. A regression here (the picker suddenly filtering) would be a
silent, undocumented UI behavior change worth catching even though it
might look like an improvement.

---

### E2E-X-001: Cross-role flow — operator submits, reviewer approves

**Doc ref:** `skypermit/docs/02-state-machine.md` (`UNDER_REVIEW`→
approve→`APPROVED`); auth mechanisms per
`skypermit/docs/04-frontend-spec.md`

**Role(s):** Operator → Reviewer (handoff after step 1)

**Preconditions:**
- A request in `UNDER_REVIEW` (e.g. the result of `E2E-OP-001`).

**Steps:**
1. As operator (session cookie): open "My requests", confirm the request
   shows `UNDER_REVIEW`. End the operator portion here — do not carry this
   session into the next step.
2. As reviewer (set `X-Reviewer-Id` via the header UI, no login): open the
   pending requests table, locate the request, open its detail view (all
   four gate results visible), click `flight-request-approve-button`.

**Expected result:**
- Request transitions to `APPROVED`.
- Switching back to the operator view (same or a fresh session) shows the
  updated state.

**Rationale:** Validates the two auth mechanisms independently and the
clean handoff between them — the most common way a test accidentally
leaks one identity into the other is by reusing a single browser
context/cookie jar across both halves without resetting it.

---

### E2E-OP-005: Cancellation deadline boundary on an APPROVED request

**Doc ref:** `skypermit/docs/02-state-machine.md` ("Cancellation
deadline")

**Role(s):** Operator

**Preconditions:**
- Variant (a): an `APPROVED` request with `window_start` more than 2 hours
  away.
- Variant (b): an `APPROVED` request with `window_start` less than 2 hours
  away.

**Steps:**
1. Click `flight-request-cancel-button` on the request.

**Expected result:**
- Variant (a): succeeds, request moves to `CANCELLED`.
- Variant (b): refused — UI shows an error, state remains `APPROVED`. This
  is a state-transition rule, not a gate result — the UI's error
  presentation should not resemble a `422` gate-failure display.

**Rationale:** The 2-hour boundary is easy to get backwards (off by one on
which side is legal) and easy to conflate with a gate failure in the UI's
error handling — worth a dedicated boundary case rather than folding it
into a generic cancel-flow test.
