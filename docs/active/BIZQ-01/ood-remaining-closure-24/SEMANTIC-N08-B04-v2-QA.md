# Independent semantic review: N08-B04 v2

**Verdict: PASS.** All 18 revised objects preserve the original consistent-coordination decision, state the required boundary in the case, and have one option that best satisfies the visible contract. The competing choices represent distinct failures—retaining opposing acquisition orders, holding local coordination across external work, or broadening the blocked scope.

## Bound inputs and verification

- Proposal: [N08-B04-v2.json](proposals/N08-B04-v2.json), SHA-256 `4eba890055c2cccd810540df6d47f1f65f2842108683be90c5e632e630a09646`.
- Before source: `content/object-oriented-design-interview/concurrency_thread_safety_resources_and_failure_handling/OOD-N08-B04.json`, SHA-256 `2585e5a74a146510e7b6d7cdcb6ac11f32326aca0ad9b920279b2b25479b0fab`; manifest binding `2585e5a74a146510e7b6d7cdcb6ac11f32326aca0ad9b920279b2b25479b0fab`.
- Manifest SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`; contract SHA-256 `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`.
- Prior v1 review SHA-256 `3ecb32d85d1676499e9c742858cf6ef613a274874ed27d6d863d229a248dd2a5`. The v2 whole objects were reviewed directly; v1 findings were not treated as current without rechecking.
- I reviewed prompts, options, answer meanings, Reason, all five Details fields, and option-targeted diagnostics for every item. The accepted option ID remains `owner_preserves_contract` throughout.

The actual validator accepts all 18 questions. The scorer accepts all 18 keys and rejects all 54 distractors; all 18 keys remain correct after option reversal, and all 18 feedback-target sets match the wrong-option IDs. These checks establish schema, scoring, and feedback wiring; semantic conclusions below come from whole-object review.

## Item identity and decision

All items are SAME_ID. Their specific records differ, while the shared decision is to use one coordination order for the records that participate in the invariant, preserving unrelated work.

| Question | Identity | Accepted option ID | Current decision |
|---|---|---|---|
| ood-n08-b04-i001 | SAME_ID | `owner_preserves_contract` | Order both station and reservation locks the same way in reserve and expiry. |
| ood-n08-b04-i002 | SAME_ID | `owner_preserves_contract` | Acquire both assets in stable ID order before merging them. |
| ood-n08-b04-i003 | SAME_ID | `owner_preserves_contract` | Acquire territory before role in both grant and expiry paths. |
| ood-n08-b04-i004 | SAME_ID | `owner_preserves_contract` | Acquire the aircraft and battery in one stable ID order for both assignments. |
| ood-n08-b04-i005 | SAME_ID | `owner_preserves_contract` | Check consent and record the referral attempt, then send without local locks held. |
| ood-n08-b04-i006 | SAME_ID | `owner_preserves_contract` | Acquire exercise revision before learner progress in both paths. |
| ood-n08-b04-i007 | SAME_ID | `owner_preserves_contract` | Acquire exception before evidence for approval and correction. |
| ood-n08-b04-i008 | SAME_ID | `owner_preserves_contract` | Acquire the episode before its segment map in replacement and annotation paths. |
| ood-n08-b04-i009 | SAME_ID | `owner_preserves_contract` | Acquire user before role in both grant and expiry paths. |
| ood-n08-b04-i010 | SAME_ID | `owner_preserves_contract` | Acquire the document before the seal registry in both paths. |
| ood-n08-b04-i011 | SAME_ID | `owner_preserves_contract` | Acquire order before seller balance for release and reconciliation. |
| ood-n08-b04-i012 | SAME_ID | `owner_preserves_contract` | Capture subscribers with the route update, then notify after releasing both locks. |
| ood-n08-b04-i013 | SAME_ID | `owner_preserves_contract` | Acquire the two meters by sorted ID before checking and recording the reservation. |
| ood-n08-b04-i014 | SAME_ID | `owner_preserves_contract` | Swap the immutable provider revision under the registry lock; notify callbacks afterward. |
| ood-n08-b04-i015 | SAME_ID | `owner_preserves_contract` | Acquire both volunteer records by stable ID before validating and swapping. |
| ood-n08-b04-i016 | SAME_ID | `owner_preserves_contract` | Use map before route for merge and edit, then check the submitted base. |
| ood-n08-b04-i017 | SAME_ID | `owner_preserves_contract` | Acquire campaign before player in both reward and correction paths. |
| ood-n08-b04-i018 | SAME_ID | `owner_preserves_contract` | Acquire shipment before carrier for transfer and acceptance. |

The same general transfer sentence is reused across cases. It describes the unit’s shared coordination practice and does not create a correctness ambiguity; case-specific prompt facts, Reasons, error corrections, and option diagnostics explain the local decisions. The transfer sentence also mentions releasing before work that may wait, which is directly relevant to the cases involving remote or human work. I treat reuse as an optional future editorial refinement, not a blocker.

This PASS is limited to N08-B04 v2 content and identity. It is not acceptance of other units, producer/history, source activation/runtime, native/Premium, or full BIZQ-01.
