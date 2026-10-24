---
name: low-level-test-cases
description: Generate low-level (concrete, executable) test cases for the SkyPermit project from the spec docs in D:\Education\ISTQB\TestGenAI\Workshop\skypermit\docs, one Markdown file per test case under test-cases/API/{module}/ or test-cases/UI/{module}/, each with ID, doc reference, role(s), summary, preconditions, exact steps and exact expected result. Use this whenever the user asks to write, generate, add or extend test cases, test scenarios, negative/boundary tests or checks for any SkyPermit area (auth, registry, zones, state machine, PILOT/AIRCRAFT/ZONE/TIME_WINDOW gates, validate/submit, reviewer flow, data integrity, operator portal or reviewer queue UI), even if they just say "cover X with tests" or name a module like GT or SM.
---

# Low-level test cases for SkyPermit

Write test cases that a tester (or an automation engineer) can execute without
interpreting anything: concrete endpoints, payload values, headers, clock
times, and an exact expected status code and body/state. "Low-level" means a
tester never has to decide *what* value to type or *what* counts as a pass.

## Ground rules

- **Source of truth:** `D:\Education\ISTQB\TestGenAI\Workshop\skypermit\docs\*.md`. That repo is
  **read-only**: read and search only.
- **Don't invent behavior.** Every expected result must be stated or directly
  implied by a doc. If a doc leaves it undefined, don't write the case as if it
  were known (see "Blocked by open questions" below). A test with a guessed
  expected result is worse than no test: it fails correct code or passes
  wrong code.
- **Doc precedence:** `05-open-questions.md` is the canonical status of what's
  open; `07-clarifications.md` overrides `06-business-rules.md`; specific docs
  (API, state machine) beat summaries and diagrams (`08`). Example: the
  weight-band rule fails `AIRCRAFT`, not `ZONE` (`07 §1`).

## Modules

Test cases are split by test level first, then by module:

- `D:\Education\ISTQB\TestGenAI\Workshop\skypermit-qa-kit\test-cases\API\<module>\`: everything executed
  without a browser: HTTP requests to `/api/v1/...`, response/DB checks.
- `D:\Education\ISTQB\TestGenAI\Workshop\skypermit-qa-kit\test-cases\UI\<module>\`: everything executed
  in a browser through the operator portal or reviewer queue (`04`).

The **Level** column below says which one a module belongs to. If a feature
needs both (e.g. registration), write API cases for the rules and contract, and
UI cases for what the user sees. They go in different modules with different
prefixes.

Use the folder name and ID prefix below. Pick the module by *what behavior is
under test*, not by which endpoint happens to be called — e.g. a curfew check
called via `submit` belongs to `gate-time-window`, not `state-machine`.

| Level | Folder | Prefix | Covers | Main sources |
|---|---|---|---|---|
| API | `auth` | AUTH | register/login/logout/me, `401` vs `403`, session-derived `operator_id`, reviewer-or-owner reads, `L1` at registration | 03 §Auth |
| API | `api-registry` | REG | operators, pilots, aircraft create/read/list, uniqueness, 30,000 g registration limit, derived band/currency in responses | 03 §Registry, 01, 06 §3 |
| API | `api-zones` | ZON | zone list/detail, no write endpoints, seed catalogue values | 03 §Reference data, 06 §4 |
| API | `state-machine` | SM | legal transitions, illegal pairs → `409`, terminal states, `SUBMITTED` never at rest, cancel deadline | 02, 06 §5 |
| API | `gate-pilot` | GP | rating vs zone class, 18-month currency vs `window_start` | 06 §1.1, §2, 07 §2 |
| API | `gate-aircraft` | GA | weight band vs `permitted_bands`, band boundaries | 06 §1.2, §3, 07 §1 |
| API | `gate-zone` | GZ | altitude vs ceiling, operator authorisation level, inactive zone | 06 §1.3 |
| API | `gate-time-window` | GT | lead time, 60-day max, duration, curfew, overlap, UTC conversion | 06 §1.4, 01 §Time handling |
| API | `gate-pipeline` | PIPE | gate order / first failure only, `422` body, `validate` = `submit` without side effects | 06 §Evaluation order, §6, 03 |
| API | `reviewer` | REV | approve/reject, `X-Reviewer-Id`, required note, `ReviewAction`, `decided_by`/`decided_at` | 03 §Reviewer, 01 §ReviewAction |
| API | `data-integrity` | DATA | derived values never stored, FKs, enums, UTC, 2,000-char purpose, AuditLog append-only | 01, 02 §Implementation note |
| UI | `ui-operator-portal` | UIO | login/register pages, registry forms, request form (no picker pre-filtering), check-before-submit, my requests, detail view | 04 §Operator portal |
| UI | `ui-reviewer-queue` | UIR | queue table and sorting, gate results on detail, approve/reject with note | 04 §Reviewer queue |

If a request doesn't fit any module, propose a new folder + prefix to the user
before writing into it, so the structure stays deliberate.

## Roles

Use these role names consistently (they appear in titles and filenames):

| Role | Meaning |
|---|---|
| `Operator` | The operator persona: a logged-in operator acting on its own resources, **and** someone registering or logging in as an operator (no session yet; state that in Precondition) |
| `Other operator` | Logged-in operator acting on someone else's resources (expects `403`) |
| `Reviewer` | Caller sending `X-Reviewer-Id`, no operator session |
| `Anonymous` | An unidentified caller hitting a protected endpoint without a session or reviewer header (expects `401`). Not used for register/login flows: those belong to `Operator` |
| `System` | Maintenance endpoint or DB-level actor (e.g. completion, triggers, direct SQL checks) |

The role names the business persona whose feature is being tested, not the
caller's authentication state. Session state belongs in Precondition.

A case can have several roles (e.g. Operator creates and submits, Reviewer
approves). List them in order of appearance.

## File naming and IDs

- One test case per file: `test-cases/<API|UI>/<folder>/<ID>-<role-slug>-<summary-slug>.md`
  - e.g. `test-cases/API/gate-time-window/GT-004-operator-lead-time-below-6h.md`
  - multi-role: `REV-002-operator-reviewer-reject-without-note.md`
  - slugs are lowercase, hyphen-separated, short (≤ 6 words for the summary).
- IDs are `<PREFIX>-<NNN>`, zero-padded to 3 digits. Before writing, list the
  module folder and continue from the highest existing number. Never reuse or
  renumber an existing ID, because other artifacts may already cite it.
- Create the module folder if it doesn't exist yet.

## Test case template

Write each file in UTF-8 with exactly these fields, in this order:

```markdown
# <ID> · <Role(s)> · <Summary>

| Field | Value |
|---|---|
| **ID** | <ID> |
| **Doc ref** | <doc + section, e.g. `06 §1.4 (TSD-4 §2.1)`; several refs separated by `;`> |
| **Role(s)** | <Role>[, <Role>] |
| **Summary** | <one sentence: what behavior is verified, and the condition> |

## Precondition
- <state that must exist before step 1: accounts, seed rows, request state, clock>

## Steps
1. <one action per step: method + path + headers + body, or a UI action with its `data-testid`>
2. ...

## Expected result
- <exact HTTP status>
- <exact body fields / values, e.g. `failing_gate: "TIME_WINDOW"`, `rule_reference: "TSD-4 §2.1"`>
- <resulting state / DB rows, e.g. `state` = `REJECTED`, one new AuditLog row>
```

Omit the `## Precondition` section entirely when there is none (it's
optional). Everything else is required.

## How to write good low-level cases

**Concrete data.** Use specific values from the docs: real zone codes
(`DNI-OPN-1`, `ZTM-RST-7`), exact masses (`900`, `901`), exact durations,
ratings and levels. For time-relative values, express them relative to a
reference clock so the case stays valid on any day, e.g.
"`window_start` = now + 5 h 59 min (UTC)", or fix the clock in the
precondition when a curfew/local-time check needs an absolute time.

**One behavior per case.** Each case fails for one reason. Build the rest of
the request so that every *earlier* gate passes. Gates stop at the first
failure (`PILOT → AIRCRAFT → ZONE → TIME_WINDOW`), so a TIME_WINDOW test with
an under-rated pilot would actually test PILOT.

**Boundaries in pairs.** For every threshold write the passing edge and the
failing edge as separate cases (e.g. duration 15 min passes, 14 min fails;
240 passes, 241 fails; mass 900 g → `C0`, 901 g → `C1`). Note inclusive vs.
exclusive exactly as the doc states it.

**Exact expected results.** Name the status code, the relevant body fields
with values (`rule_reference` verbatim from `06 §6`), and the resulting state
or the absence of change (e.g. "`state` is still `DRAFT`" for `validate`).
Never write "error is shown" or "request fails".

**Negative and role coverage.** For each happy path consider: wrong role
(`Anonymous` → `401`, `Other operator` → `403`, missing reviewer header →
`400` on reviewer endpoints), illegal state (`409`), malformed body (`400`).

**UI cases.** Refer to elements by `data-testid` where the doc names one
(`operator-login-link`, `operator-session-info`, ...). Where the doc doesn't
name the testid, describe the element and add "(testid not specified in 04)".
Don't invent testid values.

## Blocked by open questions

If the expected result depends on something open in `05-open-questions.md`
or on a contradiction between docs (e.g. overlap → `409` per `03` vs `422
TIME_WINDOW` per `06 §1.4`), don't write a file with a guessed result. Instead
list it in your reply under "Blocked", with the open question and which doc
sections conflict, so it can be written once the answer arrives.

## Workflow

1. Read the docs relevant to the module (always include `05` and `07`, since
   they change what the other docs mean).
2. List existing files in the target module folder(s) to find the next ID and
   avoid duplicating cases that already exist.
3. Plan the case list first (title per case), covering happy path, boundaries
   and negative/role cases. If the user asked for "all" cases of a large
   module, it's fine to produce many; if they asked for a few, pick the
   highest-value ones (boundaries and contract-defining checks first).
4. Write one file per case using the template.
5. Reply with: the folder(s), a compact list of created IDs + titles, and any
   Blocked items. Don't paste the full cases into chat.

## Self-check before finishing

- Each file has ID, Doc ref, Role(s), Summary, Steps, Expected result
  (Precondition only if needed), and the title is `<ID> · <Role(s)> · <Summary>`.
- File name starts with the ID and includes the role slug.
- Every expected result is backed by the Doc ref; nothing guessed.
- Earlier gates are set up to pass in single-gate cases.
- No ID collides with an existing file.
