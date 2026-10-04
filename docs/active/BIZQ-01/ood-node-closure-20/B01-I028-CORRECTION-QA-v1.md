# Independent B01-i028 correction review

**Verdict: PASS for the bounded correction.** Frozen input: `review-inputs/v6/OOD-N04-B01.json`, SHA-256 `ad156610a40fedb29d0bb14022703b15e19806ac3aaa7d26dfd4258e68c160c5`; notes wrapper SHA-256 `87b2eb869d68133659fc3d32b2e6de56bfe444370fac00c10a6374c2ec26c854`.

The corrected question now asks for a stable public request representing the search meaning—title words and optional date bounds—while the archive adapter translates that request to each index’s syntax and field names. Both present and replacement indexes support the same two criteria, so the decision is about hiding a changing representation behind a stable request contract.

This is distinct from accepted N04-B09-i029. That item asks how to expose a new hardware-signing operation that only some released providers can perform and that has no safe universal default; its answer is an opt-in capability interface. B01-i028 no longer asks whether to add such a subset-only capability. The revised four options, answer, Reason, Details, and targeted diagnostics all address request representation and adapter translation. The changed answer options use fresh IDs.

This accepts only `ood-n04-b01-i028`; the other 17 exact unchanged B01-v5 objects reuse their applicable prior reviews. It does not accept the full N04 cohort, source migration, runtime admission, native/Premium access, or full BIZQ-01.
