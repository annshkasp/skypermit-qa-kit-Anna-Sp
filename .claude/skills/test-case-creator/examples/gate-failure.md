# Example shape — a gate failure surfaced via validate

Placeholders in `<angle brackets>` are filled from the rule block. Text in
*italics* explains a choice and is not part of a real case. Do not copy any
wording about the specific property being broken — that comes from the rule.

```markdown
# <condition from the rule block>

### <case_id>: <GATE> fails when <the one violated condition, in plain words>

**Doc ref:** `skypermit/docs/06-business-rules.md` — `<rule_reference>`
(§1.<n> `<GATE>` table; §6 `rule_reference` table)

**Role(s):** Operator

**Preconditions:**
- Logged-in operator whose authorisation level meets the zone's required
  level.
- A zone <described by the property the rule needs, or named only if the
  rule is zone-specific>.
- A pilot whose rating covers that zone's class and whose certification is
  current at `window_start`.
- An aircraft whose weight band is in that zone's `permitted_bands`.
- <The single violated condition, stated against the threshold — e.g.
  "<field> is <limit> + 1 <unit>" — and every other condition of the same
  gate explicitly within limits.>
- No other `APPROVED`/`UNDER_REVIEW` request for that aircraft shares an
  instant with the window.
- The date is not the day of, or next to, a DST change.

**Steps:**
1. Open `/operator/requests/new`.
2. Choose the zone, pilot and aircraft in `flight-request-zone-select`,
   `flight-request-pilot-select` and `flight-request-aircraft-select`.
3. Enter the window in `flight-request-window-start-input` and
   `flight-request-window-end-input`, an altitude within the zone's ceiling
   in `flight-request-altitude-input`, and any purpose in
   `flight-request-purpose-textarea`.
4. Click `flight-request-create-submit-button` (the request is created as
   `DRAFT`).
5. Click `flight-request-validate-button`.

**Expected result:**
- `flight-request-gate-result-<GATE>` has `data-gate-status="FAIL"` and
  shows `rule_reference` `<rule_reference>`.

**Rationale:** <Why this boundary/condition matters, and why the earlier
gates and sibling conditions are pinned to pass — so the failure can only
come from this rule.>
```

*Why validate and not submit:* validate runs the same gate pipeline but never
changes state, so the case asserts the rule without dragging in the state
machine.
