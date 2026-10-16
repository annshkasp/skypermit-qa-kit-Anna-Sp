# SkyPermit Test Plan — Full System

**Version:** 2026-10-16 · **Author:** annshkasp · **Sources:** docs 01–08

## 1. Scope
Confirm that SkyPermit approves or rejects drone flight requests exactly as the spec defines, with the correct state, error shape and audit trail.
- In scope: operator auth and data scoping (`03 §Auth`); registry and data model (`01`); request lifecycle (`02`)
- Also in scope: the 4-gate pipeline via `submit` and `validate` (`06 §1`, `07`); the reviewer flow (`03 §Reviewer`); the API error contract (`03 §Error semantics`); UI contracts (`04`)

## 2. What we test
| Area | Key checks | Level | Pri | Source |
|---|---|---|---|---|
| Auth and scoping | No session → `401`; another operator's resource → `403`; `operator_id` is never taken from the client; reviewer header unlocks reads and `validate`; registration starts at `L1` | API | P1 | 03 §Auth |
| State machine | Every legal transition; every other (from, action) pair → `409`; `SUBMITTED` is never observed at rest; terminal states stay final | API | P1 | 02 §States |
| Gate order | `PILOT`→`AIRCRAFT`→`ZONE`→`TIME_WINDOW`; a 422 names only the first failing gate | API | P1 | 06 §Evaluation order |
| PILOT / AIRCRAFT | Rating vs zone class; 18-month currency measured at `window_start`; weight band vs `permitted_bands` fails **AIRCRAFT**; band edges at 900/3,500/12,000 g; over 30,000 g → `422` at registration | Unit / API | P1 | 06 §1.1–1.2, §3; 07 §1 |
| ZONE | Altitude ≤ ceiling; operator level ≥ the zone's required level; inactive zone fails | Unit / API | P1 | 06 §1.3 |
| TIME_WINDOW | 6 h lead time, 60-day max, 15–240 min duration (inclusive); minute-by-minute curfew incl. crossing midnight and `A-7` overrides; overlap where touching windows don't count and only APPROVED/UNDER_REVIEW requests count | Unit / API | P1 | 06 §1.4 |
| `422` body | `failing_gate`, verbatim `rule_reference` from `06 §6`, and an operator-readable `message`; `rule_reference` persisted on the request | API | P1 | 03 §422, 01 §FlightRequest |
| `validate` | Same results as `submit` with no state change; safe to repeat | API | P1 | 03 §Flight requests |
| Cancel deadline | APPROVED can be cancelled up to 2 h before `window_start`, later → `409` | API | P1 | 02 §Rules, 06 §5 |
| Reviewer | Missing `X-Reviewer-Id` → `400`; reject requires a note; a `ReviewAction` row written; queue shows UNDER_REVIEW sorted by submission time | API / UI | P1 | 03 §Reviewer, 04 §Reviewer |
| Data integrity | Unique keys; band and currency derived, never stored; UTC storage; 2,000-char purpose limit in both API and DB; AuditLog append-only | API / DB | P2 | 01 |
| UI contracts | Stable `data-testid`s (login/register IDs present, `operator-id-input` gone); pickers not pre-filtered; detail view shows reason and `rule_reference` | UI / E2E | P2 | 04 |

## 3. Risks
| Risk | L | I | Mitigation | Source |
|---|---|---|---|---|
| Weight band still implemented under ZONE, per `06`'s old wording | M | H | Assert `failing_gate: AIRCRAFT` for a band violation | 07 §1 |
| Superseded values used (24-month currency, 4,000 g boundary, base curfews instead of `A-7`, `CR-1` bands) | M | H | Boundary tests built from `06` tables only | 06 §2–4 |
| `RETIRED` aircraft / `INACTIVE` pilot wired into a gate | M | M | Verify that neither affects gate outcomes | 07 §2 |
| `validate` and `submit` diverge (gate logic duplicated) | M | H | Run the same scenarios through both endpoints | 03 §Flight requests |
| One operator's data leaks to another | L | H | Cross-operator access matrix for every scoped endpoint | 03 §Auth |
| Curfew or time-zone errors around midnight and UTC conversion | H | M | Edge-minute and cross-midnight cases per zone | 01 §Time, 06 §1.4 |
| `SUSPENDED` operator returned as a `422` gate failure | M | M | Assert it is never `422`; track the open question | 05 §1 |

## 4. Definition of Ready (entry criteria)
- [ ] Docs version and migrations 0001–0004 identified; build deployed
- [ ] Seed data: operators at L1–L3 (incl. SUSPENDED), pilots of each rating with `certified_on` near 18 months, aircraft at each band edge, all 6 zones plus one inactive zone
- [ ] Controllable clock, or relative timestamps, for lead time, curfew and deadline tests
- [ ] Reviewer IDs, operator accounts and the `data-testid` list available
- [ ] Open questions answered, or affected tests marked Blocked

## 5. Definition of Done (exit criteria)
- [ ] All P1 checks pass; no open P1/P2 defects
- [ ] Every legal and illegal transition covered; each gate rule has a pass and a fail case, plus boundaries
- [ ] Every `rule_reference` value in `06 §6` asserted at least once
- [ ] Each test traced to a doc section; remaining open questions logged as accepted risks

## 6. Open questions
| # | Question | Impact on testing | Source |
|---|---|---|---|
| 1 | Is an overlap a `409` "scheduling conflict" or a `422 TIME_WINDOW` failure? | Expected status of overlap tests | 03 §Error semantics vs 06 §1.4 |
| 2 | `SUSPENDED` status and body: `05` says undefined, `03` lists it under `403` | Precondition tests blocked | 05 §1, 03 §Error semantics |
| 3 | The "maintenance completion endpoint" isn't in the API contract | Can't test APPROVED→COMPLETED | 02 §States vs 03 |
| 4 | `validate` shows "all four gate results", but the pipeline stops at the first failure. What is reported for later gates? | Expected `validate` response | 04 §Reviewer, 08 vs 06 §Evaluation order |
| 5 | Zone has no time-zone field. Which local time does the curfew use? | Curfew expected results | 01 §Zone, §Time |
| 6 | Is cancelling at exactly 2 h before `window_start` allowed? | Deadline boundary test | 06 §5 |
| 7 | Cancelling SUBMITTED: is it reachable at all, given gates run synchronously? | Transition coverage | 02 §States |
| 8 | No update endpoint for `mtom_grams` / `certified_on`, so how is the "recalculate on correction" behavior exercised? | Derived-value tests | 01 §Derived vs 03 §Registry |
| 9 | Zone `active` citation (`ZC-2026.1 §4`) unconfirmed | `rule_reference` assertion provisional | 05 §2 |
