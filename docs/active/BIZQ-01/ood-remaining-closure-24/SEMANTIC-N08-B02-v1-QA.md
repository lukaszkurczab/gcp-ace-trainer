# Independent semantic review: N08-B02 v1

**Verdict: REVISE.** The visible facts support the keyed coordination decisions in these 18 cases, and retaining their question and accepted-option IDs is justified: each continues the original objective of selecting one synchronization/immutable-transfer boundary for the invariant or ordering at issue. The keyed choices need concise revision, however. In 16 of 18 items, the correct option is strictly longest and packs more implementation clauses than its shorter alternatives. This repeated presentation makes answer form a reliable shortcut under BIZQ-01 §4.3. Keep the supported policy but remove redundant implementation detail from the key; use concrete, decision-relevant alternatives, without padding or enforcing equal lengths.

## Frozen evidence and review method

- Proposal: `review-inputs/N08-B02-v1.json`, SHA-256 `bd6dd7da862836111d3f03d0655884b45a69635e8cd2af3eef8a919c3fb2dc1c`.
- Before/current manifest: `N08-N09-MANIFEST.json`, SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`.
- Frozen author notes: `AUTHOR-N08-B02-v1.json`, SHA-256 `18eb381d217550c828d831f1a726b07ccdd1db077a2d5f688db4b4d7963b179e`; Markdown SHA-256 `461c48ce11474b13ecff94b68b26efa3cadfac98bfe2f1a92c16c30d976f9709`.
- Source: `content/object-oriented-design-interview/concurrency_thread_safety_resources_and_failure_handling/OOD-N08-B02.json`, SHA-256 `1db1cf0b1c16746d2899fadd9dd2afdfb2d40e3fc945e220a79404b0883efba8`.
- Applicable requirements: BIZQ-01 §4.1–4.4 and §5C; canonical `docs/07-content-guidelines.md` §766. The contract calls for visible facts, one supported decision, plausible nearest alternatives and causal feedback. It allows fewer meaningful choices where current schema/scoring accepts them; it requires no fixed word or alternative count.
- I resolved accepted choices by `answer.optionId`. Per-item fingerprints use SHA-256 of repository `canonicalJson(question)` (recursively sorted object keys).

I read all 18 before and current objects: full prompts, accepted and wrong options, Reason, all Details fields, diagnostics, source references, and identity hypotheses. I did not infer semantic correctness from mechanical scoring.

## Meaning and identity

All 18 actions are **SAME_ID**. The before accepted choice, `owner_preserves_contract`, says to choose one synchronization owner or immutable-transfer model for a compound invariant. The current accepted choice applies that same primary decision to a concrete order, line, meter, stream, pair of assignments, revision, or immutable input. The objective remains the N08-B02 coordination/ownership decision; the added concrete conditions make the case-specific boundary testable rather than changing its archetype. The accepted option ID `owner_preserves_contract` retains that broad meaning. Current distractors have item-specific IDs and represent caller-stale state, overbroad/global coordination, or fragmented ownership.

| Item | Supported current decision | Identity | Canonical before → current fingerprint |
|---|---|---|---|
| i001 | Serialize settlement/release for one order; recheck settlement at the release write. | SAME_ID | `cb43dbea750d7c387e12b5c00ee47dc21672909237370267f28bdcb476b043c4` → `569a194adcf420baaff30db9aa6f97ddc9a185f8868136578fb9886ed21d67f5` |
| i002 | Queue each transit line by effective sequence, not delayed arrival. | SAME_ID | `54d4b2d96775ba9c2785c7b70b5629fda6876d506306a100abe128ff76578c14` → `98247352ee6b4a435e3f2eab78cc9a07d7c8de9980b6d1036c6ce3973a9eba5d` |
| i003 | Meter owner checks overlap and records the accepted reservation as one decision. | SAME_ID | `988e07da11b8ffcce8467cd4788cfdbead28cc38606cbef304f81abf06e28408` → `cd89b21d31bf42994a5d10d2bf4f3e5eb5d6cde5419818c0ca330d43420db1f8` |
| i004 | Immutable per-stream provider config; switch selects new config only for new streams. | SAME_ID | `b1ded229ef3b9a0b80088f80f93433998a360d57c260c9110a69b9f065bdf288` → `14b7ae81b37682c7e97116bc86abd479dde6ed69385711670bfcc0fe73292898` |
| i005 | Roster owner validates and commits both assignments together for one shift pair. | SAME_ID | `38f1ee516c9e4c16c44639366f15bdf53e95a3d94608d10d070088c09b55fe02` → `365625701b53f0d0239a84c695d4d95af26c5b66caa0862529e81ab0bfc50514` |
| i006 | Route owner compares submitted base revision with current accepted revision and returns conflict. | SAME_ID | `586dd7670797a7749ee5142049646e6ef753ae67480b2bb62ea3c2c8729b3550` → `4f3799716a4d266f68ac3d91005b48975b41369cf961c3905d424e388b28ee2d` |
| i007 | Campaign owner evaluates command against latest phase before recording transition. | SAME_ID | `17b2eb9b2adaab6ef27b73a24a8ffbf12adb7a38b75dd5834be23dea3a2546d9` → `1e7bf7223fda6851a17c2789d703aad8ef074e620e69b9860e654568300d6c30` |
| i008 | Transfer a versioned shipment record; activate new carrier only for accepted version. | SAME_ID | `6ff2076725c673d01fb7221d1ac5decb86b2c40b9d9691c00cd96646dddec8fb` → `c19ad72cb843d2241e7d28972850a46ec8c871564ac67a94c05a4aa20e3b35f4` |
| i009 | Account ledger coordinates balance check, allocation, and matching entry per account. | SAME_ID | `a58105beb738516976afdade292524395ef244fdef45c523f75eb41c2358ecd6` → `77e4b10dc26f8b2b974b46490f0303d1c49c84c4d5140ec5f6291a0bba2e3a32` |
| i010 | Match owner serializes result and accepts the first legal current-state transition. | SAME_ID | `1689f60d5aca566b74f280f7aa3a38761a392ccc3b63d6352621689a4a925cb3` → `b3630b278bdaa0a17058c979d1a57209ba80c27a670dc5b0dd63e307a4e2cc82` |
| i011 | Refund reviewer reads an immutable inspection revision and does not edit findings. | SAME_ID | `bf87be50b05f40d6ea027a7478548a95fd85e8aff2487c2f989cce8275111a13` → `5f147e1df35f3b202356b4343da0e66a38d248d3a9dbae0f76ef1376a39582bd` |
| i012 | Capture selected dataset/code revision in immutable publication input before job reads. | SAME_ID | `d8c0cb380bae1f24ec02e589940ced302ed1937d4c73f4a2640f7fb7e30ecf8e` → `bef242351389ee3f4d61c1dc68888f1a600848a688e1b538796a347e22f93e08` |
| i013 | Commit comment author/revision, then emit notification identifying the accepted record. | SAME_ID | `854cd9dc8313acda16dc55765aa4b0cf4c2331a0f1ec4a6592055351ed33e1db` → `4550ba6b392cb13b559544afce5bedf14c4187657246cec288705cdc85495f5a` |
| i014 | Bind completion/retry response to the frozen submitted revision; later edits stay separate. | SAME_ID | `ab4706a7bfade691c66c86e660874a02ae1630b92c80b524243d3969f8d78ae6` → `659ea7f62bd24f2431d594fc24549f0b4103ce2031597fb51b0a90a2d8fcddc9` |
| i015 | Immutable invoice revision gets its own exchange result; corrected issue remains separate. | SAME_ID | `2ba13008bd7a3672b83f09244173d6f57aebc926a1a24aa1639d7a195a8205c5` → `023149d741ec0373079dcb3bad2b6999fa43f167518a7faae602d2c328f2fd4b` |
| i016 | Grant decision compares checked badge revision against authority’s current revision. | SAME_ID | `ac94390d84ca51faf0a5903a18eff9e01068d5c26a290e8d3cc24c7842d3d540` → `20d77c399ee243c1b2da49ce5e9881939c5a829ebf1728e187dcb90f25b2eeff` |
| i017 | Each print job receives an immutable approved shipment revision. | SAME_ID | `21e4acfce6e2d6b8e89cf0f1799d0791533fba72643ccb920b18f3662ced353c` → `63e89d725470679e853af70880a4feeeb4ea9be13fec06a5bd75fb2535565109` |
| i018 | Room booking owner checks current overlap count and accepts one room-scoped reservation. | SAME_ID | `1841e1a266465b7bcf46d1c81cabce6a3f5281b0b2382f324168316b7a86357d` → `123a29e37abcaa6d12971ceb4be28b5cb28967301ab42d54055d150745c59a32` |

## Correction and observations

Shorten the correct options to the decision-critical boundary. Keep each stem’s decisive ordering, scope, and state facts visible; do not remove them just to shorten the key. Where a wrong option is a genuinely plausible strategy, preserve the misconception and explain why it fails here. No fixed option count or equal-length rule is part of this review.

The correct options are longest in 16/18; this is a style signal, not an automatic numerical gate. The evidence is the repeated construction: the key states an owner, action, boundary, and often a result, while alternatives often state only a single stale write or overbroad lock. One nearest alternative in each item is meaningful (for example, stale read-then-write for order release, check-then-insert for a meter window, or compensate after the first volunteer assignment). The pattern across the unit can still reward selecting the most complete-sounding answer instead of evaluating the boundary. Shorten redundant clauses and keep the meaningful contrasts.

The `mechanismOrProperty`, `transfer`, and much of `boundaryOrTradeoff` are reused across items. They accurately describe the common coordination objective; case-specific applications and error explanations preserve relevance. This is not a separate blocker. Several prompt starts have awkward capitalization (“In A …, A …”); that is optional copyediting.

This report does not accept other N08/N09 units, the whole324 map, producer/source/runtime/admission, native/Premium, or full BIZQ-01.
