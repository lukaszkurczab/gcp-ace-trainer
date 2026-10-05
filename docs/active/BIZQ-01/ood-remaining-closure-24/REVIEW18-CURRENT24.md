# Review18 sample reconciliation against source24

This reconciliation follows the original 216-item closure-review-18 sample to the actual current source24 objects and to fixed accepted replacement evidence. It does not estimate defect rates for the whole bank, repeat semantic review of unrelated items, or accept producer, runtime, admission, deployment, or full BIZQ-01 completion.

The reproducible helper is [reconcile-review18-n24.mjs](reconcile-review18-n24.mjs), run with Node 22:

```sh
/opt/homebrew/opt/node@22/bin/node patternly/docs/active/BIZQ-01/ood-remaining-closure-24/reconcile-review18-n24.mjs > patternly/docs/active/BIZQ-01/ood-remaining-closure-24/ROOT-REVIEW18-CURRENT24.json
```

It imports the repository's existing `validateTrack` and `canonicalJson` helpers. It validates all nine current source tracks, keeps full domain-enriched question objects, verifies all 18 N24 source files against the producer map, checks each N24 current object against the actual validated source, and checks the 1,413-item OOD question-set fingerprint. For OOD IDs replaced in accepted predecessor packages, it follows only explicit producer-map edges; it never infers a replacement from position or wording.

## Results

Of the 216 sampled historical objects, 79 prior PASS findings still bind to the exact current object fingerprint, and 119 historical findings still bind to the exact current object fingerprint. These are item-level historical matches, not fresh review of the full bank.

Five sampled IDs were replaced in accepted source packages. Four map through the fixed N19/N20 replacement proofs, and `ood-n07-b05-i003` maps to `ood-n07-b05-i021` through the N23 producer map. Their current target IDs and canonical whole-object fingerprints are recorded in the JSON with proof and semantic-package references. The retired sample finding is not transferred to the replacement.

Twelve same-ID objects match a later accepted producer map and semantic acceptance record. One additional historical finding is explicitly excluded: the old note on `ood-n08-b02-i015` concerns lazy/eager query loading, which does not describe the invoice-reissue/synchronization object. The current N24 object is linked to its own exact semantic review and acceptance. Together, these account for the other 13 changed sample objects.

The per-item JSON records the historical question ID, original fingerprint and verdict, current question ID and fingerprint, replacement lineage when applicable, disposition, and exact acceptance references. It binds the original sample and review reports, previous reconciliation receipts, N19/N20 migration proofs, N24 producer map and fixed proof, and N24 cross-unit review.

The helper also checks the accepted N19/N20 replacement targets against the exact committed source-file snapshots used by those predecessor packages. For N03-B02, it uses the later N19a checkpoint because that source file received the accepted reason-only amendment before N20; the predecessor object is checked against that exact snapshot. This is a source-lineage check, not transfer of the old sample verdict. The current source checkout is ahead of its Git HEAD during this preflight, so the helper reports both identities and does not treat HEAD as the current source snapshot.

## Exact bindings

- Original sample: `d2c083f3f3ac02fdaa38de725c717d31c88ad227365c30fb54bd121c16241ad4`
- N24 producer map: `dd444141610a8057053501ade6997323b833bb4d4e7fbd268cff4b896abf9892`
- Prepared fixed proof24: `3c2636ac2d98c7eb0179281bf3bb30aa89934e5a11846e79f69ba35d36e0c1c9`
- N24 cross-unit review: `877159e4a88953ec4a56e17e7a664aa6f840273e0579821ba8dc0537e0fec347`
- Current OOD question-set fingerprint: `c92a9f04488efb4ef7a5fa8b3257495c21e6c62125123df8073141c60000b2d8`
- Preserved 1,089-question fingerprint: `5e4e334f5acc89f44925c17926dddde2ebb55b6f11cee792c0dc89803da15377`
- Reconciliation helper SHA-256: `c5ec08cfa4e1cbf662561c0002d7205cc59733ee4611d8945e27491fa62f9254`
- Reconciliation output SHA-256: `63a1431942e06c75486431aa6bcdccf14dc5ae02251da6fbbdf667eb949292e5`

The output contains all 216 reconciled rows and the current raw-file, report, map, proof, checkpoint, and sample bindings: [ROOT-REVIEW18-CURRENT24.json](ROOT-REVIEW18-CURRENT24.json).
