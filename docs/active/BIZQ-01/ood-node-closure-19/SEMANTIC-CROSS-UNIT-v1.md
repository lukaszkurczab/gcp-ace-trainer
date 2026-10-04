# Independent semantic cross-unit review — N03 B01–B09

**Verdict: PASS for the frozen 162-question proposal set as a semantic cohort.** This verdict covers question meaning and cross-unit distinctness. It does not accept source activation, consumer/admission behavior, native or Premium behavior, or full BIZQ-01 closure.

## Frozen inputs

| Unit | Proposal SHA-256 |
|---|---|
| B01 | `c23224df332377b45f718bc10d903a7c9fe645954dd9778f30af503bbabef58b` |
| B02 | `d70ee871a3ee7087c1b5d3d03f2feaedf041fd1d1cbb6267df2439a953abd237` |
| B03 | `830a1fb12385d084279054f3d32db5261af24e7501700847b75e25f1c83ef0de` |
| B04 | `25c09577a8ebcb0116dd1bf5ce2a763eaa011e8f58f42ebeb3e00f0591126360` |
| B05 | `19912a8a5278b7fe5a88ac1864aca04327ff255ee46dd04b29c68ed0c21d7d32` |
| B06 | `c7fc7970481fadc0795617e64af14e8cbcce8452d01bb3c45ca65fd6d75952ad` |
| B07 | `846d741c52339153cf0ad2b72813ce2672908de733591aaf6afcd7dd42b00fc0` |
| B08 | `68ca04a4849f4d1c7e20ff9592c4dbd2a028f7be86e51241015f91d3f7e56058` |
| B09 | `d3327d2c3e1d42ca3079ac9a74dd05aba9e684bd2fee39115324b46cd84bbb19` |

The corresponding objective/identity/nearest-peer note files are bound to B01–B04 SHA-256 `f66e00a55958eb51f535ef69edf2d938446493c8a7458101f187c2dc676cbc2e` and B05–B09 SHA-256 `1d5f8268f505a5decc7bfbdf5740a8896bb8415f31738ea77feec3d30a17f8e7`.

## Identity disposition

I compared the 162 current proposal objects and their identity notes with the corresponding original N03 source objects through the fixed manifest mapping (`old001–018 → new019–036` in each unit) and the recorded pre-production source snapshot. Every source object used the unit’s generic lens answer, applying that maxim to a quoted scenario invariant. Each replacement changes the primary decision to a concrete relationship, state transition, behavioral contract, dependency, lifetime, resource, or module-boundary choice that the original key did not select. On that whole-object comparison, all 162 are material semantic replacements and none is a wording-only correction; I found no exception that should retain its original ID. The `replace_question_with_new_id` actions therefore match the observed meaning change. This identity conclusion is based on the prompt/key comparison, not solely on the all-new-ID count or the structural checker.

## Cross-unit assessment

I reviewed the 162 current whole objects through the unit reviews and compared nearby decisions within and across the nine units, including the cited accepted N01/N02 controls. The primary learner decisions remain distinguishable across the final set:

- **B01 vs. B03 lifecycle cases:** B01 models current association multiplicity, qualifiers, association-class facts, and whole/part ownership. B03 identifies workflow commit, expiration, cancellation, retry, acknowledgement, and retained-record boundaries. Both use lifecycle facts, but answer different questions about the model.
- **B01 vs. B02 association cases:** B01 decides endpoint multiplicity/ownership (for example, current exclusive installation at B01 i025). B02 decides which object-navigation ends actual clients traverse (for example, Edit→RouteRevision at B02 i021). Link ownership/cardinality is not the same decision as traversal direction.
- **B02 i032 vs. i035:** i032 requires a two-association Shipment→RouteRevision→Publisher path and asks which ends must be navigable without unused inverses. i035 preserves each event’s Hub and sequence-level path instead of flattening multiple event-specific Hubs onto Shipment. Their shared navigation vocabulary and Shipment noun do not make the selected rule the same.
- **B01 i032 vs. B03 i032:** B01 models recurring Conversation and Author endpoints for events; B03 updates current ownership while appending immutable reassignment history. One is association multiplicity/attribution; the other is current-state and event-history transition.
- **B01 i027 vs. B03 i027:** B01 models a shipment’s retained labels across corrections; B03 distinguishes a disposable preview from a durable label created on successful printing. The first is versioned association/cardinality; the second is the workflow creation boundary.
- **B04 vs. B07:** B04 tests behavioral substitutability and contract preservation, while B07 tests application composition and collaborator lifetime/selection. Choosing an implementation at runtime is not the same decision as whether an object can substitute for a base type.
- **B05/B06 dependency cases:** B05 focuses on who owns a stable capability and whether a provider abstraction is warranted; B06 focuses on source-level cycles, cohesion, and responsibility boundaries. The shared dependency-direction principle is applied to different observable graph defects.
- **B08/B09 boundaries:** B08 decides resource acquisition, cleanup, and transfer points. B09 decides the supported public API surface, package exports, and adapter-facing types. Hiding an implementation detail is not equivalent to releasing an acquired resource.

Nearest accepted N01/N02 comparisons in the notes were checked as controls, not as a source of automatic approval. The current proposed items change their primary answer where their premises and objective require a new decision; retained principles such as stable identity, state transitions, and dependency direction are expected reinforcement. For example, B01 i025’s simultaneous installation multiplicity is not the accepted N01 historical-record/deletion choice, and B02 i021’s required Edit→RouteRevision navigation is not the accepted N02 sensor-reading snapshot decision. Other pairs deliberately reinforce lifecycle, version pinning, or dependency direction while asking for different modeled facts or transitions. I found no material unjustified duplicate or templated weak decision. Similar domain nouns and recurring correct principles alone are not duplicate decisions.

## Decision and boundaries

The two unit reviews support all 162 items; the six latest corrections (B01 i025/i031, B02 i021/i032/i035, B04 i031) now have visible decisive facts and aligned keyed feedback. Across the whole set, no unsupported explanation, material ambiguity, same-decision duplicate, or repeated feedback-slot mismatch remains. Option-detail differences are tied to the scenario’s misconception, not a systematic “longest option wins” cue; option length is advisory rather than a numeric gate.

This assessment is limited to the frozen proposal semantics. The accompanying root structure record verifies only hashes, counts, schema, and scoring/reversal cases and is not used as semantic evidence. Source/proof-chain preservation, runtime pools, consumer red/green, admission, builds, exports, native/Premium, and the remaining BIZQ-01 work require their own evidence and remain outside this verdict.
