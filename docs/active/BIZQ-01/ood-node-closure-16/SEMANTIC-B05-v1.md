# Independent semantic review — OOD-N01-B05

**REVISE, two narrowly scoped explanation fixes; all 17 answer decisions are supported.** Reviewed frozen payload [REVIEWED-B05-v1.json](./REVIEWED-B05-v1.json), SHA-256 `388cdfb1e5471ebee5d2b80bfe4165b626c8d4e84ef81f45faa020d4c364feaa`.

B05's vocabulary objective is consistently applied: distinguish domain outcomes, commands, events, lifecycle words, and similarly named values from their actual business effects. The answer to each item follows from the stated glossary or outcome facts. The wrong-option messages are generally tied to the stable option IDs and explain why the wording would misstate the scenario.

| Item | Review |
|---|---|
| `i018` | Pass. Account-balance credit and card refund are separately reported outcomes; `AccountCredit` keeps the business distinction. |
| `i019` | Key passes: queue escalation preserves owner while reassignment changes owner. **Feedback correction:** the message to `owner_changed_means_escalated` says “specialist-queue and priority action,” but the prompt says escalation does not change priority. Remove the unsupported “priority action” phrase; diagnose the queue move/ownership distinction. |
| `i020` | Key passes: retirement stops new assignments while preserving the lesson ID and existing references. **Details correction:** `scenarioApplication` says assigned learners are allowed to finish, a rule not stated in the prompt. Keep the application to preserving existing references/assignments without asserting their completion policy. |
| `i021` | Pass. Operator-selected maintenance is not equivalent to connectivity or power loss. |
| `i022` | Pass. Closing the live session and deleting its searchable transcript are separate lifecycle operations. |
| `i023` | Pass. Publication makes a checked listing visible; draft persistence and validation are separate. |
| `i024` | Pass. The operation allocates request lines to vendors; “backorder” names the stock condition. |
| `i025` | Pass. An approved, identity-preserving transfer differs from an administrative plot-field correction. |
| `i026` | Pass. Customer quoted bundle price differs from component list total under the given pricing policy. |
| `i027` | Pass. Physical occupancy and a future reserved interval are separately scoped facts and can coexist. |
| `i028` | Pass. Metadata records are merged while asset ID/image stay fixed; the key does not claim asset identity changes. |
| `i029` | Pass. The event names scoped territory clearance, not the separately defined signed license or global film approval. |
| `i030` | Pass. Dispatch records sending; confirmation records the vendor's later acknowledgement of quantity and date. |
| `i031` | Pass. Internal routing and consent-governed external disclosure are distinct actions. |
| `i032` | Pass. Submission of an attempt is distinct from the course's completion decision. |
| `i033` | Pass. Exception approval and later buyer/order authorization are separate outcomes. |
| `i034` | Pass. `GrantRole` remains accurate when its data carries required approval and expiry; early removal is a separate revocation. |

### Distinctness and sources

This unit's primary decision is vocabulary selection. It differs from the state-transition questions in B04 and responsibility/sequence questions in B06/B07. Several domain settings recur—lesson retirement (`i020`/B06 `i024`), vendor allocation (B04 `i018`), approved plot transfer (B04 `i019`), and referral disclosure (B06 `i032`)—but these items ask how to name the business action while their counterparts ask about state rules, storage responsibility, or orchestration. Those are contextual overlaps, not duplicate keyed decisions.

Microsoft's DDD guidance supports aligning shared language to business problems and use cases, but does not prescribe these particular command names; the prompt's explicit terminology and effects decide the answers ([Microsoft Learn: Designing a DDD-oriented microservice](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice)). This is content-only QA; no admission, runtime, or full-area status is implied. The correct answer is longest or tied in 4/17 items, so there is no cohort-wide longest-option shortcut signal.
