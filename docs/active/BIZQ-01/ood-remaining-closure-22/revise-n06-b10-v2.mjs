import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const packet = path.resolve('patternly/docs/active/BIZQ-01/ood-remaining-closure-22');
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const frozenBytes = readFileSync(path.join(packet, 'review-inputs/N06-B10-v1.json'));
assert.equal(digest(frozenBytes), '16b91e2845748d26aef9f509af728d952d5e2f6918c95a5d0af730f9b9e4ce9b');
const questions = JSON.parse(frozenBytes.toString('utf8'));
assert.equal(questions.length, 18);

const cases = [
  {
    id: 1,
    key: 'Keep the charger hold provisional: confirm only after authorization; release it on decline or expiry.',
    reason: 'A temporary slot claim can be undone, but a confirmed booking cannot represent a declined or expired attempt.',
    wrong: [
      ['Confirm the booking as soon as the slot is held, then leave it confirmed if payment authorization is declined.', 'The hold is provisional; a declined attempt must leave the slot available, not preserve a confirmed booking.'],
      ['Authorize payment before taking the charger hold, then leave the reservation pending if no slot remains.', 'The case explicitly places the hold before authorization, so payment work can begin only after capacity is reserved.'],
      ['Keep a declined attempt reserved for the driver and let another driver wait until retry succeeds.', 'A declined or expired attempt must return the slot to availability rather than strand capacity.'],
      ['Treat an expired hold as a confirmed booking if the payment request was already sent.', 'Sending a payment request does not keep an expired hold valid or confirm the reservation.'],
    ],
    note: {
      learningObjective: 'Distinguish a reversible charger hold from a confirmed booking when payment authorization can fail.',
      decisiveFact: 'The slot is held before authorization; decline or expiry must leave the slot available and produce no charge.',
      nearestAlternative: 'Confirming at hold time is attractive because capacity is secured, but it exposes a booking before authorization succeeds.',
      changedCondition: 'If the hold could not expire and authorization could not fail, there would be no failed-attempt compensation to coordinate.',
    },
  },
  {
    id: 2,
    key: 'Commit canonical metadata first; retry indexing from that revision without undoing the merge.',
    reason: 'The archive accepts the merge; the index is a dependent view and cannot decide or reverse the canonical record.',
    wrong: [
      ['Refresh search from proposed fields first and let its result choose which metadata becomes canonical.', 'The archive record is canonical; the derived index cannot decide which merge is accepted.'],
      ['Keep the merge uncommitted until indexing succeeds, including during an index outage.', 'The prompt says the merge remains accepted when indexing is unavailable, so index success is not a commit prerequisite.'],
      ['Commit the merge, but delete it if the search refresh cannot be completed immediately.', 'An index outage is retryable and does not undo the accepted canonical merge.'],
      ['Assign a new asset ID whenever indexing retries so the archive and index can reconcile independently.', 'The asset ID must remain stable across the merge; an index retry must not replace that identity.'],
    ],
    note: {
      learningObjective: 'Separate acceptance of a canonical metadata merge from the retryable search projection.',
      decisiveFact: 'The merge commits before indexing, remains accepted during an outage, and retries from its committed revision while preserving asset ID.',
      nearestAlternative: 'Waiting for search before committing looks safer, but directly contradicts the stated accepted-merge behavior during outages.',
      changedCondition: 'If the index were itself the canonical metadata owner, the authority boundary would differ; here it is explicitly a projection.',
    },
  },
  {
    id: 3,
    key: 'Complete territory, expiry, and recipient checks before the irreversible delivery.',
    reason: 'The work cannot be undisclosed after delivery, so authorization must be settled before the external effect.',
    wrong: [
      ['Check territory and expiry, deliver, then verify that the selected recipient was authorized.', 'Recipient authorization is one of the required preconditions and cannot be repaired after disclosure.'],
      ['Send to every possible recipient while checks run, then cancel the unauthorized deliveries.', 'The work may be acted on immediately, so cancellation cannot undo disclosures to extra recipients.'],
      ['Deliver first and rely on a revocation notice as compensation if a check fails.', 'Revocation can restrict future access but cannot erase the disclosure the prompt forbids.'],
      ['Let each recipient determine its own rights after it receives the work.', 'The tool must establish territory, expiry, and recipient authorization before release, not delegate the checks after delivery.'],
    ],
    note: {
      learningObjective: 'Place all authorization checks before an irreversible external disclosure.',
      decisiveFact: 'A failed territory, expiry, or recipient check must prevent delivery because a recipient can act immediately.',
      nearestAlternative: 'Post-delivery revocation can limit later access, but it cannot restore confidentiality already lost.',
      changedCondition: 'If delivery were a private reversible staging step, it could precede final release; the prompt says it is externally actionable.',
    },
  },
  {
    id: 4,
    key: 'Pair the two assignments at commit; release the battery hold if the slot check fails.',
    reason: 'The accepted plan has both resources or neither; only the temporary battery claim is reversible preparation.',
    wrong: [
      ['Record the battery assignment first and leave it assigned if the aircraft slot later conflicts.', 'The prompt requires neither assignment to be recorded on a slot conflict, so the partial battery assignment is invalid.'],
      ['Reserve the aircraft slot, release the battery hold, and record the pair before checking both claims.', 'A released battery is no longer secured for the paired plan, so the recorded assignment could lack its required resource.'],
      ['Keep the battery held after a conflict so an operator can finish the maintenance plan manually.', 'The conflict outcome explicitly returns the battery to the available pool rather than retaining a failed attempt.'],
      ['Publish whichever assignment succeeds first and reconcile the missing side in the next planning run.', 'A partial plan is not an accepted outcome; both assignments must be recorded together or neither.'],
    ],
    note: {
      learningObjective: 'Coordinate paired resource claims while compensating only the reversible hold on a failed second claim.',
      decisiveFact: 'A slot conflict requires both assignments to remain unrecorded and the battery to return to availability.',
      nearestAlternative: 'Publishing the first successful claim can appear to preserve progress, but the case rejects any one-sided plan.',
      changedCondition: 'If a battery assignment could legally stand without an aircraft slot, the pair would not be an all-or-nothing invariant.',
    },
  },
  {
    id: 5,
    key: 'Validate all three gates before one send; make a retry refer to the same referral.',
    reason: 'The send is irreversible, so retries must not turn an uncertain receipt into a second disclosure.',
    wrong: [
      ['Check consent and specialty, send, and verify the recipient identity after the clinic receives the referral.', 'Recipient identity is required before sending; a later check cannot undo disclosure to the wrong clinic.'],
      ['Send to all clinics in the specialty and ask the patient to select the intended recipient afterward.', 'The permitted recipient must be confirmed first; sending broadly discloses information to unapproved clinics.'],
      ['Create a new referral for each retry whenever the clinic receipt is delayed.', 'A delayed receipt is not permission for a second disclosure; a retry must refer to the existing referral.'],
      ['Ask the clinic to confirm consent after it receives the patient information.', 'The external clinic cannot provide the patient’s consent retroactively after disclosure.'],
    ],
    note: {
      learningObjective: 'Distinguish pre-send privacy conditions from retry handling after an irreversible referral send.',
      decisiveFact: 'Consent, specialty, and recipient identity are all required before the clinic receives information and may act.',
      nearestAlternative: 'Sending broadly and narrowing later is operationally convenient, but it discloses information before recipient authorization.',
      changedCondition: 'If the external send were only a private draft, the irreversible boundary would occur later; the prompt says the clinic may act immediately.',
    },
  },
  {
    id: 6,
    key: 'Accept completion only after its version-bound score passes; retry badge and analytics from that record.',
    reason: 'The recorded exercise version determines score validity; downstream consumers cannot replace the completion decision.',
    promptSuffix: ' A valid completion remains accepted while those downstream updates lag.',
    wrong: [
      ['Award the badge before validating the score, then revoke it if the recorded version fails.', 'This can expose a completion effect for a score that the required version-bound check rejects.'],
      ['Use a score from the learner’s latest exercise version even when the recorded attempt names an older version.', 'The prompt requires validating the version attached to the recorded exercise, not substituting another version’s score.'],
      ['Let analytics recalculate the score and overwrite the completion owner’s accepted result.', 'Analytics is a downstream update; it cannot become the authority for a version-bound completion.'],
      ['Remove a valid completion whenever badge delivery is delayed, then ask the learner to submit again.', 'A downstream delay does not invalidate the accepted completion or require a second exercise submission.'],
    ],
    note: {
      learningObjective: 'Keep version-specific completion acceptance separate from retryable badge and analytics projections.',
      decisiveFact: 'The score is tied to the recorded exercise version, while a valid completion remains accepted during downstream lag.',
      nearestAlternative: 'Waiting for consumers or letting them recalculate appears to simplify consistency, but it delegates completion authority to projections.',
      changedCondition: 'If analytics were the designated score authority rather than a downstream update, its role in acceptance would be different.',
    },
  },
  {
    id: 7,
    key: 'Persist one attributed approval only after both controls pass; index and notify afterward.',
    reason: 'A denial by either mandatory control must leave no approval state for downstream consumers to misread.',
    wrong: [
      ['Write a provisional approval after control one, then revoke it if control two denies the request.', 'A provisional approval is still a partial approval record, which the prompt forbids on second-control denial.'],
      ['Create two approval records, one for each passing control, and combine them after indexing.', 'The scenario requires one attributed decision after both controls, not separate records that can be mistaken for approval.'],
      ['Let search determine whether the exception meets the controls, then write an approval from its index result.', 'Search is a downstream projection and is not one of the two required approval controls.'],
      ['Notify the requester after the first control and revise the decision if the second later denies.', 'Requester notice follows the final decision; an early notice exposes a provisional outcome the prompt excludes.'],
    ],
    note: {
      learningObjective: 'Sequence mandatory checks before one attributed decision and keep indexing/notice downstream.',
      decisiveFact: 'Control two may deny, in which case no partial approval exists; search and notice follow the decision.',
      nearestAlternative: 'A provisional record can seem useful for progress reporting, but it becomes a partial approval if the second control denies.',
      changedCondition: 'If the first control were final authority, there would be no second precondition to resolve before persistence.',
    },
  },
  {
    id: 8,
    key: 'Validate the map before switching; refresh search from the accepted reference.',
    reason: 'Annotation identity depends on the validated mapping, while search can be rebuilt after the canonical switch.',
    wrong: [
      ['Switch the canonical reference first, then validate the segment map and revert if validation fails.', 'The old recording must remain active on map failure; switching first exposes an unvalidated replacement.'],
      ['Delete the old recording before checking the replacement map so annotations cannot refer to two sources.', 'If validation fails, the prompt requires the old recording to remain active instead of leaving no usable source.'],
      ['Guess the new annotation mapping from search results and let each search index update it independently.', 'The producer must validate one segment map before switching; derived search indexes cannot choose annotation identity.'],
      ['Undo a successful canonical switch whenever a later search refresh fails.', 'Search is retryable after the accepted switch and does not invalidate the validated recording reference.'],
    ],
    note: {
      learningObjective: 'Separate reversible replacement preparation from the accepted source-reference switch and later search refresh.',
      decisiveFact: 'A validated stable-segment map is required before switching; failure preserves the old source, while search may retry afterward.',
      nearestAlternative: 'Switching optimistically and reverting looks fast, but it exposes the replacement before annotation continuity is known.',
      changedCondition: 'If search owned annotation identity, it could inform mapping; the scenario assigns mapping validation to the producer before switch.',
    },
  },
  {
    id: 9,
    key: 'Persist only an approved, unexpired grant; check expiry on access and retry notice separately.',
    reason: 'The grant’s acceptance facts govern access directly; notification and scheduled cleanup are not authorization checks.',
    wrong: [
      ['Grant access when review is submitted, then revoke it later if approval is denied.', 'Submission is not approval, so access can be exposed before the required decision exists.'],
      ['Check expiry only when the cleanup job runs and trust the stored role until then.', 'The prompt requires authorization to check expiry on each request, independent of cleanup timing.'],
      ['Delete an otherwise valid grant whenever notification delivery fails.', 'Notification is retryable after persistence and cannot cancel an approved, unexpired grant.'],
      ['Delay the approval decision until the notification service confirms delivery.', 'Notification follows the persisted grant; delivery success is not an approval or expiry condition.'],
    ],
    note: {
      learningObjective: 'Keep grant validity with request-time authorization and treat notification/cleanup as independent follow-up work.',
      decisiveFact: 'The grant needs approval and expiry, and every access request checks expiry even if cleanup is delayed.',
      nearestAlternative: 'Using cleanup as the expiry authority is simpler, but it permits access between expiry and the next cleanup run.',
      changedCondition: 'If expiry were enforced only by scheduled revocation, the prompt would need to allow cleanup lag to extend access.',
    },
  },
  {
    id: 10,
    key: 'Seal the chosen immutable revision; retry indexing from the seal record.',
    reason: 'The notary’s recorded revision is authoritative; a public index reports it but cannot select or undo it.',
    wrong: [
      ['Seal a mutable draft and replace its contents after the index has published the seal.', 'The seal must identify one exact immutable revision, not a draft whose contents can change afterward.'],
      ['Publish a seal event before selecting which immutable revision it will identify.', 'The seal target must be known before recording; the event cannot precede selection of its exact revision.'],
      ['Let the public index select the revision the notary should seal based on its latest search result.', 'The notary records the authoritative revision; a derived index does not choose the seal target.'],
      ['Remove a recorded seal whenever public indexing is unavailable, then create another after recovery.', 'The seal remains authoritative during an index outage; indexing retries from that record.'],
    ],
    note: {
      learningObjective: 'Bind an irreversible seal to an exact immutable revision and keep public indexing downstream.',
      decisiveFact: 'The target revision is immutable and exact; once recorded, the seal remains authoritative through index failure.',
      nearestAlternative: 'Using the latest index result seems convenient, but it lets a derived projection choose what the notary attests to.',
      changedCondition: 'If the notary were sealing a mutable working copy, the target would not meet the stated immutable-revision contract.',
    },
  },
  {
    id: 11,
    key: 'Settle only on bank confirmation; free the hold on rejection and retry reporting by payout ID.',
    reason: 'A transfer request is not its outcome, and a report retry must not be mistaken for a second bank transfer.',
    wrong: [
      ['Mark the payout complete when the transfer is requested, then amend it if the bank rejects.', 'A request can be rejected; recording payout success before confirmation reports an effect that did not occur.'],
      ['Keep the funds reserved after confirmed rejection so a later transfer attempt can reuse them.', 'The prompt explicitly releases the reservation on bank rejection; retaining it strands unavailable funds.'],
      ['Issue a second bank transfer whenever the first response is delayed, then deduplicate report rows by payout ID.', 'The ID is specified for report retries only; it does not promise that the bank will deduplicate repeated transfers.'],
      ['Have the report update issue the transfer again whenever its payout row is missing.', 'The report is downstream; its retry updates the existing payout record and is not a new transfer command.'],
    ],
    note: {
      learningObjective: 'Separate external transfer outcome, reversible reservation handling, and report-only retry identity.',
      decisiveFact: 'Bank rejection frees the reservation; success is recorded under a payout ID, and only the report update retries by that ID.',
      nearestAlternative: 'Resending on a delayed bank response may recover a lost transfer, but the scenario supplies no bank-side idempotency guarantee.',
      changedCondition: 'If the bank explicitly deduplicated a transfer key, retries could be scoped differently; the stated payout ID is for reporting only.',
    },
  },
  {
    id: 12,
    key: 'Accept only after conflict validation and sequence assignment; release the hold on failure, then notify.',
    reason: 'The board decides acceptance and sequence; displays consume that result and may refresh later.',
    wrong: [
      ['Notify passengers when the platform is tentatively reserved, then correct the notice if conflict validation fails.', 'A rejected change must produce no passenger notice; tentative capacity is not an accepted platform change.'],
      ['Let each display assign its own effective-time sequence when the change arrives.', 'The change has one authoritative sequence; consumer-assigned values could disagree about its order.'],
      ['Keep the platform reservation after a rejected conflict check so a dispatcher can resolve it later.', 'The failed validation requires releasing the temporary reservation, not keeping a rejected change active.'],
      ['Reject an accepted change whenever one display has not refreshed its projection yet.', 'Displays may refresh later by sequence; their lag does not decide whether the board accepted the change.'],
    ],
    note: {
      learningObjective: 'Place conflict validation and authoritative sequence assignment before acceptance and passenger notice.',
      decisiveFact: 'A failed check releases the temporary platform and sends no notice; accepted changes carry a sequence displays can catch up to.',
      nearestAlternative: 'Letting displays create their own order appears locally convenient, but it loses the single sequence supplied by the board.',
      changedCondition: 'If each display were an independent authority, there would be no shared effective sequence for the accepted change.',
    },
  },
  {
    id: 13,
    key: 'Record the non-overlapping window once; retry its notice using the reservation ID.',
    reason: 'The schedule owns overlap validation; a delivery retry reports the accepted window rather than allocating another.',
    wrong: [
      ['Notify the participant first and let the notification channel reserve a meter window if delivery succeeds.', 'The schedule must check overlap before a reservation exists; notification success cannot enforce that invariant.'],
      ['Create a fresh reservation for every notice retry so each delivery has its own window ID.', 'A notice retry must not create another meter window; it refers to the existing reservation ID.'],
      ['Revoke the accepted reservation when a participant notification cannot be delivered.', 'The prompt allows notification failure to retry; failure to deliver does not cancel the accepted reservation.'],
      ['Let each notification channel reserve independently and merge any overlapping windows afterward.', 'Independent channel allocation can create the overlap the schedule is required to prevent.'],
    ],
    note: {
      learningObjective: 'Keep interval uniqueness in the schedule and make notification retries refer to the accepted reservation.',
      decisiveFact: 'The reservation must be non-overlapping before notice; retries use its ID and cannot create another window.',
      nearestAlternative: 'Allocating separately per channel may simplify delivery, but it bypasses the single overlap check.',
      changedCondition: 'If participants could reserve intervals themselves, the schedule would not be the sole owner of overlap acceptance.',
    },
  },
  {
    id: 14,
    key: 'Switch only after the candidate passes; retain the active provider on failure.',
    reason: 'Testing is the acceptance boundary for traffic; the existing provider remains the fallback until the candidate passes.',
    wrong: [
      ['Move traffic to the candidate first and use monitoring to discover whether timing and errors meet the contract.', 'The candidate must pass the timing/error test before it receives traffic; monitoring is not a substitute for that test.'],
      ['Remove the active provider before testing the replacement so the studio cannot use two configurations.', 'The old provider must remain active if the staged candidate fails.'],
      ['Keep a failed candidate active but label it staged until a later test succeeds.', 'A failed configuration is discarded and must not serve traffic under a staged label.'],
      ['Restore the old provider whenever the monitoring dashboard is delayed after a passing switch.', 'Monitoring may catch up after success; its delay does not undo the accepted provider switch.'],
    ],
    note: {
      learningObjective: 'Distinguish reversible provider staging from the accepted traffic switch and later monitoring refresh.',
      decisiveFact: 'Only a passing timing/error test permits switching, and failed staging preserves the known-good provider.',
      nearestAlternative: 'Switching first and letting monitoring judge seems operationally quick, but it exposes traffic before the required test.',
      changedCondition: 'If monitoring were the stated acceptance test, the candidate could not be switched before that signal; here a separate test is required.',
    },
  },
  {
    id: 15,
    key: 'Commit the swap only after both checks pass; release both holds on failure.',
    reason: 'The roster accepts one paired change, not intermediate assignments that can leave the volunteers in a half-swap.',
    wrong: [
      ['Move the first volunteer immediately and ask the second volunteer to accept the remaining assignment later.', 'The roster would expose a partial swap before both skill and availability checks pass.'],
      ['Commit each assignment as soon as its volunteer passes, then reconcile a failed second check manually.', 'The prompt preserves the original roster if either check fails; it does not accept a partially committed pair.'],
      ['Retain the first assignment hold when the second volunteer fails so the swap can resume without reacquiring it.', 'Both temporary holds must be released on either failure, not leave one assignment unavailable.'],
      ['Publish the first move and let the audit consumer complete the second assignment after it records the event.', 'The audit consumer is not the roster decision owner, and publication cannot turn one move into the required paired swap.'],
    ],
    note: {
      learningObjective: 'Stage both sides of a volunteer swap and commit one roster change only after both validations pass.',
      decisiveFact: 'Either failed check releases both holds and preserves the original roster; no half-swap is accepted.',
      nearestAlternative: 'Committing each passing side separately seems to preserve progress, but it violates the explicit paired-outcome contract.',
      changedCondition: 'If partial swaps were allowed, the roster could commit each assignment independently; the scenario requires the original pair on failure.',
    },
  },
  {
    id: 16,
    key: 'Commit geometry, markers, and provenance together; retry search from that accepted revision.',
    reason: 'Storage decides whether the complete route revision is accepted; search can be regenerated from it afterward.',
    wrong: [
      ['Publish the geometry to search first and let the index choose which merge becomes canonical.', 'Search is a derived projection; it cannot decide canonical geometry or conflicts.'],
      ['Commit geometry now and attach conflict markers and provenance after storage becomes available.', 'The route revision is accepted only with all three parts, so geometry alone is not a valid commit.'],
      ['Undo the full route revision whenever search is unavailable after a successful storage commit.', 'A search outage occurs after acceptance and must not reverse the stored route revision.'],
      ['Let each projection merge its own geometry and resolve conflicts independently.', 'Independent projections could disagree; the prompt requires one accepted revision with the conflict data and provenance.'],
    ],
    note: {
      learningObjective: 'Keep the complete route revision at one storage acceptance boundary and treat search as a rebuildable projection.',
      decisiveFact: 'Geometry, conflict markers, and provenance are accepted together; storage failure accepts no geometry, while search may retry after commit.',
      nearestAlternative: 'Publishing geometry first looks responsive, but it exposes a revision without its required conflict and provenance records.',
      changedCondition: 'If search were the canonical route store, it could determine the merge; the prompt makes storage the acceptance boundary.',
    },
  },
  {
    id: 17,
    key: 'Commit item use with its reward; restore only a failed pre-commit hold and retry summaries.',
    reason: 'The ledger accepts item consumption and reward together; summary lag is downstream and cannot rewrite that accepted pair.',
    wrong: [
      ['Consume the item before validating the reward and leave it spent if validation rejects the reward.', 'The prompt requires restoring the item when reward validation fails after reservation.'],
      ['Commit item consumption first, then let each achievement summary create the reward entry later.', 'Item use and the reward must be one accepted ledger change, not separate downstream writes.'],
      ['Undo the committed reward whenever an achievement summary refresh is delayed.', 'Summary refresh is retryable after commit and cannot change the accepted reward ledger entry.'],
      ['Let an achievement projection decide whether the campaign ledger may consume the item.', 'The campaign ledger records the accepted item/reward change; summaries do not own that gameplay decision.'],
    ],
    note: {
      learningObjective: 'Distinguish rollback of a reversible pre-commit item reservation from retry of post-commit summaries.',
      decisiveFact: 'Failed reward validation restores the reserved item; after the paired ledger commit, summaries may retry without changing it.',
      nearestAlternative: 'Rolling back on summary lag can appear to keep screens synchronized, but it reverses a committed ledger fact for a projection failure.',
      changedCondition: 'If summary refresh were part of the reward’s acceptance condition, it would not be a post-commit retryable projection.',
    },
  },
  {
    id: 18,
    key: 'Hand off only after temperature passes; release the candidate hold on failure.',
    reason: 'The shipment remains with its current carrier until eligibility is known; accepted tracking is a later projection.',
    wrong: [
      ['Transfer the shipment to the new carrier before temperature validation and repair the assignment if the test fails.', 'The shipment would be owned by a carrier that may fail the explicit temperature condition.'],
      ['Keep the candidate carrier reserved after a failed temperature test so another attempt can reuse it.', 'The failure outcome releases the candidate reservation while the old carrier keeps the shipment.'],
      ['Let tracking accept the hand-off and decide whether the receiving carrier meets the temperature limit.', 'Tracking follows an accepted shipment revision; it does not determine carrier eligibility.'],
      ['Undo a valid hand-off whenever the tracking projection has not refreshed yet.', 'Tracking may retry from the accepted shipment revision, so projection lag does not reverse the transfer.'],
    ],
    note: {
      learningObjective: 'Keep temperature eligibility before carrier transfer and separate the reversible candidate reservation from tracking retry.',
      decisiveFact: 'On a failed test the old carrier retains the shipment and the candidate hold is released; after acceptance tracking may retry.',
      nearestAlternative: 'Transferring first and repairing later is too late if the candidate is ineligible to receive the shipment.',
      changedCondition: 'If the test were advisory rather than an eligibility condition, it would not gate ownership transfer; the prompt makes it required.',
    },
  },
];
assert.equal(cases.length, 18);

for (const entry of cases) {
  const q = questions[entry.id - 1];
  assert.equal(q.questionId, `ood-n06-b10-i${String(entry.id).padStart(3, '0')}`);
  const key = q.interaction.options.find((option) => option.optionId === q.answer.optionId);
  assert(key, `${q.questionId}: missing keyed option`);
  key.text = entry.key;
  if (entry.promptSuffix) q.prompt += entry.promptSuffix;
  q.feedback.reason = entry.reason;
  const oldWrong = q.interaction.options.filter((option) => option.optionId !== q.answer.optionId);
  assert.equal(oldWrong.length, 4);
  const messages = new Map(q.feedback.messages.map((message) => [message.targetId, message]));
  for (const [index, [text, diagnostic]] of entry.wrong.entries()) {
    const oldOption = oldWrong[index];
    const message = messages.get(oldOption.optionId);
    assert(message, `${q.questionId}: missing diagnostic for ${oldOption.optionId}`);
    const optionId = `n06_b10_v2_i${String(entry.id).padStart(3, '0')}_alt${index + 1}`;
    oldOption.optionId = optionId;
    oldOption.text = text;
    message.targetId = optionId;
    message.text = diagnostic;
  }
}

const proposalBytes = Buffer.from(`${JSON.stringify(questions, null, 2)}\n`);
writeFileSync(path.join(packet, 'proposals/N06-B10.json'), proposalBytes);
const notes = {
  version: 2,
  sourceProposal: 'review-inputs/N06-B10-v1.json',
  sourceProposalSha256: digest(frozenBytes),
  sourceNotes: 'review-inputs/N06-B10-v1-NOTES.json',
  sourceNotesSha256: 'e50c6e20c264a845c7581298c3d2a42b9b50c5ef2ece0b36efe84842f549c12b',
  proposalSha256: digest(proposalBytes),
  items: cases.map((entry) => ({
    beforeQuestionId: `ood-n06-b10-i${String(entry.id).padStart(3, '0')}`,
    questionId: `ood-n06-b10-i${String(entry.id).padStart(3, '0')}`,
    mentalUnitId: 'OOD-N06-B10',
    learningObjective: entry.note.learningObjective,
    decisiveFact: entry.note.decisiveFact,
    nearestAlternative: entry.note.nearestAlternative,
    changedCondition: entry.note.changedCondition,
    identityAction: 'preserve_question_id',
    identityReason: 'The accepted primary decision remains coordinating the stated multi-step outcome across owners. This revision changes only the competing workflow representations and clarifies the case boundary; it does not retarget the orchestration objective.',
    sourceRefs: ['https://learn.microsoft.com/en-us/azure/architecture/patterns/saga'],
  })),
};
const notesBytes = Buffer.from(`${JSON.stringify(notes, null, 2)}\n`);
writeFileSync(path.join(packet, 'AUTHOR-NOTES-B10-v2.json'), notesBytes);
const notesMd = `# N06 B10 v2 authoring notes\n\nThis revision binds to frozen v1 proposal SHA-256 \`${digest(frozenBytes)}\` and frozen note SHA-256 \`${notes.sourceNotesSha256}\`. It preserves all 18 question IDs and the accepted workflow-orchestration meaning. The keyed option IDs remain stable because their primary meaning remains; all revised distractors use fresh IDs, with exact feedback targets.\n\nThe options compare reversible pre-commit reservations, irreversible effects, and retryable post-commit projections where those boundaries exist in the case. They do not infer cross-service isolation, atomic transactions, guaranteed compensation, provider-side idempotency, or exactly-once delivery. The i011 payout ID is scoped to report updates.\n\nThe per-item JSON records objectives, decisive facts, nearest alternatives, counterfactuals, identity rationale, and the Microsoft Saga primary reference. The source explains coordination and compensation limits; it does not establish the scenario's fictional local guarantees.\n\nMechanical checker output is structural/scoring evidence only; independent semantic review is pending.\n`;
writeFileSync(path.join(packet, 'AUTHOR-NOTES-B10-v2.md'), notesMd);
console.log(JSON.stringify({
  result: 'B10-V2-WRITTEN',
  frozenV1Sha256: digest(frozenBytes),
  proposalV2Sha256: digest(proposalBytes),
  notesJsonSha256: digest(notesBytes),
  questions: questions.length,
  optionIds: questions.reduce((sum, q) => sum + q.interaction.options.length, 0),
  preservedQuestionIds: questions.map((q) => q.questionId),
  changedKeys: cases.map((entry) => `ood-n06-b10-i${String(entry.id).padStart(3, '0')}`),
}, null, 2));
