# N07-B08 v5 identity correction

Changed only the 18 questionIds from the original i001–i018 IDs to the corresponding manifest-reserved i019–i036 IDs, as bound by the independent content review and root identity check.

- Frozen input: `be7d5acfc2e2ccfa469ad6a70764572842bc873626e29414afd2f107f037bc2b`
- Current proposal: `7063afa97f8bb5cf004042d7b32b847610da80417a7864aacf52b5ad4073a9a2`
- Parsed-object leaves changed: 18.
- Mechanical check: **PASS**, 18 objects and 90 original/reversed option score cases. This confirms schema, score, and target bindings only; semantic review is independent.

The independent content review returned content PASS for all 18 items and the root binding maps every before ID to its corresponding unused reserved ID. This correction changes question identity only; no text, answer, option, or feedback field changed.
