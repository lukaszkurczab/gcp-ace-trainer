# Independent N06 whole-cohort semantic review

**Verdict: REVISE before accepting the N06 semantic/identity map.** The frozen 180-object set has no unresolved primary-decision duplicate or question-identity defect in this review. A repeated correct-answer form remains a material §4.3 issue in B01, B03, B05, and B08: the keyed choice is consistently the sole longest and reads as the only complete policy while alternatives are shorter, abbreviated decisions. Tighten those keyed choices to the mechanism already supported by each stem, or make the competing alternatives comparably concrete without filler. Keep question IDs, keyed meanings, option IDs, scoring, and feedback mappings unchanged unless a meaning actually changes.

## Frozen evidence and review basis

- Current N06 registry: [`ROOT-CURRENT-N06-INPUTS.json`](ROOT-CURRENT-N06-INPUTS.json), SHA-256 `d72b6e023e823f47ebfb9be10a6cab256e012fa67b4fd123ef312190e24f948e`. It binds all ten current proposal snapshots, their notes, old/current question IDs, whole-object fingerprints, accepted option IDs/text, the fixed manifest, and the 765 accepted N01–N05 comparison population. It records 180 same-question-ID proposals, 1,233 other retained OOD items, and is explicitly a review input rather than an accepted identity map.
- Advisory receipt: [`ROOT-FINAL-N06-WARNINGS.json`](ROOT-FINAL-N06-WARNINGS.json), SHA-256 `29f8652b922b71ffe72e57939185789eb7a49235e367c65ae00f09657d3a4784`; it reports 93 sole-longest advisories across the 180 proposals. The count is not a threshold or automatic rejection.
- Criteria: [`N06-CONTRACT.json`](N06-CONTRACT.json), SHA-256 `c6b5612e21fb66a540eba31514510df49b302f8f1089cf474f2ac5880b4205fb`, and the existing quality specification, §§4.1–4.4 and 5B–5C. Whole-object reasoning uses the actual keyed answer ID, not option position.
- The ten unit reports below bind each current proposal. Matching-object reviews and narrow corrections are reused; they were not re-run merely because of a later registry snapshot.

## Cross-unit and accepted-bank comparison

I compared the current accepted decisions by mechanism and caller-visible outcome, not by shared nouns or pattern labels. The closest N06 pairs remain distinct:

| Pair | Distinct learner decision |
|---|---|
| B01 Strategy / B07 Template Method | Select a replaceable policy at a stable workflow seam versus keep a required host-owned algorithm skeleton and vary a defined subclass step. |
| B03 Command / B09 domain event | Capture a proposed operation and its inputs before execution versus publish a fact only after the owning operation accepts and persists it. |
| B04 Observer / B09 domain event | Subscribe to a subject’s committed change versus publish an accepted business fact for retryable consumers. |
| B05 Mediator / B10 Saga | Coordinate peer calls while leaving domain rules with participants versus sequence external effects and apply a permitted compensation/retry on failure. |
| B06 Chain / B07 Template Method | Try ordered handlers with applicability and pass/stop outcomes versus run a stable algorithm with a designated variation point. |
| B09 events / B10 workflow orchestration | Publish a valid completed outcome for downstream projections versus coordinate a multi-step workflow and decide which local effects to retain or reverse. |

The recurring music, payout, notary, and sequence examples in B09/B10 are useful transfer practice: the event items ask where the accepted fact is owned and when it is published; the workflow items ask what the caller does when an external step fails. In particular, B09 i005 teaches publication of the accepted seal fact; B10 i010 teaches retaining the authoritative seal when an index projection is unavailable. I found no materially identical answer/decision pair between these items or the nearest accepted N01–N05 controls. The accepted-bank comparison reuses the already-reviewed accepted evidence and does not claim to re-review all 765 objects from scratch.

The current map preserves the 180 question IDs because the accepted mental-model objective/archetype remains the same in each reviewed whole object. It uses fresh, case-specific IDs for the newly authored keyed meanings rather than reusing the old generic `owner_preserves_contract` option identity. That decision is supported by the per-unit before/current answer-ID comparisons and the frozen registry; the registry itself is not treated as semantic approval.

## §4.3 option-form finding

The advisory itself is not a gate. The defect is the repeated answer-form cue visible in the actual choices:

| Unit | Flagged items | Concrete observation |
|---|---|---|
| B01 Strategy | i001, i002, i003, i005–i013, i015, i017, i018 | 15 of 18 keys are sole-longest. In i003, the key gives a shared policy interface and explains the fixed posting sequence (155 characters); each distractor is a shorter single-boundary mistake (94–102 characters). The same two-part “policy seam plus stable workflow” form repeats through the unit. |
| B03 Command | i001, i003–i018 | 17 of 18 keys are sole-longest. In i001 the 170-character key recites the captured inputs, validation, and unchanged-on-rejection result; the longest distractor is 106 characters. Most questions repeat that complete-operation recipe against shorter one-error alternatives. |
| B05 Mediator | i001–i010, i012–i014, i016–i018 | 16 of 18 keys are sole-longest. In i001 the key names all three participants and preserves their local rules (155 characters); the longest distractor is 122 characters. Similar “coordinator plus preserved participant ownership” answers recur. |
| B08 Iterator/Visitor | i001–i018 | All 18 keys are sole-longest. In i001 the key is 138 characters and the longest distractor is 78; it alone states both ordered traversal and separation from collection representation. Across the unit, the same 43–99-character generic distractors (“copy the loop,” “return the backing collection,” “add a command”) contrast with 111–160-character scenario-specific complete keys. |

These are not isolated differences needed to express a particular invariant: they form a stable shortcut across repeated items. In B08 especially, answer length and completeness identify the key before the learner evaluates the stated ownership/traversal facts. The smallest coherent repair is to express each keyed mechanism at the decision boundary already established by the stem, and preserve required ownership constraints in the stem or concise key. If an abbreviated keyed answer would omit a decisive contract, enrich its nearest wrong alternatives with realistic competing policies and their specific failure boundary. Do not pad options, impose equal word counts, or change the underlying answer merely to make it shorter.

The remaining warning groups are not separately blocking on the evidence reviewed. B04’s keyed messages specify the accepted payload fields required by the stems; B09’s choices present concrete, multi-step alternatives for event ownership, publication, and consumer retry; B02 and B06 have only one and two flags respectively, and their alternatives state distinct lifecycle/handler errors. Their unit reports assessed the actual option content, not the warning count. This conclusion does not waive the required correction in the four groups above.

## Per-unit evidence reused

| Unit | Frozen proposal SHA-256 | Independent unit review |
|---|---|---|
| B01 v1 | `259cc143512849ffc408879253d4ee622494938a9b8172ee9b59917d1ce890eb` | [`SEMANTIC-N06-B01-v1.md`](SEMANTIC-N06-B01-v1.md) and [`SEMANTIC-N06-B01-v1-IDENTITY-CLARIFICATION.md`](SEMANTIC-N06-B01-v1-IDENTITY-CLARIFICATION.md) |
| B02 v2 | `2bcb129d105b26b8b84ed9c2898df5a85e062a650103995ab4264952868e674e` | [`SEMANTIC-N06-B02-v2.md`](SEMANTIC-N06-B02-v2.md) |
| B03 v1 | `6cb88be1e41095f3d02f548c0b9531d3db7061aff597f868eb5eee019e2bfcdd` | [`SEMANTIC-N06-B03-v1.md`](SEMANTIC-N06-B03-v1.md) |
| B04 v1 | `7a31f2f34c67f5614f6c46a64c88fd113e732b07d56d702cddeafa3b5b7c2eda` | [`SEMANTIC-N06-B04-v1.md`](SEMANTIC-N06-B04-v1.md) |
| B05 v2 | `51db77ba7356e461968b9550ed6f808341f4510fea5c2e372602180ab4299608` | [`SEMANTIC-N06-B05-v2.md`](SEMANTIC-N06-B05-v2.md) |
| B06 v4 | `b7333dfb35f9b1f0066e4d0ad8144f8ea41264470cfca6c27ac82ca8895fa8ef` | [`SEMANTIC-N06-B06-v3.md`](SEMANTIC-N06-B06-v3.md), plus the exact answer-option-ID-only rename evidence in `ROOT-ACCEPTED-OPTION-RENAME-DELTA.json` |
| B07 v5 | `77fd48660671d6ac4e57eaa212f98a8114670de4c3078cf2835e346876a9e342` | [`SEMANTIC-N06-B07-v4.md`](SEMANTIC-N06-B07-v4.md); frozen v4/v5 bytes are identical |
| B08 v3 | `f08cf6ed81fbdeb50b9af418960a57cab0c91fdcd38fc6125b7fb50e8d2c078f` | [`SEMANTIC-N06-B08-v2.md`](SEMANTIC-N06-B08-v2.md), plus the exact answer-option-ID-only rename evidence in `ROOT-ACCEPTED-OPTION-RENAME-DELTA.json` |
| B09 v3 | `ed9c57ba6289e07441455deaabb6526d35277ca7fcfb0ac4ae2cb93cda38efbe` | [`SEMANTIC-N06-B09-v3.md`](SEMANTIC-N06-B09-v3.md) |
| B10 v3 | `e959f3b8c5a843f0fdc917784c24cb83cf2b3b87a26e28fbd996d55cc8f22c72` | [`SEMANTIC-N06-B10-v3.md`](SEMANTIC-N06-B10-v3.md) |

## Scope limits

This is a proposal-level semantic and identity review. It does not accept source integration, proof/migration, producer or consumer implementation, app admission, runtime/native/Premium behavior, full-bank eligibility, or full BIZQ-01 closure. The next review should bind the corrected four-unit option text to a new frozen registry and inspect only the changed objects/fields plus affected warnings and mappings.
