# N07 B05 v2 semantic review

**Verdict: REVISE.** Frozen input `review-inputs/N07-B05-v2.json` SHA-256 `0c836263bf7f0724099436beedae72fd57b3c2e301d21b313b5fbb50da635f6f`. V2 resolves the v1 identity and i003 premise findings, but i019 includes a second potentially valid compatibility design, so the answer is not yet unique.

## Scope and evidence

I reviewed all 18 current whole objects against the manifest before objects and the v1 semantic review. This included prompts, constraints, every answer resolved by `answer.optionId`, all options and targeted diagnostics, Reason, all five Details fields, source references, and question/option identities. The frozen mechanical receipt passes 18 objects and 90 original/reversed scoring cases; it does not establish semantic acceptance. Whole-object fingerprints use the producer’s `canonicalJson` encoding. Per-item hashes and changed paths are in [the JSON review](SEMANTIC-N07-B05-v2-QA.json).

The v1 identity finding is resolved: 16 materially changed primary decisions now use their matching reserved QIDs and new accepted-option IDs. i012 retains its exact immutable dataset/code provenance decision and i015 retains the immutable corrected-issue history decision, so those two QIDs and accepted option IDs remain valid. The v1 i003 concern is resolved by the visible statement that archived ProtoJSON/TextFormat records use `legacy_peak`, which supports reserving both its text name and binary tag.

## Blocking finding

**i019 does not yet have a uniquely supported answer (§4.1).** Its accepted option adds the memo at a fresh proto3 tag, preserving the stated empty-memo meaning when absent. The distractor `n07b05_i019_parallel_payout_type` proposes a versioned payout message routed through a compatibility adapter for older workers. The scenario requires old workers to continue settling records from the new service, but does not say they must consume the same message directly or exclude an adapter. An adapter could translate the new message for old workers and satisfy the stated absence semantics; thus the distractor describes another viable compatibility architecture. Replace it with a design that demonstrably fails the visible requirement, or explicitly constrain the task to an additive change in the existing message if that reflects the intended case.

## Option presentation and remaining items

The v1 systematic longest-key signal is substantially resolved. The correct answer is uniquely longest by JavaScript UTF-16 character length in 6 of 18 v2 questions; 12 have a longer or tied competitor. The six are spread across different mechanisms and their nearest choices are comparable in length and concrete. I found no cohort-wide form from which a learner can select the answer without understanding the serialization decision. This is qualitative, not a threshold, and I do not require equal lengths or a fixed choice count.

For the other 17 items, current choices and explanations align with visible protocol facts: presence distinguishes omitted from zero/empty, wire and JSON names are handled separately, historical enum/decoder compatibility is explicit, unknown fields remain on the same binary message object, ordered repeated values preserve duplicates, 64-bit JSON identifiers remain exact, signatures use an application-defined canonical projection, and immutable provenance/history references are retained. Wrong-option diagnostics identify their target misconceptions. I found no other hidden premise or stale diagnostic in the reviewed v2 objects.

| Before → current | Identity | Item assessment |
| --- | --- | --- |
| i001 → i019 | Replace with reserved i019; new accepted option ID | REVISE (adapter path may work) |
| i002 → i020 | Replace with reserved i020; new accepted option ID | PASS |
| i003 → i021 | Replace with reserved i021; new accepted option ID | PASS |
| i004 → i022 | Replace with reserved i022; new accepted option ID | PASS |
| i005 → i023 | Replace with reserved i023; new accepted option ID | PASS |
| i006 → i024 | Replace with reserved i024; new accepted option ID | PASS |
| i007 → i025 | Replace with reserved i025; new accepted option ID | PASS |
| i008 → i026 | Replace with reserved i026; new accepted option ID | PASS |
| i009 → i027 | Replace with reserved i027; new accepted option ID | PASS |
| i010 → i028 | Replace with reserved i028; new accepted option ID | PASS |
| i011 → i029 | Replace with reserved i029; new accepted option ID | PASS |
| i012 → i012 | Retain QID/key ID | PASS |
| i013 → i031 | Replace with reserved i031; new accepted option ID | PASS |
| i014 → i032 | Replace with reserved i032; new accepted option ID | PASS |
| i015 → i015 | Retain QID/key ID | PASS |
| i016 → i034 | Replace with reserved i034; new accepted option ID | PASS |
| i017 → i035 | Replace with reserved i035; new accepted option ID | PASS |
| i018 → i036 | Replace with reserved i036; new accepted option ID | PASS |

## Limits

This is proposal-level B05 review only. Resolve i019 before semantic acceptance. Final N07 cross-unit comparison against the other current units and accepted N01–N06 remains pending. No source, producer, consumer, admission, runtime, native, Premium, or full-BIZQ acceptance is claimed.
