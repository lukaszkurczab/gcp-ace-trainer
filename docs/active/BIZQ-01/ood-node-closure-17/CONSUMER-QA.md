# Independent consumer QA — BIZQ-01 OOD N02 closure17

**Verdict: PASS for the bounded app consumer scope.** I independently ran the synced app consumer and preservation tests against candidate `dc494c52dcce3bf786d8ea3685e33db425bc94fd6e97f4834f1da44ed8a00e9a`. The release lock binds its OOD artifact to source revision `3c45f928e7d8deb3a1c94fd13c992bffd6185d6c` (producer commit `3c45f928e7d8deb3a1c94fd13c992bffd6185d6c`); the bundled content lock identifies that artifact by content version and checksum, not by Git revision. The current OOD artifact has content hash `0415eae170f08689d775d77507ace85e2e38212119c7a7ead330a8a91ab2c8be` and contains 1,413 questions, including the 152 current N02 replacements.

## Verification

Ran from the app repository:

```sh
node --import tsx --test \
  src/content/bizq01OodNodeClosure17.test.ts \
  src/content/bizq01OodNodeClosure16.test.ts \
  src/content/bizq01BesdSeedCohort14.test.ts \
  src/content/bizq01OodSourceReplacement.test.ts \
  src/content/bizq01OodSourceReplacement12.test.ts \
  src/content/bizq01OodUnitCohort13.test.ts \
  src/domain/tracks/runtimeAdmissionLaunchTracks.test.ts \
  src/application/design-interview/designInterviewChoiceFeedback.test.ts
```

Result: **46 tests passed, 0 failed, 0 skipped**. This includes 19 closure17 consumer tests, 17 closure16 preservation tests, 3 BESD14 consumer tests, the prior OOD replacement/closure tests, runtime candidate-lock resolution, and two existing durable-submit/rebind feedback lifecycle tests.

Also ran `npm run check:content-release`: **passed** (`CANONICAL_CONTENT_CHECK=passed`; inventory 9 tracks / 117 nodes / 943 units / 16,077 questions).

The closure17 tests verify the eight pinned reviewed payload hashes and 19 ordered replacements per unit; source-to-review and bundled-artifact parity for all 152 objects; absence of the retired IDs in source and current artifact; and exact preservation of all 136 accepted N01 questions. For every new item they exercise the real fixed-ID scorer with every option and reversed option order, authored wrong-option feedback mapping, pre-answer view-model disclosure, and radio accessibility controls. The three actual ordinary N01 mode pools remain exactly the accepted 136 IDs, with no N02 eligibility added. `runtimeAdmissionLaunchTracks.test.ts` also passed against the actual release lock, bundled content-lock bytes, and candidate ID.

## Limits

No consumer defect was found within this scope. The existing durable submit/rebind tests verify the shared Design feedback lifecycle; they do not claim per-item durable submission of the N02 replacements. These checks do not establish native/device or Premium behavior, publishing/runtime authorization, or full BIZQ-01 completion. Item-semantic acceptance is recorded separately and is not inferred from consumer tests.
