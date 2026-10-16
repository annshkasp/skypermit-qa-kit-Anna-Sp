# SkyPermit Test Plan — Data Model

**Version:** 2026-10-16 · **Author:** annshkasp · **Sources:** docs 01–08 (focus: `01-data-model.md`)

## 1. Scope
Verify that the persisted schema and the API's view of it match `01`: entities, constraints, enumerations, derived values and time handling.
- In scope: 7 entities and their keys, FKs and unique fields (`01 §Entities`, `08 §ERD`)
- Enumerations (`01 §Enumerations`)
- Derived pilot currency and aircraft weight band (`01 §Derived`, `06 §2–3`)
- UTC storage and the `flight_purpose` length cap (`01 §Time handling`)
- Append-only AuditLog and read-only Zone (`01 §AuditLog`, `03 §Reference data`)

## 2. What we test
| Area | Key checks | Level | Priority | Source |
|---|---|---|---|---|
| Keys and uniqueness | Duplicate `Operator.national_id`/`email`, `Pilot.national_id`, `Aircraft.serial_number` rejected; `Operator.id` = auth user id; deleting the auth user cascades to the Operator | API / DB | P1 | 01 §Operator, §Pilot, §Aircraft |
| Referential integrity | FlightRequest with an unknown pilot, aircraft or zone is rejected; pilot/aircraft of another operator → `403` | API | P1 | 01 §FlightRequest, 03 §Auth |
| Enumerations | Every valid value accepted; any other value → `400`; registration starts at `L1` | API / DB | P1 | 01 §Enumerations, 03 §Auth |
| Weight band (derived) | Boundaries 900/901, 3,500/3,501, 12,000/12,001, 30,000 → C0/C1/C1/C2/C2/C3/C3; 30,001 → `422` at `/aircraft`; band not stored | Unit / API | P1 | 06 §3, 01 §Derived |
| Pilot currency (derived) | Current at exactly 18 months, not current 1 day after; measured against `window_start`; not stored | Unit / API | P1 | 06 §2, 01 §Derived |
| FlightRequest constraints | `window_end` > `window_start` (equal → rejected); `flight_purpose` 2,000 chars OK, 2,001 rejected by the API **and** by the DB constraint; times round-trip as UTC | API / DB | P1 | 01 §FlightRequest, §Time handling |
| Rejection fields | `failing_gate` + `rule_reference` set only on gate rejection; null for a reviewer rejection and for non-rejected states | API | P2 | 01 §FlightRequest, 06 §6 |
| ReviewAction | Row written per approve/reject; `reviewer_id` = `X-Reviewer-Id`; REJECT without `note` refused | API | P1 | 01 §ReviewAction, 03 §Reviewer |
| AuditLog | One row per state change (create has `from_state` = null); no update/delete via API or UI | API / DB | P1 | 01 §AuditLog, 02 §Implementation note |
| Zone reference data | No create/update endpoint; seed matches the 6-zone catalogue incl. `A-7` curfews | API | P2 | 03 §Reference data, 06 §4 |

## 3. Risks
| Risk | L | I | Mitigation | Source |
|---|---|---|---|---|
| Fixtures still use superseded values (24-month currency, 4,000 g C1/C2 boundary) | M | H | Boundary tests use `06` values; review the seed and fixtures | 06 §2–3 |
| Derived value persisted, so it goes stale after a correction | M | H | Inspect the schema for band/currency columns; change the input and re-read | 01 §Derived |
| Schema drifts from the doc across migrations 0001–0004 | M | M | Compare migrations field by field against `01` | 01 intro |
| Curfew converted at write time or in the wrong zone time | M | H | Test windows near curfew edges and midnight | 01 §Time handling, 06 §1.4 |
| AuditLog writable through a side path | L | H | Attempt UPDATE/DELETE via the API and the Supabase client | 01 §AuditLog |
| `flight_purpose` limit enforced in only one layer | M | M | Test the API and a direct DB insert separately | 01 §Time handling |

## 4. Definition of Ready (entry criteria)
- [ ] Docs version under test and migrations 0001–0004 identified
- [ ] Test DB seeded: operators L1–L3 (ACTIVE and SUSPENDED), pilots of every rating with `certified_on` around 18 months, aircraft at each band boundary, all 6 zones
- [ ] Read access to the DB for schema and AuditLog checks
- [ ] Reviewer IDs and operator test accounts available
- [ ] Open questions below answered, or the affected checks marked Blocked

## 5. Definition of Done (exit criteria)
- [ ] All P1 checks executed and passed; no open P1/P2 defects
- [ ] Every enum value and every band and currency boundary covered
- [ ] Each test traced to a `01`/`06` section
- [ ] Remaining open questions logged as accepted risks

## 6. Open questions
| # | Question | Impact on testing | Source |
|---|---|---|---|
| 1 | `01` says correcting `mtom_grams` recalculates the band, but no aircraft or pilot update endpoint exists. How is a correction made? | Can't test recalculation through the product | 01 §Derived vs 03 §Registry |
| 2 | Zone has no time-zone field. Which local zone time converts the curfew? | No expected result for curfew boundaries | 01 §Zone, §Time handling |
| 3 | `SUSPENDED` operator: `05` says the status code is undefined, `03` lists it under `403` | Precondition tests blocked | 05 §1 vs 03 §Error semantics |
| 4 | Nullability, types and ranges are unspecified for most fields (altitude ≥ 0? `mtom_grams` = 0? curfew null = "none"?) | Negative/`400` tests lack expected results | 01 §Entities |
| 5 | Is `rejection_reason` the reviewer's `note` when a reviewer rejects? | Can't assert the field's content | 01 §FlightRequest, §ReviewAction |
| 6 | AuditLog covers "any entity", but only FlightRequest state changes are defined. Do Pilot, Aircraft and Operator status changes log too? | Coverage of AuditLog unclear | 01 §AuditLog |
| 7 | Zone `active` citation (`ZC-2026.1 §4`) is unconfirmed | `rule_reference` assertion is provisional | 05 §2 |
