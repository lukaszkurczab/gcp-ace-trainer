# AUD-15 — answer and review presentation

## Outcome

- Audit status: `PARTIAL`
- UI result: no confirmed product defect; final acceptance `BLOCKED`
- Scope: single/multi choice answer cards, correctness states, result/review, standard and large text after removal of visible status badges
- Surface: mobile app
- Evidence class: `LIVE_UI` + `CODE_ONLY`
- Source identity: `c494253b476772c068c115fa5f5ff888ec8d2561`
- Scenario and environment: existing iPhone 17 Simulator, iOS 26.4, English, standard text; protected local profile read-only
- Report date: 2026-09-27

## User goal and contract

The learner must distinguish selected, correct, incorrect, omitted-correct and unselected answers without the removed redundant badge. The card hierarchy must remain legible in Practice and Review, while accessibility retains selection and correctness. `docs/PATTERNLY-WORKING-PLAN.md` additionally requires runtime coverage of single/multi, correct/incorrect/partial, review, standard/large text and screenshots. The fixture may not modify the protected profile.

## Sources and rule map

| Rule | Source | How checked | Result |
| --- | --- | --- | --- |
| No redundant visible status badge | `AnswerOption.tsx`; owner decision preserved in Git history | source and focused test | `PASS` |
| Distinct card treatments remain | `AnswerOption.tsx`; design-system semantic-state rule | source and focused test | `PASS` |
| Selection and correctness remain semantic | `PracticeResponseControls.tsx`, `AnswerReviewScreen.tsx` | source, focused test and live hierarchy | `PASS` for observed single-select states |
| Single/multi and correct/incorrect/partial are visible at runtime | active plan | read-only inventory of existing sessions | `NOT_VERIFIED`: no existing multi-select or partial attempt |
| Standard and large text screenshots cover all states | active plan | runtime inventory | `NOT_VERIFIED`: missing safe state fixture; device setting was not changed |
| Physical VoiceOver announces content, selection and correctness without harmful repetition | historical acceptance condition and accessibility contract | no physical device available | `NOT_VERIFIED` |

## Evidence and coverage

| Screen/state | Platform | Text size | Evidence | Status |
| --- | --- | --- | --- | --- |
| Certification Result, 40-item Knowledge Check | iPhone 17 Simulator | standard | live navigation from Activity | `PASS` for result hierarchy and Review entry |
| Certification Review, single correct | iPhone 17 Simulator | standard | live hierarchy: `Selected, correct`; unselected alternatives | `PASS` |
| Certification Review, single incorrect | iPhone 17 Simulator | standard | live hierarchy: `Selected, incorrect`; `Correct answer, not selected` | `PASS` |
| Algorithms Review, sessions 4 and 5 | iPhone 17 Simulator | standard | live hierarchy | `PASS` for observed radio/correct state only |
| Algorithms session 1 | iPhone 17 Simulator | standard | live Result | No review: session ended early |
| Multi-select partial/correct/incorrect | iPhone 17 Simulator | standard/large | no isolated existing attempt | `NOT_VERIFIED` |
| Physical VoiceOver | physical iOS | all required states | unavailable | `NOT_VERIFIED` |

Opening Activity, Result and Review used read-only application paths. `Mark Needs Review` was not activated. No answer was submitted, no app data was reset, and the protected profile was not changed.

## Verification

- Focused controller gate covering answer presentation, accessibility, practice projections and certification review projections — `PASS`, 41/41.
- Independent reviewer focused gate — `PASS`, 17/17.
- `npm run typecheck` — `PASS`.
- `git diff --check` — `PASS` before documentation changes.
- Existing iPhone 17 remained the only used simulator and app installation.

## Independent review

Luna High issued `BLOCKED`. The implementation and observed single-select states do not establish the required multi-select partial matrix, large-text screenshots or physical VoiceOver behavior. Static tests cannot replace those runtime criteria. The reviewer also identified one item for the physical test: correctness is present in both the accessibility label and value, so the actual announcement must be checked for harmful repetition.

## Blocker and safe unblock condition

The available completed sessions contain observable single-select correct/incorrect states, but no read-only multi-select partial attempt. Creating one through normal Practice would persist a new response into the protected profile, violating the task contract. There is also no physical iOS device available for the required VoiceOver announcement check.

Provide a deterministic answer/review fixture isolated from the protected profile and a physical iPhone for VoiceOver. Then capture single/multi correct/incorrect/partial in standard and large text on the existing test installation, verify card hierarchy and full semantics, restore any changed device text setting, and rerun independent QA. Do not add an audit-only product route, use `Mark Needs Review`, or claim Simulator hierarchy as physical VoiceOver evidence.

## Approach assessment

The evidence-first read-only approach was independently approved: goal/architecture `0.94`, simplicity `0.92`, risk `0.84`, maintainability `0.94`; minimum `0.84`. It stopped at the first material evidence gap instead of mutating the profile or manufacturing a passing surface.
