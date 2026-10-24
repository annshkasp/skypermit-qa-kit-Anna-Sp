---
name: one-page-test-plan
description: Generate a one-page test plan for the SkyPermit project from the spec docs in D:\Education\ISTQB\TestGenAI\Workshop\skypermit\docs, covering scope, risks, what we test, definition of ready, definition of done and open questions, every item traced to a doc section. Use this whenever the user asks for a test plan, test strategy, QA plan, "what should we test", test scope, risk assessment or entry/exit criteria for SkyPermit or any of its areas (gates, state machine, API, frontend, auth), even if they don't say "one page" or "test plan" explicitly.
---

# One-page test plan for SkyPermit

Produce a test plan that fits on **one printed page** (about 500–700 words) and
tells a reader what will be tested, why, what could go wrong, and when testing
can start and finish. Every claim traces to a spec doc section.

## Ground rules

- **Source of truth:** `D:\Education\ISTQB\TestGenAI\Workshop\skypermit\docs\*.md`. That repo is
  **read-only**: read and search only, never write or run state-changing
  commands there.
- **Output:** `D:\Education\ISTQB\TestGenAI\Workshop\skypermit-qa-kit\test-plan\`. Default filename
  `test-plan.md`. For a plan scoped to one area, use `test-plan-<area>.md`
  (e.g. `test-plan-gates.md`). Write UTF-8 Markdown.
- **Don't invent behavior.** If the docs don't say it, it isn't in the plan as
  a fact. A gap or contradiction becomes an Open question instead. A test plan
  built on guessed behavior sends testers after the wrong expected results.
- **Trace everything.** Cite sources as `doc §section`, e.g. `02 §States`,
  `06 §1.2`, `03 §Error semantics`. Short doc prefixes (`01`–`08`) keep the
  page compact.

## Precedence between docs

The docs say which one wins when they disagree. Apply this order and mention it
in Risks or Open questions when it matters:

1. `05-open-questions.md` is the **canonical status** of what's resolved or open.
2. `07-clarifications.md` **overrides** the literal wording of `06-business-rules.md`.
3. Otherwise treat the specific doc (API contract, state machine) as more
   authoritative than a summary or diagram (`08-uml-diagrams.md`).

If two docs still conflict after this, report it as an Open question. Don't
pick a winner silently.

## Workflow

1. **Read all eight docs in full.** They total about 1,000 lines, which is
   cheap, and risks hide in the cross-references (e.g. a rule moved between
   gates, an auth change noted in a ⚠️ callout).
2. **Find the scope.** If the user named an area (e.g. "gates only", "reviewer
   flow"), narrow to it. Otherwise cover the whole system.
3. **Draft each section** using the template below.
4. **Check the page budget.** Count words, and if it's over ~700, cut detail.
   Merge rows and drop low-value items before you drop sections. The one-page
   limit is the point: it forces prioritisation.
5. **Verify traceability.** Every row in Scope, What we test and Risks has a
   source ref, and every ref points to a section that exists.
6. **Save the file** and reply with the path plus 2–3 lines on the top risks and
   open questions. Don't paste the whole plan back into chat.

## Template

Use this structure and section order. Tables keep it dense and scannable.

```markdown
# SkyPermit Test Plan — <scope, e.g. "Full system" or "Gate pipeline">

**Version:** <date YYYY-MM-DD> · **Author:** <git user or "QA"> · **Sources:** docs 01–08

## 1. Scope
<1–2 sentences on the goal of this test effort.>
- In scope: <bullets of features/areas, each with a source ref>

## 2. What we test
| Area | Key checks | Level | Priority | Source |
|---|---|---|---|---|
| <e.g. State machine> | <e.g. all legal transitions; every other (from, action) → 409> | API / Unit | P1 | 02 §States |

## 3. Risks
| Risk | L | I | Mitigation | Source |
|---|---|---|---|---|
| <what could go wrong and its effect> | H/M/L | H/M/L | <test or action> | <ref> |

## 4. Definition of Ready (entry criteria)
- [ ] <checkable conditions that must hold before testing starts>

## 5. Definition of Done (exit criteria)
- [ ] <checkable conditions that end testing>

## 6. Open questions
| # | Question | Impact on testing | Source |
|---|---|---|---|
```

## Guidance per section

**Scope.** Base it on what the docs define: the features and areas under test,
each with a source ref. An open item, such as an undefined response code, still
belongs in scope. List its blocked check in Open questions, because it still
needs a test once it's answered.

**What we test.** Group by spec area, one row per area, roughly following the
docs: data model and derived fields, state machine, the four gates and their
evaluation order, API contract and error semantics (`422` body shape, `409`),
auth and authorisation (operator session vs. `X-Reviewer-Id`), frontend
contracts (`data-testid` stability, no picker pre-filtering), audit log. Name
concrete, high-value checks in "Key checks", especially boundaries and negative
paths, since that's where defects cluster. Levels: Unit (Vitest), API, UI, E2E.
Priority P1 means a defect would break correctness, safety or a contract;
P3 means cosmetic.

**Risks.** Aim for 5–8 risks specific to *this* spec, not generic ones like
"tight deadlines". Good sources of risk in these docs:
- rules reassigned between gates by clarifications (a test or implementation
  may still follow the old doc wording)
- time handling and boundaries (cancellation deadline, time windows, time zones)
- race conditions or state visible between calls (e.g. `validate` passes but
  `submit` fails because of overlap)
- error shapes that must *not* be used (e.g. forcing a non-gate failure into `422`)
- doc changes that broke earlier assumptions (auth, removed test IDs)
- unconfirmed citations or open items that could change expected results
L = likelihood, I = impact, each H/M/L. The mitigation should be a concrete
test or action, not "be careful".

**Definition of Ready.** Make each item checkable: something a person can tick
yes or no. Typical items: the docs version under test is identified, the open
questions that block specific tests are answered or the affected tests are
marked blocked, a test environment with seed data exists (operators at each
authorisation level, pilots, aircraft per weight band, zones incl. inactive), a
build is deployed, the `data-testid` list is available, and reviewer IDs are
known.

**Definition of Done.** Examples: all P1 checks executed and passed, no open
P1/P2 defects, every legal and illegal transition covered, every gate has a
pass and a fail case for each rule, traceability from each test to its doc
section, and open questions either closed or recorded as accepted risks.

**Open questions.** Take the still-open rows from `05-open-questions.md` and
any new ambiguity you found while reading. For each, state what it blocks in
testing (which checks can't get an expected result yet). Don't propose an answer
as fact. A placeholder suggested by the docs may be noted as "proposed, not
settled".

## Quality check before saving

- Is it ~700 words or fewer, with all 6 sections present?
- Does every table row carry a source ref?
- Do resolved items in `05` appear as normal test checks, and open items appear
  only in Open questions?
- Did you apply the `07` overrides of `06` (e.g. which gate owns which rule)?
- Is anything stated that no doc supports? If so, remove it or move it to
  Open questions.
