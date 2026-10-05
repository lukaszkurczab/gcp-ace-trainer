# Additive metadata erratum: N09 B05–B07 v2 target IDs

This erratum corrects target-option references in the immutable semantic-review reports only. The substantive issue descriptions, unit verdicts, and reviewed question bytes are unchanged.

The frozen inputs and original report bindings are recorded in the companion JSON. I checked all 25 finding target IDs against the option IDs on the exact frozen questions: 17 bind as reported; eight metadata references do not and are corrected below. The corrected IDs are present in the relevant input questions.

| Question | Original report target | Correct frozen option ID |
|---|---|---|
| ood-n09-b06-i009 | `n09b06_i009_boundary` | `n09b06_i009_wrong_boundary` |
| ood-n09-b06-i011 | `n09b06_i011_boundary` | `n09b06_i011_wrong_boundary` |
| ood-n09-b06-i011 | `n09b06_i011_later` | `n09b06_i011_reconstruct_later` |
| ood-n09-b06-i018 | `n09b06_i018_later` | `n09b06_i018_reconstruct_later` |
| ood-n09-b07-i025 | `n09b07_i025_cache` | `n09b07_i025_assumed_cache` |
| ood-n09-b07-i028 | `n09b07_i028_shortcut` | `n09b07_i028_contract_shortcut` |
| ood-n09-b07-i028 | `n09b07_i028_cache` | `n09b07_i028_assumed_cache` |
| ood-n09-b07-i030 | `n09b07_i030_cache` | `n09b07_i030_assumed_cache` |

No corresponding N09-B05 target reference was missing. This erratum does not alter content, scoring, semantic disposition, or package acceptance.
