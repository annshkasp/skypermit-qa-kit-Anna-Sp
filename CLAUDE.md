# SkyPermit QA kit

This repository is the QA kit for the **SkyPermit** project. Claude uses it to generate testware (test plans, test cases and checklists) from the SkyPermit specification docs, and to verify test cases against those docs and the code. This repo contains no application code.

- **System under test:** `../skypermit` (`D:\Education\ISTQB\TestGenAI\Workshop\skypermit`), a Next.js + Supabase app with Vitest tests. It is **read-only** (see the hard rule below).
- **Source of truth for requirements:** `../skypermit/docs/`.

## Read before writing testware

Read these in order. Start with the app's own entry point, then the docs:

1. `../skypermit/CLAUDE.md`: entry point for the app: stack, gate implementation status, conventions.
2. `docs/01-data-model.md`: the seven entities, their fields, enums, derived values and time handling.
3. `docs/02-state-machine.md`: the seven flight-request states and the legal transitions. Any other transition must return `409`.
4. `docs/03-api-contract.md`: all endpoints under `/api/v1`, authentication and authorisation, error semantics (including the `422` body: `failing_gate`, `rule_reference`, `message`) and the gate pipeline shared by `submit` and `validate`.
5. `docs/04-frontend-spec.md`: the operator portal and reviewer queue, and the **`data-testid` contract**. Every interactive element has a stable `data-testid`, which is the primary hook for UI/E2E tests.
6. `docs/05-open-questions.md`: the **canonical status** of every open or resolved question. Check it before treating any behavior as known.
7. `docs/06-business-rules.md`: the gate logic (`PILOT`, `AIRCRAFT`, `ZONE`, `TIME_WINDOW`), thresholds, zone catalogue, cancellation deadline and `rule_reference` values.
8. `docs/07-clarifications.md`: answers from the business rules owner. Where it conflicts with `06`, **`07` governs**.
9. `docs/08-uml-diagrams.md`: Mermaid diagrams generated from `01` and `02`. Use it for orientation only; cite `01`/`02` instead.

**Doc precedence:** `05` is the canonical open/resolved status; `07` overrides `06`; the specific docs (`01`–`04`) beat the diagrams in `08`.

## Key facts worth not re-deriving

- Gates evaluate in a fixed order, `PILOT → AIRCRAFT → ZONE → TIME_WINDOW`, and stop at the first failure. A `422` always names the *first* failing gate, not every failing gate.
- The weight-band check fails the `AIRCRAFT` gate, not `ZONE` (`07 §1`).
- `POST /api/v1/flight-requests/{id}/validate` runs the same gate pipeline as `submit` but never changes state, so tests can call it repeatedly as a read-only probe of gate outcomes.
- Operators authenticate via real Supabase Auth (session cookie). Reviewers are identified by a static `X-Reviewer-Id` header, not a login. A test acting as reviewer never needs a session, and a test acting as operator never sends `X-Reviewer-Id`.
- `data-testid` values are a stable contract. If a selector seems to be missing in the running app, report it as a bug against `skypermit`; don't fall back to text or CSS selectors.
- The operator portal's pickers (pilot, aircraft, zone) are deliberately **not** pre-filtered by business rules. A test can select an invalid combination and must expect the failure at validate/submit time, not at selection time.

## Traceability and open questions

- Every generated artifact must trace back to the doc and section it came from (for example `03 §Error semantics`). Do not invent behavior.
- If the docs are silent, ambiguous or contradict each other, don't guess an expected result. Raise it as an open question instead:
  - in a test plan, in its **Open questions** section;
  - for test cases, in the reply under **Blocked**, naming the open question in `05` or the conflicting doc sections.
- Never add open questions to the `skypermit` docs themselves.

## HARD RULE: `../skypermit` is read-only

- **Never** create, edit, move, rename or delete any file under `D:\Education\ISTQB\TestGenAI\Workshop\skypermit`.
- **Never** run commands there that change state: no `git` commits, checkouts, stashes or resets, no `npm install` or builds, no migrations, no formatters, no generators.
- Reading, searching and listing files there is allowed.
- All output goes into this repository (`skypermit-qa-kit`).

`.claude/settings.json` enforces this: it grants read access to `../skypermit`, denies `Edit` there (which also covers `Write` and `NotebookEdit`), and denies `git -C` against it. Keep the paths in `settings.json`, the skills and the agent in sync with this file if the app moves.

## How the work is done

| Task | Use |
|---|---|
| Test plan, test strategy, scope, risks, entry/exit criteria | skill `one-page-test-plan` → `test-plan/` |
| Design, write, add or extend E2E/UI test cases | skill `e2e-test-design` → `test-cases/UI/<module>/` |
| Verify a test case against the docs and the code | agent `test-case-verifier` |

- Run `test-case-verifier` **only when the user asks** to verify, validate or check a test case. Don't run it automatically after generating test cases.
- The verifier checks one test case per run (give it the ID, e.g. `E2E-OP-004`) and is read-only. Its report goes into the reply, not into a file. For several cases, run one verifier per case.

## Directory structure

```
skypermit-qa-kit/
├── CLAUDE.md                  # this file
├── README.md                  # UTF-16 LE, see Repository notes
├── test-plan/                 # one-page test plans (skill: one-page-test-plan)
│   ├── test-plan.md
│   └── test-plan-data-model.md
├── test-cases/                # E2E test cases, one file per case (skill: e2e-test-design)
│   └── UI/
│       └── auth/              # operator registration (E2E-OP-001 … E2E-OP-007)
└── .claude/
    ├── settings.json          # permissions: read-only access to ../skypermit, no web access
    ├── agents/
    │   └── test-case-verifier.md
    └── skills/
        ├── e2e-test-design/
        │   ├── SKILL.md       # what to test: selectors, auth, state machine, gate pipeline
        │   ├── templates.md   # test case fields and template
        │   └── examples.md    # worked examples
        └── one-page-test-plan/SKILL.md
```

### Test case conventions

Source: `.claude/skills/e2e-test-design/` (`SKILL.md`, `templates.md`). If this section and the skill disagree, the skill governs.

- **Location:** one Markdown file per case at `test-cases/UI/<module>/<ID>-<role-slug>-<summary-slug>.md`, for example `test-cases/UI/auth/E2E-OP-001-operator-register-with-all-fields.md`.
- **ID:** `E2E-<portal>-<NNN>`. `OP` is the operator portal, `REV` the reviewer queue and `X` a cross-role flow. Numbering is per prefix across all of `test-cases/`, not per folder. Before writing, search `test-cases/` for the prefix and continue from the highest number. Never reuse or renumber an ID, even after a case is deleted.
- **Title:** `# <ID>: <Title>`. The title states the scenario, not the mechanics (for example "Illegal re-submit of an UNDER_REVIEW request", not "click submit twice").
- **Fields, in order:** Doc ref, Role(s), Preconditions, Steps, Expected result, Rationale.
  - **Doc ref:** written as `skypermit/docs/<file>.md`, never `../skypermit/...`. Choose the anchor in this order: a `rule_reference` (for example `OH-1 §2.3`) for gate failures, then a numbered section, then a quoted heading.
  - **Role(s):** Operator, Reviewer, or Operator → Reviewer, naming the handoff point. The two identities never share one flow: the operator uses a session cookie, the reviewer uses `X-Reviewer-Id`.
  - **Preconditions:** the data and state that must exist first. Leave the field out entirely when nothing beyond a fresh page load is needed; don't write "None".
  - **Steps:** numbered, each naming the `data-testid` it acts on and any input value. Bind only to `data-testid`, never to text or CSS. If a selector is missing, report it as a bug against `skypermit`.
  - **Expected result:** both the visible UI outcome and the underlying state or gate result. Name the specific error (the gate and its `rule_reference`, or the `409` state-transition error), not just "shows an error".
  - **Rationale:** the state transition, gate or documented edge case the case exists for.
- **Scope:** E2E cases check that the UI reflects outcomes. They don't re-verify the API contract (status codes, error body shape).

## Repository notes

- Remote: `git@github-personal:annshkasp/skypermit-qa-kit-Anna-Sp.git`. `github-personal` is an SSH host alias from `~/.ssh/config` for the personal GitHub account. Default branch: `main`.
- Commit or push only when the user asks.
- Write all files as UTF-8. From PowerShell, pass `-Encoding utf8` so files don't end up as UTF-16.
- `README.md` is saved as UTF-16 LE with CRLF line endings, so `cat`, `grep` and most tools show it as spaced-out text. Convert it to UTF-8 before editing it.
- Environment: Windows, Git Bash and PowerShell. Node (v22) and `git` are available. `jq` is not installed, and `python` is only the Microsoft Store stub, so scripts can't rely on either.
