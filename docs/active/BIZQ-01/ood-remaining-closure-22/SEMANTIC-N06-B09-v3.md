# Independent semantic review — N06-B09 v3

**Verdict: PASS for this frozen proposal.** The single corrected explanation now diagnoses the actual keyed distractor. I reuse the v2 review for the other 17 unchanged question objects and its nonblocking qualitative review of the 13 longest-answer advisories.

## Frozen evidence

- Proposal: [`review-inputs/N06-B09-v3.json`](review-inputs/N06-B09-v3.json), SHA-256 `ed9c57ba6289e07441455deaabb6526d35277ca7fcfb0ac4ae2cb93cda38efbe`.
- Unit notes: [`review-inputs/N06-B09-v3-NOTES.json`](review-inputs/N06-B09-v3-NOTES.json), SHA-256 `470e0b34f45e0f352831544545d2995eb856334a287e8769635f1e17f9e50e7c`.
- The recorded v2-to-v3 delta is limited to i001 `feedback.details.errorCorrection`; the other 17 full question objects and i001 prompt, options, key, Reason, other Details, and option messages are reused from [`SEMANTIC-N06-B09-v2.md`](SEMANTIC-N06-B09-v2.md). The v2 report remains the historical REVISE record.
- Applicable source: `../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md`, §§4.1–4.4 and 5B–5C.

## Changed field assessment

In i001, alt1 says to record `ExerciseAttempted` before checking the version-bound score, then delegate validation and completion awarding to badge subscribers. The revised `errorCorrection` describes that same error: subscriber-owned validation and awarding before the completion owner accepts the result. It no longer attributes a completion publication to an option that publishes an attempt. The visible stem establishes that the completion owner validates and persists before success, while badge and analytics updates may lag, so the correction follows the stated case contract without adding a framework guarantee.

The correct event-boundary decision and its ID are unchanged. This is an explanation-only repair; it does not alter the learner's answer, scenario, scoring, or identity mapping.

The reused v2 assessment found 13 longest-answer advisories nonblocking after checking the actual competing alternatives; this is not a numeric acceptance rule. This review accepts only the frozen N06-B09 proposal bytes, not source activation, runtime, admission, native behavior, or full BIZQ-01 closure.
