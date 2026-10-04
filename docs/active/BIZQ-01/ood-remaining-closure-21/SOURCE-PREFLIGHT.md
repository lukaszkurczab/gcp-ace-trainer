# OOD remaining-source preflight — current findings

**Stage: read-only source preflight complete for N05–N09.** All 45 arrays / 801 current whole objects were reviewed. This is not an authoring approval, source-package decision, or BIZQ-01 acceptance; item dispositions are bounded evidence for closure planning, not admission decisions. The per-item ledger and raw-source/whole-question SHA-256 bindings are in [SOURCE-PREFLIGHT.json](./SOURCE-PREFLIGHT.json).

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

These findings support item-level correction planning, not automatic replacement of all 153. Each ledger entry records whether the existing objective could be retained by adding decisive facts or whether the primary decision may need to change. Keep the existing ID only if the reviewed correction preserves the primary decision and keyed meaning; assign a new ID if that meaning changes. The linked ROOT-REVIEW18-CURRENT reconciliation covers 216 sampled objects across tracks: 79 exact PASS, 132 matched historical DEFECT, 4 retired IDs, and 1 finding reassessment. Its 24-item OOD subset has 6 exact PASS, 13 exact historical DEFECT findings (12 critical and 1 noncritical feedback finding), 4 retired IDs, and 1 finding reassessment. Reuse requires both an exact fingerprint and a finding that describes the current object. In the completed N05 read, only `ood-n05-b01-i004` was an exact applicable match; the N06–N09 matches were assessed against their own whole objects below and in the ledger.

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

## N08 disposition

All 162 N08 items were read as whole objects, including every option-ID diagnostic and all five Details fields. The unit-level answer and four broad alternatives recur through each array; the case facts often establish a business outcome but omit the concurrent access, interleaving, lifetime, failure, or replay condition required by the named concurrency mechanism. The ledger classifies 142 as `CONFIRMED`, 19 as `CONTRACT_GAP` (a mechanism is plausible, but the facts do not settle the nearest alternative), and one supported control as `NOT_REPRODUCED`. These are item assessments, not a claim that every object needs a new ID or the same correction.

| Unit | Objective | Review result |
| --- | --- | --- |
| N08-B01 | Shared mutable state and confinement | No competing reads/writes or ownership boundary is stated. |
| N08-B02 | Locks, immutability, actors, queues, and ownership | Most cases omit contending actors or a serialization/transfer constraint. The current prompt says, “In a digital invoice exchange, the billing operator must reissue a rejected invoice. The new issue is traceable and does not double-charge the customer”; its key says, “Choose one synchronization owner or immutable transfer model so a compound invariant has one coordination point.” This item is confirmed for the current synchronization/objective mismatch. An older review note attached to the same fingerprint describes lazy/eager query loading, which is absent from this prompt, so that finding was not reused, and its historical critical grade was not transferred to the separate current-source assessment. |
| N08-B03 | Atomicity, races, visibility, and happens-before | Several cases imply simultaneous updates, but do not state the interleaving or visibility boundary that excludes an ordinary operation. |
| N08-B04 | Deadlocks, ordering, and starvation | Transfer/temperature facts do not establish nested acquisition, a lock-order cycle, or progress hazard. |
| N08-B05 | Thread-safe collections and compound operations | No shared collection plus competing multi-step operation is identified. |
| N08-B06 | Async cancellation and timeouts | Status and retirement outcomes do not establish cancellation, timeout, or late completion behavior. |
| N08-B07 | Resource ownership and RAII | Offline/retry outcomes do not specify acquired resources and their release lifetime. |
| N08-B08 | Exception safety and partial effects | Some prompts mention retry or failure pressure, but generally omit the failure point and committed/partial side effects. |
| N08-B09 | Retry and idempotency | Duplicate-sensitive cases often omit the replay source or stable request identity; `ood-n08-b09-i014` is a supported control because invoice reissue is explicitly traceable and must avoid double charge. |

Three overlapping prior sample findings were independently confirmed on exact whole-object fingerprints: `ood-n08-b04-i018` (no lock graph/progress hazard), `ood-n08-b06-i004` (retirement without async cancellation), and `ood-n08-b07-i003` (submission outcome without resource lifetime). The misbound N08-B02-i015 prior finding is recorded as a mismatch and was not reused.

## N09 disposition

All 162 N09 objects were read as whole objects. The case-level outcomes generally lack the current implementation, test harness, public contract, measurement, or review alternatives needed to decide testability, refactoring, API evolution, observability, performance, YAGNI, or design-review communication. The prompt names its target lens and adds a general change pressure, while the four broad alternatives and much of the explanatory language repeat within each unit. The item ledger records 130 `CONFIRMED`, 31 `CONTRACT_GAP`, and one supported control `NOT_REPRODUCED`.

| Unit | Objective | Review result |
| --- | --- | --- |
| N09-B01 | Test seams | Some time-expiry cases support a clock seam, but do not support the option’s full list of seams. `ood-n09-b01-i001` is a supported control for its clock component because the facts require deterministic expiry tests without a live integration. |
| N09-B02 | Testable constructors | Some timed inputs are relevant, but do not establish how construction acquires dependencies or validation should be isolated. |
| N09-B03 | Code smells and misplaced behavior | No existing implementation or forwarding path is shown to locate behavior. |
| N09-B04 | Behavior-preserving refactoring | Snapshot/revision facts can matter, but no baseline implementation, change sequence, or regression evidence is supplied. |
| N09-B05 | Public API and evolution | A few stream/caller cases imply compatibility pressure but omit the published version/deprecation contract needed to distinguish alternatives. |
| N09-B06 | Observability | A generic requirement to observe failure does not state which signal or diagnostic is missing. |
| N09-B07 | Performance and cost | Generic performance pressure lacks measured workload, hot-path, or cost evidence. |
| N09-B08 | YAGNI | Some stems add a second workflow, but do not specify the independent variability or substitution axis that would make the keyed boundary decisive. |
| N09-B09 | Design-review communication | The cases generally omit audience, competing alternatives, change pressure, and review feedback needed to assess the communication decision. |

The prior sample finding for `ood-n09-b08-i004` was independently confirmed on an exact fingerprint: privacy/consent is explicit, but the prompt does not establish the keyed YAGNI boundary. The clock-control item above is retained as a counterexample to blanket claims that every N09 key is unsupported.

## Remaining scope and limits

The per-item ledger binds all 45 source arrays and 801 whole objects to raw-source and canonical-question SHA-256 values. It records exact prompts, constraints, keyed option, every alternative and feedback message, Reason, all five Details fields, source references, nearest-alternative analysis, and a per-item action hypothesis. Unit summaries also record the actual repeated answer/alternative/explanation patterns. N05 authoring has been authorized under its separate fixed contract; these N08/N09 findings support future scope decisions but do not themselves authorize content edits. The report does not infer that every question requires a new ID or a single uniform correction.

Current OOD Free experience profiles select N01; this preflight does not establish N05–N09 learner-pool reachability or alter mode eligibility. No Premium claim is made. Any future source implementation would need to preserve accepted N01–N04 objects, existing proof history, and other content bytes; this review authorizes none of those changes.

No source, proof, test, catalog, app, artifact, candidate, admission, web, runtime, or service file was changed. This read-only review is bound to the current track/question-set hashes and the per-file/per-item hashes in the JSON ledger.
