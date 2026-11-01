# Example shape — a rule enforced at registration, not by a gate

For rules the script labels `REGISTRATION`: the check happens on a registry
write, before any flight request exists, so there is no gate result to
assert. Placeholders in `<angle brackets>` come from the rule block.

```markdown
# <condition from the rule block>

### <case_id>: Registration refused when <the one violated condition>

**Doc ref:** `skypermit/docs/06-business-rules.md` — `<rule_reference>`
(§3 thresholds; §6 `rule_reference` table, "not a gate")

**Role(s):** Operator

**Preconditions:**
- Logged-in operator.
- An aircraft to register whose <field> is <limit> + 1 <unit>; every other
  field valid.

**Steps:**
1. Open `/operator/aircraft`.
2. Fill `aircraft-create-manufacturer-input`, `aircraft-create-model-input`
   and `aircraft-create-serial-number-input` with valid values, and
   `aircraft-create-mtom-grams-input` with the over-limit value.
3. Click `aircraft-create-submit-button`.

**Expected result:**
- `aircraft-create-error` is shown and the aircraft is not registered
  (underlying `POST /aircraft` returns `422`, per `<rule_reference>`). *The
  docs define no body shape for this 422 — the gate `rule_reference` field
  belongs to flight-request 422s — so don't assert one.*

**Rationale:** <Why the boundary sits where it does, and why this is a
registration precondition rather than a gate outcome.>
```
