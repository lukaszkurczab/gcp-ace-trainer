# N07 B04 v1 semantic review

**Verdict: REVISE.** Frozen input `review-inputs/N07-B04-v1.json` SHA-256 `39a1ff59885a25605201d27f0943816dbda6b44c0890709c12c6ed6c9363ad94`; source `patternly-content/content/object-oriented-design-interview/persistence_repositories_serialization_and_domain_boundaries/OOD-N07-B04.json` SHA-256 `632406736598286d3843016987f28b3ed4eef4f2a1cf040de9f108780d5cc5fc.

### Scope and basis

Reviewed every whole object against its before object, including prompt/constraints, the accepted choice found by `answer.optionId`, every distractor and keyed feedback target, Reason, all five Details fields, source refs and identity. The mechanical receipt covers 18 objects and 90 original/reversed score cases; that is structural evidence only.

### Finding

The accepted choice is uniquely longest in **18 of 18** current questions by JavaScript character count, resolving the key through `answer.optionId`. The keys commonly describe the full sequence and scope—same instance, validated changes, then coordinated commit—while alternatives are much shorter partial or misordered actions. That repeated contrast lets a learner select the most complete-looking answer without weighing the identity/UOW decision. BIZQ-01 §4.3 bars a systematic longest-correct cue; the 18/18 observation identifies this cue but is not itself a numeric gate.

Smallest correction: make competing options plausible, sufficiently complete alternative approaches that fail on visible facts, or make supported keys concise without omitting their required action. Do not pad, force equal lengths, or drop meaningful alternatives just to alter a count. Rebind changed diagnostics and retain option IDs only when answer meaning is unchanged.

### Identity and item review

The predecessor’s accepted answer teaches operation-scoped identity plus tracking accepted local changes in a unit of work. Current stories instantiate the same mechanism: e.g. i001 same route through two paths and conflict-before-save; i007 a result with two revision links before publish; i008 comment before external notification; i011 same badge before the access decision; i016 close marker/cutoff before export. The case-specific domain does not itself change the primary mechanism, so the QIDs and accepted option IDs remain valid. i006 uses an immutable revision, but explicitly identifies one revision row reached through two paths during one signing request and asks what both paths should return; a single in-memory identity fits the unit objective despite no edit to that revision.

Current prompts and constraints state the relevant operation scope, ordering and grouped local outcomes. Reason, Details, and option-targeted messages generally explain the distinction without a new unstated persistence or external-transaction guarantee. The primary blocker is the systematic form cue, not an identity mismatch.

### Item dispositions

| Item | Decision tested | Identity | Verdict |
|---|---|---|---|
| ood-n07-b04-i001 | One route instance across tile/ID paths; stage geometry until explicit conflict resolution. | Retain QID and accepted option ID | REVISE |
| ood-n07-b04-i002 | One character instance for two command reads; track the validated inventory and score changes together. | Retain QID and accepted option ID | REVISE |
| ood-n07-b04-i003 | One shipment instance for map/planner reads; stage carrier/handoff fields until carrier validation succeeds. | Retain QID and accepted option ID | REVISE |
| ood-n07-b04-i004 | One account instance and one work unit for balance change plus matching repayment allocation. | Retain QID and accepted option ID | REVISE |
| ood-n07-b04-i005 | One local work unit for match result and bracket advancement; notify after local commit. | Retain QID and accepted option ID | REVISE |
| ood-n07-b04-i006 | One in-memory revision identity across seal/history paths for the signing request; retain the seal’s exact immutable revision. | Retain QID and accepted option ID | REVISE |
| ood-n07-b04-i007 | Track result plus both exact revision links before publication; report is downstream. | Retain QID and accepted option ID | REVISE |
| ood-n07-b04-i008 | Commit accepted comment and author/revision links before an independent notification. | Retain QID and accepted option ID | REVISE |
| ood-n07-b04-i009 | Collect evidence and submission-state transition; only mark complete when the required evidence set exists. | Retain QID and accepted option ID | REVISE |
| ood-n07-b04-i010 | Track new invoice and rejected-invoice link before the later payment request. | Retain QID and accepted option ID | REVISE |
| ood-n07-b04-i011 | Unify badge reads within one access request and observe revocation before granting entry. | Retain QID and accepted option ID | REVISE |
| ood-n07-b04-i012 | Persist label and selected approved-revision link before retryable print attempts. | Retain QID and accepted option ID | REVISE |
| ood-n07-b04-i013 | After capacity validation, persist room and interval as one accepted move; fee calculation follows later. | Retain QID and accepted option ID | REVISE |
| ood-n07-b04-i014 | Persist maintenance state and technician attribution before acknowledging entry. | Retain QID and accepted option ID | REVISE |
| ood-n07-b04-i015 | Use one lesson instance during retirement while preserving its stable progress identity. | Retain QID and accepted option ID | REVISE |
| ood-n07-b04-i016 | Persist close marker and final event cutoff before starting export; email follows. | Retain QID and accepted option ID | REVISE |
| ood-n07-b04-i017 | Use one conversation instance and track owner/deadline as the accepted pair. | Retain QID and accepted option ID | REVISE |
| ood-n07-b04-i018 | Unify draft-list/ID reads, validate price/stock and save the accepted publication state. | Retain QID and accepted option ID | REVISE |

### Limits

This is only the B04 unit review. Whole-N07 cross-unit review is pending; no source, producer, runtime, consumer, admission, native, Premium or full-BIZQ-01 acceptance is claimed.
