# Independent N09-B07 v5 correction review

**Verdict: REVISE, narrowly.** The v5 content supplies the missing visible facts in i021 and makes batching materially preferable in i027. One decisive i027 premise remains linguistically ambiguous: “serializes single-author requests” can mean the service handles them sequentially, or that it encodes/serializes their payloads. Clarify that the provider processes those requests one at a time. The other v5 changes are supported.

## Scope and bindings

I reviewed both changed whole objects against v4 and checked that the other 16 objects are exactly unchanged. I reused the matching v4 review for fields and cases not changed here. The production validator/scorer checks all 18 accepted answers, all 72 distractors, reversed option order, and exact feedback-target sets.

- Frozen v4: `review-inputs/N09-B07-v4.json`, SHA-256 `87689861d0d722d81c8e62f9909078701ea461e0126b6173e8fe6448441bd17d`.
- Frozen v5: `review-inputs/N09-B07-v5.json`, SHA-256 `8114a839b8c3c62a7214cd185412f4229fb313a35f25d3a22633f319b465cfef`.
- Before-object manifest: `N08-N09-MANIFEST.json`, SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`.
- Contract: `N08-N09-CONTRACT.json`, SHA-256 `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`.
- BIZQ criteria: `patternly/docs/specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md`, SHA-256 `c10ce086ecd3b58d7d776a458cb453d0161ac4519ca2474deba952122ceac8a3`.
- Content guidelines: `docs/07-content-guidelines.md`, SHA-256 `00c20d8c74d8e4dfec3ffb9211865642a5ae72d218bdd7473b8f41e52bfa5471`.

The actual v4→v5 delta is limited to two whole objects: i021 constraints, and i027 constraints plus one distractor text/ID and its aligned message target/text. The accepted answer and question IDs remain unchanged. Production checks pass: 18/18 valid; all 18 accepted answers score correct; all 72 distractors score incorrect; all 18 accepted answers remain correct with reversed option order; and all 18 feedback target sets exactly match the current wrong-option IDs. These checks confirm schema/scoring/target binding, not the remaining wording issue.

## Changed cases

**i021 — supported preview sizes.** The prompt now states that clients repeatedly request only two supported sizes, thumbnail and card, and the constraints say the derivative budget allows storing both for each image. That makes the key’s upload-time generation of those two variants a bounded option grounded in the visible facts. The 71% resizing CPU profile identifies the measured path; the stated dimensions validation and budget cover the relevant operational boundaries. The key, Reason, Details, and option messages now agree with the case. I found no remaining i021 blocker.

**i027 — fixed-set reputation batch.** The case now says repeated single-author request setup dominates latency, the batch interface handles the fixed candidate set with one setup, and returns the same reputations. The replacement distractor proposes parallel individual requests, so the revised message correctly compares request setup and batch behavior rather than relying on an unstated rate limit. However, the phrase “the profile service serializes single-author requests” is ambiguous in this context: it may mean sequential request handling, or serialization/encoding. Because this premise is what excludes parallel fan-out, state explicitly that the service processes single-author requests sequentially (or equivalently queues them one at a time). This is a clarity correction to the supplied behavior, not a new concurrency gate or numeric threshold. `Reason`, `Details.errorCorrection`, and the feedback message should use the same explicit meaning.

## Reused scope and limits

The remaining 16 questions are byte-equivalent to the reviewed v4 objects, so their v4 correction findings remain matching evidence. The underlying question and identity dispositions are unchanged by this v5 delta. This report only reviews the bounded B07 correction; it does not accept source migration/activation, runtime/admission, native/Premium, or the complete BIZQ-01 package.

## Reproducible checks

`SEMANTIC-N09-B07-v5-CHECK.mjs` runs the production validator and scorer against each item, checks every distractor, reverses options, verifies the exact feedback target set, binds original manifest rows by `reservedNewQuestionId`, and verifies the v4→v5 changed scope. Receipt: `SEMANTIC-N09-B07-v5-CHECK.json`.
