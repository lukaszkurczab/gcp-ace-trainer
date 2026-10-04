# Independent semantic review — N06-B07 v1

**Verdict: REVISE.** Frozen proposal SHA-256 74f202c79495c207fc32143bc17f9c5ca8fbddadca6c3174049080cd6e3ec8ef; frozen notes SHA-256 1ef4df8adcbd2f49b808629721927b6037ff8f75a70aa9cc9c12c5f31d0077aa. I compared all 18 before/current whole objects and resolved every accepted answer using answer.optionId. The JSON binds each object fingerprint and accepted-answer meaning.

Two requirement-based issues apply throughout the unit:

1. **The stem discloses the structural answer (§4.2).** Each stem lays out every workflow step, says exactly which single hook or step varies, and explicitly states that the shared sequence/invariant must stay fixed, then asks which implementation preserves that invariant. For example, i001 says only conflict-summary format varies while the shared workflow owns the no-silent-overwrite invariant; i018 says only product-specific validation varies and visibility waits for both checks. The key then restates that the sequence stays fixed and only the named hook varies. The stem already gives the Template Method shape instead of leaving a meaningful design decision. Retain the scenario constraints, but remove the explicit fixed-skeleton/only-hook conclusion so the learner must decide how to isolate bounded variation while preserving the invariant.

2. **Wrong-option feedback is mechanically malformed (§4.4).** The shared error-correction template inserts the full invariant text into phrases that do not parse, e.g. i001 “the shared conflicts are explicit and never silently overwrite accepted geometry” and i017 “the shared the escalation keeps ownership and response deadlines.” Replace each affected message with a case-specific diagnosis of the actual competing option. The other feedback messages should be checked in the same pass for mapping to the selected wrong option.

Identity: all predecessor and current accepted keys make the Template Method/fixed-skeleton decision, so preserve all 18 question IDs. The new keyed options are scenario-specific; this is not a reason to change question identity.

The current items also repeat a fixed four-distractor architecture across the unit. Reuse of concepts is not an automatic duplicate, but here the stem’s answer disclosure and malformed diagnostics make the repeated form easier to select without evaluating the case. Correcting the two concrete issues is sufficient; I do not require 18 unique pattern concepts or scenarios.

**Limits:** proposal-level B07 v1 only; this does not accept source integration, other units, app admission, native execution, or full BIZQ-01.

| Items | Finding |
|---|---|
| i001–i018 | REVISE: each stem gives the fixed-skeleton/one-hook answer shape; keyed wrong-option messages have malformed invariant insertions. Preserve question IDs. |

