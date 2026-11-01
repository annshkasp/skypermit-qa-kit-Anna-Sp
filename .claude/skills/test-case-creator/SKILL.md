---
name: test-case-creator
description: Writes ONE atomic SkyPermit E2E test case for ONE business rule (rule_reference + gate) into test-cases/, in the kit's template format. Use when a specific uncovered rule needs a case — called per rule by /cover-gaps, or directly with a rule block from scripts/uncovered-rules.mjs. Not for reviewing existing cases (case-reviewer) or for open-ended test design (e2e-test-design).
argument-hint: "<rule block: rule_reference, gate, condition, case_id, file, rule>"
model: sonnet
context: fork
agent: general-purpose
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write(test-cases/**)
---

# Write one test case for one rule

You get one rule block (the output of `scripts/uncovered-rules.mjs` for a
single rule) and write exactly one case for it to the `file` path in the
block, with the `case_id` in the block. The ID and path were pre-assigned so
parallel runs never collide — use them as given.

Rule block:

$ARGUMENTS

If the block has no `rule_reference`, `gate`, `case_id` or `file`, write
nothing and return `{"status": "blocked", "reason": "incomplete rule block"}`.

## What "atomic" means here

One violated condition → one expected outcome with one `rule_reference`.

- Break **only** the condition named in the block. Everything else — the
  gates that run earlier (`PILOT → AIRCRAFT → ZONE → TIME_WINDOW`, first
  failure wins) and the *other* conditions of the same gate — must be set
  up to pass, and the Preconditions must say so. Otherwise a different
  check fires first and the case asserts the wrong thing.
- For a numeric rule, sit just past the boundary on the failing side (e.g.
  one minute / one gram / one metre beyond the limit), and state the exact
  value relative to the threshold. One side only — the passing side is a
  separate case, not part of this one.
- Expected result asserts that one outcome: which gate fails and which
  `rule_reference` is shown (or, for REGISTRATION, that registration is
  refused citing the rule). Don't add assertions about unrelated behaviour
  (state transitions, list contents, other gates' messages).

## Inputs you may read

- `.claude/skills/e2e-test-design/templates.md` — the field list and order.
  Follow it exactly.
- `examples/gate-failure.md` and `examples/registration-refusal.md` in this
  skill's directory — the *shape* of a good case. They are templates with
  placeholders, not data to copy.
- `../skypermit/docs/06-business-rules.md` — only if the rule block's
  `rule` line is missing or you need a threshold it doesn't state (grep for
  the `rule_reference`, don't read the whole doc).
- `../skypermit/app/**` and `../skypermit/components/**` — to learn the UI
  flow and to confirm selectors. Derive the **expected result from the docs,
  never from the code**: if code and docs disagree, the case follows the docs
  (that disagreement is what the case is for).

## Selectors

Bind only to `data-testid`. Grep every one you use in `../skypermit/app`
and `../skypermit/components` (e.g. search for `flight-request-validate-button`).
Many are passed as a `testId="..."` prop rather than written as
`data-testid="..."` — grep the bare value. Gate results render as
`flight-request-gate-result-<GATE>` with a `data-gate-status` attribute
(`PASS` / `FAIL` / `NOT_EVALUATED`) — see `components/GateResultsPanel.tsx`.
If a selector you need doesn't exist, don't invent one; return
`blocked` with the reason.

## Test data — describe it, don't invent it

Describe each entity by the property that matters ("a pilot whose rating
covers the zone class and whose certification is current at
`window_start`"), never by concrete values: no emails, names, national IDs,
serial numbers, UUIDs, or calendar dates. This keeps cases from silently
sharing fixtures and makes the one relevant property obvious.

Name a specific zone only when the rule depends on that zone's catalogue
values (its curfew, ceiling, class or permitted bands); otherwise describe
it by property ("a zone with no curfew").

Times: relative to the moment of validation ("`window_start` = validation
time + 5 h 59 min") or in zone-local time (Europe/Kyiv) for curfew rules.
Add a precondition that the chosen date is not the day of, or adjacent to,
a DST change (last Sunday of March / October) — the curfew and lead-time
maths cross a UTC offset change there, and that deserves its own case, not
an accidental one.

## Writing the file

Write the case to the `file` path from the block, as a file with a one-line
`# <condition>` heading followed by the case (`### <case_id>: <Title>` and
the template fields). Doc ref is repo-rooted (`skypermit/docs/...`). If the
block says `citation not yet confirmed`, still assert that citation and say
so in the Rationale.

Write nothing else — no other files, no edits to existing cases.

## Return

Reply with a single line of JSON and nothing else:

```json
{"status": "written", "case_id": "<case_id>", "file": "<file>", "rule_reference": "<rule_reference>", "gate": "<gate>"}
```

or `{"status": "blocked", "case_id": "<case_id>", "reason": "<one sentence>"}`.
