---
name: e2e-test-design
description: Use when designing or reviewing E2E/UI test cases for SkyPermit's operator or reviewer portal in this QA kit — deciding what scenarios to cover, which data-testid selectors to bind to, and how to structure a test around the state machine and gate pipeline. Not for API-level tests (see api-automation/CLAUDE.md) and not for choosing/configuring a framework.
argument-hint:  "What scenario are you designing a test for?"
---

# E2E test design for SkyPermit

This skill is about *deciding what to test and how to structure the test*,
not about framework mechanics. No E2E framework is chosen yet in this repo
— don't assume Playwright, Cypress, or anything else is in use until it
appears in a `package.json` here. This skill applies regardless of which
framework eventually lands.

Before designing any test, read `skypermit/docs/04-frontend-spec.md` in
full (the two portals, the `data-testid` contract) and skim
`skypermit/docs/02-state-machine.md` and `06-business-rules.md` for the
scenario you're covering. Don't re-derive facts already captured below —
they're pulled from those docs, but the docs are the source of truth if
anything drifts.

## Selector discipline

- **Only bind to `data-testid`.** Never fall back to text content, CSS
  classes, or DOM structure. If a `data-testid` seems to be missing on an
  element you need, that's a bug to report against `skypermit`, not a
  license to use a different selector.
- Treat `data-testid` values as a stable contract across test runs. If a
  test starts failing because a selector disappeared or changed, check
  whether `skypermit`'s frontend spec changed intentionally before assuming
  the test is wrong.
- Known selector churn: `operator-id-input` no longer exists (removed when
  real operator login landed). Its replacements are `operator-login-link`,
  `operator-register-link` (logged out) and `operator-session-info`,
  `operator-logout-button` (logged in). Don't write a test against the old
  selector.

## Two portals, two auth mechanisms — never mix them in one test flow

- **Operator portal**: real login via Supabase Auth (session cookie from
  `/login` or `/register`). A test acting as operator drives the UI login
  flow (or seeds a session directly, if the eventual framework supports
  that) — it never types a reviewer header.
- **Reviewer queue**: identified by an `X-Reviewer-Id` value typed into the
  header UI — not a login, no session. A test acting as reviewer sets that
  header/value and never authenticates as an operator.
- A single test *can* legitimately span both roles (e.g. operator submits →
  reviewer approves), but it must switch identity mechanisms cleanly at the
  handoff point — don't try to carry operator session state into the
  reviewer half or vice versa.

## Design tests around the state machine, not just the happy path

Source: `skypermit/docs/02-state-machine.md`. Seven states, and **any
transition not explicitly listed is illegal and must surface as an error**
— including transitions that look plausible, like re-submitting something
already `UNDER_REVIEW`, or cancelling something already `COMPLETED`.

For any UI flow that triggers a state transition, design at least:
1. The legal transition, asserting the resulting state is reflected in the
   UI (e.g. request detail view, "My requests" list filter).
2. All illegal transition attempts from that same screen, if the UI exposes
   an action that could be raced or re-triggered (e.g. double-clicking
   submit, or navigating back and re-submitting) — confirm the UI doesn't
   silently succeed or show a misleading state.
3. The `APPROVED → cancel` deadline edge: cancellation is only legal more
   than 2 hours before `window_start`. This is a state-machine rule, not a
   gate — design a test near that boundary, not just far inside or outside
   it.

## Design tests around the gate pipeline, not just pass/fail

Source: `skypermit/docs/06-business-rules.md` and
`07-clarifications.md`. Four gates evaluate in fixed order — `PILOT →
AIRCRAFT → ZONE → TIME_WINDOW` — and stop at the first failure.

- **The request form does not pre-filter.** Pilot, aircraft, and zone
  pickers show every option regardless of business rules. A key test
  category is: deliberately pick an invalid combination in the form, then
  assert the failure surfaces at `validate`/`submit` time with the correct
  gate named — not that the form somehow prevented the selection.
- Because gates stop at first failure, a test asserting "gate X fails"
  must set up a scenario where every gate *before* X would pass, or the UI
  will report the earlier gate instead. Don't construct a scenario with two
  simultaneous gate failures and assert on the later one.
- Use the **"Check before submitting"** button (`validate`) as a
  lower-cost way to assert gate outcomes without committing a state
  transition — prefer it for pure gate-logic tests, and reserve actual
  `submit` for tests that also need to verify the resulting state change.
- Note: a scenario can pass `validate` and still fail at `submit` (aircraft
  schedule overlap only counts `APPROVED`/`UNDER_REVIEW` requests, and
  another request can be approved in between). If a test needs this to be
  deterministic, control for it explicitly rather than treating it as
  flake.

## Structuring a test case

For each scenario, write down before implementing:
- **Role(s)** — operator, reviewer, or both, and the handoff point if both.
- **Starting state** — what data/state must exist before the test acts
  (e.g. an operator with a registered pilot and aircraft; a request already
  in `UNDER_REVIEW`).
- **Action** — the UI interaction sequence, named by the `data-testid`s
  involved.
- **Expected outcome** — both the visible UI result and the underlying
  state/gate result it should correspond to (e.g. "shows `422` gate failure
  for `ZONE`, cites the zone-active rule_reference").
- **Why this scenario, not just "does it work"** — tie it back to a
  specific state-machine transition, gate, or documented edge case above,
  so the test's purpose survives even if the UI implementation changes.

## What NOT to test here

- API-level contract details (status codes, error body shape) — that's
  `api-automation`'s job. An E2E test can assert the UI *reflects* a `422`
  correctly, but shouldn't re-verify the API contract itself.
- Anything requiring a `skypermit` code change to make testable — flag it
  back per this repo's `CLAUDE.md` instead of working around it (e.g. a
  missing `data-testid`).

## Test case template

Every test case gets a formal write-up, not just the informal fields
above. See `templates.md` in this skill's directory for the required
structure: **ID** (`E2E-<portal>-<seq>`), **Title**, **Doc ref** (the
specific `skypermit/docs/` section it traces to), **Role(s)**,
**Preconditions**, **Steps**, **Expected result**, and **Rationale**. Use
this format whenever writing a test case down — as a ticket, a design doc,
or a comment block above the eventual test code.

## Worked examples

See `examples.md` in this skill's directory for six fully worked test
cases in the `templates.md` format (legal transition, illegal re-submit,
gate failure via validate, the no-pre-filter contract, a cross-role
operator→reviewer flow, and the cancellation deadline boundary). Read it
when designing a new scenario for a pattern to follow, or when the
scenario at hand resembles one of the six.
