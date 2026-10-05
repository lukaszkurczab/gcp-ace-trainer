# Independent semantic review: N08-B01 v2

**Verdict: REVISE.** The correction preserves the v1 learning decision and accepted option identity across all 18 objects, and it removes the v1 longest-choice cue. It replaces that signal with a similarly systematic shortest-choice cue: in 17 items the accepted choice is shorter than every distractor. The options also contrast a terse ownership label with three elaborate, often implausible workflows (caller-side repair, global mutable state, or a scenario-specific subtype). That contrast makes answer form a shortcut and leaves several keyed choices too underspecified as standalone decisions. This is a qualitative §4.3 issue, not a numerical threshold. Revise the competing options so the alternatives express credible, comparably complete boundary choices; do not pad text or target equal character counts.

## Frozen inputs and method

- Correct v2 input: `review-inputs/N08-B01-v2-actual.json`, SHA-256 `031233aab469faddd56eef90a9b4c04759c250d4f60423dcd059e97426e64061`. The similarly named `review-inputs/N08-B01-v2.json` is excluded: the freeze-correction record says it contains v1 bytes.
- v1 comparison input: `review-inputs/N08-B01-v1.json`, SHA-256 `1383b96bb94e9a23adef6c4a3f88d796d8e8a99c838b8e3f2823cebeff169118`.
- v2 author correction: `AUTHOR-N08-B01-v2.json`, SHA-256 `e22bc57240f407bc0fc29c449b8a7def3925dfac4185302661f3eab943bc13b4`; Markdown companion SHA-256 `5483e67135a778490046a529b90e1ca2febdd94f8440c8fe3d8b210e3d9f515e`.
- Freeze correction: `ROOT-N08-B01-v2-FREEZE-CORRECTION.json`, SHA-256 `52a8e84fbbab6f7e2f4f6a9765f3b51b6c2790ee8315e708bd05413c3b9c5bda`.
- Manifest SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`; contract SHA-256 `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`.
- v1 independent whole-object review: `SEMANTIC-N08-B01-v1-QA.md` SHA-256 `6af41e22c9242998a2903503547826a2f860dc869a6b4b27a4782622881da9a6`, with matching JSON SHA-256 `1e8b39c0d950f2d66e7dc72ee307ad59d8a19c79f7a9acdf62929898ee128875`.

I compared all 18 v2 full objects with the frozen v1 objects. The only changed leaf in each object is the text of the accepted option `owner_preserves_contract`; prompt, constraints, question IDs, answer IDs, distractors, Reason, every Details field, and feedback messages are unchanged. Therefore the v1 semantic and identity conclusions are reusable for those unchanged fields. This review independently assessed every replacement key text in context, resolving the answer by `answer.optionId`.

## Decision and correction

The old accepted answer states the broad ownership/confinement decision for each case. The v2 text remains an application of that same primary decision: route writes stay in the route owner; reward changes go through the campaign owner; shipment, inspection, match, notebook, document, invoice, booking, exhibit, lesson, board, conversation, and listing transitions stay with their relevant owner. No item changes its primary question or accepted response meaning, so all 18 remain **SAME_ID**. Retaining the question and accepted-option IDs is appropriate.

However, shortening only the keyed choice leaves it systematically much shorter than the three alternatives. Examples make the problem concrete: i013 keys only “Reserve through the room/day booking owner” against three 88–100 character scenarios; i007 keys “Publish one immutable dataset-and-code snapshot” against alternatives of 89–104 characters; i002 keys “Apply each reward through its campaign state owner” against alternatives of 90–99 characters. The wrong options are also repeated forms across the cohort: delegate mutation to callers, expose or centralize shared mutable state, or introduce a new subtype. Several subtype alternatives are not credible responses to the stated case, while their extra clauses make them visibly more elaborate than the answer. In this presentation, selecting the concise owner-oriented sentence is a reliable form cue even without understanding the relevant invariant.

The correction should address the *choice set*, not restore the long v1 key or add filler. Keep the case facts in the stem and offer competing, plausible boundary decisions in concise language—for example, an owner-local transition versus a caller-coordinated update or a separately published state—only where each is a realistic response to that case. The prompt should still supply enough facts to distinguish them, and each wrong-choice message should diagnose its actual failure mode. No fixed choice count, unique-vignette rule, or equal-length requirement is introduced here.

## Per-item binding

The table records actual v2 key text and canonical whole-object fingerprints. Fingerprints are SHA-256 of repository `canonicalJson(question)` (recursively sorted keys); the answer was resolved using `answer.optionId`. Each identity disposition is SAME_ID because the exact accepted option ID and underlying owner/confinement decision remain stable from v1. Each v2 key is shorter than all three wrong choices; that measurement is a supporting signal, not a pass/fail threshold by itself.

| Item | v2 accepted choice | Key chars / longest wrong | Identity | v1 → v2 canonical whole-object SHA-256 |
|---|---|---:|---|---|
| i001 | Keep conflict detection and route writes inside the route owner. | 64 / 118 | SAME_ID | `5a48733e077ea44cd7a3c29f46d9ff0c1d94849f6b4205af1aa3a735ca724065` → `d1476df921eb16b6c98d8b4d45d9c58c17c70837a852850d2716d01bdb372a62` |
| i002 | Apply each reward through its campaign state owner. | 51 / 99 | SAME_ID | `06ce7ebeef77f2a7a72ac6ece56e3d347fea902c40e7abfd499d3c1d5b1275da` → `060ee6bc3cc5a6a6f59553b988099f95b9f9978f34df37f90739175c3714bbe3` |
| i003 | Hand off the shipment through its owner, carrying its limits forward. | 69 / 122 | SAME_ID | `fed6e620f661a4e64a84afcd9780f438724008e8d8fcd2f7026bd32422c1c1ed` → `069657206526c1f2163f01ec2819f9801a0f9b84e2eb74d05a7c85afe724db33` |
| i004 | Allocate repayment through the account ledger operation. | 56 / 113 | SAME_ID | `66ce3ac725f3eca96ed6f13137fc8a15657d9453e4bb6c27761bea07c4884c9c` → `66e16e1f7b75378198c86fc505ee3ac31a30ccc018bbb8b27c5833c173fb6ded` |
| i005 | Let the match owner accept one legal terminal transition. | 57 / 102 | SAME_ID | `fc40111130bbf526dd3c80730c84c87c09ab6ca5c051acde493af2d1e8233912` → `8e1ea59799da70ba9e2b42ee9cdeb31eaae77ed4d87ab7eb1b48525c2c45ab05` |
| i006 | Keep inspection findings with the inspection; assess refund eligibility separately. | 83 / 105 | SAME_ID | `a29126afa7df48ed1ffffd391c91ff23a23183203325cbdb89222148c10abbca` → `9516ff7ca100fc0a24ff1b8a647f5298942ee8e3f0d84531a5eeed3e1d35de57` |
| i007 | Publish one immutable dataset-and-code snapshot. | 48 / 104 | SAME_ID | `654d50c3f0b25f07d9666059aeb09ef08c8f9594f358827b45e3ba046c3d03d9` → `c47bd240e86d43b571d27aeacbaba9affdd49f93847c8026423729c944278aad` |
| i008 | Store comment author and revision when the document accepts it. | 63 / 138 | SAME_ID | `1a38fb43d9f8b8d5d3cb38eb57e6936214870df709ab7fd83c28d07e28f172b7` → `05eaaa3da1aac46c29e8b9d59380d86a54fa8d2bd65b98599104ab661963a325` |
| i009 | Submit a frozen draft revision with its own completion result. | 62 / 104 | SAME_ID | `3c6a747cdf448fb66784b4465df196dbf9eea3ebb023f66608976b8a9073459e` → `c9540a61e2208389320848b75c5ed754f627c18cdfb3ad3924f3ebbd062b215b` |
| i010 | Issue a versioned invoice revision and record its response against that revision. | 81 / 119 | SAME_ID | `4ac1a43e8f515b2f9d1fd7ce3faacf6b0dc1a6286ebfe5a8c0d253f78cb9d12c` → `5373df17fd97f289d41865fb276d2021fb5ed090a75c99f89da554e8dc1f66fb` |
| i011 | Use the access authority's current badge state for each grant. | 62 / 102 | SAME_ID | `4ec935ead316941d90bb57442eb04f57d3b3ce83bf6e36ebbf0be8207b2ef4c4` → `8f4998cd6a4d066d83f760dac74a066fc79a75eb146800a819f19effff3503c4` |
| i012 | Print from the shipment's approved address revision. | 52 / 120 | SAME_ID | `9ed44e2fc9091889a5a14a08042d1247b71c20436bb5c02d0ec0bd32e3f490e1` → `548c0677b25a54936b8c0f1c79b1c05a4452b3b8464b5c752f9a8eabf629a15a` |
| i013 | Reserve through the room/day booking owner. | 43 / 100 | SAME_ID | `67cc36fb1cca8ba391ba40e5a237c6ee84cd619d7e1ab72baeef880b0f236509` → `9424e95b604d319b02f601959f4b65dadc33e018f9cf8a6e4cb36fc3e10b8a40` |
| i014 | Let the exhibit controller own mode transitions and command checks. | 67 / 119 | SAME_ID | `dde30742848738bc3191e3e7332204ed20d3f2654028e600a9103f2a42778483` → `06e08ecdad170157461c32e24d83ee3a71ea704ed9b4b63848358f78949d6f27` |
| i015 | Retire catalog availability without changing lesson identity. | 61 / 115 | SAME_ID | `cdadbb2dbb55239b97b7b48cb3c9eb843ea0c5b2bea8d9ab40587a552bd7e705` → `ec77ac9bcf64f9ce8732f3804ca9c559eae622a66cf9b9051b255a449f4dc3d4` |
| i016 | Export a stable board snapshot without owning the live session. | 63 / 110 | SAME_ID | `ef129922f0f4222d02b243f0ef9e13450a3cf8e44fcce24ff46e4152408864ca` → `f85802a675ed9334293ee98341e47e6ffe7e66828c2e0bbaa5e32adc8b73fab4` |
| i017 | Apply assignee and deadline through one conversation transition. | 64 / 117 | SAME_ID | `1bfed5181fdd6988c6ed1f1b5985e30718c54ae5aaf4bb1955f38516f300fd1f` → `d00b0c083488b2ca9fa59f239777e574158ee55731065fbe6feb157d1237de04` |
| i018 | Publish a validated price/stock revision for the listing. | 57 / 114 | SAME_ID | `46d4e0f701ef33ce907a160ca656b085516fb82bebc7f496abf7bc5e193860f7` → `fca6a3bcb38b4f6eacd475369b9c2e22716d1c90240f245ce48b296dd0403c86` |

This is a bounded N08-B01 v2 review only. It does not accept the remaining N08/N09 questions, the whole324 map, source/producer/runtime/admission, native/Premium, or full BIZQ-01.
