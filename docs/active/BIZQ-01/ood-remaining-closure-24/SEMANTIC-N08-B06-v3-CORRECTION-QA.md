# Independent correction review: N08-B06 v3

**Verdict: REVISE.** The v3 rewrite corrects the two v2 item-level findings (i007 and i013) and replaces several single-error distractors with complete competing policies. The cohort form cue is materially reduced. One case remains ambiguous: i008 alt2 can meet the prompt’s final-state requirement if its temporary replacement is not externally visible.

## Frozen bindings and checks

- Current frozen proposal: `review-inputs/N08-B06-v3.json`, SHA-256 `d214610eb75d80ac03851bb803f920ff6846091b331c163bd6cf98ed3989a341`.
- Matching author proposal SHA-256: `d214610eb75d80ac03851bb803f920ff6846091b331c163bd6cf98ed3989a341`.
- Prior v2 review: `SEMANTIC-N08-B06-v2-QA.json` (`58dd9638d081e3f96ee7cd8c3204ff4cb23dcfcc0043c4c19b44c349309ad8b0`); Markdown `SEMANTIC-N08-B06-v2-QA.md` (`3807810ca3e60974121567709f494632540cee3a74f0394c99c4c05e8914e53e`).
- Manifest SHA-256: `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`; contract SHA-256: `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`; canonical quality spec SHA-256: `c10ce086ecd3b58d7d776a458cb453d0161ac4519ca2474deba952122ceac8a3`.
- Whole-object hashes use repository `canonicalJson` and SHA-256; answer selected by `answer.optionId`.
- Independent production-contract check: 18/18 valid; 18/18 accepted answers score correct; all 54 distractors score incorrect; 18/18 accepted answers remain correct after reversing option order; all feedback target sets match the current wrong-option IDs.

## Correction review

The actual v3 frozen input differs from v2 in 12 of 18 whole objects (ood-n08-b06-i001, ood-n08-b06-i002, ood-n08-b06-i004, ood-n08-b06-i005, ood-n08-b06-i007, ood-n08-b06-i008, ood-n08-b06-i009, ood-n08-b06-i011, ood-n08-b06-i012, ood-n08-b06-i013, ood-n08-b06-i014, ood-n08-b06-i018). I independently inspected each changed prompt/key/alternative/targeted message and reused the v2 whole-object conclusion only for the 6 objects that are byte-semantically unchanged. All question IDs and accepted option IDs remain SAME_ID because the accepted operation-owned cleanup/cancellation decisions are retained. New distractor IDs in v3 identify rewritten wrong-option meanings.

The v3 changes resolve the earlier i007 and i013 findings: i007 now pairs pre-commit cancellation with preserving the prior listing and offers complete policies that each violate a stated visibility condition; i013 now contrasts the required unapproved state before a license result with premature approval. Other changed examples similarly tie the wrong alternative to the case’s specific resource boundary, including the remaining caller’s shared-file need (i001), lesson availability during cancellation (i004), continued editing during export cleanup (i005), rollback after partial split (i008), existing reservation ownership (i009), and the already-confirmed charger reservation (i011).

### Remaining blocker

For i008, the prompt’s visible requirement is that the parent request remains unchanged if either check fails. Alt2 temporarily replaces it after one pass, then restores it after a later failure. Unless the question says this temporary replacement is externally visible or forbidden, the alternative can satisfy the stated final condition. Add a visible “keep the parent published/current until both pass” condition or make the wrong alternative explicitly expose an unacceptable partial state. The mechanism explanation cannot supply a missing learner-facing premise.

## Item bindings

| Question | Disposition | Before → current canonical SHA-256 |
|---|---|---|
| ood-n08-b06-i001 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `6804310d49230d39e93b9223b2f11f8edc264144c36924f32ffe7ed676eea636` → `8e6219a12f5d7c58d6ad41553a690c9ce9415f222bf1e96fea3687c481ea8490` |
| ood-n08-b06-i002 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `9c1bc11393ce99c5b49e02e6b0f7c2eceaafeef95092b9bae5552e329ebe394b` → `ea3691cc5da34f001293548f99a3763eea5170e350ac5c865155d7a469d70771` |
| ood-n08-b06-i003 | PASS; REUSED_MATCHING_V2_WHOLE_OBJECT_REVIEW | `8783acd89dcada7c1f40fcd783e79e55ab9121e2dc0e18c1f32dbe91df034974` → `6406b5f7363f4218bcf13d33086f7415f16f80a316dc27e23bdb0bf6924172dc` |
| ood-n08-b06-i004 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `f837951777d3eed62dc390883ffba18f42ce6caf2df7044de3ab7ffa269e213b` → `55922f18a2464e9a172149175a0cbed51d360b6a4da8e6260ad39215503beaf6` |
| ood-n08-b06-i005 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `e179fc2eae64ff805035f1389cbcbf56bd38c251df1bb15508440e1dd7a0ad47` → `84eb67e7ac8dab00cfed275fd3548c769e512b53eacc1a1608b0d9a1e01276e7` |
| ood-n08-b06-i006 | PASS; REUSED_MATCHING_V2_WHOLE_OBJECT_REVIEW | `b150dd00bc5512ac2e8cd553db2960bdee8d5ec7b547adb9a76ee4c5aed01bb4` → `f0d6496458ebdfdfb9325d76ae6abea2ec89248ccb72363a9cfdff643c39c555` |
| ood-n08-b06-i007 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `22e90214f524715d5844b60f3f4a7a48da973f6dc7e04e23ea6c69ae1233e348` → `01e9398a32012cc27d660a066b3823c0920b5bb6b37546b3ddd76088da31ed59` |
| ood-n08-b06-i008 | REVISE; INDEPENDENTLY_REVIEWED_V3_DELTA | `7bc16a2b808c18e4505fd4ef805c6a94b0d066ac10898b735dbfc6a782026ac3` → `0d57e8f45114a71f98dc2d073e10750e45a868aeb6f44dc9b7450b128c9270ab` |
| ood-n08-b06-i009 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `680bb6585e1200a969938b5f097d57bcc18c41ba128a8643761aa82ef206d609` → `b3a71a4db285b0b814073ad92f9c240c97e503f034bb0628766cb4aed8bf5c8d` |
| ood-n08-b06-i010 | PASS; REUSED_MATCHING_V2_WHOLE_OBJECT_REVIEW | `57dbeeacf9e817fb90ee942c72f81937fd97aed63d228e9ac32994eacc60ad03` → `dc485931993adc75270f5f26e50b5de8d286496285c976e6f04b8e7192927b66` |
| ood-n08-b06-i011 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `f9f27eb9d2a913911daf1b017bdc7b47ab5cb368c45307dfb2fdb90c57af1d96` → `31c511084cfaa96df8d15155397890cafc4dcd34989e37e0442f7f32931ae5cd` |
| ood-n08-b06-i012 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `174088d9d1709e12ad147d164db11e9e6fe8788b0dc216e5df615e8ce796adfa` → `55792e063f3702eb489e44789c5c1a3dba395342c4e5f64a70433892334d92f3` |
| ood-n08-b06-i013 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `98fd55d7d99c53b064f630d80e7267c804b564f8ec58211cb636c654b03be2a7` → `0ec007fc34c72bf1677e5df19e6750db0517b53be0c8f2120f7fa0630261fcc9` |
| ood-n08-b06-i014 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `369ce02bb9dc60201c1b8a59db14d26bde1779c3235d9dd44be1cd605ebef9f5` → `90ed7a3bae94e5be3273721d273b2947a34a2fbba0864494dd9076ca976bb6bd` |
| ood-n08-b06-i015 | PASS; REUSED_MATCHING_V2_WHOLE_OBJECT_REVIEW | `b12f05c13838bf37178bc78e22241301964076e1bc7c6772d3e753f8c1b473c7` → `3ee3a99e5d0232b0e4c4708e8bb53fd2c3877aaffa2970562cca19e0a9ef026a` |
| ood-n08-b06-i016 | PASS; REUSED_MATCHING_V2_WHOLE_OBJECT_REVIEW | `6ac41762e3f3f690e3a20a700645ffaf6c297b8cc2bf05218347061c7d992a2d` → `595b657255f37997d3707dcc0dd14ae3c160782ff5f5d7fbd9c40d149518d91c` |
| ood-n08-b06-i017 | PASS; REUSED_MATCHING_V2_WHOLE_OBJECT_REVIEW | `23284fd82d6bff59832b7be1bd07fa65b7e9429fca2e24ffebdee3aa89bbce70` → `2df125595313999057d6179c410124fd2d315a5c90e8ae8ce54377fc464b2a14` |
| ood-n08-b06-i018 | PASS; INDEPENDENTLY_REVIEWED_V3_DELTA | `c382e1094c9e59230459a6da90309c60e938f08a53778bd57e12d5f2b660ce56` → `793a4e017ba4ef98bfea57645694d6b5d5e0806ad9ce94c03b3313ba3770da1c` |

This report accepts only the bounded semantic/identity correction review for N08-B06 v3. It does not accept other units, the whole 324-item package, producer/source activation, runtime/admission, native/Premium, or full BIZQ-01.
