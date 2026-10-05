# N08-B01 v4 correction review

**Verdict: PASS for this correction.** The v3 blocker was specific to i001: a per-device copy followed by a merge could surface the conflict and preserve the accepted route as written. v4 replaces that alternative with explicit last-write-wins behavior that discards the competing geometry. That directly violates the prompt and makes the keyed route-owner operation uniquely best. Its option feedback and `errorCorrection` now explain that exact failure.

The correction changes only i001’s third wrong option ID/text, its targeted message ID/text and `errorCorrection`; the prompt, key, accepted option ID, Reason, other Details and refs remain unchanged. The other 17 whole objects exactly match frozen v3. This preserves the item’s primary route-conflict decision and justifies keeping its existing question and accepted-option IDs.

## Bindings

- v3: `review-inputs/N08-B01-v3.json`, SHA-256 `d2672b21eca943d2c9896b3944bce485a2e339b66f5aaadcc71f1d8eb15f165d`.
- v4: `review-inputs/N08-B01-v4.json`, SHA-256 `5c6ed34d5ad4b6873febf875d1ff9fd5b48c7f6826872254370233e4c87b1503`.
- v4 author record: `AUTHOR-N08-B01-v4.json`, SHA-256 `0dac9f76be703f187ecf5defa594851b547f6cbeabfab2c463dc9475ce5c25cf`.
- Manifest: `N08-N09-MANIFEST.json`, SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`; contract: `N08-N09-CONTRACT.json`, SHA-256 `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`.
- Whole-object fingerprints are SHA-256 over repository `canonicalJson(question)`; answer choice resolved by `answer.optionId`. Before i001 SHA-256: `2dac73afc37e8bb4e8a36aeb8339f68f3094af2c07612fa50a7f699bc726a6ff`; v3: `7cff349a207c11481f1e4b05aed1a92624f9e8bf19d3eef59ff6f669c0654260`; v4: `96ee6ab41894893e5b3e8c6739a2484d81796bc6983821f617201cdcb0f0429c`.

This is only the bounded i001 correction. It does not accept the remaining N08/N09 units or the whole content/source/runtime/admission package.
