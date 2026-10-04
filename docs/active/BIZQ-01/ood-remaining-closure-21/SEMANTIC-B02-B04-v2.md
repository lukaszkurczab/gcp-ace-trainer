# Independent semantic review — N05 B02–B04 v2

**Verdict: PASS for these 51 proposal objects only.** The frozen v2 inputs address the two whole-object findings from v1. The remaining 49 objects are byte-for-byte-equivalent parsed whole questions to those already reviewed in v1; the root’s exact-delta receipt independently records 16 unchanged B02 items, 16 unchanged B03 items, and 17 unchanged B04 items.

Frozen inputs:

- `review-inputs/N05-B02-v2.json` — `f55212aa6ea4f2514eed7c413f4e3d7f4c4c2960fd13b7097332c4902d5fca41`
- `review-inputs/N05-B03-v2.json` — `2b66e8ff0fd2d1bc395896786e1942b38017724c50ea809fef1eb5ef5aa8eaf0`
- B04 remains `review-inputs/N05-B04-v1.json` — `ce1142d8594b1505b51db0b3fd7e64d920bfeeae276f1bec3da78c10bd65ed48`

The review used the same item-level scope and fingerprint method as [`SEMANTIC-B02-B04-v1.md`](SEMANTIC-B02-B04-v1.md): compact insertion-order `JSON.stringify` whole-item hashes, not production `canonicalJson` hashes. The exact delta receipt is `ROOT-B02-B03-CORRECTION-BINDINGS.json`; it binds only B02 i010 and B03 i017 as changed.

B02 i010 now makes the competing approach unambiguously invalid: the option says to combine independently checked plans at dispatch **without checking their combined total**. Its diagnostic identifies the missing aggregate check, while the keyed choice validates the assembled total before dispatch. The prompt states positivity, sum, and pre-dispatch timing, so only the keyed construction satisfies the visible contract.

B03 i017 now explicitly copies mutable match slots, shares the immutable rule-set, and creates a fresh tournament identity with no results. The key, Reason, and all five Details fields agree with the stem’s required reuse semantics and the purpose of copying.

I therefore accept the current primary-decision meaning and preserve each existing question ID across B02–B04. Repeated examples within the named mental units remain practice of their stated pattern decisions; this review does not impose a unique-vignette quota. It does not replace the final cross-unit comparison against all accepted N01–N04 controls, and it grants no source, producer, runtime/native, eligibility, or full BIZQ-01 acceptance.
