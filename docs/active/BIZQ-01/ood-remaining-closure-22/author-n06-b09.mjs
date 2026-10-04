import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const root=path.resolve('../patternly-content');
const source=JSON.parse(readFileSync(path.join(root,'content/object-oriented-design-interview/behavior_state_commands_events_and_workflows/OOD-N06-B09.json'),'utf8'));
const packet='docs/active/BIZQ-01/ood-remaining-closure-22';
const domainEvents='https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation';
const rows=[
{
 prompt:'In a music practice tracker, the learner completes a timed exercise. The completion record must capture the exercise version and score policy; badge and analytics updates may lag. The completion owner must validate and persist the result before returning success. Which boundary should the tracker use?',
 key:'Persist the valid version-bound completion first, then record a completion event for retryable badge and analytics consumers; keep score validation in the completion owner.',
 wrong:[
 ['Publish an ExerciseCompleted event before validating the score, and let badge handlers reject invalid completions.','A completion event would describe a result before the owner has established and stored its version and score policy.'],
 ['Let a delayed badge or analytics handler decide whether the score is valid.','A downstream handler may run later, but the prompt requires score validation before the tracker reports success.'],
 ['Call every badge and analytics service synchronously inside the completion owner.','Those updates may lag; requiring them in the completion call couples independent consumers to the timed exercise result.'],
 ['Publish a command asking each consumer to calculate and store the completion score.','The completion is one accepted domain fact owned by the tracker; consumer commands would split its score/version invariant.']],
 fact:'the completion and score policy must be valid before success, while badges and analytics can update later',
 mech:'A domain event names an accepted state change; it does not validate or perform the command. The completion owner remains responsible for the synchronous version/score invariant.',
 app:'The tracker records the completion with its exercise version and score policy. Separate consumers can process the accepted completion later without changing whether that exercise result was valid.',
 error:'The tempting event-before-validation option publishes “completed” while the score may still fail. That would let a consumer award a badge for a result the completion owner rejected.',
 boundary:'Use the event for the downstream badge/analytics work because it may lag. Keep any rule that determines whether this completion is valid inside the tracker’s command.',
 transfer:'For another exercise result, record the version-bound completion only after its score policy passes; emit a separate fact for downstream work.'
},
{
 prompt:'In a procurement approval queue, a manager may approve a bounded exception only after required controls pass. The approval must record who approved it and its scope. A search index and requester notice may update later, and event handling may be retried. Which design fits?',
 key:'Have the approval owner validate scope and controls, persist the attributed approval, then record an ExceptionApproved event for retryable indexing and notice.',
 wrong:[
 ['Publish ExceptionApproved as soon as the manager clicks approve, then let consumers run the required controls.','The click is a request, not an accepted approval; controls and bounded scope must pass before the event can state approval.'],
 ['Let the search-index consumer decide whether the exception is within scope and activate it.','Indexing is a downstream read model; it cannot own the approval controls that must pass before the queue reports approval.'],
 ['Block approval until every index and notice subscriber completes synchronously.','The prompt permits those projections to lag and retry; waiting for each consumer couples approval to optional downstream work.'],
 ['Emit one generic “approve exception” command and let each subscriber create its own attributed approval.','That can create divergent approval records; the queue owner must establish one scoped, attributed decision.']],
 fact:'approval scope and required controls are synchronous, but the index and notice may lag or retry',
 mech:'The aggregate/approval owner establishes the accepted state; the event describes that result for independent subscribers. Retry is a consumer concern, not a second approval decision.',
 app:'The approval record retains approver and scope. Search and requester views may catch up from the event, but neither can bypass the controls.',
 error:'Publishing at click time confuses a requested command with a completed approval. A failed control would then leave subscribers with a false approval fact.',
 boundary:'Decide the bounded approval synchronously. Use the event for indexing/notice only because the prompt allows those effects to lag and retry.',
 transfer:'For another exception type, retain the required control and attribution before emitting an event that names the accepted approval.'
},
{
 prompt:'In a podcast production desk, replacing a source recording must preserve annotations attached to stable segment IDs. The replacement owner validates the segment map and switches the recording reference as one accepted change. Search indexing may refresh later; a failed refresh must not change the accepted mapping. What should the workflow publish?',
 key:'After the validated reference switch, record a RecordingReferenceReplaced event with stable segment identifiers for the retryable search refresh.',
 wrong:[
 ['Publish RecordingReferenceReplaced before validating the segment map so the index can choose its own mapping.','The index is allowed to lag but cannot establish the stable segment correspondence required by the replacement owner.'],
 ['Let the search consumer decide whether annotations still point to the correct segments.','That would move the required annotation-mapping invariant out of the operation that changes the recording reference.'],
 ['Synchronously update every search index and annotation view before switching the source reference.','The mapping is the accepted change; waiting for every derived view adds synchronous coupling the prompt says is unnecessary.'],
 ['Emit a command telling each annotation consumer to rewrite its own segment IDs.','The stable IDs are already part of the recording replacement contract; consumers should observe the fact, not independently redefine it.']],
 fact:'the replacement and stable segment mapping must be validated together; search refresh may retry afterward',
 mech:'Record the domain event from the accepted reference transition. Keep the stable segment-ID mapping with that transition; a projection refresh does not decide whether annotations remain valid.',
 app:'The production desk switches to a recording only after validating the segment map. The search view can rebuild from that event while annotations continue to refer to the same segment identities.',
 error:'The nearest tempting alternative asks the search consumer to decide whether the mapping is valid. That consumer may lag, so it cannot protect the synchronous annotation invariant.',
 boundary:'Use the event for a derived search refresh. If a future consumer would change stable annotation IDs, that is part of the source replacement decision and must be handled by its owner.',
 transfer:'For another recording replacement, publish the accepted stable-ID mapping as a fact; do not ask projections to invent it.'
},
{
 prompt:'In a permissions review service, a temporary role grant must name its approving decision and expiry time. Authorization checks the expiry on every request; a cleanup job may run late. Audit indexing may retry. Which boundary should the service use?',
 key:'Validate the approval and expiry in the grant owner, persist the attributable grant, and record RoleGranted for audit indexing; authorization must still check expiry directly.',
 wrong:[
 ['Publish RoleGranted before checking the approval so the audit index can decide whether the role is valid.','A grant event must not describe a role that has not passed approval and expiry validation.'],
 ['Have the cleanup event handler remove expired roles before authorization can reject them.','Cleanup may be late, but the prompt requires request-time authorization to enforce expiry without it.'],
 ['Wait for audit indexing and cleanup to finish before recording the grant.','Both are downstream work; waiting would make authorization depend on subscriber timing even though it checks expiry itself.'],
 ['Send a GrantRole command to every subscriber and let each store its own expiry.','Independent subscriber copies could disagree about the approving decision or expiry; the grant owner establishes one record.']],
 fact:'grant approval and expiry are part of the accepted role record, while request-time authorization must enforce expiry even if cleanup lags',
 mech:'A grant event reports a persisted grant. It is not an expiry mechanism: the authorization owner enforces expiry on every access, and a cleanup subscriber only removes stale data.',
 app:'The role remains attributable to its approval and expiry. Late cleanup cannot extend access because the authorization check reads the expiry itself.',
 error:'Using cleanup as the expiry check fails the visible timing condition: the job may run late, while authorization must reject expired grants now.',
 boundary:'Emit the grant fact for audit indexing; keep approval and expiry enforcement synchronous with grant/access decisions.',
 transfer:'For another temporary permission, retain approval provenance and check expiry at authorization time even if cleanup consumers are delayed.'
},
{
 prompt:'In a document notarization service, a seal covers one exact immutable revision. The notary validates and records that revision’s seal as one accepted operation; a public search index may refresh later. Which design keeps the seal meaningful?',
 key:'Record the seal for the exact immutable revision, then emit RevisionSealed for the retryable public-index refresh.',
 wrong:[
 ['Emit RevisionSealed when a seal is requested, before confirming which immutable revision it covers.','A request does not establish a seal; the event must name the exact revision that passed notarization.'],
 ['Let the public index consumer decide which revision should be sealed.','The index is downstream and may lag; it cannot choose the authoritative revision covered by the notary.'],
 ['Wait until the public index has refreshed before recording the seal.','Index freshness is permitted to lag and cannot be part of the notary’s accepted seal operation.'],
 ['Publish a SealDocument command for every revision subscriber to execute independently.','Independent consumers could seal different revisions; the notary records one exact revision and publishes that fact.']],
 fact:'the seal must identify the exact immutable revision, whereas public indexing can lag',
 mech:'A domain event names the sealed revision after the notary accepts it. It is a fact about a completed transition, not a request to create seals in every subscriber.',
 app:'The seal record points to one immutable revision, so a later index refresh can expose that exact reference without changing what the notary sealed.',
 error:'Choosing the revision in the index consumer reverses ownership: indexing may be stale, while only the notarization operation can confirm the exact sealed revision.',
 boundary:'Keep revision selection and seal acceptance in the notary. Use the event for a derived public index that may refresh later.',
 transfer:'For another sealed document, record the exact immutable revision before publishing a fact for search or archive consumers.'
},
{
 prompt:'In a marketplace payout service, a payout may be released only for a settled order, and retries use the order’s idempotency key. The payout owner records the release result; a finance report can update later and deduplicate by payout ID. Which design fits?',
 key:'Keep settlement and idempotency checks in the payout owner, record the release result, then publish PayoutReleased for the deduplicating report.',
 wrong:[
 ['Publish PayoutReleased when release is requested and let the report consumer check settlement.','The report may lag and cannot decide whether the order was settled when the payout owner accepted the release.'],
 ['Let an asynchronous report handler enforce the idempotency key before the payout is released.','The key must prevent a duplicate release at the payout boundary; a later consumer cannot guard that synchronous effect.'],
 ['Wait for every finance report projection before recording the payout result.','The report can update later and deduplicate by payout ID, so it should not block the payout owner’s result.'],
 ['Publish a ReleasePayout command to every reporting consumer and let each issue a release.','That would turn one idempotent payout into multiple side-effect owners instead of reporting one accepted payout fact.']],
 fact:'settled-order and idempotency checks govern the release itself; the report may catch up and deduplicate by payout ID',
 mech:'The event follows the payout result and communicates that fact. Idempotency belongs where release is initiated; event consumers project or report it without performing another payout.',
 app:'The payout owner checks settlement and the stable key once. The finance report can retry an update because it deduplicates the released payout ID.',
 error:'Making the report handler enforce idempotency is too late: the payout could already be released before the handler runs.',
 boundary:'Keep duplicate prevention with the release operation; use an event for a downstream report whose update may lag.',
 transfer:'For another payout consumer, report the accepted payout ID while leaving settlement and retry safety with the payout owner.'
},
{
 prompt:'In a public-transit disruption board, a platform change receives an effective-time sequence number when accepted. Passenger displays must show changes in that sequence, but display refresh can be retried. The board owns the accepted change and sequence assignment. Which event contract fits?',
 key:'Record PlatformChangeAccepted with its assigned sequence after the board accepts it; let displays apply events by that sequence and retry refreshes.',
 wrong:[
 ['Publish a platform-change event before assigning its sequence and let displays choose the order.','The sequence is an accepted board fact; each display choosing an order could show a different effective history.'],
 ['Let the passenger display decide whether the platform change is valid and allocate its sequence.','Displays are projections; they cannot own the sequence assignment required for all consumers to agree.'],
 ['Wait for every passenger display to refresh before accepting the change.','Display refresh may retry, so it should not block the board from recording its accepted, sequenced change.'],
 ['Emit an unordered “change platform” command and let each display perform the change itself.','That distributes ownership and loses the one sequence assigned by the disruption board.']],
 fact:'the board assigns the effective-time sequence; displays may retry but must consume that same accepted order',
 mech:'The event carries the sequence as part of the accepted fact. The prompt does not promise event-delivery order, so displays use the sequence rather than arrival timing.',
 app:'The board remains the source of truth for a platform change. Passenger displays can replay or retry while presenting the board’s sequence consistently.',
 error:'Letting event arrival define order assumes delivery order the prompt does not guarantee. Consumers must apply the visible sequence instead.',
 boundary:'Publish the sequence the board assigned; if the board did not assign an authoritative sequence, downstream consumers cannot reconstruct one shared order.',
 transfer:'For another timetable change, include the accepted sequence in its event and let projections order by that value, not delivery timing.'
},
{
 prompt:'In a neighborhood energy-sharing service, a discharge reservation is accepted only if it creates no overlap for that meter. The schedule checks and records that invariant before responding. Participant notices may be retried and must not reserve a second window. Which design is appropriate?',
 key:'Keep the no-overlap check and reservation in the schedule owner, then publish DischargeWindowReserved for notice consumers to deduplicate by reservation ID.',
 wrong:[
 ['Publish DischargeWindowReserved before checking overlap so notice consumers can reject conflicting windows.','A notice consumer may run later; the schedule must not claim a reservation before enforcing no overlap.'],
 ['Let the notice subscriber check and enforce the meter’s overlap rule.','That subscriber is for notification, not reservation ownership; a delayed check cannot prevent the schedule from accepting overlap.'],
 ['Wait for all participant notices before recording the accepted reservation.','Notices can retry and must not reserve another window, so their delivery is separate from accepting the reservation.'],
 ['Send a ReserveWindow command to each participant and combine their responses into the schedule state.','Participant replies do not replace the schedule’s single meter-overlap decision and could create competing reservations.']],
 fact:'the schedule must enforce no overlap before acceptance, while retried participant notices must not create another reservation',
 mech:'Publish a fact after the schedule accepts one reservation. Keep the invariant at the schedule boundary; identify the reservation so notices can recognize the same change.',
 app:'The schedule decides whether a meter has an overlapping window. Subscribers only tell participants about the accepted reservation and can deduplicate by its ID.',
 error:'Delegating overlap to a notice subscriber is too late: its retryable work happens after the schedule must already decide whether to reserve.',
 boundary:'Use the event for notification. Any check that can accept or reject a window remains synchronous with the schedule operation.',
 transfer:'For another participant notice, reuse the reservation ID; never let notice delivery create a second window.'
},
{
 prompt:'In a live captioning studio, changing providers is allowed only when the replacement preserves the stream’s timing and error contract. The stream owner validates and activates the provider; monitoring dashboards may refresh later. Which boundary fits?',
 key:'Validate and switch the provider in the stream owner, then record CaptionProviderChanged for monitoring consumers.',
 wrong:[
 ['Publish CaptionProviderChanged before the replacement passes timing and error checks.','The event would announce a provider that the stream owner may still reject for breaking its contract.'],
 ['Let the monitoring dashboard decide whether the new provider preserves timing and error behavior.','The dashboard may lag and observes changes; the stream owner must enforce its contract before activation.'],
 ['Wait for dashboards to refresh before switching the provider.','Monitoring is a downstream view and should not determine when an already validated provider can become active.'],
 ['Issue a SwitchProvider command to every dashboard and let each select its own provider.','Dashboards would disagree about the active provider; the stream owner makes one transition and reports it.']],
 fact:'provider timing and error behavior must be validated before activation; dashboards are downstream views',
 mech:'The event reports a validated provider transition. It does not choose the provider or enforce the stream contract.',
 app:'One stream owner switches to the validated provider, so a delayed dashboard update cannot change which provider is active.',
 error:'Asking the monitoring dashboard to validate the provider confuses observation with enforcement; a delayed projection cannot guard activation.',
 boundary:'Use a domain event for monitoring after the stream transition; keep provider selection and timing/error checks with the stream owner.',
 transfer:'For another provider switch, validate the same stream contract at activation and publish the accepted provider identity for observers.'
},
{
 prompt:'In a volunteer coordination hub, swapping two assignments is valid only if both volunteers satisfy skill and availability checks. The roster owner applies the swap as one all-or-nothing change. An audit feed may update later and can retry by swap ID. Which design fits?',
 key:'Validate and apply the two-assignment swap in the roster owner, then publish AssignmentsSwapped with its swap ID for the audit feed.',
 wrong:[
 ['Publish AssignmentsSwapped after the first volunteer is moved and let the audit consumer complete the second move.','That describes a partial swap even though the roster owner must apply both assignments together.'],
 ['Let the audit consumer check skills and availability after it receives the swap event.','A delayed audit cannot decide whether the roster may accept a swap; both volunteers must pass before the owner commits.'],
 ['Wait for the audit feed to acknowledge before changing either assignment.','The audit can retry by swap ID and may update later; it need not participate in accepting the roster change.'],
 ['Send one SwapVolunteer command to every audit subscriber and let each mutate its local roster.','That splits one all-or-nothing roster decision among projections and could create inconsistent assignment copies.']],
 fact:'both assignments must pass skill/availability checks before one atomic roster change, while audit can retry by swap ID',
 mech:'The accepted event describes the complete swap, not one step in it. The roster owns the paired invariant; a downstream audit consumer records the resulting fact.',
 app:'The audit feed can catch up from one swap ID after both assignments have changed. It never fills in a missing half of the roster transition.',
 error:'Emitting after the first move exposes a partial state that the prompt forbids; the roster must commit both sides before publishing the accepted swap.',
 boundary:'Keep the paired skill/availability invariant at the roster boundary. Use an event only for the audit of the completed swap.',
 transfer:'For another paired assignment change, validate all affected volunteers before recording one event for the accepted group change.'
},
{
 prompt:'In a local-first map editor, an offline route merge must keep conflicts explicit and never overwrite accepted geometry silently. The route owner validates and commits geometry, conflict markers, and provenance together. A map-search projection can refresh later. What should the editor publish?',
 key:'After the route owner commits the validated merge, record RouteMergeAccepted for the retryable search projection; do not let that projection resolve conflicts.',
 wrong:[
 ['Publish RouteMergeAccepted before conflict validation so search can decide which geometry wins.','Search is a projection and may lag; conflict resolution belongs to the route merge that changes accepted geometry.'],
 ['Have the search consumer check for overlaps and reject or overwrite route segments.','That moves the no-silent-overwrite invariant to a delayed read model that does not own the geometry transition.'],
 ['Block the merge until every search projection has refreshed its route tree.','Search refresh may retry after commit, so it should not determine whether the validated merge is accepted.'],
 ['Publish a MergeRoute command for every projection to apply its own geometry update.','Independent projection writes could disagree about accepted geometry and bypass the route owner’s conflict markers.']],
 fact:'geometry, conflict markers, and provenance are committed together, while search projection refresh may lag',
 mech:'The event names an accepted merge after the route owner preserves its conflict invariant. A projection consumes the result; it does not make the merge decision.',
 app:'Search can rebuild from the accepted route state even when it retries. The route’s conflict markers and provenance remain authoritative.',
 error:'Letting search choose geometry makes a delayed projection the owner of conflict resolution, which is exactly the state change the route owner must protect.',
 boundary:'Publish an event for the derived search update; keep conflict validation and accepted geometry in the route operation.',
 transfer:'For another offline merge, commit geometry and its conflict/provenance records together before publishing the accepted merge fact.'
},
{
 prompt:'In a board-game campaign manager, a reward may be applied only in a legal campaign state. The campaign owner records the transition and reward ledger entry together. Achievement summaries may lag and retry by reward ID. Which design fits?',
 key:'Validate and record the reward with the campaign transition, then publish RewardApplied for achievement-summary consumers keyed by reward ID.',
 wrong:[
 ['Publish RewardApplied when the host requests a reward, before checking campaign state.','A requested reward may be illegal; the event must describe the campaign owner’s accepted transition.'],
 ['Let the achievement-summary consumer decide whether the campaign state permits the reward.','The summary can lag and cannot enforce the legal-state precondition for applying reward points.'],
 ['Wait for every achievement summary to update before recording the reward.','Summaries may retry, so their projection timing should not block a valid campaign transition.'],
 ['Send ApplyReward commands to each achievement consumer and let each write a reward ledger.','That creates multiple reward owners instead of one campaign ledger entry that summaries can read.']],
 fact:'legal campaign state and reward ledger entry are one accepted transition, while achievement summaries can retry by reward ID',
 mech:'A domain event records the accepted reward fact for projections. It is not a command that makes the reward legal; that check stays with the campaign transition.',
 app:'The campaign owner records one reward ID with the state transition. Summaries may catch up but cannot award points independently.',
 error:'Moving the legal-state check to the summary consumer permits the campaign command to accept an invalid reward before that consumer runs.',
 boundary:'Use an event for read-side achievement summaries; retain legal-state validation and the reward ledger at the campaign owner.',
 transfer:'For another campaign reward, test its legal precondition before committing and identify the committed reward for retryable projections.'
},
{
 prompt:'In a cold-chain logistics console, a carrier hand-off is accepted only if temperature restrictions and the receiving carrier are valid. The shipment owner records the new hand-off; a tracking projection may refresh later. Which design fits?',
 key:'Validate and record the hand-off in the shipment owner, then publish CarrierHandoffAccepted with the shipment revision for tracking.',
 wrong:[
 ['Publish CarrierHandoffAccepted when reassignment is requested, before receiver and temperature checks.','A request is not an accepted hand-off; the event would describe a carrier that may not meet the shipment constraints.'],
 ['Let the tracking projection decide whether the receiving carrier satisfies temperature restrictions.','Tracking can lag and must not authorize a hand-off that violates the shipment’s synchronous restriction.'],
 ['Wait for every tracking view to refresh before transferring hand-off ownership.','The projection may retry; it does not participate in the shipment owner’s accepted transfer.'],
 ['Send a TransferShipment command to all tracking consumers and let each change its carrier.','That distributes ownership across views and can make the shipment disagree about its current hand-off.']],
 fact:'temperature and receiver checks govern the hand-off itself, while tracking is a later projection',
 mech:'The hand-off event describes the shipment revision after its owner accepts the transfer. It does not replace the checks that make the carrier eligible.',
 app:'Tracking can rebuild the current carrier from a shipment revision; it cannot change which carrier owns the shipment.',
 error:'A tracking consumer is the wrong place to decide temperature eligibility because its retryable update occurs after the shipment owner has to accept or reject the transfer.',
 boundary:'Keep carrier eligibility and hand-off state with the shipment. Publish a fact for tracking after that transition.',
 transfer:'For another carrier change, validate restrictions before changing ownership and include the accepted shipment revision for projections.'
},
{
 prompt:'In a cooperative lending ledger, a repayment allocation may not reduce the outstanding balance below zero. The ledger applies an allocation only after checking the balance. An aging report and borrower notice may update later; each can deduplicate by allocation ID. Which design fits?',
 key:'Keep the balance check and allocation in the ledger, then publish RepaymentAllocated with its allocation ID for report and notice consumers.',
 wrong:[
 ['Publish RepaymentAllocated before checking the balance so report consumers can decide whether it is valid.','A report is downstream; it may run later and cannot prevent the ledger from accepting a negative balance.'],
 ['Let a borrower-notice handler enforce the nonnegative balance after the repayment is posted.','A delayed notice cannot guard the posting operation; the ledger must reject an allocation that would cross zero.'],
 ['Wait for the aging report and borrower notice to finish before applying the repayment.','Those consumers may retry and can deduplicate by allocation ID, so their completion need not block ledger posting.'],
 ['Send an AllocateRepayment command to report subscribers and let each update an installment.','That gives projections authority over balance-changing writes rather than reporting one ledger allocation.']],
 fact:'the ledger’s balance check is synchronous, while report and notice consumers can retry and deduplicate by allocation ID',
 mech:'The event is a fact about one posted allocation. The balance invariant remains inside the ledger command, not in asynchronous consumers.',
 app:'A report or notice can catch up from the allocation ID without making or changing the repayment itself.',
 error:'Making a notice handler enforce the balance rule is too late; the ledger may already have posted the repayment before the handler runs.',
 boundary:'Use an event for aging and notice projections; keep the nonnegative-balance invariant with the ledger write.',
 transfer:'For another repayment subscriber, identify the allocation for deduplication and leave posting authority with the ledger.'
},
{
 prompt:'In a tournament bracket service, a forfeit is accepted only from a legal match state, and match transition plus bracket advancement are one bracket-owned change. Standings and participant notices may update later and deduplicate by match ID. Which design fits?',
 key:'Validate and advance the bracket in one legal transition, then publish MatchForfeited for standings and notice consumers keyed by match ID.',
 wrong:[
 ['Publish MatchForfeited when timeout is reported, before checking the match state.','A timeout report is not an accepted forfeit; the event could advance standings for an illegal transition.'],
 ['Let the standings consumer check match legality and advance the bracket.','Standings may lag and do not own the state transition that determines whether a match can be forfeited.'],
 ['Wait for all standings and notice consumers before recording the legal bracket transition.','Those projections may retry; requiring them to finish couples the bracket state to downstream delivery.'],
 ['Send an AdvanceBracket command to standings and notice consumers and combine their results.','Consumers should observe one bracket-owned transition, not independently advance or decide the bracket.']],
 fact:'legal match transition and bracket advancement are one accepted change; projections can retry by match ID',
 mech:'The event reports a completed bracket fact. It must not be used as the command that chooses or performs advancement in downstream consumers.',
 app:'The bracket owner advances once after checking the legal state; standings and notices derive from that accepted match result.',
 error:'Letting standings advance the bracket moves the state machine to a delayed projection and can make it advance an invalid forfeit.',
 boundary:'Keep match legality and advancement in the bracket owner; publish the result for retryable read-side and notice work.',
 transfer:'For another match outcome, commit the legal bracket transition first and let projections deduplicate its match ID.'
},
{
 prompt:'In a returns inspection workflow, classification uses condition facts and remains separate from refund eligibility. The inspection owner records a classification; a routing dashboard may refresh later. Which design fits?',
 key:'Record the accepted ReturnClassified fact after inspection, then let the routing dashboard refresh; keep refund eligibility as a separate decision.',
 wrong:[
 ['Publish ReturnClassified before the inspection owner has evaluated the condition facts.','The event would claim a class without the inspection decision that establishes it.'],
 ['Let the routing dashboard decide refund eligibility from the classification event.','The prompt keeps refund eligibility separate; the dashboard cannot turn a classification into refund approval.'],
 ['Wait for every routing view before recording the classification.','Routing may lag, and its refresh does not determine whether the condition facts support the class.'],
 ['Publish a RefundReturn command to each consumer so each one decides whether to refund.','That conflates classification with the explicitly separate refund decision and distributes refund authority.']],
 fact:'the inspection owner records classification from condition facts; refund eligibility remains a separate decision',
 mech:'ReturnClassified describes a classification that has already been made. Event consumers can route that fact without converting it into a refund authorization.',
 app:'The dashboard may use a classification for routing, while the refund decision remains with its separate owner.',
 error:'The tempting refund command collapses two decisions the prompt explicitly separates; a class is not an approval to refund.',
 boundary:'Publish classification for downstream routing; keep refund eligibility out of that classification event.',
 transfer:'For another return class, emit the accepted class and require the separate refund check before any refund.'
},
{
 prompt:'In a research-notebook platform, a published result snapshot must reference exact immutable inputs and a code version. The notebook owner records that snapshot identity; a catalog and retention view may update later and retry by snapshot ID. Which design fits?',
 key:'Persist the snapshot identity with its immutable input and code references, then publish SnapshotRecorded for catalog and retention consumers.',
 wrong:[
 ['Publish SnapshotRecorded before capturing which input and code version the result used.','The event would lack the exact immutable pair required to define the published snapshot.'],
 ['Let the retention consumer decide which input/code pair is the authoritative snapshot.','Retention may lag and cannot choose the identity that the notebook owner accepted.'],
 ['Wait for every catalog and retention view to complete before recording the snapshot.','Those views can retry by snapshot ID and do not determine the immutable source references.'],
 ['Send a CreateSnapshot command to catalog subscribers so each captures its own inputs.','Independent captures can bind different inputs or code versions instead of one notebook-owned snapshot.']],
 fact:'one accepted snapshot identity binds the exact immutable input and code version; catalog/retention projections can retry by its ID',
 mech:'The event reports a snapshot reference after the notebook records it. It is not a request for each consumer to capture another snapshot.',
 app:'Catalog and retention views can rebuild from the same snapshot ID and source references without changing what was published.',
 error:'Having a retention consumer choose the input/code pair reverses ownership and could make the published identity differ between projections.',
 boundary:'Keep immutable-source selection with the snapshot owner; use the event for views that can lag and retry.',
 transfer:'For another result snapshot, include the accepted snapshot ID and exact source references in the fact consumed downstream.'
},
{
 prompt:'In a collaborative annotation workspace, a comment is accepted only with its author and document revision. The review owner persists those fields with the comment. Notification may be retried, and the notification consumer can deduplicate by comment ID. Which design fits?',
 key:'Persist the attributed comment first, then publish CommentAccepted with its comment ID for the retryable notification consumer.',
 wrong:[
 ['Publish CommentAccepted when the editor submits the form, before author and revision are validated.','A submitted form is not an accepted attributed comment; the event could omit or misstate both binding facts.'],
 ['Let the notification consumer decide whether the comment belongs to the current revision.','The consumer may run later and cannot establish attribution for a comment already persisted by the review owner.'],
 ['Wait for notification delivery to finish before persisting an accepted comment.','Notification may retry by comment ID; its delivery timing should not decide whether the review owner accepts the comment.'],
 ['Send an AcceptComment command to every notification channel and let each store a copy.','That creates multiple comment records instead of one attributed comment with a separate notification side effect.']],
 fact:'author and revision binding are part of acceptance, while notification may retry and deduplicate by comment ID',
 mech:'CommentAccepted is a fact about a persisted comment. Notification observes the fact; it does not create or validate the comment.',
 app:'The review owner stores one author/revision-bound comment. A retried notice uses its stable ID rather than creating another comment.',
 error:'Accepting the form before checking its author and revision publishes a fact that does not satisfy the comment’s attribution contract.',
 boundary:'Keep comment acceptance and binding with the review workflow; use a separate event consumer for notification.',
 transfer:'For another comment channel, deduplicate notifications by the accepted comment ID without changing its stored author or revision.'
}
];
if(rows.length!==18||source.length!==18)throw new Error('expected 18 B09 items');
const eventSource='https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation';
const questions=rows.map((r,i)=>{
 const old=source[i],stem=`n06b09_i${String(i+1).padStart(3,'0')}`;
 const correctId=old.answer.optionId;
 const options=[{optionId:correctId,text:r.key},...r.wrong.map((w,j)=>({optionId:`${stem}_alt${j+1}`,text:w[0]}))];
 const messages=r.wrong.map((w,j)=>({kind:'wrong_option',targetId:`${stem}_alt${j+1}`,text:w[1]}));
 return {questionId:old.questionId,trackId:old.trackId,nodeId:old.nodeId,mentalUnitId:old.mentalUnitId,prompt:r.prompt,difficulty:old.difficulty,
 interaction:{type:'choice_single',scoringMethod:old.interaction.scoringMethod,options},answer:{type:'choice_single',optionId:correctId},
 feedback:{type:'choice_single',reason:`${r.fact.charAt(0).toUpperCase()+r.fact.slice(1)}. The event communicates the accepted change; it does not replace its owner’s required synchronous decision.`,details:{mechanismOrProperty:r.mech,scenarioApplication:r.app,errorCorrection:r.error,boundaryOrTradeoff:r.boundary,transfer:r.transfer},messages},sourceRefs:[eventSource]};
});
writeFileSync(path.join(packet,'proposals/N06-B09.json'),JSON.stringify(questions,null,2)+'\n');
console.log(`wrote ${questions.length} N06-B09 whole questions`);
