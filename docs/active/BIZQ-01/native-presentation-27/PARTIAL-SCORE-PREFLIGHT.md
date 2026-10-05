# Partial-score policy preflight

## Finding

The canonical scorer deliberately keeps a diagnostically useful `partial` outcome with positive raw earned points. The new PO rule is about **user-facing overall credit**, not changing that per-question outcome or invalidating stored attempts. The smallest coherent fix is a derived overall-score projection: award overall credit only when `attempt.result.kind === "correct"`, keep each consumer's current denominator and unanswered handling, and leave the saved `kind`, `earnedPoints`, `maxPoints`, response, feedback, and result-evidence validation unchanged. The item review must continue to say “partial” / “partly correct.”

The affected families expose different existing denominators, so one small pure helper should centralize the **credit rule** while callers retain their present denominator contract. For a verified correct attempt, preserve its existing `earnedPoints` as overall credit; a partial or incorrect attempt contributes zero. Do not replace saved `earnedPoints` with `maxPoints` as a new scoring rule. This keeps the preflight grounded in the points already produced by the validated attempt rather than adding an assumption about score normalization. Where a screen has only historical aggregate evidence and no compatible verified attempts, keep the summary readable with its existing correct-count score and omit the optional points row rather than add a new verification gate or reinterpret persisted raw points.

## Current behavior and impact

`scoreCanonicalQuestion` creates `kind: "partial"` whenever earned points are positive but below max. Actual catalog probes confirm partial outcomes in all implemented partial-capable interaction families: multiple choice, ordering, complexity, and decision matrix. Single choice has no partial state. The scorer's raw points are used by attempt creation, review scheduling, completed result evidence, and strict result readers. Those are diagnostic and integrity contracts; changing them to incorrect/zero would fail their current scorer-parity checks and risk making historical completed evidence unreadable.

Several correctness/count views already exclude partial from the overall correct count. The shared result card shows `correctCount / totalOccurrences`; certification progress and the legacy certification projection compute accuracy from correct outcomes only; analytics domain/tag percentages use `isCorrect`. They can retain their current behavior. They separately expose partial as a diagnostic category.

There are current user-facing points/effectiveness views that still credit a partial answer:

- `ResultScreen` obtains the certification exam projection's raw `pointsEarned` and renders `Points: earned / max`. `certificationExamReviewProjection` accumulates raw attempt points while separately exposing `correct`, `partial`, and `incorrect` counts. Preserve that raw field for evidence validation and add a separate correct-only display numerator from those validated attempts.
- `ResultScreen` normalizes raw practice result evidence and passes it to `SessionResultOverview`; that component can show a `Weighted points` row. The real ten-answer practice fixture currently projects 7 correct, 1 partial, 2 incorrect and 15/22 raw points. Its top-line 7/10 correct count already treats the partial as not correct, while the extra point row gives positive credit.
- Coding practice uses `codingInterviewSessionFacade` to validate and aggregate raw persisted points; `AlgorithmsPracticeSummaryScreen` passes raw score evidence to the shared weighted-points UI. Coding simulation does the same in `AlgorithmsInterviewSimulationResultScreen`.
- `progressTabModel` also aggregates raw points into per-area totals (around line 247) and calculates the algorithm effectiveness percentage (around line 677). Both visible aggregates give partial points credit; apply the same correct-only numerator in both paths while retaining each existing denominator and diagnostic counts.
- Certification/cloud accuracy and taxonomy percentages already use only `kind === "correct"`; mistake counts already include every non-correct outcome.

The legacy `certificationProjections` percentage is also correct-count based. No partial-score aggregation was found in the Learning Plan package during this preflight.

The important separation is: preserve raw per-attempt and committed result evidence as historical facts, then derive an overall score from the verified attempt kinds at the projection boundary. Do not mutate old attempts or weaken validators that confirm an attempt against its source question. Current result evidence fields such as `pointsEarned` are raw scorer evidence; reusing them as the new overall score without a verified derivation is unsafe.

## Minimal implementation surface to consider

Use one pure credit projection for completed verified attempts, leaving denominator inputs with their current owners. A concrete application API shape is `overallCreditPoints(attempts)`, implemented beside the canonical score projections (for example `src/application/canonical/overallScoreCredit.ts`). It returns the sum of each attempt's existing `result.earnedPoints` only when its verified kind is `correct`; it does not mutate an attempt and does not choose a denominator. Keep this helper pure and have the existing verified family projections call it.

Do not add a universal `loadOverallScoreProjection(sessionId)` facade. Extend only existing score-bearing verifiers with derived credit from their already-validated attempts; this keeps family ownership and avoids imposing new verification on generic historical summaries:

- certification practice: expose derived overall credit from `projectCertificationPracticeReview` / `getCertificationPracticeReviewProjection`, based on `sessionAttempts` after its existing exact-source scorer comparison. `ResultScreen` currently does not require this projection to render its count summary, so treat the derived points row as optional: if this existing projection cannot be obtained, keep the current readable summary and omit the points row; do not turn the new policy into a new unavailable-summary gate;
- certification exam: extend `projectCertificationExamReview` with derived overall credit from its already exact-validated attempts, keeping its full-plan `maxPoints` denominator (including unanswered items) and raw `pointsEarned` validation unchanged;
- coding practice/simulation: extend existing validated completed-result projections with derived credit after their current validation; leave `resultScore` and raw saved-evidence comparison intact. Thread derived credit into `AlgorithmsPracticeSummaryScreen` and `AlgorithmsInterviewSimulationResultScreen`;
- ordinary Object-Oriented Design practice: do not add a completed-result verifier for this score policy. The current OOD catalog is single-choice only, so it cannot produce partial outcomes. Keep its existing summary readable and use its correct-count score; omit an optional raw-points row where the available historical summary has no compatible verified attempts.

`ResultScreen` already distinguishes Certification Exam, Certification Practice, and generic results. Certification Practice and Exam can use their existing exact attempt projections; Coding Practice and Simulation use their existing completed-result verifier. Those verified branches should pass derived credit to the points presentation while retaining their current denominators and raw-evidence checks. For generic or historical summaries with no compatible verified attempt projection, keep the existing correct-count summary and suppress the optional raw-points row instead of rejecting the summary. In Certification Practice, keep its current summary validation and availability behavior separate from the optional call used only to derive points. OOD content itself is single-choice and cannot produce partial outcomes. The generic Design result branch can also represent other tracks, so do not infer that every such session is single-choice; where no compatible verified attempts exist, keep the count summary and omit its optional raw-points row. `progressTabModel` should change the numerator in both the per-area aggregation and effectiveness percentage to sum existing `earnedPoints` only for attempts whose kind is `correct`; retain each current `sum(maxPoints)` denominator and separate partial/incorrect diagnostic counts. Search established no other current `earnedPoints` score consumer in Learning Plan.

This creates no new persistence field or versioned history. Old completed result objects continue to be validated against raw attempt points; the application calculates display credit on read from those verified attempts. That is how a historical correct item keeps its full existing credit while an old partial item displays zero overall credit without rewriting the record. For a family that already has an exact verified projection, derive credit only from its verified attempts. For a generic historical summary or optional Certification Practice points lookup without compatible verified attempts, do not add a new unavailable state: preserve the existing count summary and omit the optional points row. Keep existing validation and availability behavior that already applies to the summary itself.

The implementation should thread this shared rule into the existing verified result projections and progress effectiveness, rather than altering `scoreCanonicalQuestion` or `AttemptResult`:

- certification practice/exam result projection and `ResultScreen` points row;
- coding practice/simulation projections and `AlgorithmsPracticeSummaryScreen` / `AlgorithmsInterviewSimulationResultScreen` weighted points;
- generic historical Design summaries remain readable without a new verifier; use count score and omit an unsupported optional points row;
- per-area totals and algorithm effectiveness percentages in `progressTabModel`;
- shared `SessionResultOverview` consumers so raw diagnostic points are not presented as overall credit.

Keep `CanonicalTrainingRuntime`'s persisted attempt/result fields and `certificationReviewEvidenceMatches`, coding/exam integrity validators, and saved review results raw and byte-consistent. Preserve each existing denominator, including unanswered exam occurrences where the current overall percentage includes them. Keep `partialCount` and each reviewed item's `result: "partial"` unchanged.

Tests should pair correct, partial, incorrect and unanswered items in each score-carrying family: assert the partial remains diagnostically partial, adds zero overall credit, does not change the current denominator, and leaves stored attempt/result evidence unchanged. Include historical results with raw positive partial points and prove they remain readable while the derived overall score gives them no credit; include historical fully-correct attempts to prove their existing credit is preserved. Keep strict raw result-evidence parity tests as-is. Add direct helper tests plus verified-projection tests for Certification Practice, Exam, and Coding Mock; do not create a Design verifier solely for this policy. Add `ResultScreen`, `AlgorithmsPracticeSummaryScreen`, `AlgorithmsInterviewSimulationResultScreen`, and `SessionResultOverview` tests for the actual points rows (including the generic-summary no-points-row case), and `progressTabModel` per-area and trend/effectiveness tests. The current English locale already maps `Partial` to `Partly correct`; preserve that label and its translations. Existing canonical all-subset validation must continue to verify raw scorer/oracle parity.

## Reproduction evidence

Read-only current-catalog probe (`node --import tsx -e` using CommonJS `require` for the repository's TypeScript modules) found 440 actual multiple-choice questions with a valid partial subset. Example `CCARP-D01-O01-transfer`: selecting only correct option `d` is a complete response and currently produces `{kind:"partial", earnedPoints:4, maxPoints:5}`. Other real examples:

- `alg-arrays-duplicate-handling-007`, swap the last two authored elements: partial 1/3;
- `alg-arrays-duplicate-handling-009`, choose `O(1)` instead of the accepted time dimension: partial 1/2;
- `fesd-n01-b03-i001`, choose `single_lab_score` for evidence and retain the other two correct dimensions: partial 2/3.

The existing practice fixture uses an actual completed session and yields 7/10 correct, 1 partial, 2 incorrect with raw points 15/22. This reproduces the current distinction between correct-count score and raw weighted points.

Verification run on Node 22.22.3:

- `node --import tsx --test src/application/canonical/multipleChoiceScoringIntegration.test.ts` — 3/3 passed, including the all-440-question / 8,960-subset check and raw durable-attempt preservation.
- `node --import tsx --test src/application/certification/certificationPracticeReviewProjection.test.ts src/application/certification/certificationExamReviewProjection.test.ts src/features/exam/sessionResultPresentation.test.ts src/tracks/certification/certificationProgress.test.ts` — 15/15 passed. Current tests explicitly preserve raw partial points in result evidence and verify exact historical maximum override without mutating that evidence.

One initial ad hoc ESM `node -e` probe failed because `tsx` did not expose the CommonJS module's named export under that invocation form. I changed only the probe invocation to CommonJS `require`; the actual catalog enumeration then completed successfully. No files or user data were changed.

## Bindings and limits

Source of the PO decision: `native-presentation-27/PO-DECISIONS-2026-10-05.json` (SHA-256 `165880ca9b4b02ffbb55f7bdadc5183537c68ccd9426dc75e19e04f902c50d71`). Canonical runtime contract: `../docs/17-training-runtime-and-interaction-spec.md` from the app checkout, SHA-256 `a6d2e12be67d9de9d1e67728506bf29566bf6bbfbb332c4886a5de4d24b8106a`; §7 retains `partial` diagnostically, gives it no overall-score credit, and keeps existing denominator/unanswered and history-validation policies. Repository checkout at review: `2d24ef611839a825be98bc056132211a05662f99`.

This preflight changes no code and makes no native, Premium, full-Q12, full-BIZQ-01, or release-readiness claim. It identifies an existing cross-family score-projection defect and the bounded compatibility-preserving direction for a separately reviewed implementation slice.
