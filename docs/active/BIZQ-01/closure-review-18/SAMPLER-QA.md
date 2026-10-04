# Independent sampler QA — BIZQ-01 closure review18

**Verdict: PASS for sampler identity, reproducibility, and bounded coverage.** Reviewed only the frozen sampler and sample; this is not semantic acceptance of the 216 questions, source approval, or full BIZQ-01 acceptance.

## Binding and reproducibility

- Current content Git HEAD resolves to `90a1d83859c2be83c5266ffe981f487d3c29aeeb`. The sampler reads the canonical review-console API and the live catalog, binds each selected row to that track’s current `contentVersion`, whole source-file SHA-256, and canonical item fingerprint.
- Ran `node --check docs/active/BIZQ-01/closure-review-18/sample-current.mjs` twice; both passed.
- Ran `node docs/active/BIZQ-01/closure-review-18/sample-current.mjs --check` twice; both runs passed, and their outputs were byte-identical. Each run reselected from current API records and verified the frozen `SAMPLE.json` bytes. Raw `SAMPLE.json` SHA-256 is `d2c083f3f3ac02fdaa38de725c717d31c88ad227365c30fb54bd121c16241ad4`.
- The resulting sample is **216 distinct question identities: exactly 24 from each of the nine launch tracks**, from a 16,077-item population. The data check confirms current track/version and source fingerprints for every selected item. The sample and source trees were not modified during this review.

## Actual selection coverage

Each track includes 24 distinct mental units. Selected node coverage is 24/26 for Coding, 7/7 for CCARP, 10/10 for BESD, 9/9 for OOD, 10/10 for Frontend, 20/20 for GCP ACE, 21/21 for AWS SAA, 9/9 for Azure Administrator, and 5/5 for Azure AI Fundamentals. For every track, the selected interaction-type set equals the interaction types available in that track; the sampler enforces and records this comparison. For example, Coding covers choice-single, choice-multiple, complexity, and ordering; Frontend covers choice-single, decision-matrix, and ordering.

The explicit risk/control overrides fit within each 24-item cap and are visible in the sample’s `selectionReason`: Coding’s `alg-binary-search-bounds-020`; BESD’s three authored-seed/current-risk IDs; OOD’s accepted N01/N02 controls and selected N03/N06 residual-risk examples; GCP’s exact `gcp-ace-gcpace-n01-b02-001`; and the CCARP D03-O01 control. These are selected examples, not approval of the surrounding bank. The BESD advisory flags are preserved as review context, not treated as semantic verdicts or quality statistics.

## Field and stage limits

I inspected actual records from the review-console API and the canonical catalog. The question fields include `difficulty` but no `stage` or `learningStage`; catalog track entries contain only `trackId` and `contentVersion`. The sample correctly records `stageCoverage` as **not established** and explicitly says node/difficulty spread is not stage stratification. Non-null difficulty values appear in four tracks (Coding, BESD, OOD, and FESD); the other five (Claude, GCP, AWS, Azure Administrator, and Azure AI Fundamentals) have `difficulty: null`, as reflected in the sample rather than filled with invented values. Two Coding nodes are outside the 24-item cap. The report must not claim all-node coverage for that track or stage coverage for any track.

The `--check` path does not write `SAMPLE.json`; this review used only that path. The ordinary generation path is available to the packet owner for regenerating the snapshot after a deliberate source/selection change. No such change was needed here.

## Scope boundary

This QA establishes the frozen sample’s current-source binding, deterministic selection, cap, distinctness, risk/control overrides, and recorded node/interaction/difficulty coverage. It does not judge the sampled answers, validate all cited primary sources, produce a bank-quality percentage, infer unsupported authored stages, or accept source changes/admission/native/Premium behavior. Those question-level reviews and the remaining BIZQ dependencies are separate work.
