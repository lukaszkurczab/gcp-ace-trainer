# Additive identity erratum: N08-B09 v3/v4

This erratum resolves a discrepancy between the v3 SAME_ID finding and the v4 whole-unit review. It preserves the original reports and proposals.

**Resolution:** v4 did not introduce the primary-decision shift relative to v3. The shift was already present in v3. The v3 report’s SAME_ID conclusion, including its i014 identity rationale in the earlier metadata erratum, treated shared retry/idempotency subject matter as unchanged primary decision. Direct comparison with the manifest before objects does not support that conclusion. The v4 review’s REVISE verdict remains, but its wording should be read as a before-to-current difference, not a new v3-to-v4 shift.

## Evidence

- Before/source manifest: `N08-N09-MANIFEST.json`, SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`; source bytes SHA-256 `093bdea05d1a2e9854c474025fea368aac46a1c70f57f4a8371c990f0461e15d`.
- Frozen v3 proposal: `review-inputs/N08-B09-v3.json`, SHA-256 `960bf89a2f3a3d8fa9a91b587957b7c0e452a2c77b476b116274b7955938a4cf`.
- Frozen v4 proposal: `review-inputs/N08-B09-v4.json`, SHA-256 `9e0251f2010279f88ca52d7e0e039dafae7f342ebd02152294c89662c973df71`.
- Contract: `N08-N09-CONTRACT.json`, SHA-256 `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`.
- The per-item canonical before/v3/v4 hashes and ID bindings are recorded in `SEMANTIC-N08-B09-IDENTITY-ERRATUM.json`.

The before i001 asks where to put the retry/idempotency invariant so the owner can enforce the passenger-visible effective-sequence rule. Its key places the retry key or idempotent transition at that object boundary. V3 already asks which retry identity to honor for a stable platform-change ID after a lost acknowledgement; its key replays that ID and keeps a later change distinct. V4 asks the same operation-ID scope question with reworded prompt/options. Therefore the archetype shift occurs between before and v3, not between v3 and v4.

For i014, the before asks where to enforce the invoice reissue invariant; v3 asks which stable issue ID to reuse after an uncertain acceptance; v4 asks how to reconcile that ID while keeping a corrected issue distinct. The supported retry/idempotency facet remains, and no exactly-once transport guarantee is asserted. That facet is a contract control, not proof that the primary decision and accepted meaning are unchanged.

The N08/N09 contract says to keep the question ID only when the primary decision and accepted meaning remain, and to use the corresponding reserved identity for a genuine change. On the evidence above, the identity assessment needs to be revisited for all18 objects; this erratum does not write the source map or impose a replacement count.

## Report relationship

The original `SEMANTIC-N08-B09-v3-QA.md` and `SEMANTIC-N08-B08-B09-v3-QA-ERRATUM.md` remain immutable historical inputs. This note corrects the v3 SAME_ID interpretation and clarifies the temporal scope of `SEMANTIC-N08-B09-v4-QA.md` (SHA-256 `8190de2ba9bef53d9add1cb65e10ef08c553a5f711619d6de376a54cce41f28c`). The v4 presentation findings are separate: it removes the v3 direct-answer leak and shortest-key cue.
