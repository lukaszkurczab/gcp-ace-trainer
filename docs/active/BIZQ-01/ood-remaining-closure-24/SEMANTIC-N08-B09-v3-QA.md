# Independent semantic review: N08-B09 v3

**Verdict: REVISE.** The unit still targets retry identity and preserves the same accepted meaning and IDs as its before objects. Its options are structurally valid and score correctly, but two repeated form patterns undermine the intended decision: the stem often states the exact same-ID behavior that the keyed option repeats, and the keyed option is the shortest choice in all18 objects while every distractor adds a failure consequence.

## Frozen inputs and method

- Current proposal and frozen review copy: `proposals/N08-B09-v3.json`, SHA-256 `960bf89a2f3a3d8fa9a91b587957b7c0e452a2c77b476b116274b7955938a4cf`; the `review-inputs` copy is byte-identical.
- Before objects and source bytes: `N08-N09-MANIFEST.json`, SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`; source `content/object-oriented-design-interview/concurrency_thread_safety_resources_and_failure_handling/OOD-N08-B09.json`, SHA-256 `093bdea05d1a2e9854c474025fea368aac46a1c70f57f4a8371c990f0461e15d`. The current source bytes match the manifest.
- Contract: `N08-N09-CONTRACT.json`, SHA-256 `00c20d8c74d8e4dfec3ffb9211865642a5ae72d218bdd7473b8f41e52bfa5471`.
- The canonical validator and scorer were run on every whole object, the keyed choice, each of the 54 distractors, and the keyed choice after reversing option order. Stable feedback targets were checked against actual option IDs. All18 validate, all18 keys score correct, all54 distractors score incorrect, all18 reversed keys score correct, and all feedback targets match.
- I compared every current prompt, option, answer, feedback message, Reason, Details field, taxonomy and source reference with its manifest before object and reviewed all18 current whole objects. Each retains its question ID and `owner_preserves_contract` answer ID, so the before-to-current identity map is SAME_ID throughout. This does not accept the whole N08/N09 cohort or producer/source/runtime admission.

## Findings

### F1 — The prompt supplies the retry rule the question asks the learner to choose

Across the unit, the stem repeatedly states that the same operation ID must be replayed and that a distinct action has a different ID, then asks which retry identity the operation should honor. The keyed choice restates that rule. For example, i014 says a stable invoice issue ID must return the same accepted/rejected outcome without charging twice; the answer says to return the recorded exchange result for that same ID before creating another issue. i002 similarly says the same reservation ID must return the original result, while i010 says replaying the same submission ID returns its recorded status. These are decisive parts of the answer, not just neutral case facts.

This weakens the item’s decision value under the prompt-quality requirement to test a decision rather than supply the accepted decision itself. Keep the stable identity, possible lost acknowledgement, and distinction between replay and a genuinely new operation as visible facts; ask the learner to infer the appropriate boundary instead of stating the same-ID handling rule in the stem.

### F2 — A new shortest-correct cue replaces the earlier longest-correct cue

Every accepted option is the **shortest** option in its item (18/18). In each set, the correct choice is a compact direct instruction; the three distractors are longer, parallel templates that append a consequence (“risking … twice,” “suppressing …,” or “without checking …”). For instance, i014’s accepted choice is a short same-ID result lookup, while each wrong option names the consequence of a fresh-ID retry, resource-level dedupe, or treating a lost acknowledgement as rejection. This repeated form makes the key recognizable without assessing the retry boundary.

The count is descriptive evidence of a unit-wide cue, not a length quota. Revise the complete competing policies or tighten the key naturally so that plausible alternatives test distinct case-local misconceptions without making the accepted answer consistently more concise. Do not equalize word counts or pad choices.

## Reused prior findings and supported boundary

The v1 review established the SAME_ID decision for all18 objects and identified the prior first-and-longest cue. The current proposal keeps those IDs and accepted meanings. Correct answers are now last in their option arrays, and the app’s order correction is independently accepted; this review does not treat source array position as a current renderer defect. The remaining shortest-correct pattern is a separate content-form concern.

i014 remains supported: the prompt says the same invoice issue ID must return the same accepted/rejected outcome without charging twice. Its answer reuses the recorded result for that issue ID. This does not establish that an identifier alone guarantees external exactly-once delivery; no such claim is made here.

## Per-item identity review

All18 items were compared as whole objects against their manifest before objects. Each retains its prior accepted option ID `owner_preserves_contract` and SAME_ID question identity. The concrete repeated-prompt and shortest-choice findings apply across all18 IDs; per-item fingerprints, positions, answer IDs and score checks are recorded in `INDEPENDENT-CHECK-N08-B08-B09-v3.json`.

This scoped review is not acceptance of other units, the complete N08/N09 cohort, source activation, candidate admission, native/Premium coverage or full BIZQ-01.
