# Independent amendment review — OOD N03 closure19

**Verdict: PASS for the amended source-scope proposal.** This amends my earlier conditional briefing review after reading the completed N03 preflight and the updated private-proof approach. It approves preparing one N03 authoring cohort; it does not approve authored questions, source changes, admission, pool reachability, native/Premium acceptance, or full BIZQ-01 closure.

The final preflight is bound to content HEAD `90a1d83859c2be83c5266ffe981f487d3c29aeeb`; its manifest SHA-256 is `c344367f12072c110761664825bd95c6f40334eea89296cb56e9787ab847fe73`. I independently compared all nine current source files and their 162 ordered IDs to that manifest. The source bytes match the listed hashes, and each unit contains exactly i001–i018.

The amended scope is coherent: include the complete N03 node (nine existing units, 162 questions), preserve the other 1,251 OOD objects and the eight other track artifacts, and leave the 1125-item cross-node heuristic outside this package. The source read supports the inclusion: each N03 item has a unit-lens mismatch or missing decision facts in addition to the malformed wrong-option template. The common pattern is evidence for review, not a count-based quality verdict. The per-item manifest records the item-level gaps, and the review still needs to assess each eventual replacement independently.

The revised identity rule is consistent with the existing content contract. Map an old i001–i018 to the reserved i019–i036 only when the authored replacement changes that item’s primary decision or accepted-answer meaning. A repair that preserves both must retain its current question ID. The mapped new IDs are therefore conditional, not a required replacement count. The proof must bind each per-item identity action and reject a reused ID whose meaning changed or a new ID used for a wording-only correction.

The proof-path refinement also fits the existing boundary: one private validator body may serve only the two hard-coded, closed source17/source19 descriptors while preserving all prior source17 checks. It must not take approval scope or mappings from proof input. The historical chain remains private verification only; it does not authorize runtime or pool changes. This avoids another copied validation loop without adding a general override mechanism.

| Criterion | Score | Reason |
|---|---:|---|
| Objective and architecture fit | 0.94 | A complete evidenced node is a coherent source unit; other nodes remain excluded. |
| Simplicity | 0.85 | One fixed cohort and the existing candidate, admission, and provenance path; the private validator shares only a closed-descriptor body. |
| Risk | 0.83 | 162 authored items carry semantic risk, bounded by item-specific objectives, independent whole-object and cross-unit review, fixed hashes, and unchanged runtime/pool scope. |
| Maintainability | 0.86 | Conditional per-item identity actions and one strict validator implementation reduce accidental identity and code-path drift. |

Minimum: **0.83**. No new product rule or gate is needed. The final source, consumer, and admission work remains subject to its normal independent acceptance after authoring.
