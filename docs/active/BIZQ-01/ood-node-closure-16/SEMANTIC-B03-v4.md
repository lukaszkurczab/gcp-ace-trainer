# Independent semantic review — OOD-N01-B03

**PASS for B03 source semantics.** This review binds to the already frozen [REVIEWED-B03-v4.json](./REVIEWED-B03-v4.json), SHA-256 `d12d12454103c7ec897a331b9ac1200b4cb8ee6be9e7324bd886f639625ce374`. The frozen review payload and current proposal bytes match exactly. I reviewed all 17 complete objects, including visible premises, key text, each alternative, Reason, the five Details fields, and the message attached to each wrong-option ID.

The objective is coherent: classify concepts using identity, continuity, independent lifecycle, and equality facts, with a smaller set of decisions about operations that require facts from multiple concepts. The authored facts support the choices. They are scenario premises, not universal claims about what a named noun must be. Microsoft Learn describes entities by identity/continuity/persistence and value objects as concepts without conceptual identity; it also emphasizes that classification depends on bounded-context meaning ([domain model guidance](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model), [DDD-oriented design](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice)). Those sources support the general distinction, not every individual scenario guarantee or the particular multi-concept operation chosen here.

## Per-item review

| Item | Semantic decision and evidence |
|---|---|
| `i018` | Clearance number and audit history persist through territory/expiry changes; matching scope fields do not merge separately auditable approvals. The stateless-calculation distractor also loses the retained lifecycle. |
| `i019` | Serial follows the physical battery through repair/retirement; charge is a changing, possibly repeated measurement. The second distractor's immutable-per-reading model loses that continuity. |
| `i020` | Referral and consent have separately stated IDs and histories; specialty is a shared catalog value. The alternatives respectively collapse consent history or hide independent lifecycles in a recreated tuple. |
| `i021` | Completion records the exact exercise revision and scoring-policy version; title reuse makes title-only lookup ambiguous, while dropping versions loses the historical interpretation. |
| `i022` | Request identity and amendment audit survive edits, and the approver decision is a retained outcome. The alternatives lose amendment history or substitute transient in-memory service state for the record. |
| `i023` | Annotation authorship and stable segment link persist while text can change. Equal text does not merge authored records, and byte offset is unstable under recording replacement. |
| `i024` | Grant ID, expiry, and approval reference carry one grant lifecycle; a reusable role name does not identify an individual grant. An untracked value would lose its stated ID/approval link. |
| `i025` | Seal ID identifies each recorded act; immutable digest identifies its target. Multiple seals can target one revision, so digest cannot replace seal identity. |
| `i026` | Payout ID follows proposed-to-released lifecycle; currency/amount are repeatable values. Equal payments and transient release requests do not replace retained payout history. |
| `i027` | Notice ID and supersession history identify the controller's accepted change; platform/time are attributes. Passenger delivery is a downstream effect, not that accepted notice record. |
| `i028` | Reservation ID supports independent cancellation; normalized start/end instants define interval equality regardless of string formatting. These are distinct identity and value questions. |
| `i029` | Session identity and provider-change history continue while endpoint/language/timing configuration changes. Neither an endpoint nor a replaceable configuration snapshot stands in for the session. |
| `i030` | A swap needs skill and availability facts from two independently identified assignments. The answer coordinates those facts without making a display name the owner or mistaking a temporary relation for subtype inheritance. |
| `i031` | Edit ID and parent revision retain proposal lineage; geometry remains revisable content. Equal shapes do not erase authorship/parentage, and point-level records lose edit history. |
| `i032` | Each claim retains its applied rule version and the granted point bundle as values; later rule changes must not rewrite prior claims. Current service configuration cannot explain historical application. |
| `i033` | Shipment and carrier retain independent identities; eligibility compares the shipment's band value with carrier capability and hand-off facts. The range is not a carrier subtype, and carrier changes do not change shipment identity. |
| `i034` | Transaction ID identifies the repayment across allocations; currency/amount are values and the allocation decision uses current balances across accounts. Currency itself lacks that account context. |

In each item, wrong-option messages refer to the selected option ID and accurately name that option's misconception. No stale cross-option diagnosis remained from the prior failed review. The corrected `i025`, `i029`, and `i032` now answer their own prompts; their answer alternatives, Reason, Details, and messages are aligned.

## Distinctness and overlap

B03 differs from accepted B01's actor/goal/subject modeling and from B02's caller-visible outcomes. Some scenario motifs recur, but the decisions differ: B02's annotation replacement asks whether a partial revision may become active, while B03 `i023` asks which facts establish annotation identity; B02's notary timeout asks what outcome is observable, while B03 `i025` separates a seal event from the revision it targets; B02's meter conflict asks whether a move can proceed, while B03 `i028` separates reservation identity from interval equality. Those are purposeful contextual reinforcement, not the same answer decision.

B03 `i030`, `i033`, and `i034` are near the B06 service-boundary objective because each operation uses facts from multiple concepts. Here the question is what identities/values remain distinct and what facts the operation compares. B06 asks where behavior belongs among objects, domain services, application coordination, and infrastructure. The keyed B03 choices do not impose a universal service-placement rule. I found no pair whose primary decision is duplicated across the current B02/B04–B08 proposals.

The fixed checker’s advisory identifies seven items where the correct choice is strictly longer than every distractor. I treat that as a diagnostic only; equal lengths or a numerical style threshold are not requirements. The options are scenario-specific and present recognizable competing assumptions.

The fixed proposal checker passed B02/B03 identity, schema, option-ID feedback, scoring, and reversed-option checks (34 items; 204 answer cases). That automated result is structural/scoring evidence, not the semantic basis of this verdict. This source-only review does not certify the other units, source admission, consumer rendering, native eligibility, or full BIZQ-01 acceptance.
