# Semantic certification — closure review 18

**Verdict: FAIL for this frozen 120-item sample.** The result is limited to the five target tracks below. It is not an admission result, a whole-bank quality estimate, native acceptance, or full BIZQ-01 closure.

The reviewed bytes are `SAMPLE.json` SHA-256 `d2c083f3f3ac02fdaa38de725c717d31c88ad227365c30fb54bd121c16241ad4` (seed `BIZQ-01-section3.2-review18-v1`, source head `90a1d83859c2be83c5266ffe981f487d3c29aeeb`). Every entry below binds the frozen `questionId`, source-file SHA-256 and item fingerprint in [the machine-readable report](SEMANTIC-CERTIFICATION.json). I read each complete item: prompt, constraints, all options, answer key, Reason, all five Details fields where present, and every option-level message.

## Results

| Track | Reviewed | PASS | DEFECT | Main finding |
|---|---:|---:|---:|---|
| Claude Certified Architect Professional | 24 | 23 | 1 | One false arithmetic statement in feedback; accepted decision remains correct. |
| Google Cloud Associate Cloud Engineer | 24 | 0 | 24 | Repeated learner-visible exclusions and distractor categories expose answer-elimination cues. |
| AWS Solutions Architect Associate | 24 | 1 | 23 | One failure-domain contradiction, feedback/Details and filler-distractor defects, and a repeated uniquely-longest-key cue. |
| Azure Administrator AZ-104 | 24 | 23 | 1 | Stored-policy propagation key does not explain the stated multi-minute outcome. |
| Azure AI Fundamentals AI-901 | 24 | 0 | 24 | Generic template and missing decisive case facts leave the keyed capability/operation underdetermined. |
| **Total** | **120** | **47** | **73** | **0 unresolved** |

### Concrete defects

- **CCARP-D02-O04-scenario-05:** tokens total 18K + 5K + 10K = 33K before the 6K reserve. Against a 32K budget that is 1K over before reserve; the 7K excess applies only after adding reserve. The answer to defer irrelevant schemas is still correct; fix the matching arithmetic claims in `details.errorCorrection` and wrong-option feedback.
- **All 24 sampled GCP ACE questions:** each repeats learner-visible author-directed constraints such as “choose one” and “do not substitute DNS/billing/unrelated …,” and option sets repeatedly include category-level fillers from precisely those excluded categories. This cues elimination without the service-specific reasoning the question claims to test. In `gcp-ace-gcpace-n01-b02-001`, the direction to avoid an adjacent identity boundary also conflicts with the correct Cloud Identity/Workspace prerequisite. Six additional sampled items cite a page that is not the fact used by the explanation; exact item notes and direct replacements are in the JSON.
- **AWS:** The corrected pass found 23 defects in the 24-item slice. `aws-saa-c03-AWSSAA-N03-B06-002` conflicts between device failure in the prompt and tunnel failure in the constraint. `...N20-B03-013`, `...N18-B05-003`, `...N17-B06-018`, `...N19-B06-006`, and `...N20-B07-006` have generic or topic-mismatched Details/feedback. Across the slice, 21 of 24 answer keys are uniquely longest, often comprehensive multi-clause answers paired with short absolutes or category fillers; this is a qualitative systematic cue, not a length threshold or claim the key is technically false. `...N01-B04-006`, `...N07-B06-007`, `...N04-B06-013`, and `...N06-B04-005` also contain invented/category-level alternatives that do not represent credible nearest misconceptions. Only `...N09-B05-003` retained two relevant nearest alternatives and no long-key cue.
- **az104-AZ104-N04-B04-007:** Microsoft documents up to 30 seconds for stored-policy changes and says associated SAS calls might fail with 403 while the policy becomes active. The prompt also never says the shortened expiry has already passed, so success might simply be within the new validity window. The stated facts therefore do not establish propagation as the explanation. See [Microsoft’s troubleshooting guidance](https://learn.microsoft.com/en-us/troubleshoot/azure/azure-storage/blobs/authentication/storage-troubleshoot-403-errors).
- **All 24 sampled AI-901 questions:** repeated generic prompt, constraint, key, and wrong-feedback wording does not establish a single case-specific capability or correction. Examples: `AI901-N05-B05-Q004` asks about video generation but keys image generation; `AI901-N03-B12-Q011` provides no tool/state/output fact to decide direct model vs agent; `AI901-N05-B08-Q007` gives no observed extraction or privacy failure to select a pipeline correction. The current Microsoft guide confirms these broad exam topics, but topic alignment does not supply the missing premises. Individual notes identify the specific gap for every item.

## Coverage boundary
**AWS note correction.** The initial AWS annotations for `N18-B05-003` and `N17-B06-018` were crossed because I carried a preliminary issue list into the report without comparing each note to its exact sample ID and fingerprint. Those claims are withdrawn. The initial generic PASS notes also omitted the required nearest-alternative/style assessment. The corrective pass re-read all 24 AWS whole objects in sample order, verified question ID plus fingerprint before evaluating fields, recorded the nearest misconception and all feedback alignment against that object, and recomputed counts from the actual row statuses. The 21/24 sole-longest observation is descriptive support for the existing qualitative style finding, not an automatic threshold.


The deterministic selection contributes 24 objects per target track from the frozen 216-item sample. The selection covers all listed nodes and the sampled interaction types for these five tracks, but **stage coverage is not established** because canonical items do not author a stage/learningStage field. All 24 selected objects in each target track had `difficulty: null`, so these reviews do not stratify difficulty. The other four tracks in the 216-item sample are outside this report. The sample is a bounded review budget, not a statistical estimate, and this report does not claim a whole-bank defect percentage.

Primary technical checks were limited to claims that materially determine a key or expose a wrong citation: Spanner conflict aborts and retries, static external IP reservation, private-node egress, Workstations port IAM, AWS DMS LOB modes, PrivateLink pricing, stored access policy propagation, AI-901 current objectives and Content Understanding analyzer behavior. Exact URLs and conclusions are recorded in JSON. Hypothetical case facts are not presented as vendor guarantees.

## Q01–Q14 acceptance matrix

The global evidence map for all nine tracks and the frozen 216-item sample is maintained in [ACCEPTANCE-MATRIX.md](ACCEPTANCE-MATRIX.md). The findings above remain this report’s bounded semantic review of the five certification tracks (120 items); they are not repeated here as a separate Q01–Q14 status table.
