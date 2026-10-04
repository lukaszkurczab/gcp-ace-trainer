# N06 B01–B05 authoring notes

These 90 question objects cover the current five N06 units. The paired JSON records each item's learning objective, decisive case fact, closest alternative, condition that would change the choice, identity action and rationale, and source references. It is the per-question record; this summary does not replace it.

| Unit | Learning focus | Candidate question IDs |
| --- | --- | --- |
| OOD-N06-B01 | Choose an interchangeable algorithm boundary while keeping the surrounding workflow stable. | Existing i001–i018 retained provisionally. |
| OOD-N06-B02 | Decide how lifecycle stage governs permitted operations, transitions, rejected operations, and terminal outcomes. | Original i001–i018 restored; state-machine meaning retained. |
| OOD-N06-B03 | Represent a reviewable, delayed, reversible, or retried operation with the inputs and identity that define its intent. | Existing i001–i018 retained provisionally; the source cases remain recognizable. |
| OOD-N06-B04 | Notify independent consumers at the accepted-change boundary with the facts they need, without inferring delivery order or durability. | Existing i001–i018 retained provisionally; the source cases remain recognizable. |
| OOD-N06-B05 | Reduce a concrete many-to-many collaboration protocol while keeping each participant's domain rules and records with their owner. | Existing i001–i018 retained provisionally; the source cases remain recognizable. |

The proposal uses the existing question runtime shape and difficulty for each source slot. B02 retains the original question IDs because its primary State-pattern decision is unchanged. It assigns fresh IDs to wrong options whose meanings were rewritten, and keeps the key's option ID when its meaning remains the same. Other units use the per-item identity actions recorded in JSON; independent reviewers still determine whether each item meets the identity contract.

The authoring checked these primary references for the general pattern claims:

- [Design Patterns: Elements of Reusable Object-Oriented Software](https://www.oreilly.com/library/view/design-patterns-elements/0201633612/) for Strategy, State, Command, Observer, and Mediator concepts.
- [Microsoft .NET Observer design pattern](https://learn.microsoft.com/en-us/dotnet/standard/events/observer-design-pattern) for subscriptions and unsubscription. It does not establish notification ordering, durable delivery, or exactly-once behavior; candidate questions state any additional case protocol explicitly.

These references support general design concepts, not the hypothetical rules in a stem. Scenario guarantees such as a rejected request leaving records unchanged or a particular retry returning a prior result are supplied as visible facts in the relevant question.

The packet's unit checker passed the existing producer schema, source-slot bindings, scoring, reversed-option scoring, and wrong-option diagnostic-ID correspondence for each current proposal. That is structural/scoring evidence only; it is not semantic acceptance.
