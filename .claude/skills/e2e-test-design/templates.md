# Test case template

Use this structure for every E2E test case written for this kit, whether
it ends up as a design doc, a ticket, or a comment block above the actual
test code once a framework is chosen. It's a formalization of "Structuring
a test case" in `SKILL.md` — same fields, fixed order, IDs for
traceability.

## Fields

- **ID** — `E2E-<portal>-<seq>`, e.g. `E2E-OP-001` (operator portal),
  `E2E-REV-001` (reviewer queue), `E2E-X-001` (cross-role). Sequential per
  prefix, never reused even if a case is later deleted.
- **Title** — one line, states the scenario, not the mechanics (e.g.
  "Illegal re-submit of an UNDER_REVIEW request", not "click submit
  button twice").
- **Doc ref** — the specific source doc(s) and section(s) this case is
  derived from. Every case must trace to something documented — if you
  can't cite a doc section, that's a signal the case is either
  untested-project-behavior (fine, but say so explicitly) or a guess (not
  fine — go verify against the docs first).
  - **Path convention:** always write the path rooted at the repo layout —
    `skypermit/docs/<file>.md` — never `../skypermit/...`. A relative path
    only resolves correctly from this skill's own directory; a
    repo-rooted path stays correct wherever the case gets copied (a
    ticket, a PR description, a test file elsewhere in this kit).
  - **Anchor choice, most to least stable:** prefer a `rule_reference`
    value (e.g. `OH-1 §2.3`) when the case is about a gate failure — these
    are the actual citations `skypermit` returns in its `422` body, so
    they can't drift without the API contract itself changing. Next
    prefer a numbered section (`§6`, `§1.2`). Only fall back to a quoted
    heading or paraphrase (e.g. `("Cancellation deadline")`) when the doc
    has no section number for that content — and if a case's numbered
    section ever stops matching what's cited, that's a signal to re-check
    the doc, not to silently keep the old number.
- **Role(s)** — Operator, Reviewer, or both (name the handoff point if
  both).
- **Preconditions** — data/state that must exist before the test acts.
  Omit this field entirely (don't write "None") when there's truly nothing
  beyond a fresh page load.
- **Steps** — numbered, each naming the `data-testid` acted on and the
  input value where relevant. Written so someone unfamiliar with the
  scenario could execute it by hand.
- **Expected result** — the visible UI outcome *and* the underlying
  state/gate result it corresponds to. If the case asserts an error,
  name the specific error (gate name + rule_reference, or state-transition
  `409`) rather than "shows an error."
- **Rationale** — why this case exists, tied to a specific state
  transition, gate, or documented edge case. This is what keeps the case
  meaningful if the UI implementation changes later.

## Template

```markdown
### E2E-<portal>-<seq>: <Title>

**Doc ref:** `skypermit/docs/<file>.md` — `<rule_reference or §section>`

**Role(s):** <Operator | Reviewer | Operator → Reviewer>

**Preconditions:**
- <precondition 1>
- <precondition 2>

**Steps:**
1. <action, naming the data-testid>
2. <action, naming the data-testid>
3. ...

**Expected result:**
- <visible UI outcome>
- <underlying state/gate result>

**Rationale:** <why this case, tied to a doc-backed rule>
```

## Filled example

```markdown
### E2E-OP-002: Illegal re-submit of an UNDER_REVIEW request

**Doc ref:** `skypermit/docs/02-state-machine.md` (transition table,
"Every other pair ... is illegal and returns 409")

**Role(s):** Operator

**Preconditions:**
- Logged-in operator with one request already in `UNDER_REVIEW` state.

**Steps:**
1. Open the request's detail view via "My requests"
   (`flight-request-list-item`).
2. Trigger a second submit on the same request — e.g. double-click
   `flight-request-submit-button` before the first response returns, or
   navigate back and resubmit a cached form.

**Expected result:**
- UI does not show a second successful submission and does not re-enter
  `UNDER_REVIEW` from itself.
- Underlying request: `409`, state unchanged at `UNDER_REVIEW`.

**Rationale:** `02-state-machine.md` names re-submitting an already
`UNDER_REVIEW` request as an explicit illegal-transition example. A UI
that silently "succeeds" here would be masking a real `409` from the
operator.
```

See `examples.md` for six more cases in this exact format, covering the
legal-transition baseline, a gate-failure case via `validate`, the
no-pre-filter contract, a cross-role flow, and the cancellation deadline
boundary.
