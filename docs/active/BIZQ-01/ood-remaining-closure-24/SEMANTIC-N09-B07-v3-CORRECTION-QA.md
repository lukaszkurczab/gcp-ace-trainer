# Independent correction review: N09-B07 v3

**Verdict: PASS.** The revised messages now state the specific violated constraint: a stale quote misses the freshness deadline, sampled/deleted failed runs violate retention, and an unbound checksum can return a value for the wrong revision.

## Frozen bindings and verification

- v3 frozen input: `review-inputs/N09-B07-v3.json`, SHA-256 `428676e548e3da6ef68e3bfa4530c36818b7650e5c5dd2f5ea9e9c577e872a8a`; author proposal SHA-256 `428676e548e3da6ef68e3bfa4530c36818b7650e5c5dd2f5ea9e9c577e872a8a`.
- Prior v2 report: `SEMANTIC-N09-B07-v2-QA.json` (`1a459640d9a822c73842f90babea65998c49daffa87f814b12b143b3a62f0600`); prior Markdown SHA-256 `fc082efd527f38d9e50d1d47f1468f3a3aff3ba83174aa3530f5bf14eac4d8cc`. Its matching content review remains reusable for unchanged semantic fields.
- Prior v2 target-ID metadata erratum: `SEMANTIC-N09-B05-B07-v2-TARGET-ERRATUM.json`, SHA-256 `6cf108967883477466244fdef3a359c13e0f55c6fee136dc900fe0e32280d8d5`; it corrected only stale target references, not the semantic findings.
- Manifest SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`; contract SHA-256 `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`; canonical quality spec SHA-256 `c10ce086ecd3b58d7d776a458cb453d0161ac4519ca2474deba952122ceac8a3`.
- I confirmed the v2→v3 whole-object delta is limited to `feedback.messages[].text`: 4 message leaves in 3 questions. Prompts, constraints, accepted keys, distractor texts and IDs, Reason/Details, source references, and question/answer identities are unchanged.
- Production contract check: 18/18 valid, 18/18 accepted answers correct, 72/72 distractors incorrect, 18/18 correct after reversing options, and 18/18 exact feedback target sets.

## Diagnostic corrections

The revised messages now state the specific violated constraint: a stale quote misses the freshness deadline, sampled/deleted failed runs violate retention, and an unbound checksum can return a value for the wrong revision. I independently checked each changed message against the actual option text and the case’s visible facts. The explanation now targets the matching wrong option, without changing the answer or adding an unstated product guarantee.

## Item bindings

| Question | Disposition | Before → current canonical SHA-256 |
|---|---|---|
| ood-n09-b07-i019 | REUSED_MATCHING_V2_WHOLE_OBJECT_SEMANTIC_REVIEW | `undefined` → `02444da93db7afd1dd4211fd17decd587fa8945db287a3bebd8bc0bfc003ccc4` |
| ood-n09-b07-i020 | REUSED_MATCHING_V2_WHOLE_OBJECT_SEMANTIC_REVIEW | `undefined` → `989567d2e1408f059c048343a04e920c3e3ce1fd1bb00b3bc0bd6bd5ad656078` |
| ood-n09-b07-i021 | REUSED_MATCHING_V2_WHOLE_OBJECT_SEMANTIC_REVIEW | `undefined` → `98f9b2d95c7a46a22770707c24a738b3751dfaa20ca956b7186aa075fdfacf2f` |
| ood-n09-b07-i022 | REUSED_MATCHING_V2_WHOLE_OBJECT_SEMANTIC_REVIEW | `undefined` → `29d163c724bc8f0fa13deab43c6745ef720953896c67ef170ab09996a1bd4125` |
| ood-n09-b07-i023 | REUSED_MATCHING_V2_WHOLE_OBJECT_SEMANTIC_REVIEW | `undefined` → `87b16abec59407205b0b8c3b6a78b14269d280987da18a06a54b3afff25072a7` |
| ood-n09-b07-i024 | REUSED_MATCHING_V2_WHOLE_OBJECT_SEMANTIC_REVIEW | `undefined` → `54e6c16e9491e4118ad788a00bb793afae5951052ef4c36376db316fe61a7e82` |
| ood-n09-b07-i025 | INDEPENDENTLY_REVIEWED_MESSAGE_CORRECTION | `undefined` → `23d692ee7dfcac1155e962eaa4f52e6365b87e7e0fa1298dab5c0938b80f860c` |
| ood-n09-b07-i026 | REUSED_MATCHING_V2_WHOLE_OBJECT_SEMANTIC_REVIEW | `undefined` → `e9720e23493b910574bb7aff377439a1569232a25e5ba75b9fe8c410f47bcb8f` |
| ood-n09-b07-i027 | REUSED_MATCHING_V2_WHOLE_OBJECT_SEMANTIC_REVIEW | `undefined` → `ac7bd43b19e55e6ead115b8b9a5915af6aeb2a08ef99983ed0da57271efdb3e0` |
| ood-n09-b07-i028 | INDEPENDENTLY_REVIEWED_MESSAGE_CORRECTION | `undefined` → `a7a408bb6929fc1d895ef07b9998c87ec8bb33c90b602cd5674d2cf210b3cf8c` |
| ood-n09-b07-i029 | REUSED_MATCHING_V2_WHOLE_OBJECT_SEMANTIC_REVIEW | `undefined` → `ece224234abf8f1319fc690b987a4362131e3996a531281558501a1697947b8d` |
| ood-n09-b07-i030 | INDEPENDENTLY_REVIEWED_MESSAGE_CORRECTION | `undefined` → `33ed96c4937f0653338f60c37be2ce3c7b700a568fc5e47e519d88f124a30563` |
| ood-n09-b07-i031 | REUSED_MATCHING_V2_WHOLE_OBJECT_SEMANTIC_REVIEW | `undefined` → `9061a4b8e607b4d5dcf86b731bdcda4f97bbc025bb218d7a068b1c1499f0ef76` |
| ood-n09-b07-i032 | REUSED_MATCHING_V2_WHOLE_OBJECT_SEMANTIC_REVIEW | `undefined` → `87aa00eb2370eabad28e69a4fd50098ed45176c7de533841cc69a397c5d7903b` |
| ood-n09-b07-i033 | REUSED_MATCHING_V2_WHOLE_OBJECT_SEMANTIC_REVIEW | `undefined` → `7f37ddef36851bf34201e6bed909d5c8b4c98ce7b12f4d0ff96ea7bcc94730cf` |
| ood-n09-b07-i034 | REUSED_MATCHING_V2_WHOLE_OBJECT_SEMANTIC_REVIEW | `undefined` → `d1c990650e9d17b98fdee4cdee2f8e4570e4549efb58c33a4b0b19d79012759b` |
| ood-n09-b07-i035 | REUSED_MATCHING_V2_WHOLE_OBJECT_SEMANTIC_REVIEW | `undefined` → `ddd97b83ac1dd8160778d41ea4227e8c043c6180e746067440170cb1f9b4b1c5` |
| ood-n09-b07-i036 | REUSED_MATCHING_V2_WHOLE_OBJECT_SEMANTIC_REVIEW | `undefined` → `0145d44c56b38a1b894f0e246341329d2f2e8f724c8b40b7331b86b9ead2da42` |

This accepts only the bounded N09-B07 v3 feedback correction. It does not accept other units, the complete N08/N09 package, producer/source activation, runtime/admission, native/Premium, or full BIZQ-01.
