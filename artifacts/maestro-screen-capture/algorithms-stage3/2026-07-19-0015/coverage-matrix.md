# Stage 3 visual coverage matrix

| Requirement | Evidence/status |
| --- | --- |
| Practice preparing, unanswered, submitting, feedback, advance, exit | Preparing/submitting/feedback/advance not yet captured; unanswered and exit interaction captured. |
| Practice commit and abandonment recovery | Not captured through a real failure port. |
| Simulation preparing and insufficient content | Not captured through a real failure port. |
| Simulation editable, real fixed-40 session | Captured; Maestro hierarchy exposes `1 of 40` and navigation positions. |
| Simulation saved response, save failure, stale revision | Not captured through a real failure port. |
| Simulation expiry, frozen, finalization, recovery, result | Not captured through a real failure port. |
| No pre-finalization correctness | Verified by `tests/simulationViewModel.test.ts`; active visual screen shows no correctness. |
| Leave versus abandonment | Practice confirmation flows exercised with Maestro. Simulation leave/abandon still needs visual evidence. |
| Reduced motion and dynamic type | Tooling/configuration not present in this capture run. |

Result: `PARTIAL`; not eligible for G-D or Stage 3 verification.
