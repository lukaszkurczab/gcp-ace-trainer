# Independent semantic review: N08-B02 v2

**Verdict: REVISE.** The v2 key-text correction resolves the v1 systematic verbosity issue: all 18 concise answers state the case-specific coordination boundary, and their underlying answer meanings and IDs remain supported. It also creates a repeated inverse length cue: in 16 items the accepted choice is shorter than every distractor. Separately, the frozen choices put the accepted answer first in every item. The current choice renderer preserves that array order, so a learner can select the first option throughout this cohort without using the scenario facts. The position cue conflicts with BIZQ-01 §4.2 and §D; the inverse length cue leaves answer form as a shortcut under §4.3. Neither finding requires equal-length choices or a fixed option count.

## Frozen inputs and method

- v2 proposal: `review-inputs/N08-B02-v2.json`, SHA-256 `b1cf5583d99cd754ee91fe159134d84cdc7a5012a1886ddfefb3fd1d8495d5d7`.
- Compared v1 proposal: `review-inputs/N08-B02-v1.json`, SHA-256 `bd6dd7da862836111d3f03d0655884b45a69635e8cd2af3eef8a919c3fb2dc1c`.
- v1 independent report: `SEMANTIC-N08-B02-v1-QA.md`, SHA-256 `2f9157144dc00d42d144d8dbb48b3ff1bffdaaa1c28d3bc28aa011524ebe2d83`; JSON SHA-256 `2c285a281b9c9fd5ce564f948320c8bdf58d815d34b39663e95870275cfcf2da`.
- v2 author notes: `AUTHOR-N08-B02-v2.json`, SHA-256 `674a19d033336406ea2aa660ec8c16806f3194c83f029483bfb296277d4f28a2`; Markdown SHA-256 `628915dc81823a03d6151fcd5aeae07943106ced45b4e54c4189039c19dacfb6`.
- Manifest: `N08-N09-MANIFEST.json`, SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`.
- Contract: `N08-N09-CONTRACT.json`, SHA-256 `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`.
- Requirements: BIZQ-01 §4.1–4.4 and §D, especially the prohibition on form cues and the requirement to prepare/persist mixed option order where the interaction permits it.

I compared the full v1/v2 objects and resolved answers by `answer.optionId`. The v2 delta is confined to each accepted option's text; prompts, correct IDs, distractors, Reason, Details, and diagnostics are unchanged. Per-object hashes below use SHA-256 of repository `canonicalJson(question)` (recursively sorted object keys). I also checked the current presentation path: it maps the received option list through to rendered controls without shuffling it. Thus the all-first answer position is visible, not merely a source-array observation.

## Meaning and identity

The v1 concern about the keyed choice being a long solution recipe is resolved. The concise replacements identify the deciding boundary and remain supported by the visible case facts: per-order settlement/release, line-effective sequencing, meter-scoped overlap acceptance, immutable per-stream provider configuration, paired roster commit, route-revision conflict, campaign phase owner, versioned shipment handoff, account allocation plus ledger entry, first legal match transition, immutable inspection revision, frozen publication inputs, accepted-comment identity, frozen submission completion, invoice-revision exchange result, current badge revision, immutable print input, and room-scoped capacity decision.

For every item, the accepted answer remains the same primary owner/ordering/confinement decision as v1. Reuse of the question ID and `owner_preserves_contract` is justified. The wrong-option feedback remains tied to the stable distractor IDs. I found no new hidden premise or key/Reason/Details contradiction in the changed text.

The revised presentation is still systematically signaled by form. In 16/18 items the accepted choice is strictly shorter than each of the three distractors (i009 and i016 are the exceptions); in all 18 it is shorter than at least one distractor. The alternatives often state a full flawed workflow while the accepted answer names a compact boundary. For example, i003's key is 59 characters while the shortest wrong answer is 88; i014's key is 68 while the shortest wrong answer is 97. These are supporting observations, not automatic thresholds. The repeated contrast can reward choosing the compact sentence instead of checking which boundary satisfies the visible invariant. Keep the keys concise, but make the competing choices comparably decision-specific and plausible rather than adding filler.

The independent position blocker is direct: all 18 accepted answers occupy index 0. The current presentation path preserves supplied order, and these single-choice coordination decisions have no order-dependent semantics. The first-position cue can therefore replace the old length cue as a way to answer without evaluating the facts. Follow §D by preparing a mixed order once for the session and persisting that occurrence order; scoring and feedback must continue to use option IDs.

| Item | Current accepted choice | Identity | v1 → v2 whole-object SHA-256 | Accepted option position |
|---|---|---|---|---:|
| i001 | Check settlement and serialize release for that order. | SAME_ID | `569a194adcf420baaff30db9aa6f97ddc9a185f8868136578fb9886ed21d67f5` → `dcb16964bbde6f35c3b7531a783f741b79a8304c72b82342d651177076c51e3c` | 0 |
| i002 | Apply each line's updates in effective-sequence order. | SAME_ID | `98247352ee6b4a435e3f2eab78cc9a07d7c8de9980b6d1036c6ce3973a9eba5d` → `6809a167ea6be2a06b73de95102242bf2aeeec093b83de6f7b93bc2ea97ac955` | 0 |
| i003 | Serialize each meter's overlap check and reservation write. | SAME_ID | `cd89b21d31bf42994a5d10d2bf4f3e5eb5d6cde5419818c0ca330d43420db1f8` → `0f4e3567dc7d62a947075a555265fad78c347e9156139f0da5fd77ad09b7b2a0` | 0 |
| i004 | Pin each stream to one immutable provider configuration; switch only new streams. | SAME_ID | `14b7ae81b37682c7e97116bc86abd479dde6ed69385711670bfcc0fe73292898` → `54dfdf1e4d58f3a16e43a0b9e394ff352134916dbf7acd90e0a2b10a1513f66e` | 0 |
| i005 | Validate and commit the two assignments together at the roster owner. | SAME_ID | `365625701b53f0d0239a84c695d4d95af26c5b66caa0862529e81ab0bfc50514` → `275a8297394ffd8a53205e2749030eb3edb3ab3f578b08d22f05e76b271b9326` | 0 |
| i006 | Reject proposals based on a superseded route revision. | SAME_ID | `4f3799716a4d266f68ac3d91005b48975b41369cf961c3905d424e388b28ee2d` → `f7da4a28923ad697d0dc7dc0ab196a3e3d75a9032e28bdf956c06afdf19ca91` | 0 |
| i007 | Evaluate campaign commands against the latest phase at the campaign owner. | SAME_ID | `1e7bf7223fda6851a17c2789d703aad8ef074e620e69b9860e654568300d6c30` → `b0b332bc1ac4e0a15734da8d43ad94fe50720c1f1987c514308b788f6e7395b` | 0 |
| i008 | Transfer one versioned shipment; activate its carrier only for the accepted version. | SAME_ID | `c19ad72cb843d2241e7d28972850a46ec8c871564ac67a94c05a4aa20e3b35f4` → `8df76252f5f349d670e3722df77f4aea2940b079984b5c754f9f883867724d6e` | 0 |
| i009 | Validate and commit the allocation with its matching ledger entry as one account operation. | SAME_ID | `77e4b10dc26f8b2b974b46490f0303d1c49c84c4d5140ec5f6291a0bba2e3a32` → `e933ed814d8dd58360162182831b5712bca36874036c665b179ddf43c21f41cb` | 0 |
| i010 | Accept only the first legal terminal transition at the match owner. | SAME_ID | `b3630b278bdaa0a17058c979d1a57209ba80c27a670dc5b0dd63e307a4e2cc82` → `7e54ec371dca227f78774eb3c6a2505dc91dc632aba03d92b813738bfebd3196` | 0 |
| i011 | Give refund review the accepted, immutable inspection revision. | SAME_ID | `5f147e1df35f3b202356b4343da0e66a38d248d3a9dbae0f76ef1376a39582bd` → `b14156fce45370803c7b683400c79c3508a84294b4bea2a6b858d0ef0f61b4d2` | 0 |
| i012 | Pin publication input to its selected dataset and code revisions. | SAME_ID | `bef242351389ee3f4d61c1dc68888f1a600848a688e1b538796a347e22f93e08` → `f23e3ee4f4eda5cea7f25e016966790ccd05206f2534cfd2587b40f8993234a8` | 0 |
| i013 | Notify using the accepted comment's stored author and revision. | SAME_ID | `4550ba6b392cb13b559544afce5bedf14c4187657246cec288705cdc85495f5a` → `774faf386d259638ad4126be3e732c385880aec5bcffc8b3a51389e359bec3b2` | 0 |
| i014 | Bind completion to the frozen submission; keep later edits separate. | SAME_ID | `659ea7f62bd24f2431d594fc24549f0b4103ce2031597fb51b0a90a2d8fcddc9` → `60796eb98dc3c52ca0c3c9e5720d67ea32ca8c9280e72fae18e7313db9ef8dd5` | 0 |
| i015 | Attach each exchange result to the submitted invoice revision. | SAME_ID | `023149d741ec0373079dcb3bad2b6999fa43f167518a7faae602d2c328f2fd4b` → `5edd9bc858f1aeef374523c7252920547d7194062780142558da6fa9f827000f` | 0 |
| i016 | Check the current badge revision at the grant decision. | SAME_ID | `20d77c399ee243c1b2da49ce5e9881939c5a829ebf1728e187dcb90f25b2eeff` → `79e62db7a7c10f614cfe525030f49acb712241cb38dbeaac79f7eeb6c83e4b22` | 0 |
| i017 | Give each print job an immutable approved shipment revision. | SAME_ID | `63e89d725470679e853af70880a4feeeb4ea9be13fec06a5bd75fb2535565109` → `87147169ee9f52dd4c6907d4ff81c111eeac98a621f1142a36373081dfc5d841` | 0 |
| i018 | Check overlap and accept each reservation in one room-scoped operation. | SAME_ID | `123a29e37abcaa6d12971ceb4be28b5cb28967301ab42d54055d150745c59a32` → `c165084b63a663163f87a11bd58827ca125627716edf901d3ab076cea5aa9f21` | 0 |

This is a bounded N08-B02 v2 semantic review. It resolves the v1 key-verbosity correction but does not accept the cohort's current position order, other N08/N09 units, the whole324 map, source/producer/runtime/admission, native/Premium, or full BIZQ-01.
