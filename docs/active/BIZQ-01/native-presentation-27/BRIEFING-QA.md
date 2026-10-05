# Independent design review — overall scoring 27

**Verdict: PASS for the bounded scoring proposal.** I found no contract-level blocker. This approves the design direction for implementation review; it does not accept implementation, native behavior, Premium access, full Q12, or full BIZQ-01.

## Binding and decision

Reviewed `BRIEFING.md` at SHA-256 `5f737f8ab6235b8c4303d31cc1a87a8ec1f9a50d0b16463926cebb05ff70c796`, with the direct PO decision and canonical contract patch bound below. The PO requires a partial result to contribute zero positive credit to the overall score while remaining diagnostically `partial` and visible as “partly correct.” The canonical §7/§15 change records that rule and retains the existing denominator, unanswered-item behavior, raw attempt evidence, and history-validation contract.

## Assessment

| Criterion | Score | Finding |
| --- | ---: | --- |
| Objective and architecture fit | 0.96 | A derived credit value at existing verified projection boundaries implements the PO decision without changing the scorer’s diagnostic result or durable evidence. |
| Simplicity | 0.91 | One pure helper expresses the credit rule; existing family projections keep ownership of source and evidence validation, and existing callers keep their denominators. |
| Risk | 0.88 | Keeping raw `earnedPoints` for validation and deriving display credit only from verified attempts avoids invalidating history. The optional Certification Practice lookup is explicitly prevented from making the existing count summary unavailable. |
| Maintainability | 0.93 | A shared credit rule avoids family-specific drift while leaving the existing projections, result presentation, and progress model in their current roles. |

Minimum: **0.88** (required 0.80). The design’s key safety boundary is clear: derived overall credit is `earnedPoints` for verified `correct` attempts and zero for `partial` or `incorrect`; raw scorer and persisted result values remain unchanged. Existing denominators—including exam unanswered occurrences—stay with their current owners.

## Requirement-to-design review

| Requirement | Proposed handling | Result |
| --- | --- | --- |
| Partial earns no positive overall credit but remains diagnostically partial | Derive credit from verified attempt kind; retain `partialCount`, attempt kind, feedback, and saved raw points. The existing English locale already renders `Partial` as “Partly correct.” | PASS |
| Correct-answer credit and existing denominators remain stable | Keep each family’s current denominator, including unanswered exam occurrences; preserve existing correct attempts’ `earnedPoints`. | PASS |
| Historical result evidence remains readable and truthful | Do not rewrite attempts or weaken raw scorer/evidence validators. Derive display credit after the existing exact-source validation. | PASS |
| Result and progress consumers stop presenting raw partial points as overall credit | Change the identified Certification Exam/Practice and Coding result paths, shared points presentation inputs, and both progress numerator paths. Keep correct-count summaries and diagnostic counts intact. | PASS |
| No unsupported verification gate for generic historical summaries | Where there is no compatible verified-attempt projection, retain the existing count summary and omit the optional weighted-points row. Certification Practice’s additional lookup is optional and cannot block its current summary. | PASS |
| Verification exercises the real behavior | The brief calls for mixed correct/partial/incorrect/unanswered cases, historical raw-evidence preservation, projections, rendered rows, both progress aggregates, and existing raw parity checks. This is proportionate to the changed consumers. | PASS as a test plan; implementation tests have not been run in this review. |

I checked the named implementation boundaries: `ResultScreen` currently renders the exam projection’s `pointsEarned`; `SessionResultOverview` supports an optional weighted-points row; the Certification Exam and Practice projections aggregate raw `earnedPoints` while separately preserving outcome kinds; the Coding facade validates raw scores and aggregates their raw points; the Coding practice/simulation screens pass those values to the shared presentation; and `progressTabModel` sums raw points in both the per-area and effectiveness paths. The proposed edits target those paths while retaining their existing raw validation and denominators. The bounded preflight also documents real partial examples across MC, ordering, complexity, and matrix interactions and a completed practice aggregate reproducing the raw-versus-correct-count mismatch.

## Scope limits and non-blocking follow-up

The proposed same-session iPhone observation uses a result with 9 correct, 1 incorrect, 10 answered, and 0 partial. It can verify that the existing result remains intact after this code change, but it cannot prove native partial presentation. The briefing says so and leaves native partial, long-option/theme/accessibility Q12 coverage, Q13 update behavior, and remaining BIZQ-01 acceptance open. This is a correctly bounded implementation proposal, not a reason to block the scoring fix.

The separately authorized Premium-profile route does not create a dependency for this score-projection change: the proposal neither changes Premium admission nor claims Premium/native acceptance. Its preflight’s expired fixture and unavailable OOD Premium mode remain follow-up facts, not new gates for this package. Do not present this review as proof of actual Premium access.

No source, device, account, or service state was changed, and no implementation tests were run as part of this design review.

## Evidence bindings

- `patternly/docs/active/BIZQ-01/native-presentation-27/BRIEFING.md` — `5f737f8ab6235b8c4303d31cc1a87a8ec1f9a50d0b16463926cebb05ff70c796`
- `patternly/docs/active/BIZQ-01/native-presentation-27/PO-DECISIONS-2026-10-05.json` — `165880ca9b4b02ffbb55f7bdadc5183537c68ccd9426dc75e19e04f902c50d71`
- `patternly/docs/active/BIZQ-01/native-presentation-27/PO-CANONICAL-CONTRACT-CHANGE.patch` — `b06c502760eb3f1bcf827d92a4e40ace7e6db992263772c479c663f711c53c14`
- `patternly/docs/active/BIZQ-01/native-presentation-27/PARTIAL-SCORE-PREFLIGHT.md` — `6763c53677efe419af734e65ec0a8b7262bfaf42761b2b9921d4b8875d762f09`
- `patternly/docs/active/BIZQ-01/native-presentation-27/PARTIAL-SCORE-PREFLIGHT.json` — `03ebf2e94c1e48e4c915ec8711ca7a24d40ac214d42c20dbe0815024c047d15e`
- `docs/17-training-runtime-and-interaction-spec.md` — `a6d2e12be67d9de9d1e67728506bf29566bf6bbfbb332c4886a5de4d24b8106a`
- App checkout at review: `2d24ef611839a825be98bc056132211a05662f99`.

