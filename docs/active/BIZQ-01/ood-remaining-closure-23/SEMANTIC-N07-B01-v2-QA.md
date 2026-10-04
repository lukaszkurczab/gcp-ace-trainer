# Independent semantic review — N07-B01 v2

**Verdict: PASS for the bounded correction.** The v2 change resolves both blockers from the v1 review: it removes the repeated uniquely-longest-key cue without adding artificial filler, and B01-i002 now makes the full-load alternative’s failure visible in the scenario. The four-option choice shape passes the existing schema/scoring checks and is not subject to a five-option requirement.

This re-review is bound to `review-inputs/N07-B01-v2.json` SHA-256 `aebc7f8cc71f8203d0e53e0eda80118878758608a8cc447aad4dc45bb22f524a`. The predecessor/current manifest is `N07-MANIFEST.json` SHA-256 `07b9663946f5de9587434e9a3bd5836f71fa70dec772bfced94524ab3fc4fc01`. I compared the v2 whole objects with v1 and reviewed the changed keyed choices, removed alternatives, remaining option set and aligned diagnostics; for unchanged semantic fields I reuse the exact v1 review conclusions. I resolve accepted choices only through `answer.optionId`. The mechanical receipt covers 18 questions and 72 score/reversal cases, but does not establish semantic acceptance.

## Findings resolved

The keyed option is no longer uniquely longest in any of the 18 questions. Each item now has four choices after removing one weak alternative. The removed choices were filler or less credible than the retained competing approaches; each item retains three distinct, meaningful wrong choices. Some keys are now uniquely shortest, but length is not being used as a new gate. The choice sets vary in length and retain the conditions that make the correct policy complete.

The prior i002 ambiguity is resolved by visible facts: the prompt states about 250,000 open-case rows, a 200 ms p95 endpoint target, and measured full-table materialization above that target. The full-load distractor is specifically contradicted by the scenario. Its feedback explains that failure, and the key selects a team/open conversation query while keeping ownership/history mapping in the adapter. This is not an unstated performance preference.

All 18 question IDs and accepted-option IDs retain the same primary B01 decision and repository/domain-collection answer meaning. The new key texts shorten that contract rather than replace it. Wrong-option messages track their exact retained option IDs; review found no remaining target mismatch or unsupported key. No new question or option identity action is needed.

| Item | Correction review | Identity | Result |
| --- | --- | --- | --- |
| i001 | One distractor removed; key shortened. Prompt facts and explanation unchanged. | Retain question and accepted-option IDs; same primary repository/domain-collection decision. | PASS |
| i002 | One distractor removed; key shortened. i002 adds visible 250k-row, 200 ms p95 and measured full-load failure facts. | Retain question and accepted-option IDs; same primary repository/domain-collection decision. | PASS |
| i003 | One distractor removed; key shortened. Prompt facts and explanation unchanged. | Retain question and accepted-option IDs; same primary repository/domain-collection decision. | PASS |
| i004 | One distractor removed; key shortened. Prompt facts and explanation unchanged. | Retain question and accepted-option IDs; same primary repository/domain-collection decision. | PASS |
| i005 | One distractor removed; key shortened. Prompt facts and explanation unchanged. | Retain question and accepted-option IDs; same primary repository/domain-collection decision. | PASS |
| i006 | One distractor removed; key shortened. Prompt facts and explanation unchanged. | Retain question and accepted-option IDs; same primary repository/domain-collection decision. | PASS |
| i007 | One distractor removed; key shortened. Prompt facts and explanation unchanged. | Retain question and accepted-option IDs; same primary repository/domain-collection decision. | PASS |
| i008 | One distractor removed; key shortened. Prompt facts and explanation unchanged. | Retain question and accepted-option IDs; same primary repository/domain-collection decision. | PASS |
| i009 | One distractor removed; key shortened. Prompt facts and explanation unchanged. | Retain question and accepted-option IDs; same primary repository/domain-collection decision. | PASS |
| i010 | One distractor removed; key shortened. Prompt facts and explanation unchanged. | Retain question and accepted-option IDs; same primary repository/domain-collection decision. | PASS |
| i011 | One distractor removed; key shortened. Prompt facts and explanation unchanged. | Retain question and accepted-option IDs; same primary repository/domain-collection decision. | PASS |
| i012 | One distractor removed; key shortened. Prompt facts and explanation unchanged. | Retain question and accepted-option IDs; same primary repository/domain-collection decision. | PASS |
| i013 | One distractor removed; key shortened. Prompt facts and explanation unchanged. | Retain question and accepted-option IDs; same primary repository/domain-collection decision. | PASS |
| i014 | One distractor removed; key shortened. Prompt facts and explanation unchanged. | Retain question and accepted-option IDs; same primary repository/domain-collection decision. | PASS |
| i015 | One distractor removed; key shortened. Prompt facts and explanation unchanged. | Retain question and accepted-option IDs; same primary repository/domain-collection decision. | PASS |
| i016 | One distractor removed; key shortened. Prompt facts and explanation unchanged. | Retain question and accepted-option IDs; same primary repository/domain-collection decision. | PASS |
| i017 | One distractor removed; key shortened. Prompt facts and explanation unchanged. | Retain question and accepted-option IDs; same primary repository/domain-collection decision. | PASS |
| i018 | One distractor removed; key shortened. Prompt facts and explanation unchanged. | Retain question and accepted-option IDs; same primary repository/domain-collection decision. | PASS |

## Limits

This accepts only the B01 v2 bounded semantic correction. Final comparison against the other N07 units and accepted N01–N06 remains pending. It does not accept source implementation, consumers, admission, runtime, native behavior, Premium, or full BIZQ-01.

## Frozen evidence

- v2 input: `review-inputs/N07-B01-v2.json`, SHA-256 `aebc7f8cc71f8203d0e53e0eda80118878758608a8cc447aad4dc45bb22f524a`.
- v1 input: `review-inputs/N07-B01-v1.json`, SHA-256 `4f327d79af5941d617f8c211cd70bb84ca450a1f8bc08bce4d0b034c8c526df2`; historical v1 semantic report remains REVISE.
- Manifest: `N07-MANIFEST.json`, SHA-256 `07b9663946f5de9587434e9a3bd5836f71fa70dec772bfced94524ab3fc4fc01`.
- Source file: `patternly-content/content/object-oriented-design-interview/persistence_repositories_serialization_and_domain_boundaries/OOD-N07-B01.json`, SHA-256 `647f8594ec29f5d565d79e558e94c6ecf0f25637198b141cbb7dfbe0b10fe4df`.
- Mechanical-only receipt: `ROOT-N07-B01-v2-MECHANICAL.json`, SHA-256 `27416754634c3b8c5460575b7e3535eb25bd2b0421194060b0dd74a0d6603d1f` (18 objects, 72 scoring/reversal cases).
- Criteria: BIZQ-01 spec `c10ce086ecd3b58d7d776a458cb453d0161ac4519ca2474deba952122ceac8a3`, canonical guidelines `cffd5dae0850ecd7fc1f2e05e28f7e83c7ca9460207f6f857713d196254773e5`, N07 contract `79c6dd8d2861d21eec0122675659840ba6f04883f546ec9ef4326f29320d4720`, briefing `9370339439c25f7fe065e3753af31f0436d0e0e78e9084815d83c5ad9039e4d3`.
- Author notes snapshot: `AUTHOR-B01-B04.json`, SHA-256 `f6432921636f76506bc0fa6d345edcca49f909c26fee4b8e49f9495833e2bbf9`, treated as hypotheses only.
