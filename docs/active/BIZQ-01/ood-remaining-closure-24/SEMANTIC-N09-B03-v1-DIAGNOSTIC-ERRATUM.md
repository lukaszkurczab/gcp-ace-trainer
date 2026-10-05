# Additive diagnostic erratum: N09-B03 v1

**Diagnostic disposition: REVISE.** This erratum qualifies the diagnostic portion of the original bounded PASS; it does not rewrite or erase the historical report. Its positive findings about the 18 keys, question intent, and SAME_ID dispositions remain intact. The original report's statement that targeted diagnostics were meaningful is incorrect: in all 72 wrong-option messages, the text exactly repeats the targeted option.

## Bound evidence

- Frozen proposal: `review-inputs/N09-B03-v1.json`, SHA-256 `184713fc55a2484453eec47e84f513b0f3cf0e88d0a96656d82e17e14764f8c8`.
- Live proposed object has the same bytes at `proposals/N09-B03.json`, SHA-256 `184713fc55a2484453eec47e84f513b0f3cf0e88d0a96656d82e17e14764f8c8`.
- Historical review preserved: `SEMANTIC-N09-B03-v1-QA.md`, SHA-256 `5c341b758fca778688f1ef600058fa9f9dbdd0d246181a67c736136dae39ecaa`; JSON SHA-256 `a3ea5292afe24ec6ddcebbddf11381822abb8c3728347ec9a22b1a1f3738fd47`.
- Root observation cross-check: `ROOT-N09-DIAGNOSTIC-OBSERVATIONS.json`, SHA-256 `b4e5dc64d693ffea772b963a499acc59e052ac19a310ec897ddd0af877cfa6de`.
- Canonical requirement: `docs/07-content-guidelines.md`, SHA-256 `00c20d8c74d8e4dfec3ffb9211865642a5ae72d218bdd7473b8f41e52bfa5471`, Choice-item contract lines 357–365. BIZQ-01 Q05 also applies.

I independently loaded all 18 objects, indexed option text by `optionId`, and compared each `wrong_option` message with the text of its `targetId`. The result is 72 exact echoes, with no exceptions: four of four for each item. For example, in i001 the `caller_copy` message repeats “Keep the decision in the printer service and give it more shipment fields…” verbatim. That does not explain why the option might appear plausible, which case fact makes the ownership boundary wrong, or what failure follows. The other three messages in the item have the same defect; this pattern holds throughout the unit.

Canonical guidance requires authored distractor explanations that identify plausibility and the assumption, requirement, or boundary that makes the choice wrong; it explicitly prohibits fabricating explanations from option text. A correct stable `targetId` establishes which message is selected, but it does not meet that diagnostic contract. This is therefore a substantive feedback defect, not a numeric duplicate-text gate.

| Items | Exact copied messages | Targets checked |
|---|---:|---:|
| i001–i018 | 4 per item; 72 total | Every wrong-option `targetId` resolves to the copied option text |

Correct each message with a concise causal diagnosis grounded in its scenario and the targeted misconception. Where useful, explain when that alternative could become valid. The repeated `caller_copy`, `representation_write`, `generic_service`, and `subtype_reuse` labels do not require 72 unique phrasings; each message must still teach why its own option fails under that item's facts.

The additive JSON lists the 18 canonical whole-object hashes and all affected target IDs. No source or proposal was changed. No other N09 unit, whole324 semantic map, producer/source/runtime/admission, native/Premium, or full BIZQ-01 acceptance is implied.
