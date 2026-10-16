# UIO-002 · Operator · Register form has no authorisation level field

| Field | Value |
|---|---|
| **ID** | UIO-002 |
| **Doc ref** | 04 §Operator portal ("`authorisation_level` is not a field on this form"); 03 §Authentication & authorisation |
| **Role(s)** | Operator |
| **Summary** | The registration form doesn't let the operator choose an authorisation level, because registration always starts at `L1`. |

## Precondition
- Browser has no SkyPermit session.

## Steps
1. Open `/register`.
2. Inspect every input, select and radio control in the registration form.

## Expected result
- No control for authorisation level exists: no field labelled "authorisation level" (or similar), and no control offering `L1`/`L2`/`L3`.
