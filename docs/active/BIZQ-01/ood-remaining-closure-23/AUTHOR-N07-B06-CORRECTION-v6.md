# N07-B06 correction v6

Ready for independent bounded re-review; not semantic acceptance.

- Proposal SHA-256: `5eafc6852700e0efd4a14e6419146ead10314a261c067fd575e581a977a76cfd`
- Frozen v5 input SHA-256: `495d6b144b2ad2d682b11d3fb771c108707026519456031982b8f9eb6e1d1136`
- Existing checker: PASS, 18 questions and 90 original/reversed option evaluations.
- Serialized diff: 36 Details fields changed (two per question) and 22 diagnostic messages across 10 questions. No prompt, constraint, option, key, QID, answer ID, Reason, other Details field, or source reference changed.

The mechanism and application Details now add information beyond the two Reason sentences. The listed wrong-option messages were checked by joining each actual stored message target ID to the option with that same ID. The v5 review’s Markdown says 11 affected questions while its JSON summary and exact per-item findings yield 10; this correction follows the actual listed target IDs and records the changed IDs below rather than adopting either count as a requirement.

| Question | Changed wrong-option targets |
|---|---|
| ood-n07-b06-i003 | n07_b06_i003_wrong_1 |
| ood-n07-b06-i008 | n07_b06_i008_wrong_2, n07_b06_i008_wrong_3 |
| ood-n07-b06-i009 | n07_b06_i009_wrong_2, n07_b06_i009_wrong_3 |
| ood-n07-b06-i010 | n07_b06_i010_wrong_2, n07_b06_i010_wrong_3, n07_b06_i010_wrong_4 |
| ood-n07-b06-i012 | n07_b06_i012_wrong_3, n07_b06_i012_wrong_4 |
| ood-n07-b06-i013 | n07_b06_i013_wrong_2, n07_b06_i013_wrong_3 |
| ood-n07-b06-i015 | n07_b06_i015_wrong_2, n07_b06_i015_wrong_3 |
| ood-n07-b06-i016 | n07_b06_i016_wrong_3, n07_b06_i016_wrong_4 |
| ood-n07-b06-i017 | n07_b06_i017_wrong_2, n07_b06_i017_wrong_3, n07_b06_i017_wrong_4 |
| ood-n07-b06-i018 | n07_b06_i018_wrong_2, n07_b06_i018_wrong_3, n07_b06_i018_wrong_4 |

The mechanical check does not establish semantic correctness. No proposal fields outside the assigned feedback fields, and no source, producer, catalog, proof, consumer, runtime, queue, or admission files were changed.
