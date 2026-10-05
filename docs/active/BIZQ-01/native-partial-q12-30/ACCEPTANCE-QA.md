# Independent acceptance — BIZQ-01 package 30

**Verdict: PASS for the bounded package30 scope.** The accepted scope is the shared answer-option renderer on the existing saved Claude partial result, question 3/10, at maximum iOS Dynamic Type in light and dark appearance, including the ordinary source-link opening and captured-state preservation. This does not close all of Q12 or BIZQ-01, and makes no Premium, Q13, release-readiness, or educational-effectiveness claim.

## Acceptance evidence

I independently reviewed the frozen packet and production diff at base app HEAD `d0525e3ea5d5bf0cf19425923ccc329af86f0e06`. `EVIDENCE-MANIFEST.json` has SHA-256 `134fda55bffe0691033671c1f99a01e69711805d15158e1fe6261d578bd10ae7`; all 206 listed code/packet bindings matched. Both screenshot indexes also matched their image hashes: 48 recovered images and 42 final images.

I viewed the final native light and dark frames 01–10 and 20. Across the overlapping frames the saved prompt and all five options are legible; option A ends with “in a later review.”; B is shown selected/correct, D as omitted/correct with a dashed border, and the “Partly correct” banner agrees with the saved partial result. Reason remains readable, Details and Next are visible and reachable, and the final frames do not advance to question 4. This is presentation evidence for this saved partial only; it is not a new wrong-answer or repaired-OOD case.

The 48 earlier captures cover omitted-answer feedback, Reason, all five expanded Details sections, the source control and Next. I independently confirmed that `textLayoutHeight.ts` and `PracticeFeedbackBlock.tsx` equal the HEAD versions after the documented helper/import/export name normalization. This supports reuse of the unchanged feedback renderer under the tested conditions; it does not substitute for the separately recorded source opening.

The source evidence records one ordinary tap on the saved question’s Source control. The loaded screenshot shows Claude Platform Docs and the “Prompt engineering overview” page with explanatory body. I independently checked the private Safari address node against the exact URL in `SOURCE-OPENING-EVIDENCE.json`. The screenshot and address agree; consent controls were left untouched. The packet correctly makes no retained-position claim after Safari.

I independently compared the private before/after snapshots without displaying raw record values. Schema, device, profile, key inventory, records, lifecycle fences and notification fields match exactly: 81 captured records and 84 keys. Guest state and permission-undetermined/scheduled-zero reminders match; three profile-metadata values remain unread, so this is not a whole-store assertion. The OS restoration receipt reports dark appearance and Large content size.

The final `AnswerOption.tsx` uses a one-shot native text-height correction shared through `textLayoutHeight.ts`. The child key covers text, window width, font scale, physical scale, badge letter and answer state; the key does not move to the outer Pressable. This handles the state-border and badge-width layout changes while preserving control identity and its label, role, state, callback and test ID. The old feedback helper path is removed. The focused callback/remount/accessibility tests, typecheck and recovery check recorded in `ROOT-CHECKS.json` passed. I inspected those receipts; I did not rerun their commands.

## Findings and limits

No blocking defect or unsupported acceptance claim was found within package30. Earlier failed layout hypotheses are marked superseded, and the final report identifies the measured native rounding cause and the accepted repair.

Remaining scope is explicit: the full Q12 matrix and complete BIZQ-01 remain open, including other representative answer outcomes, common questions and iOS coverage, long repaired options/Premium, and actual active-package Q13 update. OOD admission remains covered by the already accepted packages23/24. VoiceOver, notification delivery, purchase/RevenueCat, and educational efficacy were not tested or claimed. This PASS is for package30 only; it is not full Q12, full BIZQ-01, or release readiness.
