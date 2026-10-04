# Independent semantic review: OOD-N04-B08 v1

**Verdict: REVISE, one item.** Frozen input: `review-inputs/v1/OOD-N04-B08.json`, SHA-256 `417977d3d5fde110c954443d9deea7c21baae99468b692ea8b52dc06eacc7906`; notes `review-inputs/v1/OOD-N04-B08-notes.json`, SHA-256 `a35bb4cac289d5b1aed5614ae00ad273abbb7ad44187ecf956b7f37214841cd2`. I read all 18 prompts, options, keys, Reasons, five-part Details and keyed option feedback. The unit objective is to distinguish a type/category marker from an operation with the context, authority, inputs and result required by the caller.

## Item findings

| Item | Verdict | Evidence |
|---|---|---|
| i019 | PASS | Referral ID, destination and current consent record are the visible per-request facts; a provider-wide marker/Boolean cannot decide scoped consent. The stem asks for a contract the router calls, so the direct-router alternative does not satisfy the requested boundary. |
| i020 | PASS | The recorder must preserve historical revision and policy IDs while the dashboard only classifies types; the record and marker serve separate needs. |
| i021 | PASS | Exception, actor, controls, allow/deny and policy-version attribution require a scoped decision result, not marker membership or role Boolean. |
| i022 | PASS | Stable segment IDs across old/new tables and explicit unmatched results are necessary; offsets and ordinal position are expressly unreliable. |
| i023 | PASS | Read-only inspection needs expiry/provenance facts, while revocation is reserved to the grant service. |
| i024 | PASS | The scenario explicitly requires a seal for canonical bytes of a specific revision and a result bound to its ID. The marker alone cannot establish that revision. |
| i025 | PASS | The provider guarantee identifies retries by a stable client key and returns the original receipt; reusing that keyed attempt prevents a new payout identity. |
| i026 | PASS | Cross-category ordering requires the shared effective-time value; class markers and arrival order cannot provide it. |
| i027 | PASS | The ledger is explicitly the atomic check-and-commit authority for requested intervals; meter capability alone cannot reserve one. |
| i028 | PASS | The adapter-facing contract normalizes timed chunks and retryable/terminal errors, as callers require, without exposing provider SDK shapes. |
| i029 | PASS | Skill alone does not determine availability for a particular shift; the decision receives volunteer plus shift and reports which condition failed. |
| i030 | PASS | The merge engine cannot choose conflicts for a human; returning proposed geometry plus conflicts preserves the unresolved outcome. |
| i031 | PASS | A prior check can become stale before the campaign command; the operation must validate current state while applying the reward. |
| i032 | PASS | Shipment-specific temperature and hand-off facts require an offer decision; carrier category is only discovery metadata. |
| i033 | PASS | The ledger alone can atomically allocate against current balance and return resulting state; a precheck or caller-side write cannot preserve that contract. |
| i034 | PASS | The marker remains limited to UI discovery; a late event must go through a command that rechecks current state and reports acceptance. |
| i035 | PASS | Inspection records condition only; refund policy uses additional date/channel facts and remains a separate outcome. |
| i036 | REVISE | The prompt states the answer’s complete input/output contract: “the publisher must instead receive both revision identifiers and return a snapshot that retains them,” then asks what it should accept and return. The keyed option repeats those two instructions. The learner is not deriving the contract from provenance/race facts; the decisive interface is disclosed verbatim, contrary to the meaningful-decision objective and BIZQ §§4.1–4.2. Reframe around the need to preserve which dataset/code revisions a concurrent publication represents, without prescribing the exact method inputs and output; preserve the same underlying decision and stable identity if only wording changes. |

The rest of the item set provides distinct applications of the same marker-versus-capability objective: durable evidence, authorization context, mapping partial outcomes, split inspection/mutation authority, immutable revision binding, idempotent retries, common ordering, atomic reservations, normalized provider behavior, state-dependent decisions, unresolved conflicts, and separation of discovery from transition. Reuse of this unit principle is expected; I found no other item whose correct key is disclosed as directly as i036.

The review follows existing BIZQ §§4.1–4.2: one answer must be justified by the visible facts, and the problem must still leave a meaningful decision for the learner. It does not claim whole-bank, source-admission, runtime, native or full BIZQ-01 acceptance.
