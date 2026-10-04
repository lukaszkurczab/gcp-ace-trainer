# Producer design review — package 20

**Verdict: PASS for the bounded producer design.** This review applies to the frozen `PRODUCER-BRIEFING.md` SHA-256 `9f38613a920ff823112f4bfcca692f497723212f55da8cf8ef626812063e4bf8`. It authorizes implementation within that proposal after the root records the design acceptance; it is not producer, consumer, runtime, native, release, or full-BIZQ acceptance.

The plan fits the requested N04 slice and the current proof architecture. It binds the nine current N04 sources and 162 semantically reviewed objects, then reconstructs the exact accepted 19a predecessor in memory before handing validation to the existing 19a→19→17→16→13→12→11 chain. The two identity classes are necessary and correctly separated: 144 true replacements affect current membership and semantic-map totals, while 18 same-ID object corrections restore the old whole objects for historical comparison without pretending they are ID mappings. Keeping the 25 existing Reason corrections in their existing chain avoids changing that contract.

The repository evidence supports this approach. `verify-migration.mjs` already has fixed version dispatch, exact proof schemas, historical row and projection checks, and a narrow private source-buffer exception used by the 19a/N03 path. The proposed v20 path can reconstruct N04 from the current parsed objects using the bound predecessor objects and exact compact JSON bytes, then call that existing validator. N04 is outside the three N03 paths accepted by the 19a private-buffer guard, so leaving that guard unchanged is the right boundary. The proposal also addresses the material same-ID hazard in `verifyMigration`: historical membership must substitute the 18 old objects before comparison, while current membership remains based only on the 144 new-ID replacements.

The fixed descriptor, literal source/version/question-set bindings, whole-object equality, raw source hashes, and predecessor row hashes provide a coherent closed proof. The direct same-ID historical regression case is important because current ID membership alone would not detect a stale historical projection. The proposed missing, extra, duplicated, reclassified, tampered, wrong-version, path, and symlink negatives address concrete proof-integrity and path risks. Retaining all earlier descriptors, evidence bytes, and generation-specific fixture expectations keeps the change additive and auditable.

One bounded integration detail should be included in implementation: `patternly-content/package.json` has an explicit `test:canonical` file list, currently ending at the cohort-19 test. Register the new package-20 focused test path once in that list. This is not a new gate; it makes the focused v20 tests part of the repository’s existing canonical test command. The brief already requires focused tests and the canonical checks, so this is a concrete wiring detail, not a reason to widen the design.

The plan is appropriately bounded: no schema, selector, runtime, entitlement, publication, or service changes; no generalized migration framework or public override; and no claim that source checks prove native behavior or close BIZQ-01. The stated downstream candidate, readiness, consumer, admission, provenance, and final-QA steps remain separate acceptance stages.

| Dimension | Score | Basis |
|---|---:|---|
| Objective and architecture fit | 0.96 | Completes the fixed N04 source slice while reusing the accepted historical chain and preserving current contracts. |
| Simplicity | 0.85 | Two explicit identity arrays handle a real semantic distinction without a new migration abstraction. |
| Risk | 0.85 | Exact source/object/history bindings plus direct same-ID restoration coverage address the principal integrity risk. |
| Maintainability | 0.83 | Adds one closed version branch and retains prior validators and private-path limits. |

Minimum: **0.83**. No design-level blocker found. Implementation must still demonstrate the stated actual source, history, negative-test, canonical, and build evidence; passing this review does not establish those results.
