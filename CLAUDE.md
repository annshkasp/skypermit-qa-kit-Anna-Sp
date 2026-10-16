# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Goal

This repository is the QA kit for the **SkyPermit** project. Claude is used here to generate testware, such as test plans, test cases and checklists, from the SkyPermit specification documents.

- **System under test:** `C:\GenAIHome\skypermit` (a Next.js + Supabase app with Vitest tests).
- **Source of truth for requirements:** `C:\GenAIHome\skypermit\docs\`
  - `01-data-model.md`
  - `02-state-machine.md`
  - `03-api-contract.md`
  - `04-frontend-spec.md`
  - `05-open-questions.md`
  - `06-business-rules.md`
  - `07-clarifications.md`
  - `08-uml-diagrams.md`

Every generated artifact must trace back to the doc and section it came from. If the docs are ambiguous or contradict each other, report it as an open question (see `05-open-questions.md` and `07-clarifications.md`). Do not invent behavior.

## HARD RULE: `C:\GenAIHome\skypermit` is read-only

- **Never** create, edit, move, rename or delete any file under `C:\GenAIHome\skypermit`.
- **Never** run commands there that change state: no `git` commits, checkouts, stashes or resets, no `npm install` or builds, no migrations, no formatters, no generators.
- Reading, searching and listing files there is allowed.
- All output goes into this repository (`skypermit-qa-kit`).

## Directory structure

```
skypermit-qa-kit/
├── CLAUDE.md            # this file
├── README.md
├── test-cases/          # generated test cases, one file per feature/area
└── .claude/
    └── skills/          # project-specific Claude skills for generating testware
        └── <skill-name>/SKILL.md
```

- `test-cases/`: test cases grouped by feature or spec area, for example `test-cases/state-machine.md` or `test-cases/api-<resource>.md`. Each test case gives an ID, title, source reference (doc + section), preconditions, steps, expected result and priority.
- `.claude/skills/`: reusable skills that encode how this kit produces testware (formats, templates, conventions). Each skill lives in its own folder with a `SKILL.md`.

## Repository notes

- Remote: `git@github.com:annshkasp/skypermit-qa-kit-Anna-Sp.git`, default branch `main`.
- `README.md` is saved as UTF-16 LE with a BOM, probably from PowerShell redirection. `cat`, `grep` and most tools show it as spaced-out or garbled text. Convert it to UTF-8 before editing it with text tools.
- Environment: Windows. `jq`, Python and Node are not installed, so scripts can't rely on them.
- When writing files from PowerShell, use `-Encoding utf8` so they don't end up as UTF-16.
