# ODK-097 — local Design session matrix

Date: 2026-09-21
Status: `VERIFIED_CLOSED` for the local app/producer slice; no immutable package publication or global release admission.

## Outcome

PO-approved Backend, OOD and Frontend Free node matrix is active in the application: Learn `[1,10]` (default 10), Tradeoff `[10,20,40]` (default 10), Review `[1,10,20]` (default 10) with due-only evidence, explicit shortening and unavailable without eligible evidence. The producer's three version 2 profiles are in `patternly-content` commit `33c82866270a45f205f358a79cb3795f938adb34`; unchanged Learn config remains v1, changed Tradeoff and Review configs are v2. The producer report records exact canonical question and profile hashes.

The application matrix, identity-scoped evidence filtering and tests were already included in app commit `6c8cee2`. Independent QA exposed one integration gap: the Design mode cards went directly to a default-length session, so a learner could not select 20 or 40. `PracticeHubScreen` now opens the existing Practice Setup for every Design mode. A focused navigation test guards the route. No duplicate setup, content change or new state path was added.

## Verification

- Focused ODK-097 config/runtime/navigation tests: 19/19 PASS; typecheck PASS; `check:content-release` PASS with inventory `9/117/943/16077` and producer HEAD `33c8286`.
- Independent app QA: `gpt-5.6-luna`, effort `max`, `PASS_WITH_GAPS`; consistency 0.90, simplicity 0.87, risk 0.84, maintainability 0.86, minimum 0.84. The identified navigation gap was fixed and rechecked. QA ran 14/14 focused navigation/session tests and 22/22 ODK-097/runtime/config tests, typecheck, content release check and diff check.
- iOS 26.4 isolated simulator: Backend, OOD and Frontend Tradeoff setup each exposed 10/20/40; selecting 40 started a real `1 of 40` session. Frontend Learn setup showed 1/10 with 10 selected; the fresh guest's Review row was unavailable and tapping it left the hub in place. [Manifest and screenshots](evidence/ODK-097/screenshot-manifest.md), [run report](evidence/ODK-097/run-report.md), [coverage matrix](evidence/ODK-097/coverage-matrix.md).
- `git diff --check` PASS for the local navigation correction and report at preparation time.

## Boundaries and limitations

- Historical immutable `*-free-node-0003` packages still carry profile v1. Question content, canonical `contentVersion`, bundle and historical migration evidence were not rewritten. This is local session admission only.
- No due Review fixture was fabricated. Due-only and shortening behavior passed deterministic runtime tests, while the simulator proved only the empty unavailable state.
- Screenshots are one iPhone size, Light theme and English locale. Per-track Tradeoff setup selectors passed in Maestro, but only session 1/40 screenshots were saved for all three tracks. The screenshot pack is evidence, not a UI audit.
- The existing broad `6c8cee2` commit included ODK-097 with earlier ODK-114/124–129 work. This report does not recharacterize that mixed historical commit as an isolated ODK-097 commit.
- VoiceOver was not tested, as instructed.

## Changed and replaced paths

The remaining ODK-097 correction changes `src/features/practice/PracticeHubScreen.tsx` and `practiceNavigation.test.ts`, adds capture flows under `.maestro/screenshot-capture/odk097`, this report and `docs/qa/evidence/ODK-097`. The direct Design mode-card-to-session route was replaced by the existing setup route. No content, question, scoring, persistence or other-track path was removed.
