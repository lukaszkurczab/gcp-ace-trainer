# Independent semantic review — N05 B02–B04 v1

**Verdict: REVISE two items.** I reviewed the 51 frozen whole objects in all three inputs, including each visible prompt and constraint, every option and key, Reason, all five Details fields, each option-ID diagnostic, source references, and the matching predecessor object and declared unit objective. The item register and fingerprints are in `SEMANTIC-B02-B04-v1.json`.

The frozen review inputs are:

- `review-inputs/N05-B02-v1.json` — `38e79dd9a7412b5958cf585c70109236a25be4c1c1709c0d34ea928eda014304`
- `review-inputs/N05-B03-v1.json` — `d53b62ac41ea1cc5082101e23cc08d45786bba3a9abc49be0f3bdbb4f4dd55d0`
- `review-inputs/N05-B04-v1.json` — `ce1142d8594b1505b51db0b3fd7e64d920bfeeae276f1bec3da78c10bd65ed48`

Per-question fingerprints use SHA-256 over compact `JSON.stringify` output from the parsed JSON item, preserving property insertion order. The raw proposal-file hashes above bind the frozen inputs. These are not production `canonicalJson` hashes.

## Required corrections

- **B02 i010 (`ood-n05-b02-i010`)**: The wrong alternative “Build each line in an independent plan and combine plans at dispatch” is not necessarily invalid under the visible facts. The completed plans can be combined and the aggregate checked before the actual dispatch call. The associated diagnostic says separate plans do not establish the total, but the prompt does not prohibit validating the combined plan. Clarify this alternative or add the specific visible API constraint needed to make it wrong; otherwise the item admits more than one viable construction approach under §4.1.
- **B03 i017 (`ood-n05-b03-i017`)**: The stem asks to reuse an immutable rule-set, while the keyed option says “Copy match slots and rules.” Since copy depth and identity are the decision under test, the key is ambiguous about whether the rule-set is shared or duplicated. Change the key to say that match slots are copied while the immutable rule-set is retained/shared. The current Reason and Details describe the latter behavior.

## Unit findings

B02’s other 16 items show a concrete staged-construction trigger: conditional required fields, dependencies on earlier results, cross-field validation, aggregate checks, or a fixed snapshot boundary. Their keys, Reasons, Details, and option-specific explanations align with those premises. B03’s other 16 items distinguish mutable per-instance state from immutable references, identity, event history, and internal graph sharing; their feedback tracks the options. B04’s 17 items state either a real external/internal representation mismatch or a repeated multi-step client workflow, and the keyed adapter/facade boundary matches the stated need.

B04 contains close practice pairs: i004/i010 both address interval translation; i006/i014 both preserve a three-state mapping; i007/i013 both coordinate multi-step facade workflows. I do not treat those similarities alone as a defect. The visible constraints differ enough to support transfer practice, and the existing criteria do not impose a unique-vignette quota. This finding does not substitute for the final cross-unit comparison against the other 612 accepted N01–N04 items.

Across these 51 questions, the corresponding existing question IDs remain appropriate: the primary unit decision is still staged construction, copy depth/identity, or adapter/facade boundary. These proposals make the missing case-specific trigger concrete rather than replacing the mental-unit decision. I found no requirement to consume the reserved replacement IDs for these rows. B02 i010 and B03 i017 are semantic/content corrections; neither currently establishes a need to change its question identity.

The pattern sources describe the general pattern concepts. The case-specific invariants, lifecycle rules and integration contracts are authored scenario facts, not claims about a real vendor or runtime guarantee. Fowler’s `Making Stubs` page is only adjacent background for prototype/factory use; it does not establish the scenario’s copy-depth rules.

This bounded review does not accept source integration, migration/proof design, runtime behavior, mode eligibility, native/Premium behavior, or full BIZQ-01. The two corrections and final 153-item identity/cross-unit review remain outstanding.
