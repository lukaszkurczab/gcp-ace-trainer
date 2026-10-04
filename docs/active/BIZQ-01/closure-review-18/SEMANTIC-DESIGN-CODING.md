# Independent semantic review — packet18 sample (four tracks)

**Verdict: FAIL for this bounded 96-object review.** This report covers only the four listed tracks and frozen objects. It is not a whole-bank estimate, runtime/admission result, stage-coverage claim, or full BIZQ-01 closure.

The reviewed sample is [SAMPLE.json](SAMPLE.json), SHA-256 `d2c083f3f3ac02fdaa38de725c717d31c88ad227365c30fb54bd121c16241ad4`, source head `90a1d83859c2be83c5266ffe981f487d3c29aeeb`. Every record in [the item-level JSON](SEMANTIC-DESIGN-CODING.json) binds the exact track, version, source-file hash, question ID, and item fingerprint. I read the complete prompt, constraints, all choices/elements, answer, Reason, Details, and every option-level message. Prior-review reuse is limited to exact matching fingerprints.

| Track | Reviewed | PASS | DEFECT |
|---|---:|---:|---:|
| Coding interview — DSA problem solving | 24 | 24 | 0 |
| Backend system design | 24 | 2 | 22 |
| Object-oriented design | 24 | 6 | 18 |
| Frontend system design | 24 | 0 | 24 |
| **Total** | **96** | **32** | **64** |

## Findings by track

**Coding interview — DSA problem solving (24 PASS).** The sampled items make concrete algorithmic decisions from stated input and operation facts, and the key/feedback explain the relevant invariant or cost boundary. I found no sampled content defect. The verdict does not certify unsampled questions or any stage coverage.

**Backend system design (2 PASS, 22 DEFECT).** The two passing objects are exact accepted items: `besd-n02-b01-i032` (fingerprint `2d3b25440635f58ce24e23f792dd497ea55f869cc16adb98e32782ae3288503e`) and `besd-n04-b01-i022` (fingerprint `0a8f813a95030112e90aaefe4417d497be0b12aff6963dac4277d28da7ccde14`), reused from [packet14 semantic QA](../besd-seed-cohort-14/SEMANTIC-QA-v5.md). For each of the other 22 items, a learner-visible constraint literally states “The primary decision is …” and gives the keyed architecture answer before the response. The generic lens prompt/options compound the disclosure by making distractors category-level shortcuts rather than workload-grounded alternatives. Remove the answer-labelled instruction and rewrite each scenario with facts that distinguish the key from its nearest plausible alternative; align all feedback to those facts.

**Object-oriented design (6 PASS, 18 DEFECT).** Six exact fingerprints reuse bounded accepted reviews: `ood-n01-b01-i024`, `ood-n02-b01-i021`, `ood-n02-b07-i029`, `ood-n01-b08-i033`, `ood-n02-b04-i031`, and `ood-n02-b05-i032`. Their fingerprint-level review sources appear in the JSON and packet13/16/17 reports. Of the other 18 defects, 17 have case-to-lens gaps: for example, the plot transfer lacks ownership/lifetime evidence for composition; the badge case states revocation visibility but not independent policy variation; a non-overlapping meter reservation does not establish serialization/default evolution; and the shipment transfer does not describe a nested-lock progress hazard. The remaining item, `ood-n07-b01-i004`, has a supported repository/domain-access key grounded in the deterministic test seam and retained delivery promise, but its wrong-option feedback falsely says no delivery requirement exists and dismisses the stated second workflow variant. Thus the report does not classify all 18 as underdetermined: 17 need case-specific evidence or a key grounded in existing facts, and one needs aligned feedback without changing its supported key.

**Frontend system design (0 PASS, 24 DEFECT).** The sampled objects repeatedly pair generic browser/UI vignettes with a named lens or a stock “observe/preserve/expose/recover” sequence that the case facts do not determine. Matrix examples ask about measured image optimization on a revision/comment case with no performance trace, or cache dimensions on keyboard/touch requirements with no cache evidence. Options and feedback reuse broad templates rather than diagnosing the actual nearest alternative; every sampled Details.application has a malformed “The the …” sentence and describes generic recovery rather than applying the case. Rebuild each item so a visible user/browser/system fact distinguishes the key from a plausible alternative, then make every feedback leaf address its actual option.

For the 13 sampled FESD ordering objects, serialized source includes a `wrong_element` message that contradicts the accepted first element. [ORDERING-SCOPE-QA.md](ORDERING-SCOPE-QA.md) independently confirms that the current Design Interview ordering projection emits `broken_relation`, not `wrong_element`; this is an authored-source inconsistency, not a confirmed current learner-visible message defect. The item-level ordering findings separately assess each prompt and its generic sequence; they do not turn this source-message mismatch into a runtime claim or a blanket verdict about other ordering questions.

## Limits

This review examined 96 of 216 objects in the frozen sample, from four of nine tracks. It does not estimate a bank-wide defect rate. Stage coverage is not established because the source items have no authored stage field. Existing sample selection and root probes are evidence about selection/runtime projection only; they do not replace whole-object semantic judgments. No source changes or runtime tests were made.
