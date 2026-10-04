# Independent N05 cross-unit and identity review — frozen current153

**Verdict: REVISE before N05 semantic acceptance or source activation.** The 153 proposals retain their old question IDs consistently with the original mental-unit decisions, and the unit-level reviews found no additional cross-unit duplicate that requires a question-ID change. However, the current B02–B04 proposals reuse one old answer-option ID for 51 different answer meanings, contrary to the fixed N05 contract. B03 also gives away its copy policy in every prompt; its correct options have a systematic specificity/length cue. These findings concern existing identity and content-quality requirements, not a new quota.

## Frozen review inputs

This review binds to `ROOT-CURRENT-N05-INPUTS.json` (SHA-256 `3e8bb35ec6a7ff26a0b2cd2b2aebc3a80adcfe00bd87bc944408626a6f599087`), which binds the exact frozen proposals below. The manifest hash is `bdef2880a62de54f54e3c06cb9ffc9bd5c900be31c6135d7a0b16c7583ab320a`; N05 contract hash is `f1252079b899164632accbf4168e5c77c46fb004879a6865f218c8f5707a53f2`; BIZQ-01 spec hash is `67aba008969eb570c86e1fbefc5b88a5e65f422d160fc7dcfd38084b59ff67d5`; canonical guideline hash is `5a949d18184d4713642eff447821c7b06aae04304454c72226372c4fd8b268af`.

| Unit | Frozen input | SHA-256 |
| --- | --- | --- |
| B01 | `review-inputs/N05-B01-v2.json` | `ef632970851fd14d8e468c858c32ba9b0a4b96ae35cf3159c0a67b0f4047f174` |
| B02 | `review-inputs/N05-B02-v2.json` | `f55212aa6ea4f2514eed7c413f4e3d7f4c4c2960fd13b7097332c4902d5fca41` |
| B03 | `review-inputs/N05-B03-v2.json` | `2b66e8ff0fd2d1bc395896786e1942b38017724c50ea809fef1eb5ef5aa8eaf0` |
| B04 | `review-inputs/N05-B04-v1.json` | `ce1142d8594b1505b51db0b3fd7e64d920bfeeae276f1bec3da78c10bd65ed48` |
| B05 | `review-inputs/N05-B05-v2.json` | `b7cfa499a82d56e10a1619c09512f6a304ffb7cda11498175e55262e5928e409` |
| B06 | `review-inputs/N05-B06-v1.json` | `e401e6dc966a7abc0535a9b6bad350b562bb8837008d4fd03a957927a029c89d` |
| B07 | `review-inputs/N05-B07-v1.json` | `87d1961108c1a24ceaf45385539badf72877aa87c0c5cd11cb956532c54e77ef` |
| B08 | `review-inputs/N05-B08-v1.json` | `bf6ae3b52c70f02239d5c957af81bfdb28a840e2331e9cfda12f02b9dec61d18` |
| B09 | `review-inputs/N05-B09-v1.json` | `e8b8b17b1b04a5f27e4ccc180564b12e62cf77dd78c24e0f556cb21ee5be944d` |

The per-unit evidence is [`SEMANTIC-B01-v2.md`](SEMANTIC-B01-v2.md) (17 whole objects, PASS), [`SEMANTIC-B02-B04-v2.md`](SEMANTIC-B02-B04-v2.md) (51 whole objects, PASS on their content/primary decision), [`SEMANTIC-B05-v2.md`](SEMANTIC-B05-v2.md) (two corrected objects plus 15 exact reused objects, PASS), and [`SEMANTIC-B06-B09-v1.md`](SEMANTIC-B06-B09-v1.md) (68 whole objects, PASS). This final cross-review adds current-bank comparison and identity checks; it does not convert the per-unit passes into source, producer, consumer, or release acceptance.

## Identity map

All 153 current question IDs match their corresponding 153 before IDs, 17 in each of the nine units. The per-unit semantic reviews support preserving those question IDs: their primary decisions remain within the fixed objectives (factory/family creation, staged construction, copy semantics, Adapter/Facade boundaries, Decorator/Proxy behavior, Composite, Bridge, Flyweight, and dependency assembly). Reserved IDs are not a replacement quota. B03’s prompt disclosure needs correction without changing its primary copy-semantics decision, so its question IDs should also remain stable.

There is, however, a separate answer-option identity defect. In every B02, B03, and B04 item, the correct option reuses the old ID `owner_preserves_contract` while replacing its previous answer meaning with a new unit-specific decision. Examples from the actual frozen objects:

- B02 i001 changes the answer from staged construction when optional/dependent parts require it to validating a replacement invoice only after the correction reference is present.
- B03 i001 changes the answer from defining copy depth and identity semantics to copying the board while sharing immutable assets and separating annotations.
- B04 i001 changes the answer from translating an incompatible contract at a boundary to translating money and authority codes at a tax adapter.

I compared option IDs and exact texts for all 153 current objects against the corresponding before objects in the fixed manifest. The same changed-meaning reuse occurs in B02 i001–i017, B03 i001–i017, and B04 i001–i017: **51 reused answer IDs have changed meanings**. The other 561 current option IDs are new relative to their before objects. The canonical N05 clause explicitly says never to reuse an option ID for a different meaning. Assign a fresh unused ID to each of those 51 keyed options and update its `answer.optionId`; retain the question IDs and existing wrong-option IDs where their meanings already match.

## B03 answer disclosure and style cue

Every B03 stem includes a prescriptive copy-policy sentence immediately before asking which copy policy to use. It states the answer action rather than only the facts from which the learner should derive it. Examples include:

- i001: “Copy the configured board while sharing immutable assets and separating editable annotations.”
- i006: “Copy the mutable sequence while retaining stable references.”
- i013: “Preserve graph identity inside the copy and isolate it from the source.”
- i017: “Reuse the bracket rules while resetting schedule state, identity and results.”

The same disclosure pattern is present in i001–i017. It conflicts with BIZQ-01 §4.2 because the question asks the learner to select the copy policy after the stem has already prescribed it. Replace these instructions with neutral, observable requirements—such as source immutability, required reference identity, independent edits, fresh identity, or empty new-result state—while preserving enough facts to make the keyed policy uniquely correct. Do not simply remove a sharing requirement if an alternative such as deep-copying could then satisfy the remaining visible facts.

The disclosure is reinforced by an option-specificity pattern: using whitespace-separated words for a descriptive check only, the keyed option is strictly longest in 11 of the 17 B03 items (i001, i002, i004, i006, i008, i010, i011, i012, i013, i016, i017), and ties for longest in three more (i007, i009, i015). This count is not a threshold. The qualitative concern is that the correct option usually states the full multi-boundary policy while distractors state shorter partial actions. BIZQ-01 §4.3 asks that options be comparably concrete and that “longest is correct” not become a systematic cue. Preserve all necessary copy conditions in the key, and review the alternatives for realistic complete but meaningfully wrong copy boundaries; do not pad them or impose equal word counts.

## Cross-unit and cross-bank comparison

I compared the closest same-domain decisions in the accepted N01–N04 bank and the N05 proposals. These overlaps are related practice, not the same primary learner action:

- B01 i003/i010 and accepted N01 B06 i021 use carrier/shipment vocabulary, but B01 asks whether one or a paired set of product implementations should be constructed from a single configuration. N01 i021 asks how an external carrier response maps into the shared `LabelReference` contract. Construction/family selection differs from Adapter field translation.
- B01 i016 and accepted N01 B05 i031 both use referrals. B01 binds request/response mappers to a selected directory; N01 B05 i031 distinguishes internal routing from consent-authorized external disclosure.
- B02 i006 and accepted N03 B03 i022 both involve a published snapshot. B02 requires selecting content/edition before validating rubric references and staging the release; N03 tests creation of an immutable result snapshot after input references validate. They reinforce validation-before-publication but do not ask the same dependent-construction decision.
- B02 i014 and accepted N01 B02 i032 both involve missing snapshot version data. B02 asks how construction distinguishes required dataset/code references from optional notes; N01 asks what to do when a requested code version is absent. This is close transfer practice, not an identical decision.
- B05 i006 and accepted N02 B06 i021 both concern notarization. B05 asks whether a wrapper can audit the identity returned by a successful seal without changing the target contract; N02 asks which identifier defines seal equality. The operation and conclusion differ.
- B06 i005 and accepted N01 B04 i024 both involve exclusive battery assignment. B06 asks whether an aggregate Composite tree should own a concurrent assignment transition; N01 B04 i024 asks for the atomic assignment change and its history. Composite’s boundary versus the transition itself is a useful adjacent decision.
- B08 i010 and accepted N01 B04 i019/i025 both involve plot transfers. B08 asks what immutable map geometry may be shared while each reservation retains its own state; N01 asks how a particular transfer preserves plot/approval history. Sharing static value versus committing a transfer differs.
- B09 i009 is the closest control overlap: it reuses the exhibit-maintenance scenario from accepted N01 B06 i023 and accepted N04 B06 i033. N01 asks where the Exhibit-owned maintenance check is enforced; N04 asks where to put the guard across newly registered handlers. B09 instead asks how a shared dispatcher is bound to each exhibit’s independent state. That per-entity dependency-binding decision is specific to B09’s composition-graph objective. It is a close reinforcement, not a forced question-ID change.
- B09 i001 and accepted N03 B07 i019 both involve startup wiring. N03 asks where concrete implementations are selected at the composition root; B09 requires the policy/store compatibility pair be validated before use. Compatibility validation is a distinct condition.

Within N05, the recurring use of one unit principle across different domains is generally purposeful practice; I found no additional pair that is materially the same decision without a meaningful condition or boundary change. Exact Reason text is unique across the current 153. The existing per-unit reviews found Reasons and keyed explanations causal rather than exact key paraphrases; no new §4.4 blocker surfaced in the cross-bank scan.

## Required corrections and limits

1. Give B02 i001–i017, B03 i001–i017, and B04 i001–i017 new unused correct-option IDs and update the answer references. Keep their question IDs.
2. Rewrite B03 i001–i017 prompts as neutral observable requirements, preserving enough facts for one answer; review the B03 alternatives for comparable specificity and the correct-option length cue under the existing §4.3 standard.
3. Freeze the corrected proposals and have the relevant changed objects reviewed before any N05 source activation. Reuse unchanged item findings only where exact whole-object bytes remain unchanged.

This is a review of frozen N05 proposal semantics and identity only. It does not accept the 153-question source migration, producer proof, app consumer, admission, native/Premium eligibility, full bank, or full BIZQ-01 closure.
