# N07/23 design review

**Verdict: PASS for the bounded authoring and semantic-review approach, subject to the stated pre-authoring source freeze.** This review approves the approach only; it does not accept proposals, a producer proof, source integration, consumer readiness, or full BIZQ-01.

## Inputs and actual contract

I reviewed the N07 brief (`N07-BRIEFING.md`, SHA-256 `9370339439c25f7fe065e3753af31f0436d0e0e78e9084815d83c5ad9039e4d3`) and append-only contract receipt (`N07-CONTRACT.json`, `79c6dd8d2861d21eec0122675659840ba6f04883f546ec9ef4326f29320d4720`), the current OOD N07 source observations, the PO scope decision, BIZQ-01 spec, canonical content-guidelines appendix, canonical work plan, and current working state. The contract binds the actual `docs/07-content-guidelines.md` bytes at SHA-256 `cffd5dae0850ecd7fc1f2e05e28f7e83c7ca9460207f6f857713d196254773e5`; I verified the N07 clause is present and the contract records `unchangedPrefix: true`. The underlying BIZQ-01 specification is SHA-256 `67aba008969eb570c86e1fbefc5b88a5e65f422d160fc7dcfd38084b59ff67d5`.

Current source observations bind the eight N07 arrays and 144 complete question objects to the prior item-level preflight. The root's actual preflight receipt (`ROOT-INITIAL-PREFLIGHT-RECEIPT.json`, SHA-256 `8c352a5beae2843a5cb0f31c7e27f3f2d33d8a16f4017d3e3377350ed8c341c2`) confirms the final helper, current-source check and canonical appendix bindings; its 144-item match is not semantic or identity acceptance. The current-source check reports 1,413 questions at QSet `c6cf903178b823fb71ac29040f3c5fa5f72c619d3adbb525fc7791756654ac3e`, with 144 exact raw-source and whole-object matches. The observations classify 133 matching items as previously confirmed and 11 as `CONTRACT_GAP`; the 11 are ambiguity, not evidence that the existing keys are wrong. The supported B01-i004 control has a narrow feedback defect. The observations intentionally reuse earlier findings for exact-matching items instead of presenting them as a fresh independent review.

The PO scope decision (`PO-SCOPE-DECISION.json`, SHA-256 `d0483f7916ad2000f8988050ef1b2954ec5ba857ec6eaeba613f9ce609a75bc6`) confirms work on this OOD node and shared BIZQ-01 continues. It defers further content review and repairs in the other eight banks to maintenance when the app is release-ready, without accepting their unreviewed content or changing release authority. This does not conflict with completing the fixed N07 cohort.

## Assessment

The scope is coherent: one whole N07 node, eight existing learning units, and 144 current questions. Its 11 ambiguity findings, the supported control, and the observed recurring template weaknesses give concrete reasons to review the full node together. The method still makes every decision item-specific: preserve a supported facet, resolve a real discriminator, and select same-ID correction versus a reserved ID based on actual primary meaning. It does not turn the available i019–i036 IDs into a replacement quota or require a wholesale rewrite.

The proposed authoring contract follows the existing BIZQ criteria: visible decisive facts, a unit-specific decision, plausible nearest alternatives, causal Reason, all current Details fields, and stable-ID diagnostics. Requiring applicable primary sources for technical claims is appropriate for the listed persistence, ORM, serialization, identity-map, loading, and retry topics; the accompanying source references expressly limit provider claims and do not turn general guidance into universal guarantees. The brief also preserves the distinction between a contract gap and a wrong answer, which prevents adding transactionality, distributed exactly-once, or retry rules that the scenarios do not establish.

The identity and preservation boundaries are sufficiently explicit for proposal preparation: compare all current objects to the fixed manifest, review identity per whole object and across accepted N01–N06, preserve the other 1,269 OOD objects, ordinary N01/136 pools, taxonomy/scoring/counts, and eight other artifacts, and report same-ID corrections separately from true replacements. The exact predecessor reconstruction and fixed closed proof remain a separate design review after the identity map is accepted. That sequencing preserves the existing v22→v21→v20→v19a→v19→v17→v16→v13→v12→v11 history and avoids approving an unknown proof shape here.

The workflow has clear ownership and a single existing pipeline. Proposal authors do not edit source or accept their own content; root owns manifests, source activation, admission, locks and queue; independent review covers semantics and identity. No selector widening, global option-ID rule, schema migration, archive, alternate pipeline, new authority, product rule, or release gate is introduced. Ordinary pools and native/Premium claims remain explicitly bounded.

Before authoring begins, root must freeze the exact 144 before objects, source bytes, accepted keys/references and corresponding unused IDs, then record the actual pre-authoring binding check as the briefing requires. Current source observations support that preparation, but this design report does not itself certify a future proposal manifest. After semantic review, the exact producer proof and private byte-exact v22 reconstruction still require their own independent review before producer implementation/source activation.

## Scores

| Dimension | Score | Basis |
|---|---:|---|
| Objective fit | 0.95 | Completes the bounded remaining OOD node toward the active BIZQ-01 goal while honoring the PO's separate eight-bank deferral. |
| Simplicity | 0.86 | One node-wide proposal/review package uses the existing source, proof and admission pipeline; it avoids eight disconnected partial cycles and avoids a bank-wide rewrite. |
| Risk | 0.84 | Exact before-state, whole-object semantic review, per-item identity, accepted-bank comparison and later closed-proof review control the main content and history risks. |
| Maintainability | 0.85 | Fixed manifest, explicit ownership, immutable predecessor chain and no new runtime or authority path keep future changes auditable. |

Minimum: **0.84**, above the required 0.8. These scores assess the approach, not repository readiness or source quality.

## Limits

This PASS is conditional on the pre-authoring freeze and binding check. No N07 proposals have been semantically accepted by this review; the future mixed identity map and producer proof are not approved. It does not claim source activation, runtime eligibility, native/Premium readiness, external publication, release readiness, or full BIZQ-01 completion.
