# ODK-E2E-129 — truthful Activity for ended sessions

Date: 2026-09-21  
Status: `VERIFIED_CLOSED`

## Outcome

Activity no longer routes every terminal session to a result screen. One typed interaction resolver now decides whether a durable record can open an exact result, exposes saved session facts inline, or opens immutable archival details. Certification, Design, Algorithms simulation, incomplete, and inconsistent records therefore cannot reach a dead or foreign summary.

The lifecycle contract itself is unchanged: pause/leave keeps the active resumable session and is excluded from Activity; end persists `abandoned` before clearing the active pointer; abandoned sessions without a committed attempt are excluded; abandoned sessions with a committed attempt and completed sessions remain historical records.

## Record-to-Activity matrix

| Durable record | Activity behavior |
| --- | --- |
| Active / paused resumable | Excluded from Activity |
| Abandoned, no committed attempt | Excluded from Activity |
| Algorithms practice, abandoned with attempt | Opens the existing derived partial practice summary |
| Algorithms practice, completed with matching result | Opens exact practice summary |
| Algorithms simulation | Shows inline session details; simulation summary remains unavailable in this release |
| Certification / Design, completed with exact family/session/track result | Opens exact canonical result |
| Certification / Design, abandoned or completed without exact result | Shows inline saved facts |
| Cross-family or inconsistent result | Fails closed to inline saved facts |
| Archived unavailable record | Opens immutable unavailable details |
| Unknown archived track | Uses localized unavailable track copy; never exposes the stored ID |

Inline facts include truthful terminal status, track, mode, optional scope, answered/total, active foreground time, and date. Disclosure rows have no result chevron, expose `expanded` accessibility state, and mutually exclude the other detail surface.

## Implementation

- `activityModel.ts` owns the closed interaction union and exact family/result guard.
- `activityNavigation.ts` accepts only typed `open_result` capabilities and throws for inline-only records.
- `ActivityScreen.tsx` renders useful saved facts for terminal records without a supported result.
- Home and Progress delegate to the same interaction capability instead of rebuilding route rules.
- EN/PL copy names ended sessions and detail actions without presenting them as completed.

No journal, session mutation, activity inclusion rule, migration, scoring, content artifact, contentVersion, or artifact SHA changed.

## Verification

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| Focused Activity/lifecycle/recovery/migration/i18n tests | PASS, 69/69 |
| `npm run validate:content-boundary` | PASS |
| `npm run validate:runtime-privacy-boundary` | PASS |
| `git diff --check` | PASS |
| Full `npm test` | 1178 PASS; 11 `releaseManifest.test.mjs` hook failures because the preserved sibling backend worktree is intentionally dirty |
| Runtime PL: end after one committed response | PASS |
| Runtime PL: Activity row and inline details | PASS; `Zakończono wcześniej`, `Odpowiedzi: 1/10`, no unavailable summary |

The focused lifecycle set explicitly covers zero-attempt exclusion, abandonment ordering and idempotent replay at every durable boundary, force-close A–G recovery, deterministic resume, and legacy migration/fail-closed behavior. The full-suite failures do not execute ODK-129 behavior and were not hidden by cleaning or resetting sibling worktrees.

## Runtime evidence

Evidence is under `docs/qa/evidence/ODK-129/`:

- `certification-ended-activity-pl.png` and hierarchy — terminal row with no result chevron;
- `certification-ended-details-pl.png` and hierarchy — useful saved facts;
- repeatable Maestro end/detail/list flows.

Only disposable simulator `Patternly_ODK124` (`2E25A24A-E3FC-408A-BFC0-F91A939F2D7E`) was used. Preserved iPhone 17 state was not reset or changed.

## Independent QA

Final verdict: **PASS** for the implementation. QA confirmed the interaction matrix, read-model exclusions, journal/migration preservation, disclosure accessibility, corrected list/details evidence, and the 69-test lifecycle matrix. No P0 or implementation P1 remained. The final unknown-track P2 was removed by a localized unavailable fallback and regression test.

Scores: architecture `0.91`, simplicity `0.87`, risk `0.84`, maintainability `0.90`; minimum `0.84`.

## Assessment

- Architecture: `0.94`
- Simplicity: `0.86`
- Risk: `0.85`
- Maintainability: `0.92`
- Minimum: `0.85`

The redesigned plan was accepted before implementation at minimum `0.85`; independent QA remained above the required `0.8` threshold.
