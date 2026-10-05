# N09 B05–B07 v3 feedback correction

This revision starts from the frozen, independently reviewed v2 snapshots in `review-inputs/`, not the mutable proposal files. The first attempted edit was based on v1 bytes; it is retained as `AUTHOR-N09-B05-B07-v3-REJECTED-WRONG-BASELINE.json` and is not v3 evidence. The v3 proposal files are the explicit `proposals/N09-B05-v3.json`, `N09-B06-v3.json`, and `N09-B07-v3.json` snapshots.

Only the 25 listed `feedback.messages[].text` leaves changed: 16 across 11 B05 questions, 5 across 4 B06 questions, and 4 across 3 B07 questions. Prompts, constraints, options, answer IDs, question IDs, score fields, Details, Reason, source references, and all non-targeted messages match the frozen v2 objects exactly. Each revised message explains the concrete failure in its paired option using the case facts rather than echoing the option text.

The B06 v2 QA JSON has two target-ID typos: it names `n09b06_i009_boundary` and `n09b06_i011_boundary`, which do not exist in the paired question. The actual options/messages are `n09b06_i009_wrong_boundary` (draw plus a private timeout reason) and `n09b06_i011_wrong_boundary` (provenance only in an inaccessible private log). Those are the actual paired targets corrected here. The original QA remains immutable; this correction binding is recorded in the JSON notes.

The authoring script asserts the exact v2 SHA before applying edits. The check script compares each v3 object to v2 after restoring the original message texts, then runs the repository validator and scorer for the key, all distractors, and reversed option order. Results: 54/54 valid, 54/54 correct keys, 216/216 incorrect distractors, 54/54 reversed-order keys, 54/54 exact message-only objects, and 25 targeted message leaves.

| Unit | Frozen v2 SHA-256 | v3 proposal SHA-256 | Changed message leaves |
| --- | --- | --- | ---: |
| B05 | `bc2700a32341370d4bd177fc3d3f940718f21e26e9f112fb146e57ff9e020497` | `079132e8a69a8de0b58dce533c132c60032e5b2a9f1a1e522c08327f700259cc` | 16 |
| B06 | `8de7e8965b42bc3835282c716a6665617bb20551fc42f5589424c08021596052` | `c1b0d362bc233193eed1095190c2d5302a432b5a7578b9b7e6a0bd45abe52310` | 5 |
| B07 | `99d20efb139d9dafb9a57a2947ba1520f6df468991480863764b1330ec0b6f82` | `428676e548e3da6ef68e3bfa4530c36818b7650e5c5dd2f5ea9e9c577e872a8a` | 4 |

Detailed old/new messages and QA target bindings are in `AUTHOR-N09-B05-B07-v3-MESSAGE-CORRECTION.json`; reproducible commands are in the two adjacent `.mjs` files. This is an author correction pending independent bounded review, not semantic acceptance or source activation.
