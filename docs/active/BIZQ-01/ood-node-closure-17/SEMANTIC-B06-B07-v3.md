# Independent semantic review — OOD N02 B06 v2 and B07 v4

**Verdict: PASS for both reviewed units.** This report supersedes the B07 portion of `SEMANTIC-B06-B07-v2.md` after two whole-object corrections. Frozen inputs:

- `REVIEWED-B06-v2.json`, SHA-256 `46ba770ef4ebeb58c0f4a7e0dc312afb89c4d5efd17474612276276b6975249b` (19 items).
- `REVIEWED-B07-v4.json`, SHA-256 `781ed817fdddc5e6533e46136ecbae1aef116ab53ae7b4ed2f3c9cf7d198881e` (19 items).

B06 differs from v1 only at i025/i036/i038; I read those complete objects and reuse prior PASS evidence for the 16 exact unchanged objects. B07 v4 differs from v3 only at i023 and i037; I reread those two complete objects and reuse the v3 whole-object review for the 17 exact matches, including their revised Details. That review read all 19 B07 questions and all 19 Details narratives. This is semantic review of frozen proposal content, not source admission, learner-pool reachability, or runtime acceptance.

I applied BIZQ-01 §4.1 and docs/07 §§4.1, 4.4, and Choice-item contract: one defensible single-choice answer from visible facts, plausible alternatives, accurate stable-ID diagnostics, and case-applied teaching Details. Similar examples are acceptable where the decision differs; no prose or concept-count quota is imposed.

## B06 — entity identity, equality, and hash keys

| Item | Verdict | Decision evidence |
|---|---|---|
| i020 | PASS (reused) | Grant ID remains the identity through role/expiry changes; the prompt says one approval can issue multiple grants. |
| i021 | PASS (reused) | Multiple seals may reference one immutable revision; seal ID still distinguishes records. This is not N01 B04 i030’s signer-rejection transition. |
| i022 | PASS (reused) | A fixed payout ID identifies retry of the same payout; equal amounts do not merge sellers’ payouts. |
| i023 | PASS (reused) | Original and superseding notices remain distinct even if time/platform match. |
| i024 | PASS (reused) | Reservation identity survives interval changes/cancellation, and multiple reservations may share a meter. |
| i025 | PASS | Separately loaded objects with the same immutable session ID must compare equal and derive hashes from that same ID. Provider settings/history are explicitly mutable, so this equality/hash task is distinct from accepted N01 B03 i029’s domain identity question. The objective is broad but consistent with the stable-session decision. |
| i026 | PASS (reused) | Distinct assignments remain separate when occupants change. |
| i027 | PASS (reused) | Identical-geometry submissions remain independently reviewable by edit ID. |
| i028 | PASS (reused) | Saved reward claim resolves the same character after quest progress changes; distinct from N01 B02 i027’s eligibility result. |
| i029 | PASS (reused) | Shipment ID survives carrier reassignment; carrier is a separate reference. |
| i030 | PASS (reused) | Independently reversible allocations remain distinct despite equal values. |
| i031 | PASS (reused) | Match ID persists across state changes; event hash identifies a transition. |
| i032 | PASS (reused) | Battery serial tracks physical identity while inspection category changes. |
| i033 | PASS (reused) | Byte-identical executions remain separately auditable by run ID. |
| i034 | PASS (reused) | Equal comment text/revision does not merge separately authored comment records. |
| i035 | PASS (reused) | Delivery retries retain submission identity; status/content are not the submission key. |
| i036 | PASS | Retry keeps the issue ID; corrected reissue creates a new linked ID. Prompt, key, all option messages, and Details agree on that boundary. |
| i037 | PASS (reused) | Badge ID keeps a revoked badge distinct from its person and replacement badge. |
| i038 | PASS | The corrected prompt says each reprint after address correction is a new record, and different labels may show the same address. Key, Reason, messages, and Details consistently preserve print identity instead of merging by address or bytes. |

## B07 — construction-time invariants versus changing operation checks

All 19 Details were checked against their visible prompt and closest distractors in v3. They now explain the item’s local invariant, case application, tempting error, boundary, and transfer without repeating the former generic “stable creation facts” template. The v3 primary corrections also distinguish the closest accepted N01 decisions: i022 score range versus N01 B03 i021 revision/policy association; i024 duplicate mapping destinations versus N01 B02 i018 missing target/no-partial activation; i027 final settled money values versus payout retry identity; i028 inclusive per-route time and acceptance recheck versus N01 B04 i032 effective-event correction; i038 successful-run output versus N01 B02 i032 provenance completeness. The separate adjudication `ADJUDICATION-B07-i026.md` correctly treats factory input and post-rejection state as different decisions.

| Item | Verdict | Decision evidence |
|---|---|---|
| i020 | PASS | Require battery/aircraft IDs as stable input; check changing exclusivity at commit. Details explains the stale-read race. |
| i021 | PASS | Construct a complete referral from patient, specialty, and consent reference; obtain fresh authorization before sending. |
| i022 | PASS | Enforce integer score 0–100, inclusive, preserving zero; do not clamp the scorer’s value. Distinct from revision/policy association in N01 B03 i021. |
| i023 | PASS | The correction now says the accepted-evidence factory receives the complete fields together and that the alternative public empty constructor creates a second path exposing a partial record. This accurately diagnoses local1 and removes the prior false claim that an empty constructor could not expose partial state. |
| i024 | PASS | With completeness given, require distinct destination IDs for distinct old annotation anchors. This is distinct from N01 B02 i018’s missing mapping/no-partial-replacement decision. |
| i025 | PASS | Validate grant ID, approval reference, and expiry ordering from supplied values; current approver authority was already checked before construction. |
| i026 | PASS | Factory captures an exact immutable document revision before editable state can change. Separate adjudication confirms this differs from N01 B04 i030’s legal result after signer rejection. |
| i027 | PASS | Copy final amount/currency from the settled order; do not reconstruct from mutable draft/catalog inputs. |
| i028 | PASS | Require station/platform/effective instant; use the explicit `newTime >= latestAcceptedTime` rule and recheck after reloading current route state at acceptance. |
| i029 | PASS | Check interval shape locally and schedule overlap against changing shared state at commit. |
| i030 | PASS | Check language and timing compatibility while retaining the stream-facing error contract; configuration validity does not promise reachability or successful switch. |
| i031 | PASS | Reject identical assignment IDs at request creation; recheck changing skills/availability at execution. |
| i032 | PASS | Capture the parent route revision and retain a stale edit as a branch for later review, without overwriting newer geometry. |
| i033 | PASS | Require prior eligibility tied to the campaign revision; claim construction neither manufactures eligibility nor changes quest state. |
| i034 | PASS | Require both temperature compatibility and custody acknowledgement from the acceptance record before reassignment. |
| i035 | PASS | Validate amount against the stated snapshot and recheck the mutable balance at posting. |
| i036 | PASS | Require active state plus elapsed timeout, then recheck match state before commit; no stale forfeit may advance a finalized match. |
| i037 | PASS | The corrected local4 message now diagnoses that “refund pending” is a downstream policy result, not an allowed inspection category. It no longer invents category immutability. The additional allowed-category invariant makes this distinct from N01 B02 i031’s classification-recorded/no-refund outcome. |
| i038 | PASS | Require succeeded status and terminal output for PublishedResult; failed-run diagnostics remain a separate record. This differs from N01 B02 i032’s missing code-version provenance check. |

The two v3 blockers are resolved in v4: i023’s scenarioApplication now describes the actual partial-record path, and i037’s local4 feedback matches the current option. The other 17 B07 objects are exact v3 objects and retain their item-level review. No proposal or production content was changed by this review.
