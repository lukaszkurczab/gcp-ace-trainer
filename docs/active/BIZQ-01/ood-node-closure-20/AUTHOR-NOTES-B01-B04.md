# N04 B01–B04 author notes — package20 proposal

This document records the author’s proposed learning decisions and source scope. It is not semantic acceptance or source activation. The arrays retain the existing question schema, unit IDs, difficulty slots, single-choice interaction and exact-selected-set scoring. Each item maps its prior i001–i018 object to the corresponding reserved i019–i036 ID because the prior object used the same generic ownership key and options across unrelated cases; the authored cases now ask a different, unit-specific decision. All four arrays use newly assigned option IDs because every option meaning is new.

The exact 72 item-level mappings, objectives, decisive prompt facts, closest plausible distractors, identity rationale and technical references are in [AUTHOR-NOTES-B01-B04.json](./AUTHOR-NOTES-B01-B04.json). The current-source baseline remains the exact N04 manifest. Scenario guarantees are fictional premises authored in each prompt; the references below support only the programming-language concepts named by the units.

## B01 — interface contracts, abstraction and information hiding

The cases ask what a client-facing contract should expose: permitted operations, read-only views, explicit command/query outcomes, or a stable request/result boundary. The key decision is the shape and authority of the public seam, not a generic claim that every invariant belongs to an “owner.” Closest accepted controls include N02-B03 behavior-placement questions and N03-B04 replaceable collaborator contracts. Those ask where behavior or a varying collaborator belongs; these cases ask which operations and results a specific caller may depend on while representation stays hidden. Some original domain contexts are retained, but the proposed decision is at the interface boundary; the reviewer should check that no case simply restates an accepted command outcome.

References: Oracle’s Java interface specification and Microsoft’s C# interface-language specification establish interface declarations and member contracts. They do not establish the invented business rules in the prompts.

## B02 — subtype polymorphism and dynamic dispatch

Each case states a stable caller operation and the concrete behavior that differs among implementations. The learner selects whether the variation should be dispatched through that shared operation, rather than a caller-side class/type branch or leaked representation. Several cases use policy or provider implementations, but each has distinct inputs, outcomes and extension boundary; they are not presented as a universal “use a strategy” answer. The closest accepted comparison is N03-B04’s selected-policy/collaborator substitution: those items ask whether a collaborator can vary while the subject remains the same. These proposals instead test whether a subtype/implementation can satisfy one caller contract and supply variant behavior at runtime. Review should test this distinction on the full case, not on repeated domain nouns.

References: Oracle JLS §15.12 and the Oracle polymorphism tutorial support method invocation through a runtime implementation. They do not prescribe the fictional policy selection or provider outcomes in these prompts.

## B03 — substitutability and behavioral contracts

Every prompt states a base caller guarantee and a candidate implementation behavior. The cases vary the tested contract boundary: accepted input range, ordering, durable-success timing, exact side effects, repeat-call outcomes, output invariants, lifecycle finality, and mutation. The answer must preserve the stated contract; a candidate can be rejected when it strengthens preconditions, weakens postconditions, broadens side effects, or changes a specified outcome. Nearest accepted controls include N02-B02’s domain transition outcomes and N03-B04’s proposed implementations under a common operation. Those are adjacent examples, but these cases explicitly compare a declared base guarantee with a subtype result rather than asking which business state transition or collaborator is preferred.

References: Liskov and Wing’s paper gives the behavioral-subtyping basis; JLS §8.4.5 covers Java method overriding constraints. The prompts explicitly define the fictional base contracts, so these sources are not used to infer unstated business guarantees.

## B04 — interface segregation and role-specific contracts

The cases describe two or more clients with different permitted method sets or information needs. The learner chooses a contract split that avoids forcing a client to depend on unrelated methods or authority. This differs from N01 actor/use-case classification (who initiates or receives a result) and N02-B04 responsibility placement (which domain component owns a rule): B04 here asks which interface a software client should receive for its role. A shared implementation may still serve multiple small interfaces; the answer does not require one class per interface.

References: Oracle’s Java interface specification and Microsoft’s C# interface-language specification support declaring distinct interface member sets. They do not establish the scenario-specific access restrictions, which are explicit fictional facts in each prompt.

## Review cautions

- Structural/scoring checks do not establish that each stem makes exactly one answer defensible, that feedback diagnoses the text under its option ID, or that identity replacement is semantically correct.
- All 72 identity dispositions are proposals. The checker binds them to the exact source manifest and validates schema/scoring/reversal only; an independent whole-object and cross-unit reviewer must decide identity and semantic acceptance.
- No changes are made here to canonical source, catalog, migration proof, consumer tests, eligibility, or release state.
