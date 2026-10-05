# Independent design review — native25 resume correction

**Verdict: PASS.** The proposed consumer-only correction is the smallest coherent fix for a source-confirmed producer/route contract mismatch. This is a design review, not implementation or device acceptance.

## Binding and finding

- Reviewed proposal: [RESUME-CORRECTION-BRIEFING.md](RESUME-CORRECTION-BRIEFING.md), SHA-256 `910897c89b6e6f22ef8a3603952b18e4bc21a628ef74f6b75d5134b70ee10588`.
- Actual producer shape: `CanonicalTrainingRuntime.prepare` emits the canonical ordinary-practice snapshot with `kind`, `timer`, `feedbackMode`, `answerChanges`, `submission`, and `reinsertEnabled`; it does not emit `navigation`. `validateResume` constructs that same expected snapshot and compares it to the persisted snapshot.
- Consumer mismatch: ordinary Certification resume calls `assertOrdinaryCertificationConfiguration`, which currently rejects snapshots unless `navigation === "linear"`; ordinary Design resume independently has the same requirement. Home recommendation construction calls these route builders and converts the thrown error into an unavailable/disabled resume recommendation. The Home action then calls the same route builder again before navigating.
- The proposed change—accept the canonical absent-navigation shape in both route builders, while rejecting a `navigation` property and retaining the remaining guards—aligns consumers with the current producer without changing persisted sessions, fingerprints, package resolution, or Premium admission.

The post-ACK disabled Home action in `POST-ACK-RESUME-PREFLIGHT.json` is consistent with this mismatch, but I did not inspect private device storage or independently verify the saved session bytes. The source path itself establishes the producer/consumer incompatibility; this review does not claim a full device reproduction.

## Scope and implementation conditions

The correction should stay in `sessionConfig.ts`. Remove only the two requirements for `navigation: "linear"` and require that `navigation` is absent, so manually injected `"linear"` or other values do not make a noncanonical snapshot routable. Preserve every other existing check: active status, family/track/mode, exact session ID, package-supported length, feedback timing, submission mode, answer-change policy, timer, reinsert policy and current package selection. The later lifecycle `resumeActiveSession` and `CanonicalTrainingRuntime.validateResume` must remain responsible for exact package/version/artifact/fingerprint validation.

Update the ordinary-session test fixtures to match the actual producer shape rather than keeping a hand-authored `navigation: "linear"`. Add a regression that drives `CanonicalTrainingRuntime.prepare` through the relevant route builder and Home recommendation, asserting an enabled action for the same session identity. Cover the two consumer families; a selectable-feedback Certification case should exercise both supported snapshots, and an ordinary Design case should prove the second guard is corrected. Explicit `navigation` injection should still fail. Existing status, track, mode, length and configuration rejection tests should remain intact.

This addresses the route/configuration mechanism for both consumers. A Design route unit test does not establish Premium entitlement, and the Free GCP native run does not establish native Design behavior. No producer, persistence, migration, compatibility fallback, Premium, selection, or service change is justified by the evidence.

## Design assessment

Objective/architecture fit: **0.96**. Simplicity: **0.94**. Risk: **0.91**. Maintainability: **0.94**. Minimum: **0.91**. The current producer and its exact resume validator already define the snapshot contract; the two consumer guards are the inconsistent part. Updating both route consumers and their regression fixtures closes the demonstrated path while retaining fail-closed identity and interaction checks.

Source bindings and exact proposal hash are recorded in [RESUME-CORRECTION-BRIEFING-QA.json](RESUME-CORRECTION-BRIEFING-QA.json). No production code, app state, device, Metro process, service, plan, or queue was changed or tested in this review.
