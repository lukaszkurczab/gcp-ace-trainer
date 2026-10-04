# N07 B03 v2 semantic correction review

**Verdict: PASS for the bounded B03 v2 semantic correction.** Frozen input `review-inputs/N07-B03-v2.json` SHA-256 `0ba2bcd05ce9da659635f98a0605c3b33bada0bd262f537e34d4b0e828e3172c`. The previous whole-object review and form-cue supplement were REVISE; this report supersedes their findings only for the corrected B03 v2 input and preserves both historical reports.

## Evidence and review scope

The exact v2 input contains 18 questions. The frozen mechanical receipt reports 18 objects and 90 original/reversed score cases passing; that establishes structure and feedback target mechanics, not semantic acceptance. I compared all 18 current objects to their frozen v1 objects and the manifest before objects using the producer’s canonical JSON fingerprint method. Per-item fingerprints and exact changed paths are in [the machine-readable review](SEMANTIC-N07-B03-v2-QA.json).

Each object changes the accepted wording, one competitor, and that competitor’s targeted feedback. I reviewed those changed fields in all 18, reused the v1 judgment for unchanged scenario meaning and supporting fields, and reread all of i006 because its prompt, constraint, accepted answer, Reason, Details, and one diagnostic also changed. The accepted choice is resolved by `answer.optionId`.

## Findings

The missing fact in i006 is now visible: `REVOKED` maps to revoked and `ACTIVE` to unrevoked. The key maps those codes and UTC time to domain state/instant, while the badge operation performs the access check. Its Reason, Details, and changed diagnostic explain the same boundary. The remaining alternatives now express distinct errors: spreading parsing to callers, moving authorization into mapping, making the storage code the public domain representation, or replacing the recorded instant. The code mapping resolves the v1 underdetermination without changing the tested decision.

The v1 form cue is also resolved. With the correct key found by option ID, it is uniquely longest in only 4 of 18 options by JavaScript UTF-16 character length (`i004, i015, i017, i018`). That observation is descriptive, not an acceptance threshold. The corrected set no longer uses a cohort-wide longest-key shape; case-specific distractors are fuller and several are longer than the key. The remaining isolated cases do not produce the systematic form signal described in §4.3.

Across all 18, the accepted decision remains the same mapping boundary: translate stored representation into domain values and relationships, then leave policy or external effects to their owning operation. The more concise keys are case-specific instances of that accepted answer. The expanded distractor and its feedback preserve each wrong answer’s core misconception while tying it to the scenario. I found no new hidden premise, incorrect diagnostic, or changed primary answer in the reviewed deltas. All 18 QIDs and accepted option IDs are appropriately retained.

## Limits

This is a bounded B03 correction PASS. Final cross-unit comparison against the other current units and accepted N01–N06 remains pending. This report does not accept source activation, producer/runtime behavior, consumers, admission, native behavior, Premium, or full BIZQ-01.
