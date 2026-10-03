# Independent semantic review — OOD-N01-B06

**REVISE, one targeted wording correction; the other 16 answer decisions are supported.** Reviewed frozen payload [REVIEWED-B06-v1.json](./REVIEWED-B06-v1.json), SHA-256 `1004eb9b16f735aef409c78fe369348f30c70582ee37bef00f8e8b9ff227b773`.

B06 consistently distinguishes domain-object rules, cross-object domain policy, application sequencing, protocol/infrastructure translation, and data access. The prompt normally names which participant owns the relevant fact or behavior, and the answer follows from that ownership. It does not claim unprovided retry or atomicity guarantees.

| Item | Review |
|---|---|
| `i018` | Pass. Shared completeness belongs with Inspection; UI and sync invoke the same rule, while queueing remains orchestration. |
| `i019` | Pass. The application service sequences validation, billing API, and local persistence; Details properly avoids inferring retry safety from the timeout. |
| `i020` | **Revise option `policy_parses_wire`.** The prompt says AccessPolicy decides allow/deny from a loaded Badge; it says nothing about revocation. Replace “deciding revocation” with the stated allow/deny decision and align its feedback. The adapter remains the uniquely supported mapping boundary. |
| `i021` | Pass. Provider response schemas are normalized by each carrier adapter to the shared LabelReference contract. |
| `i022` | Pass. The shared Room/Rehearsal capacity rule has no single-object owner and is reused by two callers, supporting a domain service. |
| `i023` | Pass. Exhibit owns the state that gates its unsafe commands, so the same guard applies across callers. |
| `i024` | Pass. Repository lookup maps persisted Lesson records by canonical ID while Lesson retains retirement meaning. |
| `i025` | Pass. Session defines snapshot contents, the application sequences export, and a storage adapter performs filesystem I/O. |
| `i026` | Pass. The application coordinates SupportCase policy, queue transfer, and notification without copying the rule or claiming atomicity. |
| `i027` | Pass. Repository translates the requested region/page query to the indexed store and maps rows back; it does not decide publication. |
| `i028` | Pass. Reused cross-vendor allocation policy belongs in a domain service; save/confirmation workflow stays with the application. |
| `i029` | Pass. The application resolves external authorization, invokes Reservation's transfer behavior, persists, and confirms. |
| `i030` | Pass. A reusable comparison across multiple RightsRecords has no single-record owner; retrieval and response remain separate. |
| `i031` | Pass. The shared database's stated unique-active constraint can reject concurrent duplicate writes that pass the earlier read check. |
| `i032` | Pass. Application orchestration obtains consent before asking the communications adapter to deliver; no distributed atomicity or exactly-once guarantee is claimed. |
| `i033` | Pass. A shared bundle quote combines component policies and is reused by catalog and renewal, supporting a domain pricing calculation separate from retrieval and caller flow. |
| `i034` | Pass. The approval adapter translates provider wire fields/date strings; Grant validates domain-shaped approval and expiry values. |

### Distinctness, sources, and limits

The unit's primary choice is where a responsibility belongs. Shared settings recur in B05 (retirement vocabulary, referral disclosure, bundle-price naming) and B07 (capacity decision, approval lookup), but those items ask for a term or the next message rather than ownership of the rule or layer. B06 `i031` is a race-closing persistence contract, distinct from B04's battery reassignment transition.

Microsoft's DDD-oriented architecture guidance distinguishes the domain model's business rules from the application layer's task coordination and infrastructure persistence ([Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice)). The provider/adapter facts and expected contract in individual prompts supply the rest; I do not infer behavior of an unspecified SDK or database. Correct options are longest or tied in 8/17 items, below half; no majority longest-answer cue appears. This report does not establish source admission, consumer rendering, native acceptance, or full BIZQ-01 closure.
