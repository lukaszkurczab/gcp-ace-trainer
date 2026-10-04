# Independent known-critical risk reconciliation

**Verdict: PASS for this bounded evidence reconciliation.** This verifies exact reuse of the previously reviewed 46 critical whole objects and their current app source/runtime/pool bindings. It is not a new semantic review, repair, full-bank acceptance, or release-readiness assessment.

The current source and bundled runtime match the prior fingerprints for all 46 records: 22 BESD and 24 FESD. Four are members of configured ordinary Design pools; 42 are absent from those pools. The four membership records are `besd-n01-b01-i005`, `besd-n01-b06-i011`, `fesd-n01-b07-i017`, and `fesd-n01-b01-i011`. The pool evidence covers Learn Framework and Tradeoff Practice immediate pools and the evidence-conditioned Weak Area Review pool (`due_queue`). It establishes configured membership only; it does not establish that a learner, profile, or native session selected an item. Absence from these ordinary pools does not prove absence from simulations or verified-context paths.

The classification correction is supported by the actual objects and current presentation path:

- The two BESD findings are explicit answer-direction cues in constraints. `DesignInterviewPracticeScreen` forwards constraints to `PracticeQuestionCard`, which renders each constraint as visible text when present. This demonstrates learner-visible exposure if either item is selected, not actual selection.
- `fesd-n01-b07-i017` and `fesd-n01-b01-i011` are case/key underdetermination with generic explanations. Their scenario facts do not establish the keyed generic ownership/ordering principle against the nearest alternative. This is distinct from an explicit direction cue.
- For the FESD ordering item, the source also contains a `wrong_element` feedback leaf that conflicts with the first accepted element. The current Design Interview projection filters to `broken_relation` messages; current exposure of `wrong_element` is therefore not established. I do not count it as a demonstrated runtime feedback defect.

The independent exact-object and binding results are recorded per item in [the machine-readable QA record](KNOWN-CRITICAL-RISK-QA.json). Evidence inputs include the [current risk inventory](KNOWN-CRITICAL-RUNTIME-RISKS.md), [current source/runtime and pool observations](ROOT-KNOWN-CRITICAL-RUNTIME-POOLS.json), [risk bindings](ROOT-KNOWN-CRITICAL-RISK-BINDINGS.json), [classification correction](ROOT-KNOWN-CRITICAL-RISK-CLASSIFICATION-RESOLUTION.json), and [current-review reconciliation](../ood-remaining-closure-22/ROOT-REVIEW18-CURRENT.json). The root PO-scope decision, contract receipt, and consistency QA were also checked: further review/repair of the other eight banks is deferred to maintenance when the app is release-ready; missing full review alone is not a release gate. These four risks remain explicit and are not declared repaired or accepted.

No native run, Premium selection, learner-profile selection, or all-mode unreachability was established. This QA adds no blanket review gate, selector workaround, product requirement, or release authority.

**Option-count clarification:** Four-option drafts were valid under the checked schema and scorer. The earlier wording error was inferring that five options were mandatory because the source examples used five; this reconciliation establishes no such count requirement.
