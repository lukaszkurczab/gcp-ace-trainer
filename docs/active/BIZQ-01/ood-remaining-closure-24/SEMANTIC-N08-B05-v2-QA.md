# Independent semantic review: N08-B05 v2

**Verdict: REVISE**, limited to `ood-n08-b05-i011.feedback.details.scenarioApplication`. The v2 option rewrite substantially improves competing-policy quality and removes the former cohort-wide longest-key cue as a material concern. The i011 prompt and key now state a coherent stable completion identity, but its scenario-application detail still teaches the rejected three-field identity.

## Frozen input and method

- Proposal snapshot: `review-inputs/N08-B05-v2.json`, SHA-256 `8958fb3508390873dcafadc02beabfbb33cbd1f8209c9fb2b3cae99ff3984a93`.
- Before objects and source binding: unit `OOD-N08-B05` in `N08-N09-MANIFEST.json`, SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`; source `content/object-oriented-design-interview/concurrency_thread_safety_resources_and_failure_handling/OOD-N08-B05.json`, SHA-256 `9ed4fbc42e1526372553053432cdb1b91de22a78b5547a20647f0571c6fa5910`.
- Contract: `N08-N09-CONTRACT.json`, SHA-256 `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`.
- Author notes are hypotheses; the v2 notes are bound in the companion JSON.
- Whole-object hashes below use SHA-256 of repository `canonicalJson(question)`; accepted answers are selected by `answer.optionId`.

I compared all 18 before/current question objects, including prompt, constraints, key, every alternative, targeted diagnostic, Reason, all five Details fields, references, question ID and accepted-option ID. The old key is resolved by its actual option ID rather than array position.

## Findings

### i011 has one contradictory teaching field

The current prompt says that learner and exercise revision identify a completion and that the score policy is stored on its record. The current key says to key by learner and exercise revision and store policy with the accepted score; the Reason correctly explains that a different policy for that same learner/revision is a conflicting retry. However, `feedback.details.scenarioApplication` still says “A completion key contains learner, exercise revision, and score policy.” A learner seeing the correction therefore receives the exact three-field identity that the key and other feedback reject. Correct that Details leaf to describe policy as stored accepted data, not part of the key. This is a causal feedback consistency defect under the existing explanation contract, not a new data-model requirement.

The primary question intent remains the N08-B05 collection-invariant decision: how a compound insert/retry rule is enforced where individual map calls are safe. Keep the question ID. The accepted option’s specific rule now resolves a clarified composite-identity decision, so the fresh `owner_preserves_contract_i011_v2` option ID is justified. The other 17 accepted IDs continue the same owner-enforced compound-update decision instantiated by their visible cases.

### Choice quality and the earlier form cue

The v1 failure was not just that the correct text was longer: it paired full atomic-update policies with partial, stale-read or after-the-fact alternatives across nearly every case. In v2, alternatives are rewritten into competing policies tied to each case (for example, distinct map calls versus a single conversation replacement; independent versus shared revision publication; a stale curator replace versus a revision-checked replace; and client-side overlap checks versus a conditional insert). The near alternative now usually tests the relevant collection boundary. The remaining options represent recognizable failure strategies rather than unrelated pattern-name distractors. I find no current system-wide elimination cue or §4.3 defect requiring another cohort rewrite.

Six correct options remain strictly longer than their longest distractor by raw character count, but that count alone is not a criterion. Those cases vary in gap, and the option texts state concrete operations and competing failure policies; I found no repeated size-only rule that overrides understanding. Source-array position is also not the presented order: the accepted runtime correction now supplies the persisted per-occurrence permutation before the practice UI. No extra source rotation or equal-length/option-count threshold is warranted.

The four shared source references do not establish fictional behavior; the prompts state the relevant collection contracts as scenario facts. I found no unsupported external guarantee in the keys. Grammar such as “In A …, The …” is an editorial polish opportunity, not a blocking semantic ambiguity.

## Per-item disposition

All current and predecessor whole-object hashes, identity actions, and concise answer assessments are in the companion JSON. The dispositions are: 17 question IDs remain SAME_ID with the accepted owner-enforced compound-update meaning; i011 remains the same primary collection-invariant objective with a fresh accepted option ID for the clarified stable identity rule. i011 is the sole REVISE item because of the contradictory Details sentence.

This is bounded N08-B05 v2 semantics and identity only. It does not accept the full N08/N09 set, producer/source activation, runtime or admission, native/Premium, or full BIZQ-01.
