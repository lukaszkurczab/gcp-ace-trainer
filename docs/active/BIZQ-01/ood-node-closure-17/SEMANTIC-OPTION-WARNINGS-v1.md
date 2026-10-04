# Independent review of option-length warnings

**Verdict: REVISE the answer-shape pattern in B02 and B05 before treating the style warning as resolved.** This is a bounded follow-up to the prior semantic reviews, not a replay of all 95 questions. I read the visible prompts and all answer alternatives for the exact frozen inputs below, comparing whether the extra correct-option wording expresses indispensable decision content or repeatedly packages every favorable condition into the only comprehensive choice.

| Unit | Frozen input | SHA-256 | Warning observed |
|---|---|---|---|
| B01 | `REVIEWED-B01-v3.json` | `9ce1b243551a97356bcab6ae093df0a463dc2f9e978d96456329b555e8efff58` | 5 of 19 keyed answers sole longest |
| B02 | `REVIEWED-B02-v3.json` | `7dc905a9e5e34cc5bbad7d14e17c1a11b1fdedb1ac7ac02d6b9f1b6d34a9a22e` | 13 of 19 keyed answers sole longest |
| B03 | `REVIEWED-B03-v4.json` | `1e2ffd502acc9ee098e51c80633151ec2b9009590455b2726701a733c97fe795` | 3 of 19 keyed answers sole longest |
| B04 | `REVIEWED-B04-v3.json` | `61b729c8d159391deef0a1d0cebd17b3e19e5ee339fde49c9a586d579819fd33` | 0 of 19 keyed answers sole longest |
| B05 | `REVIEWED-B05-v5.json` | `359e1db813e0e1b3438957bc401a3b742d7242af3cc522c9571f373234d0f3d3` | 10 of 19 keyed answers sole longest |

The reported counts are advisory evidence, not cutoffs. The issue is not that a correct choice needs to be as short as each distractor, and I do not propose a word-count rule. The B02/B05 pattern is material because many keyed choices uniquely enumerate the complete safe behavior or restate multiple prompt facts, while wrong options each describe a single omission or failure. A test taker can repeatedly favor the most comprehensive answer without distinguishing the particular invariant being assessed. This conflicts with the existing requirement to remove systematic answer-length cues and is supported by actual option construction, not just the counts.

## B02

The concentration is strong enough to remain a cue across this unit. For example, i023’s key is 23 words: “Apply an acceptance only when its proposal ID matches the currently pending proposal; otherwise record it as stale and leave current state unchanged.” The alternatives are 17 and 16 words and present the two opposite errors. The prompt already supplies the matching-ID/stale-response contract; the key can state the decision without repeating the full rule and every consequence. Similarly, i022’s 18-word key combines the Closing state, retry permission, and the later completion condition, while both alternatives are shorter failure actions. Those clauses are substantively correct, but the answer can express the same decision more compactly (for example, “Keep it Closing and retryable; close only after the complete export is confirmed.”).

The same construction recurs in the majority of B02: the key often restates the goal plus preserved state or all-or-nothing consequence, while the alternatives state one direct error. Some close lengths are incidental—i026/i027 are nearly tied—and some distinctions are necessary, such as recording late submission with its pinned revisions. Those items do not independently establish a cue. The repeated comprehensive-key pattern does.

## B05

B05 has a similar but less concentrated pattern. The key is sole longest in 10 of 19 items. The clearest examples are i032 and i034. At i032 the 19-word key enumerates the complete rule set, cross-entry validation, immutable replacement, and coherent-only publication; its longest distractor is 16 words. A compact choice can preserve the tested rule (“Validate the full set for cross-entry conflicts; publish an immutable replacement only if coherent.”). At i034 the 20-word key lists destination, attendee count, capacity, cancellation policy, and captured review state, while the next-longest choice is 16 words. The four data fields are relevant, but a compact formulation (“Review the immutable proposal with its captured destination, attendees, capacity, and cancellation policy.”) preserves them without making comprehensiveness itself the visual tell.

Several other B05 items are tied or have a distractor longer than the key (i020, i022, i024, i025, i028, i030, i033, and i037), which is useful counterevidence against a universal pattern. Yet half the keys are still uniquely longest, and the longer correct choices regularly contain more of the prompt’s favorable terms. The existence of legitimate detailed answers does not require retaining that repeated form. A few targeted rewrites of keys or plausible distractors can remove the obvious “complete answer” shape while keeping the distinctions and all required facts.

## Reused evidence and limits

B01, B03, and B04 have much lower advisory counts, and I found no parallel unit-wide longest-choice construction in this check. The previously reviewed semantic conclusions for all five units remain otherwise unchanged. This report does not impose equal lengths, a numeric pass rate, or a unique-prose requirement, and does not reopen answer correctness, source grounding, or cross-unit distinctness. It addresses only the remaining answer-shape cue in B02 and B05 under the existing quality criterion.

**Minimum correction:** revise the repeated comprehensive-key shape in B02 and B05 using the concrete examples above, retaining each key’s actual invariant and plausible competing misconceptions. Then recount and visually recheck the affected unit options; accept based on whether the systematic cue is gone, not a target count.
