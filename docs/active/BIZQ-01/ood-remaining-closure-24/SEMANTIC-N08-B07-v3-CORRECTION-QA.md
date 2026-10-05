# Independent correction review: N08-B07 v3

**Verdict: PASS.** The v3 rewrite replaces weak single-failure distractors with complete competing resource-lifetime policies and aligns each changed diagnostic to its exact option. The cohort form cue is materially reduced; I found no remaining item-level ambiguity.

## Frozen bindings and checks

- Current frozen proposal: `review-inputs/N08-B07-v3.json`, SHA-256 `0b1a94aa9b8f8eb81d1c270ff8a63dd585a6c85700f5c968a2509ae2920610a6`.
- Matching author proposal SHA-256: `0b1a94aa9b8f8eb81d1c270ff8a63dd585a6c85700f5c968a2509ae2920610a6`.
- Prior v2 review: `SEMANTIC-N08-B07-v2-QA.json` (`3ae5635dcd5b7bb675d25beaefe81b2542e0f88f4d3247cbbfc4cbe8b72a450c`); Markdown `SEMANTIC-N08-B07-v2-QA.md` (`cef7e835ceaa6e7eee6de588350111b350470ad7d0d65de3ec23dc7b7bad2654`).
- Manifest SHA-256: `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`; contract SHA-256: `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`; canonical quality spec SHA-256: `c10ce086ecd3b58d7d776a458cb453d0161ac4519ca2474deba952122ceac8a3`.
- Whole-object hashes use repository `canonicalJson` and SHA-256; answer selected by `answer.optionId`.
- Independent production-contract check: 18/18 valid; 18/18 accepted answers score correct; all 54 distractors score incorrect; 18/18 accepted answers remain correct after reversing option order; all feedback target sets match the current wrong-option IDs.

## Correction review

The actual v3 frozen input differs from v2 in 12 of 18 whole objects (ood-n08-b07-i001, ood-n08-b07-i003, ood-n08-b07-i007, ood-n08-b07-i008, ood-n08-b07-i009, ood-n08-b07-i010, ood-n08-b07-i011, ood-n08-b07-i013, ood-n08-b07-i014, ood-n08-b07-i015, ood-n08-b07-i017, ood-n08-b07-i018). I independently inspected each changed prompt/key/alternative/targeted message and reused the v2 whole-object conclusion only for the 6 objects that are byte-semantically unchanged. All question IDs and accepted option IDs remain SAME_ID because the accepted operation-owned cleanup/cancellation decisions are retained. New distractor IDs in v3 identify rewritten wrong-option meanings.

The v3 alternative rewrites now describe complete competing policies: delegating cleanup after failure (i001), reusing an attempt-owned stream across retry (i003), caching a denied operation’s hold (i007), handing off a failed command’s session (i008), returning the scan-owned cursor to clients (i009), retaining export resources after cancel (i010), deferring timer cleanup until after return (i011), exposing one child while the other vendor check retries (i013), transferring a consumed token to a screen (i014), retaining shared streams between builds (i015), deferring conflict cleanup to a background job (i017), and returning a stream while its operation is still reading (i018). In each case, the revised target message names the prompt’s relevant ownership, cancellation, or commit fact.

### Form-cue disposition

The prior v2 cohort finding was a repeated complete-key versus isolated-error distractor structure. The v3 correction makes several distractors full policies; some now exceed the key in length. Strict-longest counts are ${strictLongest}/18, recorded only as a diagnostic. The current mix does not support the previous systematic-form-cue blocker, and I did not apply an equal-length or minimum-choice rule.

## Item bindings

| Question | Disposition | Before → current canonical SHA-256 |
|---|---|---|
| ood-n08-b07-i001 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `8c6a962e7a86917552963151b42633e0737dd208599e3e7df8008bbae3b290e5` → `12c3eb98b5e7732179921d68ffecec32930baa33f3e750a96ab44d0e44ec7140` |
| ood-n08-b07-i002 | PASS; REUSED_MATCHING_V2_WHOLE_OBJECT_REVIEW | `b79fc5bc85b5e523c8f2fc710b088ee84a1d53e91f62cc6cf6775e5d9636baac` → `6b3c090cae3f09644f2d265e7050d42514cd6ed700640935618c00a57d06123f` |
| ood-n08-b07-i003 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `302e67efc1e44fcdf850280071601b2380247230b07516eb2502fa7958529689` → `2dea0f0b44e593ce6a86975d110a3ca643db1c2db426f4590163552cd0b4bd33` |
| ood-n08-b07-i004 | PASS; REUSED_MATCHING_V2_WHOLE_OBJECT_REVIEW | `42cbe94153a3133f45c504d072cc303d8d0c3ff9c11abc0da2ebd5acef9b7566` → `a6d1b96ced8985225e0902dbb222db6b3a30fdeb34325846ee9e0d0fc5fa7cfd` |
| ood-n08-b07-i005 | PASS; REUSED_MATCHING_V2_WHOLE_OBJECT_REVIEW | `71896033a66c538b5090c6cb1045891b1bf5ac24e0a2060b94f03d3737c40dfe` → `64558b5291b59d10aadd3db53f6897ab2b289ad106999422adf5a047e1e3b422` |
| ood-n08-b07-i006 | PASS; REUSED_MATCHING_V2_WHOLE_OBJECT_REVIEW | `7d6fceddf6e1e9f63ca3902b4750ef93d879e4d302da5829f4d943cc2bbe8f8f` → `247c541b46e1040e8647465e4922306480a57287f5cfdce9634a39b10da3635c` |
| ood-n08-b07-i007 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `dc2f5ae26fcef27ed24ab5fd50bda6ee807b00b76d8affc191ffba2c6a5894bd` → `ea4e71cc2ebeffe872190a4e5ba37f8ce0c92c161066ca778f63f7180caced0b` |
| ood-n08-b07-i008 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `df89db585da9efd2ecb0a9251d256ac22588be525f33ca717ce1587fdfd4fb38` → `6d42bb03100ca5e86b49df617fdc01567f06d5702c5c9d110ae49bf9f0352a69` |
| ood-n08-b07-i009 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `bad1311ef3547073845c63b03312e7fd68006d7a9acc2fe7d0d6e2fe76736b96` → `db6a1bd067dcde1bf99042096be72f7425b2681e4ff556c6ba2c7d8bafe71794` |
| ood-n08-b07-i010 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `a089cd523f72a12099afb479d1d35033c92c3523bb9fa3a94ae79e651918750a` → `4d30c457793c0b409c19006e24a824d9b1c8bd8e19dc47ffb5219078188ba9c1` |
| ood-n08-b07-i011 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `1b23703869b0c5a3ed9f5d5122c5c0ac89102074e5c262722893d00d9b5b5485` → `1c5963f3d4fd89bc46fa2b70c1c5dbb6640575b89ab319bebafcdc0ab1e756e7` |
| ood-n08-b07-i012 | PASS; REUSED_MATCHING_V2_WHOLE_OBJECT_REVIEW | `9be4bdddcb54fee203a8ef8c18e80e30f69e273d083dda2d2d34a1a331cfad08` → `f3a437d6ba6a40aeb92d1f3f96d2133890d7b25e8fbc00d0940e238e846bbeb0` |
| ood-n08-b07-i013 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `3228d0881debc56431df987475bb6a5a7e038546be4e880f19b82c55e4888a78` → `5726189b6110451cd2bbd4e4b987aa6ce9ff334f46989a893b0999eb669bb228` |
| ood-n08-b07-i014 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `2747cc9d035f4e2623d8c6692bc2b00152519a12244e6534f610e9225cd74486` → `f7bbba58efde2735ee9a46d4bd846cfa57fa28fc671e31905b24c3c5f8e62bae` |
| ood-n08-b07-i015 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `0a57f558c741e5d56fa84b94495c7a3467752c19edda20e621b58a8e7d03dc82` → `3109c441baccaa771d687cea9d2a2c57a72039dfc739e17e1f641df451b40825` |
| ood-n08-b07-i016 | PASS; REUSED_MATCHING_V2_WHOLE_OBJECT_REVIEW | `4a7e408111107add7c3bbde4055d1de5b2ad0879d278548f11b3bc91bfe637f0` → `7cce43dc4a59b8740d9e155c351aab40033ad5000c72f023dc464248ff5cf25a` |
| ood-n08-b07-i017 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `cfa826654008b99311178f8792d006caf1169cf113bd5b229481474011be1608` → `30b34f30b10000724798fa7fdaa189a5225e3ec8ca819b9d94cf0e254266a007` |
| ood-n08-b07-i018 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `73511f6b1913217414cad13d0d1924f3ab642898eff0de01dc82356d18650ab6` → `7e6569211f73b7879ef60f2a030d0268a1018a7484f4d9ca677a70afbd5bc206` |

This report accepts only the bounded semantic/identity correction review for N08-B07 v3. It does not accept other units, the whole 324-item package, producer/source activation, runtime/admission, native/Premium, or full BIZQ-01.
