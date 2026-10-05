# N08/N09 design review

**Verdict: PASS for the bounded proposal and semantic-review approach.** The later source-freeze check and independent proof review remain prerequisites for authoring and producer work; this review does not certify either one.

I reviewed the current N08/N09 briefing (SHA-256 `89b4549bfbd364ce56f72accb3940fddaeb1072b8e0929e8c08ca921f1d4f12a`), contract (`6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`), current-source observations Markdown (`f60a33c9f18d6407dd21d86e69f516932a1f19c22cdeee366e1d32620440c962`) and JSON (`4914a5977926e710352f36f1a5b7bd835e8f506388fc4fbd72ff5efa62e690c9`), the canonical BIZQ-01 specification, canonical content-guidelines file, prior N07 source preflight, and the recorded PO scope decision. The contract binds `docs/07-content-guidelines.md` at `00c20d8c74d8e4dfec3ffb9211865642a5ae72d218bdd7473b8f41e52bfa5471`; I checked that removing the newly appended clause and its preceding separator newline reproduces the contract's predecessor hash `cffd5dae0850ecd7fc1f2e05e28f7e83c7ca9460207f6f857713d196254773e5`.

The observations bind 18 source arrays and 324 complete question objects to the prior N07 preflight. I independently recomputed all 18 raw source-file hashes and confirmed the files contain 324 questions total. The inventory is 272 exact-match `CONFIRMED`, 50 `CONTRACT_GAP`, and two `NOT_REPRODUCED` observations. Those labels are preflight evidence, not acceptance: a gap is not proof of a wrong key, and the two controls preserve only their named retry/idempotency and clock-seam facets. The current catalog remains version 23 with 1,413 questions and 79 source files; the accepted N01–N07 cohort contributes 1,089 questions. The content subtree matches the commit named by the observations. The later CI-only commit does not alter the catalog or these arrays. The required hosted CI run has since completed successfully (`37245779698`; receipt SHA-256 `0249b9522e418273725e448a63fb9a44ba3236685d88d5ddbb1688a4591bbe65`), resolving the briefing's earlier in-progress prerequisite.

## Assessment

The cohort is a coherent final OOD slice: N08 and N09 are the remaining two nodes on the same track, using the same content schema, source validator/scorer, QSet/version, application artifact, and consumer/admission path. Reviewing the 18 existing units together avoids repeating that integration cycle, while unit-by-unit authoring and semantic review keeps decisions bounded and lets corrections land before activation. The plan preserves supported meaning and uses reserved identities only for actual primary-decision or archetype changes; it does not turn the inventory, 50 gaps, or reserved IDs into a replacement quota.

The review contract addresses the concrete risks in this cohort. It requires visible decisive facts, a unit-specific decision, plausible alternatives, causal feedback and explanations, and source support for technical claims. It explicitly separates a missing discriminator from a false key and preserves bounded control facets without treating them as whole-item approval. These conditions use the existing BIZQ criteria; they do not add rules about minimum option counts, prose length, atomicity, retry guarantees, or a specific implementation pattern.

The sequence is sound: freeze the exact 324 before objects, raw files, source version/QSet and unused corresponding IDs; author and independently review the proposals; then separately review the closed proof and private byte-exact v23 predecessor reconstruction before producer implementation. Preserving the existing version chain, guards, ordinary N01 pool and other accepted content avoids a second pipeline or widened selector. The inspected preflight helper binds the current observations, prior ledger, contract, CI receipt, validated source, reserved-ID availability and preserved 1,089 items before it writes the manifest. Its source-freeze result is still pending and is not implied by this design PASS.

The PO decision defers further content review and repair of the other eight banks to maintenance, while continuing this OOD work and shared BIZQ-01. The known-risk review remains visible and unresolved as a separate concern; this scope does not mark those banks accepted or create a new release gate. BIZQ-02–06, native/Premium work, and full BIZQ-01 acceptance remain outside this design decision.

| Dimension | Score | Reason |
|---|---:|---|
| Objective fit | 0.95 | Completes the final two OOD nodes toward the active BIZQ-01 objective and respects the PO's separate deferral. |
| Simplicity | 0.86 | One fixed source/proof/consumer cycle serves both nodes; 18 bounded unit reviews remain separately reviewable. |
| Risk | 0.83 | Exact source freeze, full-object decisions, identity review and a later exact-proof review address content and history risks before activation. |
| Maintainability | 0.85 | Existing schema, pipeline, guards and predecessor chain remain in use without a new authority or migration path. |

Minimum: **0.83** (required minimum 0.80). Scores assess the approach, not source quality or runtime readiness.

This is design acceptance only. It does not accept N08/N09 proposals, the future proof shape, source activation, runtime eligibility, app readiness, native/Premium, publication, or full BIZQ-01 completion.
