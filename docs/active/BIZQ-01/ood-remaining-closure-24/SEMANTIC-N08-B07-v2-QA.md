# Independent semantic review: N08-B07 v2

**Verdict: REVISE for a remaining cohort-wide §4.3 answer-form cue.** The case-specific v2 rewrite is materially better than v1, and I found no per-item correctness, identity, or feedback blocker. In 14 of 18 objects, however, the key is still strictly longer than every distractor; across the set this accompanies a repeated full-policy-versus-single-error structure.

## Frozen inputs and method

- Proposal `review-inputs/N08-B07-v2.json`, SHA-256 `d656e287a7063d06aebf2dc42fc5f18ba4fba40d2cad08f96da06f75afab3318`.
- Manifest `N08-N09-MANIFEST.json`, SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`; before objects are from the B07 unit’s `beforeQuestion` snapshots.
- Contract `N08-N09-CONTRACT.json`, SHA-256 `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`.
- Canonical BIZQ-01 quality criteria, SHA-256 `c10ce086ecd3b58d7d776a458cb453d0161ac4519ca2474deba952122ceac8a3`.
- Whole-object hashes use repository `canonicalJson(question)` plus SHA-256. I resolve the accepted answer by `answer.optionId`; option array position is not the identity or scoring basis.
- I compared all 18 before/current prompts, constraints, keys, all alternatives, wrong-option targets/messages, Reason, Details fields and source references.

## Semantic and identity findings

Every case keeps the N08-B07 decision about assigning resource cleanup and ownership transfer to the operation whose lifetime owns that resource. The new examples make the condition concrete: dispose a panel subscription on close without deleting document comments; close the attempt stream before retry; close a response body after parsing even on error; release a hold on denial but transfer it on commit; roll back and close a failed validation transaction. Those are case-specific applications of the same accepted lifetime rule, not a changed primary answer. All 18 question IDs and accepted option IDs therefore remain SAME_ID.

The v2 wrong alternatives are more concrete than the generic v1 alternatives. They include recognizable but incorrect policies such as retaining a failed upload’s stream for retry, keeping a response body until payment, or transferring locks to a background job. The targeted messages refer to the current wrong-option IDs and explain why those policies fail under the visible facts. Reason/Details generally follow the prompt’s ownership boundary; I found no unsupported external guarantee. The repeated Details scaffolding and “In A …, A …” capitalization are editorial issues, not blockers.

## Blocking §4.3 form cue

The accepted text is strictly longer than every distractor on 14/18 questions under raw JavaScript string length (diagnostic only; there is no length threshold). More importantly, the repeated content shape is consistent: the key often combines ownership, cleanup, and transfer/publication, while wrong choices each isolate one failure. For example, i001’s key covers two resources and publication while wrong options separately leak the handle, expose early output, or use a global registry; i006’s key covers close after handoff plus removal on failure while alternatives separately expose an in-progress file, leave partial files, or share a mutable handle; i014’s key covers release on denial and transfer on commit while alternatives each break one boundary. A learner can favor a complete policy over the shorter isolated-error options without fully distinguishing the lifecycle boundary.

BIZQ-01 §4.3 asks for options with comparable specificity and removal of a systematic longest-correct cue, not equal word counts. The v2 edits improve realism but do not fully resolve this repeated completeness signal. A bounded correction can make some wrong choices complete competing lifecycle contracts, or tighten keys while preserving the stated obligations. Do not target a character count, add filler, or change identities just for variety.

- Strict-longest diagnostic item IDs: i002, i003, i004, i006, i009, i010, i011, i012, i013, i014, i015, i016, i017, i018.

The prior v1 report also noted the correct option appeared first in source arrays. That is not a finding here: source order is not presentation order after the separately reviewed persisted choice-order runtime correction. The remaining issue is the independent text-form cue.

## Per-item binding and disposition

| Item | Decision / identity | Before → current canonical SHA-256 |
|---|---|---|
| ood-n08-b07-i001 | PASS; QID SAME_ID; accepted option SAME_ID — The job owns and disposes both resources; publish only the completed result. | `8c6a962e7a86917552963151b42633e0737dd208599e3e7df8008bbae3b290e5` → `dac1ff05258bc620292499ca2ea2c4b056abf41e61a1876d68b40bb7c232ad31` |
| ood-n08-b07-i002 | PASS; QID SAME_ID; accepted option SAME_ID — The panel disposes its subscription on close; the document service retains comments. | `b79fc5bc85b5e523c8f2fc710b088ee84a1d53e91f62cc6cf6775e5d9636baac` → `6b3c090cae3f09644f2d265e7050d42514cd6ed700640935618c00a57d06123f` |
| ood-n08-b07-i003 | PASS; QID SAME_ID; accepted option SAME_ID — Each upload attempt owns its stream and closes it before a retry opens another. | `302e67efc1e44fcdf850280071601b2380247230b07516eb2502fa7958529689` → `2e770dd1e05a966b2bd4b0914684eec8b54fda48c1ad9c0da12762b51942909b` |
| ood-n08-b07-i004 | PASS; QID SAME_ID; accepted option SAME_ID — The invoice operation closes the body after parsing, whether parsing returns or throws. | `42cbe94153a3133f45c504d072cc303d8d0c3ff9c11abc0da2ebd5acef9b7566` → `a6d1b96ced8985225e0902dbb222db6b3a30fdeb34325846ee9e0d0fc5fa7cfd` |
| ood-n08-b07-i005 | PASS; QID SAME_ID; accepted option SAME_ID — Each door disposes its own subscription; the authority retains badge state. | `71896033a66c538b5090c6cb1045891b1bf5ac24e0a2060b94f03d3737c40dfe` → `64558b5291b59d10aadd3db53f6897ab2b289ad106999422adf5a047e1e3b422` |
| ood-n08-b07-i006 | PASS; QID SAME_ID; accepted option SAME_ID — The print attempt owns its file, closes it after handoff, and removes incomplete output on failure. | `7d6fceddf6e1e9f63ca3902b4750ef93d879e4d302da5829f4d943cc2bbe8f8f` → `247c541b46e1040e8647465e4922306480a57287f5cfdce9634a39b10da3635c` |
| ood-n08-b07-i007 | PASS; QID SAME_ID; accepted option SAME_ID — The move owns its temporary hold: release on denial/cancel, transfer on commit. | `dc2f5ae26fcef27ed24ab5fd50bda6ee807b00b76d8affc191ffba2c6a5894bd` → `21a012dc7e99a53f8297d860d591d73cb688bc37474bb06d19307dab4897da8c` |
| ood-n08-b07-i008 | PASS; QID SAME_ID; accepted option SAME_ID — The command closes its hardware session on exit; the controller keeps mode state. | `df89db585da9efd2ecb0a9251d256ac22588be525f33ca717ce1587fdfd4fb38` → `6961086bec69a7718b379982ca41b540c1de464aa05b9564694750c7efbb249c` |
| ood-n08-b07-i009 | PASS; QID SAME_ID; accepted option SAME_ID — The scan closes its cursor after reading; progress keeps its stable lesson identity. | `bad1311ef3547073845c63b03312e7fd68006d7a9acc2fe7d0d6e2fe76736b96` → `acd5855b75c45dd1cc465e0815452cfc1b544bc1080401119db03bc01d3fcce8` |
| ood-n08-b07-i010 | PASS; QID SAME_ID; accepted option SAME_ID — Export owns and closes its cursor and file; the live board remains open. | `a089cd523f72a12099afb479d1d35033c92c3523bb9fa3a94ae79e651918750a` → `44d8f6358eb66dc3f0f1a46eaf3cc6b227375731b15a9f91453ae710c77d1117` |
| ood-n08-b07-i011 | PASS; QID SAME_ID; accepted option SAME_ID — The escalation cancels its timer on exit and returns the result for that conversation. | `1b23703869b0c5a3ed9f5d5122c5c0ac89102074e5c262722893d00d9b5b5485` → `1cf30347f677e49e86cb3f9ba0b80e80fce4c60c7da0b5abb773bc16eac2bf25` |
| ood-n08-b07-i012 | PASS; QID SAME_ID; accepted option SAME_ID — Validation owns the transaction and commits or rolls it back before release. | `9be4bdddcb54fee203a8ef8c18e80e30f69e273d083dda2d2d34a1a331cfad08` → `f3a437d6ba6a40aeb92d1f3f96d2133890d7b25e8fbc00d0940e238e846bbeb0` |
| ood-n08-b07-i013 | PASS; QID SAME_ID; accepted option SAME_ID — The split attempt owns both response streams; close them before leaving the parent unchanged on failure. | `3228d0881debc56431df987475bb6a5a7e038546be4e880f19b82c55e4888a78` → `cb8d3bc8896c30ba52ebeee1fd60132522d9539818cfca90d46a0e69438fb874` |
| ood-n08-b07-i014 | PASS; QID SAME_ID; accepted option SAME_ID — The transfer releases its token on denial/cancel and transfers the reservation only at commit. | `2747cc9d035f4e2623d8c6692bc2b00152519a12244e6534f610e9225cd74486` → `4d20dc7215588573ac308481c9f752d70a54dc0fc23666f53440c739a5feb53b` |
| ood-n08-b07-i015 | PASS; QID SAME_ID; accepted option SAME_ID — The build owns component streams and its temp file; publish only the validated package. | `0a57f558c741e5d56fa84b94495c7a3467752c19edda20e621b58a8e7d03dc82` → `36e3a90aa59520480fed172edfc3c0cfd952a4a8e1a448a4a59218a9a117c411` |
| ood-n08-b07-i016 | PASS; QID SAME_ID; accepted option SAME_ID — The operation releases its lease before confirmation or transfers it to the booking after confirmation. | `4a7e408111107add7c3bbde4055d1de5b2ad0879d278548f11b3bc91bfe637f0` → `7cce43dc4a59b8740d9e155c351aab40033ad5000c72f023dc464248ff5cf25a` |
| ood-n08-b07-i017 | PASS; QID SAME_ID; accepted option SAME_ID — The merge releases its locks and discards its temp record on failure; publish only on success. | `cfa826654008b99311178f8792d006caf1169cf113bd5b229481474011be1608` → `acb4efc6bd76ca515affccda07a661895c78e30863bc15e6e24d68ab59823f52` |
| ood-n08-b07-i018 | PASS; QID SAME_ID; accepted option SAME_ID — The clearance operation closes its stream on every exit and approves only after success. | `73511f6b1913217414cad13d0d1924f3ab642898eff0de01dc82356d18650ab6` → `716229249faebbe34e82b1ad7b9fb6467740c051d808cc79524da3a586ab5589` |

This is bounded semantic/identity review of N08-B07 v2 only. It does not accept other N08/N09 units, the full324 map, producer/source activation, runtime/admission, native/Premium, or full BIZQ-01. No proposal or source was edited.
