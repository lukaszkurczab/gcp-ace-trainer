# N07 cross-unit warning reconciliation

Status: read-only comparison of three current N07 proposals against their manifest-bound pre-proposal objects and accepted N01/N02 items. This report does not accept the N07 questions or authorize edits. The comparison asks whether the extra N07 learning decision is supported by the unit lens and visible facts; overlap alone is not a rejection rule.

## N07-B02-i017 vs N01-B03-i021 — reinforcement with a narrower N07 decision

The exact domain and historical facts are intentionally very close: both use a practice tracker, an exercise revision, and the scoring-policy revision. N01-B03-i021 asks what defines a completed exercise’s association when titles can be reused. Its key is to reference the exact exercise revision and policy version rather than a title or copied display fields. Its objective is domain identity/vocabulary and references.

The manifest-bound N07-B02-i017 predecessor was about transaction scope: completion records exercise version and score policy, and the key was to align the transaction boundary with invariants that must hold together. The current N07 item retains that mental unit. It adds that profile changes are independent and the history projection is asynchronous, then asks which state belongs in the completion commit. Its intended decision is the completion transaction’s membership: commit the outcome with both exact revision references, excluding mutable profile and later projection state.

This is defensible practice across two lenses, but answer priming risk is real: the accepted N01 question already teaches the exact two revision references, and the N07 key restates them. The N07 distractors do test transaction-scope mistakes (including profile/projection), so the item adds a decision beyond merely choosing an identity field. Smallest same-primary refinement, if the independent reviewer finds the current contrast insufficient, is to make the commit boundary consequence explicit in a neutral prompt fact (the history projection can be rebuilt or delayed without changing a completed score) and sharpen one nearest alternative to a split commit whose references are written only by the projection. Keep the objective as aggregate/transaction scope and the key meaning. Do not change the question ID merely to avoid a repeated domain.

Disposition: retain the existing primary decision; no required correction from the overlap alone. Treat the proposed refinement as optional unless review establishes that the current “which state should commit?” contrast is answer-primable after N01.

## N07-B05-i012 vs N02-B05-i028 — strongest same-decision overlap; restore serialization-specific evidence

Both current items describe a research notebook’s published result, immutable dataset/code revisions, and later audit or rerun. Both keys say to persist the exact dataset and code revision references with the published result. N02-B05-i028 already makes the provenance decision explicit and contrasts mutable “current” inputs, edited references, copied bytes without the code revision, and new experiment identity. N07-B05-i012 asks what the serialized snapshot should retain and contrasts display names/latest, timestamps, copies of current sources, and an irrelevant schema version.

The N07 pre-proposal manifest confirms the original B05 intent was serialization/versioning/default behavior, but its visible facts did not state any serialized format, schema evolution, old reader, or missing-field behavior. The current proposal repaired the unsupported broad key by narrowing to immutable provenance. That repair is coherent with the item’s snapshot wording, yet it now teaches essentially the same primary decision as the accepted N02 question. The only additional wording, “serialized snapshot,” does not by itself create a distinct learner decision; the unit objective alone cannot establish that distinction.

Smallest coherent option is to preserve N07’s serialization/versioning objective by supplying a concrete, fictional serialized-format compatibility fact and testing a version/default boundary decision. For example, state that a stored result produced before a named field existed must still be read by the current importer, and ask how the importer distinguishes an absent legacy field from an explicitly stored value. The required default and its domain boundary must be specified in the scenario; do not imply a universal default or migration policy. This would be a genuine primary-decision change from provenance and should use the manifest’s corresponding reserved N07-B05-i030 ID, with new option IDs for changed answer meanings. If adding that case fact/policy is outside the accepted authoring scope, retain the current provenance meaning and record this as deliberate reinforcement rather than claiming N07 adds a distinct decision.

Disposition: requires a deliberate choice in whole-cohort review. The current question is internally supported, but does not demonstrate a distinct primary decision from N02-B05-i028. Preferred correction is the serialization-specific case above only if the accepted N07 objective is to be realized; otherwise retain same-ID reinforcement and disclose the overlap. No broad rewrite is indicated.

## N07-B05-i015 vs N02-B06-i036 — defensible adjacent practice, different decision facet

Both items use a rejected invoice and a corrected reissue, so the domain overlap is exact. N02-B06-i036’s explicit decision is issue identity across delivery retry versus corrected reissue: retries reuse the issue ID; corrected reissues receive a new ID and link to the rejected issue. Its primary objective is identity/lifecycle.

The manifest-bound N07 predecessor was also an invoice reissue but only said the new issue was traceable and did not double-charge. The current N07 prompt adds that each issued payload is immutable, the corrected issue references the rejected issue, and an auditor may later read either issue exactly as sent. Its key is a serialization/history decision: append a new immutable payload and predecessor link rather than overwrite, retain only the latest row, reconstruct from current invoice state, or omit the link. Unlike N02, this tests preservation and retrieval of exact transmitted bytes, not how a retry is assigned identity. The N07 error messages and details consistently diagnose payload loss/reconstruction or missing lineage.

That is a reasonable deliberate reinforcement across N02 identity and N07 serialized history. The extra facts directly support the different answer facet; no new rule about delivery guarantees is asserted. To keep the boundary clear, retain the current emphasis on exact serialized payloads in the stem and explanation, and avoid adding retry-ID language already covered by N02.

Disposition: retain current primary decision and QID. No correction needed based on this overlap.

## Evidence binding

The JSON companion records raw hashes of the two proposal arrays, the accepted source files, and the N07 manifest. The manifest binds the current/before object fingerprints, objectives, and reserved IDs. This is a scoped comparison of these six items, not a semantic approval of N07 or a full cross-unit acceptance result.
