# N24 current migration-guard preflight

This probe used the existing `verifyMigration` API against an isolated fixture. It does not modify canonical content, the verifier, or the prepared N24 proof.

The fixture began as a copy of the current v23 `patternly-content/content` tree. It then replaced the 18 manifest-bound N08/N09 source arrays with the exact `currentQuestion` objects from `PREPARED-FIXED-PROOF24.json`, set the fixture catalog to v24, and copied the exact prepared proof plus the fixed predecessor evidence used by the existing N23 test setup. `validateTrack` accepted that fixture as the OOD v24 track with 1,413 questions and question-set hash `c92a9f04488efb4ef7a5fa8b3257495c21e6c62125123df8073141c60000b2d8`.

The current verifier then rejected it with `MigrationVerificationError`, code `EVIDENCE_VALUE`: `OOD contentVersion object-oriented-design-interview-authoring-v2026.10.05-bizq01-24 has a fixed semantic proof for a different version.` The check is in `patternly-content/scripts/content/verify-migration.mjs` at line 11758. This is the current v23 verifier’s fixed-version guard rejecting v24; the probe does not establish that the N24 proof is implementation-ready or accepted by a future branch.

The private fixture was removed in the script’s `finally` block. The machine-readable record contains the verifier/proof hashes and raw hashes for all 18 prepared source arrays. The command was run with Node 22.22.3:

```sh
PATH=/opt/homebrew/opt/node@22/bin:$PATH node patternly/docs/active/BIZQ-01/ood-remaining-closure-24/N24-PRODUCER-GUARD-PREFLIGHT.mjs
```

`node --check` passed for the probe script. The verifier was not edited, and no canonical source, catalog, proof, or migration guard was changed by this preflight.
