# ODK-123 — selectable feedback timing for Claude Focus Practice

Date: 2026-09-13  
Status: `VERIFIED_CLOSED`

## Outcome

Claude Certified Architect Professional Focus Practice now offers an explicit choice between feedback after each answer and feedback at session end. The capability belongs to the versioned Claude Focus profile and is consumed by setup, session creation, the immutable session snapshot, resume, progression, summary and answer review. Other Certification tracks and Claude Diagnostic/Weak Area/Quick Review keep their existing fixed timing.

Deferred mode uses an explicit Submit → durable commit → Next sequence. Before completion, the application boundary removes canonical answers and feedback from the question projection, and the UI receives neither correctness, explanation, details nor correctness styling/accessibility state. Resume restores the exact selected timing and committed response.

## Contract changes

- Upstream Claude Focus Practice profile advanced to v2 with selectable `after_each_durable_submit` and `after_session_completion` timing; its track brief binding advanced with it.
- App product-mode configuration exposes selectable timing only for Claude `certification-focus-practice`.
- Certification setup renders the timing selector strictly from package capability.
- Certification session preparation maps the selected UI value to the canonical durable feedback timing.
- Resume validates the exact session identity, package mode, requested length and immutable feedback mode.
- Deferred projections expose committed selection without answer or feedback material until completion.
- Completed Certification Practice summary now fails closed on incomplete coverage/points evidence and links to a real answer review.
- Review re-resolves exact immutable questions, validates one matching attempt per occurrence, rescoring and aggregate evidence, then presents learner-selected, selected-incorrect and omitted-correct option states plus explanations for single- and multi-select items.

## Verification

| Gate | Result |
| --- | --- |
| Independent QA | **PASS WITH GAPS**, no P0/P1; one P2 device-E2E evidence gap |
| App typecheck | **PASS** |
| App focused configuration/lifecycle/projection/review suites | **PASS** (68/68 plus 3/3 fail-closed evidence tests) |
| App mutation architecture suite | **14/14 PASS** |
| Full app test suite on clean repositories | **1106/1106 PASS** |
| App content sync/boundary/privacy gates | **PASS** |
| Content canonical suite | **56/56 PASS** |
| Claude artifact validation and answer checks | **300/300 PASS** each |
| Diff checks | **PASS** in both repositories |

An earlier full app run passed 1094/1105 while both repositories intentionally contained the ODK-123 diff. One stale regex architecture assertion was corrected; the other ten failures were release-manifest cleanliness checks. After committing the upstream and app changes, the same full suite passed 1106/1106 on clean repositories.

## Artifact identity

The canonical Claude question artifact remains byte-identical: 300 questions, SHA-256 `7d6d12a49d67642e3144d062a6d237bec4604917ab34124e4ee121263c6beb2d`; the application lock entry is unchanged. The retired bundled-free-node publisher was not restored and no fictitious package `0002` was created. The new immutable identity is the Focus capability/profile v2 in content commit `7e322c5`.

## Removed/replaced paths

- Replaced the Certification-wide hardcoded `afterEachAnswer` path for Claude Focus with package-owned capability resolution.
- Replaced the Certification Practice review stub with a verified completed-session review.
- Replaced scalar-only feedback detail rendering with deterministic structured detail lines.
- Removed no question, scoring, attempt, provider or other Certification-mode path.

## Remaining limitation

No simulator/device flow traversed all ten questions through deferred completion, summary and review. The full behavior is covered by application/lifecycle integration tests and independent code review, but visual device evidence remains a P2 verification gap. No device-E2E claim is made.
