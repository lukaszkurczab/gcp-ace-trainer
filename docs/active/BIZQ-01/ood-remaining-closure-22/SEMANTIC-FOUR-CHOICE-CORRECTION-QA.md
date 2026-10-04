# Independent review — four-unit option correction

**Verdict: REVISE the B08 correction; B01, B03, and B05 pass this bounded rereview.** The shorter keyed choices in B01/B03/B05 preserve their already-reviewed decisions and the visible premises still support them. B08 removes the former longest-key cue but makes the correct answer uniquely shortest in all 18 questions. That is still a reliable answer-form shortcut, and the expanded distractors introduce awkward grammar in several items. This is a bounded correction within the existing §4.3/§4.4 review, not a new length threshold.

## Frozen evidence

- Current registry: [`ROOT-CURRENT-N06-INPUTS.json`](ROOT-CURRENT-N06-INPUTS.json), SHA-256 `bb8027086081c99e32a5db3ad113e2e0163cb069c401aa5c010d3962d7e5dcda`; proposed QuestionSet `bdd3db2ce213c985508aa6f61b6d40588c8b1ec05f170bb185e2a0b2b21d92c6`.
- Prior registry: [`ROOT-N06-INPUTS-BEFORE-FOUR-CHOICE-CORRECTION.json`](ROOT-N06-INPUTS-BEFORE-FOUR-CHOICE-CORRECTION.json), SHA-256 `d72b6e023e823f47ebfb9be10a6cab256e012fa67b4fd123ef312190e24f948e`.
- Actual field comparison: [`ROOT-FOUR-CHOICE-CORRECTION-DELTA.json`](ROOT-FOUR-CHOICE-CORRECTION-DELTA.json), SHA-256 `c1ff83daeb10d27bf12abebc25bdc4ac26d0e4c63313da0155cb41abeaae5ea6`.
- Console warning receipt: [`ROOT-FOUR-CORRECTED-WARNINGS.json`](ROOT-FOUR-CORRECTED-WARNINGS.json), SHA-256 `ab7f1aaa6bd340af1fe7ce20e21a10918060d94a08f025798b256771e363d0eb`; it reports zero sole-longest warnings. This check does not assess whether keyed answers become systematically shortest.
- Existing requirements: N06 contract SHA-256 `c6b5612e21fb66a540eba31514510df49b302f8f1089cf474f2ac5880b4205fb`; quality specification §§4.1–4.4 and 5B–5C.
- Root's structure/scoring/reversal checks passed all 72 questions. I independently reviewed the changed whole answers and, for B08, all 18 full prompts, options, keys, Reasons, Details and option-target feedback. No source, producer or runtime behavior was inspected or accepted.

## Bounded dispositions

| Unit | Frozen proposal | Disposition |
|---|---|---|
| B01 v2 | `4170cbff0600f28b0989faf1c476e0a20c4c235b03ad33b83eafd210e6477705` | PASS for 15 changed keyed texts. Each concise answer still states the Strategy seam supported by its stem: the scenario-selected behavior varies while the surrounding workflow remains stable. The unchanged three objects and prior cross-bank comparison are reused. |
| B03 v2 | `f6914b67481515b1a1c6b1b7bd190c8ced85beeeae9fcf13c1834a7e4acc3667` | PASS for 17 changed keyed texts. The choices retain the Command decision through their case-specific request identity, captured input, execution condition, or retry result; the prompts/Details supply the needed scope. The unchanged object and previous cross-bank comparison are reused. |
| B05 v3 | `4dd9d2657b754c3c73b353aa8348af44b78545e14c251f36bf14ac97d73e3add` | PASS for 16 changed keyed texts. Each keeps the Mediator role as a coordinator of the stated protocol while participant owners retain their own rules, consistent with the prompts and Details. The unchanged two objects and prior cross-bank comparison are reused. |
| B08 v4 | `165231fc935ec9bcbba5f80fe24c95f45ac18e3e66b0d2381155f35d3f1de0ef` | REVISE all 18 choice sets/affected diagnostics. The mechanism decisions remain supported, but every correct option is now strictly shorter than all four distractors. See the item-level measurements and wording examples below. |

The three accepted text-only corrections preserve the question IDs and the meanings already accepted for their keyed options. The current N06 IDs and accepted-bank cross-unit dispositions are reused; no duplicate-decision issue was found in these corrections.

## B08 finding

The corrected keys do state the intended mechanism compactly: an iterator for a homogeneous ordered collection, or visitors for stable heterogeneous nodes with varying operations. The stems supply those structural facts. However, on all 18 items the key is now the shortest option, while each wrong alternative is expanded into a much longer, more elaborate statement. For example, i003's key is 86 characters; its shortest distractor is 110 and longest is 140. i012's key is 88 characters; its shortest distractor is 110 and longest is 170. The same direction holds across the unit, so the correction replaces “longest is correct” with a stable “shortest is correct” cue. The issue is the one-directional answer form, not a requirement that choices have equal lengths.

| Item | Key chars | Shortest wrong chars | Longest wrong chars |
|---|---:|---:|---:|
| i001 | 101 | 121 | 138 |
| i002 | 99 | 136 | 147 |
| i003 | 86 | 110 | 140 |
| i004 | 88 | 140 | 155 |
| i005 | 92 | 108 | 149 |
| i006 | 94 | 107 | 153 |
| i007 | 92 | 110 | 171 |
| i008 | 97 | 124 | 134 |
| i009 | 86 | 124 | 145 |
| i010 | 93 | 109 | 142 |
| i011 | 103 | 132 | 156 |
| i012 | 88 | 110 | 170 |
| i013 | 95 | 110 | 164 |
| i014 | 95 | 141 | 153 |
| i015 | 96 | 109 | 132 |
| i016 | 97 | 109 | 172 |
| i017 | 101 | 110 | 165 |
| i018 | 97 | 130 | 150 |

The expanded alternatives also need a small clarity pass before acceptance. The homogeneous-record distractor repeatedly uses constructions such as “each orders record” (i001), “each feed changes record” (i002), “each caption segments record” (i004), and “each package units record” (i008). These should name the singular record type clearly. In i008, “each restriction scans consumer,” “restriction scans scan,” and “restriction scans loops” are malformed. The issue is concentrated in the expanded distractors/diagnostics; it does not undermine the keyed Iterator/Visitor distinction, but the learner-facing choice and its diagnosis should be readable and faithful.

The minimum coherent correction is to preserve varied answer lengths while ensuring choices have comparable concreteness, and repair the awkward generated noun phrases. Do not introduce a shortest-answer quota, pad options, or alter the accepted traversal decision. Preserve current option IDs if the corrected wording retains the same meaning; otherwise assign a fresh option ID and update the answer/feedback binding.

## Limits

This review accepts the B01/B03/B05 bounded changes and identifies a remaining B08 semantic-quality correction. It does not accept the full N06 map, source integration, producer migration, consumer, runtime, admission, native/Premium behavior, or full BIZQ-01 closure. The previous whole-180 REVISE report remains historical; this report supersedes only its four-unit option-correction findings.
