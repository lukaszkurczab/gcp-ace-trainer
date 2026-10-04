# Independent cross-correction semantic QA

**Verdict: REVISE two items; four corrected items pass this bounded review.** This review covers only the six corrected whole objects in the frozen proposals below. The other 156 N04 objects reuse their applicable prior whole-object reviews; this is not acceptance of the full 162-item cohort. No source activation or producer/consumer/native acceptance is implied.

## Frozen inputs

| Unit | Frozen proposal | Notes | Corrected objects |
|---|---|---|---|
| N04-B01 | `review-inputs/v5/OOD-N04-B01.json` — `19576ef2ead08fdf21c789dd7a0ab5b691174b103fa88ae2d8b0e8d90c12dc80` | `0b79bee022231bcb1144327e07785c956160656b00b91c2f465b93ee12256f32` | i028, i035, i036 |
| N04-B03 | `review-inputs/v4/OOD-N04-B03.json` — `76011c4b1ba9440b126af651a84aae1925c06d4f9955784ebf6f2067562b1e28` | `4a319a0879894e071262c3e4baf2a66b917b6f193d685795c8297b94004d204d` | i035 |
| N04-B08 | `review-inputs/v3/OOD-N04-B08.json` — `9f7dbef69dc01c92ec8f9d664f4aad08f717ab9cd4b0c9601282012da0752b5d` | `f15a70816e740adb5aeb0477bc2ea733ca077131f3b1c463c013bfc4d752c3a5` | i035, i036 |

I read each corrected prompt, constraints, all options, key, Reason, all Details fields, and each stable-ID wrong-option message. The N04-B01/B03 exact-change inventory is in `ROOT-CROSS-CORRECTIONS-A-PRESERVATION.json`; the B08 v3 structure binding is in `ROOT-STRUCTURE-B08-v3.json`. Those structural records establish the reviewed bytes and field scope, not semantic acceptance.

## Item findings

| Item | Result | Finding |
|---|---|---|
| `ood-n04-b01-i028` | **REVISE** | The decisive action is still to keep the released base interface unchanged and add a separate opt-in capability for an operation only some implementations support. That is the same learner decision and nearly the same decisive premises as accepted `ood-n04-b09-i029`: preserve a released interface, avoid a required member or unsafe default, and add a capability implemented only by the subset that supports it. “Search” versus “hardware-backed sealing” changes the domain nouns, not the decision being trained. This is the recycled cross-unit decision the N04 scope says to reject. Change this item's primary decision while retaining the B01 search objective; do not change accepted B09. |
| `ood-n04-b01-i035` | **PASS** | The correct decision is polymorphic dispatch for each heterogeneous element, with the renderer preserving the supplied sequence. The alternatives target separate failures: concrete-type branching, moving shape behavior into the renderer, and reordering by grouping. This is distinct from B02's policy-selection and B09's guarded template-method decisions. Reason, Details, and diagnostics match the stated ordering and extension facts. |
| `ood-n04-b01-i036` | **PASS** | The UI needs to continue traversal without knowing offset or provider-token syntax. An opaque continuation value passed back to the adapter directly satisfies that fact; bulk loading contradicts the stated scale. This is a pagination-boundary decision, not the immutable snapshot/provenance decision in accepted N02-B05. Feedback tracks the three rejected strategies. |
| `ood-n04-b03-i035` | **PASS** | The base contract expressly promises one ordered result per submitted candidate, retaining its ID. The key preserves cardinality, position, and identity; label deduplication, sorting, and suppressing repeated results each violate a different visible postcondition. This differs from accepted N01-B02 payout retry i021, whose decision is whether a repeated command moves money or creates a duplicate ledger entry. The corrected Reason and all three diagnostics match their options. |
| `ood-n04-b08-i035` | **PASS** | Copy support depends on the actual source/destination pair, so the useful contract is an optional attempt that returns `Copied` or `Unsupported`, allowing the stated CPU fallback while keeping the frozen load/save interface intact. Although both this and B09-i029 use an optional capability pattern, their decisive decisions differ: provider-level availability of a hardware-signing feature versus a pair-specific operation/result that the renderer attempts. The object’s prompt, key, Reason, Details, and option feedback maintain that distinction. |
| `ood-n04-b08-i036` | **REVISE** | The terminal-outcome key is appropriate: cancellation must report cleanup when cancellation wins and preserve the final receipt when publication wins. However, the alt3 diagnostic says “A Boolean cannot distinguish” the two outcomes. A Boolean can encode two outcomes if its values are defined; the option is wrong only because it stipulates no such outcome mapping. Correct the message to identify that missing mapping (or make alt3 a realistic request-accepted acknowledgment that fails to report the commit outcome). Keep the scenario's requirement that the caller learns the terminal outcome; do not claim that Boolean results are inherently inadequate. This is a bounded feedback accuracy/plausibility defect, not a change to the primary decision. |

## Scope and criteria

The two revisions follow the existing N04 clause in `docs/07-content-guidelines.md`: the replacements need distinct concrete decisions rather than recycled decisions presented as new vignettes, with visible facts and plausible alternatives. The B08-i036 correction follows the existing authored-feedback requirement that stable-ID diagnostics accurately explain the targeted alternative. No global concept-uniqueness, length, option-count, or style threshold is applied.

The findings do not modify accepted N01/N02 content. They are limited to the two listed items; the remaining four corrected items pass this review, and prior matching reviews cover the other 156 unchanged objects. Re-review only the changed objects and affected cross-unit neighbors after correction.
