# Independent semantic review: N05-B03 v4

**Verdict: PASS for the 17 frozen B03 v4 objects.** Each prompt states observable graph requirements without giving the copy policy; the keyed choice follows from those facts, and each alternative is a concrete competing boundary with feedback attached to its option ID. The old question IDs remain appropriate for the same copy/prototype mental-unit objective. Every changed answer meaning now has a fresh option ID.

## Bound input and checks

- Frozen input: `review-inputs/N05-B03-v4.json`, SHA-256 `98d7f3b25566afacac31944f5a7557fc03efacc3ba297aeacbd15789775df7af`.
- Current registry: `ROOT-CURRENT-N05-INPUTS.json`, SHA-256 `f7f50f13bb2f957c6f41442f1e6d79bb843a096fd7911b77103087fde71624ee`.
- Before objects: `N05-MANIFEST.json`, SHA-256 `bdef2880a62de54f54e3c06cb9ffc9bd5c900be31c6135d7a0b16c7583ab320a`; the matched v2 review input is `review-inputs/N05-B03-v2.json`, SHA-256 `2b66e8ff0fd2d1bc395896786e1942b38017724c50ea809fef1eb5ef5aa8eaf0`.
- Root’s structure/scoring receipt: `ROOT-STRUCTURE-B03-v4.json`, SHA-256 `babddccdec0c6327673e746dabcd2ec7a19871551afba6b63b5d5433b10ea08b` (17 questions, 136 score cases). This is corroborating structural evidence, not the basis of the semantic verdict.

I read every current whole object, its before object and v2 predecessor: prompt, constraints, four options, answer reference, Reason, all five Details fields, all wrong-option feedback, and source references. The current `constraints` arrays are empty, so the decisive facts are in the prompt. I checked that each feedback target resolves to one of the three wrong options, that no feedback target points at the key, and that each keyed ID resolves to its authored correct text. All 17 current question IDs equal their before IDs; all 17 keyed options use fresh `n05b03_iNNN_copy_policy` IDs rather than the old generic `owner_preserves_contract` ID. The 68 option IDs are unique within the current B03 set.

The v4 clarification in i001 is material and well scoped: requiring the same registered background and palette *objects* prevents a separate equal-value copy from satisfying the prompt. The other 16 objects are byte-identical to v3 per `ROOT-B03-OBJECT-IDENTITY-CORRECTION.json`; I nevertheless reviewed all 17 v4 objects as bound above.

## Per-item decisions

| Question | Decisive decision supported by visible facts | Identity | Finding |
| --- | --- | --- | --- |
| i001 | Keep the same registered background/palette objects and allocate a local annotation collection. | Preserve question ID; fresh key ID. | PASS |
| i002 | Snapshot the editable route values while assigning each escalation its own ID and due date. | Same. | PASS |
| i003 | Keep the shared immutable carrier table and copy preset dimensions into shipment-owned state. | Same. | PASS |
| i004 | Keep both shared immutable booking-policy objects and seed a booking-owned attendee list. | Same. | PASS |
| i005 | Keep the shared versioned protocol and give each installation its own editable calibration offset. | Same. | PASS |
| i006 | Create a new order list while retaining stable section IDs and immutable section references. | Same. | PASS |
| i007 | Create new editable shape records and retain their canonical asset references. | Same. | PASS |
| i008 | Retain plot/policy setup but initialize a new request ID, date, and no inherited approval result. | Same. | PASS |
| i009 | Copy the mutable ordered component list and retain the shared currency definition. | Same. | PASS |
| i010 | Copy depot-specific tuned policy values and retain the shared unit-dictionary object/version. | Same. | PASS |
| i011 | Copy editable metadata while retaining exact source-revision and checksum references. | Same. | PASS |
| i012 | Copy destination/consent defaults and initialize a new referral’s specialist choice and attempt history. | Same. | PASS |
| i013 | Create one copied chart node and preserve both internal widget references to it. | Same. | PASS |
| i014 | Copy editable steps/thresholds and retain shared immutable policy-document links. | Same. | PASS |
| i015 | Retain the shared immutable calibration specification and initialize an empty, local measurement list. | Same. | PASS |
| i016 | Copy editable benefits, retain the shared tax definition, and assign a new catalog ID. | Same. | PASS |
| i017 | Copy mutable match slots, retain the shared rule-set reference, and initialize a new ID with no results. | Same. | PASS |

## Quality and source notes

The rewritten stems now provide conditions rather than the former imperative copy recipe. The alternatives distinguish identifiable mistakes: aliasing mutable state, duplicating a required canonical reference, carrying another instance’s identity/history, or discarding configured values. Their target messages explain the specific violated fact. Reasons identify the ownership/reference boundary that decides the case; Details apply it and name a condition that would change the copy boundary. I found no key-paraphrase issue under §4.4.

As a descriptive style check, whitespace-separated counts put the key as uniquely longest in four items, tied longest in four, and shorter than at least one alternative in nine. These counts are not a threshold; the current options do not present a systematic longest-is-correct cue. Several items deliberately exercise the same broad copy rule with different object relations (for example, shared carrier table versus shipment dimensions, shared protocol versus local calibration, and shared dictionary versus depot limits). That is valid practice for this mental unit; I found no pair with the same scenario facts and the same specific learner decision.

Scenario facts are stipulated by the prompts. The shared `Design Patterns` and Fowler `Making Stubs` references supply general design context; no scenario-specific guarantee or external API behavior is attributed to them.

This is semantic proposal review only. It does not accept source activation, producer proof, app consumer, admission, native/Premium eligibility, or full BIZQ-01 closure.
