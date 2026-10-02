# BIZQ-01 — wrong multiple-choice selection scoring slice02

Updated 2026-10-02. Current local parentdocs17 SHA256 4ed626587a033a66ee234dca9727ceb81bf7f23dd4d08ea60d21134b19783cda. Bounded source/runtime slice; full BIZQ-01..06 goal remains active. Canonical status and dependencies live only in docs/PATTERNLY-WORKING-PLAN.md.

## Change and authority

Producer scripts/content/question-contract.mjs and consumer src/content/canonical/questionScoring.ts now return incorrect/zero whenever a legal selection contains a wrong option. Direct empty scorer selection also returns zero; production submit continues rejecting incomplete/invalid response before attempt creation. Correct nonempty partial math and maxPoints remain exactly as before while the async PO denominator decision is pending. Retaining this formula does not approve it as new canonical policy. Both scorer guards implement existing docs17§7 and docs16 Interaction contracts; parent docs17 received the empty/direct-score clarification before production code, outside all four Git repos. No other rule changed.

Producer keeps selected correct/wrong/omitted feedback metadata. App canonical feedback/Details and option control semantics remain authored and ID-based. Existing stored attempts are immutable historical facts, not migrated/rescored; only newly scored responses use the correction. No new persistence, runtime, profile, purchase, completion defaults, goal/plan/reminder contract, content ID/schema/version/artifact/lock/candidate/admission change. Replaced old points-awarding statement and conflicting wrong/empty test expectations; no obsolete runtime path or export introduced/deleted.

## Preflight and plan

Baseline app9b5340ebe19b46b24f475103a13f8c86e8aacc80/content2ceb2595903fceeb320eaf9cb3c98e369931ba3f/backend019e48e7d8e074c2e45d7f5ebb639a4ad394ae8f/web9585919b7d0c1a8396e6d255e49850e64e129d0e. Four upstreams fetched successfully this slice, unchanged. REPOSITORIES-BEFORE.json records refs, distance, stashes and dirty paths. Other security/full-content audits and canonical queue append retained; no owner's work moved or stashed. Backend/web untouched.

Final preflight-red-final.log has3 intended assertion failures: direct empty partial3/5; actual practice runtime→journal→stored attempt partial4/5; actual Coding Mock profile partial3/4. Earlier preflight-red and corrected logs expose setup failures, not scoring evidence: automatic selected plan lacked MC, GCP has no MC, Coding conditional reinsertion/profile identity validation correctly rejected inaccurate fixtures. Correct practice test explicitly reconstructs a valid Claude focus plan using an actual eligible-pool MC item; it does not prove automatic selection/reachability. Simulation test uses the actual canonical Coding profile/40-item plan unchanged. Production composition trainingLifecycleComposition wires the same commitTrainingOutcome owner used in the test.

Cel/Ustalenia/Podejście: BRIEFING.md and own paragraph in existing queue. Controller minimum0.88; independent NO-TOOLS Luna High PASS0.96/0.94/0.90/0.94, minimum0.90. Proposal review does not establish source/runtime acceptance. Producer-first→app implementation, paired local checkpoints after joint independent QA; no merge/push/release action. Rollback only own diff; no stash/reset.

## Verified checks

- Producer `npm run test:shared-contract`:23/23, shared-contract-green.log; independent wrong/empty fixture subset expectation and feedback metadata. Producer RED preserved separately under evidence/business-quality/bizq-01-scoring-slice-02/.
- Existing read-only committed admission validator:1/1 PASS, content admission-preservation.log. No create/admission operation or artifact write performed.
- App `node --import tsx --test src/application/canonical/multipleChoiceScoringIntegration.test.ts`:3/3, scoring-green.log. Both actual scorers tested on440MC/8960 legal subsets (377Coding/63Claude); independent expected wrong-zero, full correct, retained valid partial, empty, ID order invariance, duplicate/unknown rejection. All other7 banks contain no MC.
- Practice actual runtime→real mutation journal→canonical attempt/review repositories: wrong0/incorrect review, exact commit twice materializes once, same-memory storage rebind retains exact response/ref; invalid submissions make no further writes. This is memory repository rebind, not native disk restart or interruption recovery. Real authored reason/Details remain; selected correct/wrong and omitted correct controls match IDs.
- Actual Coding simulation finalization: wrong-containing attempt incorrect0/review reason incorrect, all39 other answers correct. Runtime-only simulation proof is not Premium admission/native UI proof.
- Existing app scorer/all16077-artifact oracle, real29-mode runtime/interaction, feedback, mutation journal and Premium lifecycle regressions:39/39, regressions.log.
- Existing current cross-repo builder tests (name filter selects2, exact expected producer HEAD2ceb259 while working tree contains own guard):2/2, current-build-parity.log. Historical frozen release test was not selected or claimed.
- Actual `buildAll` in a private temp directory compares raw bytes of all9 artifacts and content-lock against current app bundle:10 files identical; exact-artifact-bytes.log. Versioned reproduction: `node docs/active/BIZQ-01/scoring-slice-02/verify-artifact-parity.mjs`. Existing real builder API was probed by cross-repo tests before this bounded byte comparison; active output not rewritten.
- Typecheck, content boundary, runtime privacy boundary PASS; corresponding logs. Controller scoped source diff check PASS; whole dirty canonical queue belongs partly to another owner and is not a cleanup target.

Independent source acceptance Luna High: PASS WITH ISSUES for this bounded slice, independent producer23/23 + app12/12 + typecheck. Criteria and limits in QA.md. Root independently ran the checks above and inspected both actual production diffs; acceptance is not based on compilation or a reviewer report alone.

## Limits and next safe step

Current read-only Metro status200 running, actual Expo AppEntry500 UnableToResolveError learningEvidenceProjection (runtime-readonly-probe.json). Sole owner's existing runtime retained. No mobile/device/install/data clear/SDK/VoiceOver test performed; only existing iPhone17 is permitted. Code accessibility/feedback semantics preserved, no VO claim. No deploy, publish, push, production purchase, service configuration or content admission operation.

Await PO denominator choice before changing correct-subset points; zero correction can be accepted independently. Automatic practice MC selection/reachability, full Q01..Q14 content/editorial inventory and native runner/Details acceptance remain open. Next safe action is a bounded diagnosis of automatic practice selection or the unresolved partial formula after PO decision; coordinate existing runtime refresh through its owner before native replay. Previous BESD source slice01/new IDs/Premium reachability gaps remain unchanged.

Producer scoring02 implementation local commit `ddd45c83f47a77d425dd016f949f58e9dad0d3a9`; producer code identical to verified working tree. App checkpoint follows; commit alone does not invalidate the matching checks above.
