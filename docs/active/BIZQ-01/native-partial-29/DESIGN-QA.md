# Independent design review — native partial29

**Verdict: PASS for the bounded proposed native flow.** It uses the ordinary Claude practice route to produce one real partial response, then returns to the existing GCP context. It does not claim full BIZQ-01 or release acceptance.

The path is technically coherent. The frozen Claude free-node probe shows that a fresh ordinary Focus Practice selection contains only single-choice questions, while completing its normal 40 questions correctly makes the six partial-capable multi-choice questions reachable in the ordinary follow-on session. The live flow therefore observes the actual prepared session and proceeds only if it contains a multi-choice item; it does not replace an item or fabricate history. The current scorer accepts a non-empty subset of the two accepted IDs and records a partial result. The existing overall-credit rule gives partial answers zero overall credit while retaining the raw attempt and partial count. These are separate facts: the device run still needs to show the actual question, response, feedback and result.

The preservation risk is bounded by the current device baseline and the selected route. The device is Guest on GCP with no active session or draft, a GCP goal at revision 1, and an accepted plan at revision 4 referencing that goal. Claude has no goal or plan. Reminder settings and journal are absent, permission is undetermined, and the app has zero scheduled notifications. In the current selector, the active track is committed before reminder reconciliation. With the observed Claude source missing and no reminder settings or scheduled IDs, that reconciliation clears the missing-source branch without asking for permission or scheduling; returning to GCP with no reminder settings takes the existing disabled branch. Track-specific goal and plan records are not rewritten by the track selection. The actual follow-up projection also found a pending account-sign-out marker and failed account-sync marker. The brief now explicitly preserves them: it forbids auth/profile transitions and requires stopping on unexpected UI or pending effects. The read source shows the guest route does not invoke authenticated sign-out recovery; account mutation gating fields are absent, and the pending-mark function does not change a failed sync state.

The procedure is appropriately fail-closed around live state. It reads only already-initialized modules by source name, keeps private account/runtime values outside the repository, observes the prepared question instead of assuming the memory probe determines device selection, completes both sessions before restoring GCP, and compares named learning, plan, reminder, and profile categories. It makes no whole-store equality claim and does not enable reminders, change plans, sign in, seed content, clear data, or change a service or Premium mode. If the selector reports a pending/error state or the actual prepared item differs from the expected multi-choice path, the root operator stops rather than retrying an uncertain operation.

| Review dimension | Score | Reason |
|---|---:|---|
| Objective and architecture fit | 0.95 | Uses the real selector, prepared-session, scorer, feedback, and result paths for the exact missing partial case. |
| Simplicity | 0.88 | No production change or test-only data; 40 normal answers plus the follow-on session are the minimum supported route evidenced by the current selector. |
| Risk | 0.86 | A track switch and new Claude learning records are real writes; the Guest/no-reminder baseline, category comparison, no-auth rule, and stop conditions constrain them. |
| Maintainability | 0.90 | Uses current app flows and existing read/scoring contracts; no new bridge, fixture, runtime mode, or durable mechanism. |

The brief should keep the newly recorded account lifecycle markers in its post-run comparison and stop if either changes unexpectedly. The current version does so. An interruption during the two ordinary practice sessions can leave Claude session progress behind; that is within the intended learning-record addition, but it is not described as a rollback or atomic round trip.

This is proposal acceptance only. It does not verify that the device will select the expected MC question, that the actual native feedback will render correctly, that the round trip preserves the live plan/progress, or that a notification operation succeeds on device. Those observations belong to the root operator's controlled native run. Existing source feasibility and prior GCP/partial-credit evidence are reused only for their stated source/configuration scope.

## Bound inputs

- `BRIEFING.md` — `e8fd16e03f4ed14bdf6973d6ec95f17164810aca4edae32a43762e72fcaa331e`
- `PREFLIGHT.json` — `ba485fb4f371b81f029d513cfe5c5c13ce543489ec86ec512389cf4e775af079`
- `native-presentation-28/CLAUDE-NATIVE-PRESERVATION-PREFLIGHT.md` — `1c6fa69aea71acd5d5f6b3adc1a1c1bd166ec4d577fa432bacc1b7d19455af02`
- `native-presentation-28/CLAUDE-NATIVE-PARTIAL-FEASIBILITY.md` — `fce31a04edad262f3efc1e3aabdd890126a787169275fcbe000cf26b9ada3aa3`
- `src/features/home/SelectTrackScreen.tsx` — `f5ca8c6f05f9d6c8684176864f2e08d2ccca9ec03f12a9934da41fd90e4ee1f6`
- `src/application/account/accountDataService.ts` — `a6aeb3d8d754ba56982eddb943c6aab7032b9bbb9ad51229349a34c62fd4195a`
- `src/application/account/AccountSessionProvider.tsx` — `5e7618249db9383e367147dabe316c7a98dc7dc2c201b7a6f958be148076a000`
- `src/application/account/profileStartupCoordination.ts` — `ce65cc2c799dfef5da313bfa1750c8ce8539a2a0c8160a9ea2183b637a77b8ee`
- `src/application/notificationPreferences.ts` — `76e6e29e58980779437464ae760aaef7be5136863740987a82356ba95e7b0557`
- `src/application/canonical/CanonicalTrainingRuntime.ts` — `cc980c835227e253c287a1dd841b0892861d5ab8f9491b1c35d5b870253a2e83`
- `src/application/canonical/practiceQuestionSelector.ts` — `717e2a36185f97c02d4cb0aa7f609f189ebcba9cef0d3b60585ad3c41f56d7bd`
- `src/content/canonical/questionScoring.ts` — `941e9a283789ddc73d46be50f1009770c72760f0d674847aafdc15110892be17`
- `src/application/canonical/overallScoreCredit.ts` — `88a09ac20bf1df176c4de187b08d4881f8c339ca77a89afad4e1c27cc8e5a273`
- `src/content/canonical/productModeConfig.ts` — `a65e60a2ebf6f61813a1277b4058ab9b28c60b82e7b2fa7f592b08f640fe04f3`
- `src/storage/repositories/accountDataRepository.ts` — `7ef2b04b34f295be6f7ba6ac008f4efe4e22d81fcde1c28248f17f4ab609b99f`
- `src/storage/repositories/accountLifecycleRepository.ts` — `e64e85cc81394d71331b20cd46812d28bc350265cb8d7088b8c62f0d08c0b7da`
- Private lifecycle projection `/private/tmp/bizq29-lifecycle-fences.json` — `a26d2cd706ea0e6013f02eaac0e3c36666cd65bc3acc90aaf486da801ff387d8`

## Review checks

- Read the full briefing and current actual preflight, including the later account-lifecycle marker projection.
- Traced selector write order and account pending behavior; traced missing-plan reminder reconciliation and the disabled/no-settings branch.
- Traced normal Focus Practice preparation, deterministic selection, multi-choice partial scoring, and the zero-credit result projection.
- No device action, source change, storage mutation, test run, or service/account operation was performed for this proposal review.

## Limits

- The current profile's live selection cannot be predicted from the isolated in-memory feasibility probe; the proposal correctly requires observing it.
- Native device evidence and post-run preservation comparison remain necessary before accepting the behavior.
- The pending sign-out and failed-sync markers are private live-state categories. This review relies on their stated source interpretation and on leaving them unchanged; it does not inspect sensitive account identifiers or claim an entire-store snapshot.
- No notification permission prompt, notification schedule, or reminder delivery is part of this proposal.
