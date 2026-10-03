# Independent semantic review — OOD-N01-B08

**PASS for the reviewed 17-item semantic cohort.** Frozen payload [REVIEWED-B08-v1.json](./REVIEWED-B08-v1.json), SHA-256 `0c1053f6c6e722dc6954c4dc56cfbeed407d9ad9082ed3550129acb565612319`.

I reviewed every whole question, keyed meaning, alternative, Reason, Details field, and stable-ID feedback message. Each item matches its communication question: external goals/scope, message ordering, static type relations, deployment, component dependencies, activity handoffs, assumptions, trade-offs, evidence scope, or the limits of a diagram. The visible facts make the selected view or explanation a better fit than the alternatives.

| Item | Review |
|---|---|
| `i018` | Pass. External roles/goals and service boundary call for a use-case scope view. |
| `i019` | Pass. Ordered participants and calls call for a sequence view. |
| `i020` | Pass. Order, LineItem, and Money relations call for static class structure. |
| `i021` | Pass. Runtime artifacts, nodes, and network crossings call for deployment topology. |
| `i022` | Pass. Interface ownership and dependency direction call for a component-level view. |
| `i023` | Pass. Steps, branch, and role handoffs call for an activity view. |
| `i024` | Pass. Agreeing returns-platform scope and external interactions is a context/boundary sketch, not internal design. |
| `i025` | Pass. A change-impact view should expose the varying courier and the stable contract it must honor. |
| `i026` | Pass. Stable external IDs are explicitly unverified; record verifier and design consequence rather than treating them as facts. |
| `i027` | Pass. Consent controls a possible external effect, so preserve the unknown policy owner and keep delivery conditional. |
| `i028` | Pass. No ownership/deployment/scaling facts justify an unconditional split; explain current coordination cost and concrete split triggers. |
| `i029` | Pass. One client's contract supports only a bounded compatibility claim; name the rejecting-client counterexample, not a universal guarantee. |
| `i030` | Pass. The sketch must show independent route updates and the dispatcher's frequent combined read and its coordination cost. |
| `i031` | Pass. UML interaction does not establish that separate runtime effects commit atomically; the transaction contract needs separate evidence. |
| `i032` | Pass. The requested review concerns only SKU identity across cutover, so retain that dependency and remove unrelated UI/schema detail. |
| `i033` | Pass. Costs and freshness are stated, but no latency target supports a final cache/compute decision; flag that unknown. |
| `i034` | Pass. Keep the provider dependency visible and make outage/fallback behavior conditional until its owner confirms the rule. |

### Distinctness, sources, and limits

The nearest overlap is B08 `i018` with accepted B01's actor/goal/subject questions, and B08 `i019` with B07 sequence traces. The actual choice differs: B01 classifies the model's roles and subject, B07 chooses a next message from a given trace, while B08 selects the communication view for an audience's question. B08 `i031` states a model-versus-runtime proof boundary; B06 mentions atomicity only as a non-claim in its orchestration cases, not as the primary decision. These are related ideas but not repeated keyed decisions.

The official UML 2.5.1 material categorizes use cases/deployments, behavioral modeling (including activities/interactions), and structural modeling, which supports the diagram/view distinctions in these prompts ([OMG UML 2.5.1](https://www.omg.org/spec/UML/2.5.1/PDF)). The claim that a diagram is not execution proof is an inference from the distinction between a model and deployed runtime effects, not a quotation or guarantee from the specification. The correct answer is longest or tied in 4/17 items. This is a content-semantic review only; it does not establish renderer, admission, native acceptance, or full BIZQ-01 closure.
