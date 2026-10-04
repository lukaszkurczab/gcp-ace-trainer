# OOD remaining-source preflight — current findings

**Stage: partial read-only review.** This report closes the whole-object review for N05, N06, and N07 (27 arrays / 477 items). N08 and N09 (18 arrays / 324 items) remain unreviewed. This is not an 801-item verdict, authoring approval, source-package decision, or BIZQ-01 acceptance. The per-item ledger and raw-source/whole-question SHA-256 bindings are in [SOURCE-PREFLIGHT.json](./SOURCE-PREFLIGHT.json).

## Exact inventory

The actual producer validator reports content version `object-oriented-design-interview-authoring-v2026.10.04-bizq01-20`, 1,413 questions, and 79 source files. The remaining N05–N09 scope is 45 arrays / 801 questions: N05 9 units / 153, N06 10 / 180, N07 8 / 144, N08 9 / 162, and N09 9 / 162. The exact current question-set hash is `5b552f935cc3fa8bb142ccd38dc747a19a57823a8c7c8fd243fc786d43f0fe72`. These counts were enumerated from the current source and checked with the producer validator; `owner_preserves_contract` is only a lead, not a verdict.

## N05 disposition

All 153 N05 items were read as whole objects: prompt and constraints, keyed and wrong option texts, answer/scoring type, Reason, all five Details fields, each wrong-option message, and source references. Every item describes a domain operation and business invariant, then appends a generic “design review adds” pressure. The keyed mental-unit mechanism is not supported by the facts that distinguish when that mechanism is useful. The same four broad alternatives recur within each mental unit (coordinator/state exposure, inheritance for reuse, representation leakage, and speculative registry/events); they do not form plausible case-specific alternatives. Reason and several Details fields repeat by unit, and wrong-option messages interpolate a unit objective and one constraint into a shared diagnosis. The per-item ledger records each item’s actual case facts and hash rather than inferring defects from the repeated answer ID.

| Unit | Current objective | Missing case decision trigger |
| --- | --- | --- |
| N05-B01 | Factory/object-family creation | No construction variation or requirement to select a coherent family. The sampled booking-transfer item is an exact current-object match to the earlier review finding. |
| N05-B02 | Builder/staged construction | No optional construction inputs, required assembly order, or pre-use validation stages. A new workflow/caller or failure path alone does not establish them. |
| N05-B03 | Prototype/copy semantics | No copy/clone/prototype operation, object-graph sharing, aliasing, or snapshot-vs-live choice. Immutable published inputs are stated in one item, but the operation still does not choose copy depth. |
| N05-B04 | Adapter/facade | No incompatible external contracts to translate or subsystem complexity to simplify. The provider-switch case preserves a contract but does not describe incompatible APIs. |
| N05-B05 | Decorator/proxy | No stable core contract with separable added policy/access behavior. Privacy/approval cases can be implemented directly from the stated facts. |
| N05-B06 | Composite/uniform traversal | No leaf/group tree or client operation shared across leaves and groups. The bundle/components case is the closest resemblance, but no recursive structure or uniform operation is stated. |
| N05-B07 | Bridge/independent dimensions | No pair of independently varying dimensions whose combinations create a subclass-multiplication problem. |
| N05-B08 | Flyweight/shared state | No repeated population, shared immutable intrinsic data, request-specific extrinsic state, or resource-pressure fact. |
| N05-B09 | Composition root/dependency assembly | No dependency graph, implementation/environment selection, or assembly boundary at which configuration is validated. |

These findings support item-level correction planning, not automatic replacement of all 153. Each ledger entry records whether the existing objective could be retained by adding decisive facts or whether the primary decision may need to change. Keep the existing ID only if the reviewed correction preserves the primary decision and keyed meaning; assign a new ID if that meaning changes. The 14 current matched OOD review findings were reused only on exact fingerprint match; specifically, `ood-n05-b01-i004` matches the earlier whole-object finding about a booking transfer lacking a factory/object-family trigger. No other sampled finding is substituted for the individual reads.

## Remaining scope and limits

## N06 disposition

All 180 N06 objects were also read individually. Across the node, the source repeats the same four generic alternatives and uses unit-level mechanism/feedback language. I recorded both confirmed case/objective mismatches and 21 `CONTRACT_GAP` items where an explicit status, provider, queue, event recipient, or cross-object fact makes the key plausible but still does not separate it from a simpler implementation. `CONTRACT_GAP` is not a verdict that the key is false; the item ledger names the relevant fact and what distinction remains missing.

| Unit | Current objective | Missing case decision trigger |
| --- | --- | --- |
| N06-B01 | Strategy/policy objects | No independently varying policy and stable workflow. Active-provider switching (i005) is the closest and is recorded as a gap: the prompt does not say whether the provider swap represents interchangeable behavior or ordinary dependency replacement. |
| N06-B02 | State pattern/state machines | A number of cases mention status-dependent outcomes, but the prompts do not define enough legal states/transitions or a plausible direct alternative to isolate explicit state-machine modeling. Those cases are individually marked `CONTRACT_GAP`. |
| N06-B03 | Command objects | Most items have no history/undo/queue/authorization/retry identity requirement. The approval-queue and idempotent-payout items are marked gaps, not confirmed key errors. |
| N06-B04 | Observer/pub-sub | No independently owned subscribers or subscription lifecycle/delivery contract. Passenger announcement is the closest, but ordering alone does not establish publish/subscribe semantics. |
| N06-B05 | Mediator | No many-to-many peer protocol or interaction graph. |
| N06-B06 | Chain of responsibility | No sequence of replaceable handlers with an explicit stop rule. Referral routing and ordered validation do not name candidate handlers or stop/continue behavior. |
| N06-B07 | Template method | No invariant algorithm skeleton or bounded subclass variation points. |
| N06-B08 | Iterator/visitor | No traversed object structure or independent traversal/operation variations. |
| N06-B09 | Domain events | Most prompts omit downstream side effects that can be decoupled after commit; passenger announcements and comment notification are recorded as gaps because they name recipients but not the event/decoupling contract. |
| N06-B10 | Workflow orchestration | Most cases state a single operation/invariant rather than a sequence or compensation boundary. Explicitly coordinated capacity/expiry, assignment-swap, and handoff cases remain gaps where cross-object facts could matter but no sequence or recovery behavior is stated. |

Four exact current OOD review findings were reused only by matching the whole-object fingerprint: N06-B01-i017 (strategy variation absent), N06-B04-i015 (expiry/approval does not establish subscribers), N06-B07-i011 (revocation does not establish template-method subclass variation), and N06-B10-i014 (provider switching does not establish workflow orchestration). They support those items only; they were not generalized to sibling objects.

## Remaining scope and limits

N05 authoring has now been authorized under its separate fixed contract. N08 and N09 remain outside this report; any later recommendation for them requires the same item-level fact, objective, alternative, explanation, and feedback assessment. N05–N07 share a node artifact, but this does not establish that every question must be rewritten.

Current OOD Free experience profiles select N01; this preflight does not establish N05–N09 learner-pool reachability or alter mode eligibility. No Premium claim is made. Any future source implementation would need to preserve accepted N01–N04 objects, existing proof history, and other content bytes; this review authorizes none of those changes.

No source, proof, test, catalog, app, artifact, candidate, admission, web, runtime, or service file was changed. This remains a partial review bound to the current track/question-set hashes and the per-file/per-item hashes in the JSON ledger.
