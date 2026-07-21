# Coverage gaps

| Area | Status | Exact reason |
| --- | --- | --- |
| 10 additional Practice items / 8 families / all interactions | BLOCKED_SCOPE | Only one real item was captured before the audit time boundary; no item ID correlation exists. |
| After-session Summary | BLOCKED_SCOPE | No 10-item end-of-session run completed. |
| Due/remediation/retention | BLOCKED_SCOPE | Requires controlled completion and time-based due state; no clock/storage manipulation was used. |
| Full 40 Simulation | BLOCKED_SCOPE | Artifact proves feasible fixed-40 pool; no device execution was completed. |
| Cloud smoke | BLOCKED_PRODUCT | `EMPTY_INGRESS` and missing bundled artifact. |
| Android comparison | BLOCKED_ENVIRONMENT | Not exercised; audit continued on available iOS simulator. |
| Dynamic type / keyboard / small screen | UNKNOWN / NEEDS EVIDENCE | No supported device setting run. |
| Existing visual harness | EXCLUDED_AS_RUNTIME_EVIDENCE | It intentionally renders projections, not persisted real lifecycle. |

The app’s dirty checkout also blocks its canonical cross-repository integration test. It does not block static validation, canonical iOS build, or the observed Algorithms slice.
