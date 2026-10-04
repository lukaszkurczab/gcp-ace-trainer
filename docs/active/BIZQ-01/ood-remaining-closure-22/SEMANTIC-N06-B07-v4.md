# Independent semantic review — N06-B07 v4

**Verdict: PASS for this frozen proposal.** The case facts make the Template Method choice meaningfully applicable: each host requires one public operation whose base implementation owns the invariant workflow, while its supported variation is a provider-subclass hook. A composed Strategy remains valid where callers own orchestration or the host exposes policy injection; those conditions are explicitly absent here. This review binds the exact frozen v4/v5 bytes identified below.

## Frozen evidence

- Proposal: [`review-inputs/N06-B07-v4.json`](review-inputs/N06-B07-v4.json), SHA-256 `77fd48660671d6ac4e57eaa212f98a8114670de4c3078cf2835e346876a9e342`.
- Unit notes: [`review-inputs/N06-B07-v4-NOTES.json`](review-inputs/N06-B07-v4-NOTES.json), SHA-256 `74817c3962e4818e872af50bd02fdca2ee35237f40407f5ad7706e44ee7e4f2d`.
- The current frozen v4/v5 proposal bytes are identical; the advertised v4 hash is the verified input. The v4 console warning receipt reports zero longest-choice flags. I inspected the actual choices rather than using that receipt as semantic approval.
- Applicable criteria: BIZQ-01 §§4.1–4.4 and 5B–5C. The cited Template Method reference supports the base-operation/subclass-hook concept; authored API contracts and workflow facts are scenario premises, not claims about all frameworks.

## Item assessment

Across all 18 items, the answer resolved by `answer.optionId` preserves a required public workflow, its stated invariant sequence, and the single provider-specific variation point. The prompts do not claim that Strategy is universally wrong: they state that this host requires the base entry and does not accept a per-call policy. The nearest Strategy alternative is therefore plausible in general but mismatched to the given integration because it delegates workflow coordination to callers. The alternatives for replacing the full workflow, moving behavior into callers, and copying per-provider workflows each represent a concrete way to break the stated shared contract. The keyed feedback and wrong-option messages describe those actual alternatives.

The prompts deliberately make the fixed workflow and supported variation point explicit, as required to uniquely decide a host integration case. The learner still has to map that seam to the fitting design—preserve the base algorithm and vary the hook—rather than merely identify a pattern name. This is scaffolded, named-design practice; under §4.2 that is acceptable while the learner makes a meaningful application decision. The option IDs identify the case-specific accepted implementation and are distinct from the preserved question IDs.

| Items | Result |
|---|---|
| i001–i018 | PASS: visible host contract supports the keyed base-sequence/subclass-hook design; keyed Reason, Details, and target diagnostics match the options. |

The repeated contrast among hook variation, caller-selected Strategy, whole-workflow replacement, caller logic, and copying is consistent practice for this mental unit, not a claim that the nine broader N06 units must use unique stories. This proposal-only PASS does not certify source integration, runtime, admission, native behavior, or full BIZQ-01 closure.
