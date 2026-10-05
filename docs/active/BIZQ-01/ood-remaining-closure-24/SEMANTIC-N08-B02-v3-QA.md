# Independent semantic review: N08-B02 v3

**Verdict: REVISE.** I reviewed all 18 current questions against the exact before objects in the frozen manifest. The current questions retain the same primary coordination/ownership intent and accepted option ID, so all 18 `questionId` and accepted-option-ID mappings remain justified. The v3 text is materially more concrete and the prior long-key concern is not a reason to reject it. Three distractors, however, remain compatible with the prompt as written, so their accepted keys are not demonstrably unique.

## Bound inputs and method

- Current proposal: `proposals/N08-B02-v3.json`, SHA-256 `de9bb542883a708eb7f64cc5c2eabdf4dbe1ccd3c4a052a952cfd69753b0f7c7`.
- Frozen manifest: `N08-N09-MANIFEST.json`, SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`.
- Contract: `N08-N09-CONTRACT.json`, SHA-256 `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`.
- Before source path: `patternly-content/content/object-oriented-design-interview/concurrency_thread_safety_resources_and_failure_handling/OOD-N08-B02.json`; actual SHA-256 `1db1cf0b1c16746d2899fadd9dd2afdfb2d40e3fc945e220a79404b0883efba8`, matching the manifest.
- Previous independent reviews consulted: `SEMANTIC-N08-B02-v1-QA` and `SEMANTIC-N08-B02-v2-QA`; v3 itself was assessed from its current serialized objects, not accepted by inheriting those verdicts.
- Whole-object fingerprints below use the repository `canonicalJson` and `sha256` exports. Answers are resolved by `answer.optionId`, not option position.

I read each before/current prompt, constraints, all options, answer, Reason, all five Details fields, and all option-targeted messages. I also ran the content repository's actual `validateQuestion` and `scoreQuestion` functions. All 18 candidates validate; each keyed response scores correct, all 54 wrong-option responses score incorrect, all 18 keys still score correct when options are reversed, and each wrong-option message targets exactly one current distractor ID. These checks confirm schema and ID wiring, not semantic uniqueness.

## Blocking findings

### N08-B02-01 — Inspection copy is not excluded by the prompt (i011)

The prompt says a refund reviewer may read the inspection record and must not change the inspection facts. The distractor `Copy the inspection into a refund-specific subtype for review` can satisfy both statements while leaving the submitted inspection unchanged. It may be a weaker or more coupled design, but the prompt does not require the reviewer to use the exact same record identity or prohibit a read-only copy. The feedback's assertion that review must use the accepted record “rather than a different record type” therefore introduces an unstated boundary. Under §4.1, this leaves more than one defensible answer. State the identity/representation requirement if it is part of the case, or replace the distractor with an option that actually changes the submitted findings.

### N08-B02-02 — Global notification queue adds an unstated independence requirement (i013)

The prompt requires accepted comments to retain their author and document revision despite delayed or retried notification. `Queue comment and notification work for every document together` could preserve those values; the prompt does not require independent documents to notify concurrently. The feedback that unrelated documents “need not share a queue” is an optimization preference, not a stated correctness condition. State the needed independent-progress fact or replace this option with a contract-violating way to resolve author/revision at send time.

### N08-B02-03 — Global invoice queue is not shown to violate the contract (i015)

The prompt requires each issued invoice copy to retain its submitted values and each exchange result to attach to the matching copy. `Queue every seller’s invoice exchange until all responses return` could serialize work while preserving those associations. Nothing in the prompt requires other sellers to proceed during a delayed response. The corresponding feedback rejects the option based on independent sellers, a missing requirement. Add that concrete progress requirement only if it belongs to the intended case; otherwise use a distractor that can be ruled out by the existing value/result association.

These findings concern one-best-answer support, not answer length, option count, source option order, or a new performance rule. Several other prompts explicitly say unrelated orders, rooms, maps, or users must continue; the review does not infer that constraint for i011, i013, or i015 where it is absent.

## Item-level identity and disposition

The JSON report records all 18 before/current canonical fingerprints, before/current question IDs and answer IDs, accepted decision text, and per-item disposition. Identity is `SAME_ID` for all 18: the cases continue to test locating the coordination boundary that owns the stated ordering, compound state, immutable transfer, or independent-work constraint. The three findings are confined to one-best-answer support at i011, i013, and i015; no replacement ID is warranted from this review.

This is only the bounded N08-B02 content review. Source activation, the N08/N09 cohort, presenter option order, producer/history, native/Premium, and full BIZQ-01 are outside this verdict.
