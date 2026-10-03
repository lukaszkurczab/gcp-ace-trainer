# Independent consumer QA — OOD node closure 16

**Verdict: PASS WITH ISSUES** for the bounded app-consumer contract. This accepts the current 119-item OOD-N01 replacement payload in the existing canonical app path. It does not establish device/native, Premium authorization, per-item durable-session recovery, full BIZQ-01, or release acceptance.

## Scope and acceptance criteria

The package is accepted at the consumer boundary when the synced canonical runtime catalog contains the exact 119 reviewed questions, preserves the accepted B01 unit, omits the 119 retired IDs, and exposes all 136 questions in the three existing OOD mode pools. The existing single-choice renderer and scorer must keep answer/feedback data out of the pre-answer view, score by stable option ID regardless of display order, and project the authored Reason, Details, and matching wrong-option message after a response. Candidate runtime admission must resolve the current exact content lock for every launch track.

## Evidence and results

- Independently ran from `patternly/`:

  ```sh
  node --import tsx --test src/content/bizq01OodNodeClosure16.test.ts src/content/bizq01BesdSeedCohort14.test.ts src/domain/tracks/runtimeAdmissionLaunchTracks.test.ts src/application/design-interview/designInterviewChoiceFeedback.test.ts
  ```


  Result: **23/23 passed**. The OOD16 test verifies all 119 proposal bindings against their frozen hashes, current source and bundled artifact equality, all retired predecessor IDs absent, the full accepted B01 payload preserved, every option's stable-ID score and diagnostics in normal/reversed option order, hidden answers/feedback/Reason/Details before answer, and complete membership in all three configured 136-item OOD pools. The BESD14 consumer test verifies the two preserved seed units, pre-answer presentation and fixed-ID scoring/feedback. Runtime admission resolved the exact current candidate lock for every canonical launch track. The existing Design feedback tests passed for durable-submit/rebind behavior and journal/materialization failure behavior.

- Independently ran the existing OOD source11/source12/cohort13 app-consumer tests:

  ```sh
  node --import tsx --test src/content/bizq01OodSourceReplacement.test.ts src/content/bizq01OodSourceReplacement12.test.ts src/content/bizq01OodUnitCohort13.test.ts
  ```

  Result: **4/4 passed**. These tests verify exact source-to-bundle parity, retired identity absence, existing learning-pool eligibility, fixed-ID scoring and authored diagnostics for source11's accepted replacement, source12's replacement while preserving source11, and all 15 cohort13 replacements while preserving the accepted source11/source12 items. Across the two independently run targeted app-test commands, the result was **27/27 passed**.

- Independently ran `npm run check:content-release` from `patternly/`: **passed**, with content HEAD `f000ad7668ad45cb7fc82dcd3f8e3ee9c47bed3c` and inventory `9/117/943/16077`. This confirms the app's generated canonical release matches the current content source checkout.

- The actual current OOD artifact identity is `object-oriented-design-interview-authoring-v2026.10.03-bizq01-16`, with 1,413 track questions and 136 questions in the target node. The independently read `ROOT-CONSUMER-PRESERVATION.json` records all eight other bundled artifact hashes unchanged; `ROOT-TRACK-IDENTITY.json` records current OOD track and source-13 predecessor identities.

## Limits

The OOD16 checks call the real canonical view-model, scorer, and feedback composer for each new question and option. Shared Design lifecycle tests exercise durable submit/rebind and failure handling using an eligible existing question, but do not submit each of these 119 new questions through a persisted session. No native/device or real Premium session was exercised in this review. Those are evidence boundaries, not failures of the tested canonical consumer contract.
