import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const packet = path.resolve("patternly/docs/active/BIZQ-01/ood-remaining-closure-22");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const frozenProposal = readFileSync(path.join(packet, "review-inputs/N06-B02-v1.json"));
assert.equal(digest(frozenProposal), "4821f373e08c36feb7e066f7abe532aac0bb26ec11ce63e9824f83d82e178dd8");
const questions = JSON.parse(frozenProposal.toString("utf8"));
assert.equal(questions.length, 18);

const optionFixes = {
  1: [
    ["Let the API check consent but leave the scheduled retry worker to transmit without checking it.", "The retry worker invokes the same operation and would disclose the referral while it is still received."],
    ["Treat the transmission request itself as consent and move the referral to consented before sending.", "A routing request is not patient consent; advancing first would authorize a disclosure the patient has not approved."],
    ["Send the referral while received but keep its lifecycle label unchanged until consent is recorded.", "The external disclosure still happens before consent; leaving the local label unchanged does not satisfy the privacy rule."],
  ],
  2: [
    ["Allow edits in submitted after saving a second version, then let the reviewer choose which version to fulfill.", "The lifecycle explicitly forbids edits after submission; recording two versions does not make the submitted edit legal."],
    ["Permit fulfillment from submitted when the withdrawal window closes, even if approval has not occurred.", "The stated operation matrix reserves fulfillment for approved orders, not merely submitted ones."],
    ["Allow withdrawal from approved until fulfillment starts, so an approver can reverse a decision.", "The matrix says approved permits fulfillment only; adding withdrawal creates an operation the scenario excludes."],
  ],
  3: [
    ["Archive an application as soon as review requests its final documents, then replace the record if it is decided later.", "The application is not decided at that point; archival is allowed only after the decision."],
    ["Keep the stage as decided after archiving and create a new archive record on each repeated request.", "A repeat must return the existing archive result, so leaving the stage decided permits duplicate records."],
    ["Return an already-archived error when the same archive request is repeated.", "The specified repeated outcome is the existing archive result, not an error."],
  ],
  5: [
    ["Use renewal for both active and expired members, extending expiry from the request date in either case.", "Expired members require a new eligibility check before reactivation; renewal cannot bypass that prerequisite."],
    ["Charge an expired member first and perform the eligibility check only if payment succeeds.", "The check must precede reactivation; charging does not make an unchecked expired member eligible."],
    ["Infer active status from prior payment and treat every previously paid member as eligible for renewal.", "Payment history does not collapse expired and active membership stages or satisfy the new eligibility requirement."],
  ],
  6: [
    ["Let the measurement station measure a collected sample whenever it has data, then mark the reading provisional.", "Only a prepared sample may be measured; provisional labeling does not make the earlier operation legal."],
    ["Measure at any stage and ask a reviewer to discard invalid readings afterward.", "This performs a prohibited measurement instead of enforcing the prepared-stage precondition."],
    ["Restore a discarded sample to prepared when an operator asks to measure it again.", "Discarded is terminal and cannot be restored by a measurement request."],
  ],
  7: [
    ["Allow check-in from held whenever its expiry has not passed, without first confirming the reservation.", "The prompt permits check-in from confirmed; a live hold alone is not the required confirmation transition."],
    ["Reject every check-in after the first successful one and require clients to create a new reservation to recover the result.", "A repeated successful check-in must return the existing check-in result, not reject or create a different reservation."],
    ["Return the original check-in result for released reservations as well as checked-in reservations.", "Released cannot be checked in; only a prior successful check-in has an existing check-in result to return."],
  ],
  8: [
    ["Accept a response on a resolved case and append it while leaving the case marked resolved.", "Resolved cases require a reopen transition before another response is accepted."],
    ["Hide the response action in the agent screen but accept webhook responses in every stage.", "The webhook uses the same case operation and could append a response to a resolved case without reopening it."],
    ["Treat a response to a resolved case as an implicit reopen, then append the response in the same call.", "The prompt defines reopen as a separate operation; merging it into response hides the required transition from the caller."],
  ],
  9: [
    ["Mark a running job canceled as soon as the request arrives, even though its worker has not stopped.", "The running state only requests a cooperative stop; reporting cancellation before the worker stops claims an outcome that has not occurred."],
    ["Delete a succeeded job's output when cancel is retried, then leave its success status for download clients.", "Succeeded jobs must remain available for download; the output and status would contradict each other."],
    ["Send a stop request for a queued job and keep it queued until a worker eventually acknowledges it.", "A queued job has not begun running; the prompt says cancellation removes it rather than waiting for a nonexistent running worker."],
  ],
  11: [
    ["Allow capture while pending and void the capture later if the authorization is declined.", "Capture is legal only after approval; a later void does not make the premature capture valid."],
    ["Submit a new capture on every retry and reconcile any duplicate charges during reporting.", "After capture, a retry must return the existing capture result rather than create another capture."],
    ["Treat a declined authorization as approved when a client repeats capture with the same request.", "Declined is terminal for capture in this lifecycle; a retry cannot convert that result to approval."],
  ],
  12: [
    ["Require an overdue contract to become checked out again before it can be returned.", "Return is explicitly allowed from overdue; an extra transition blocks a valid return."],
    ["Create a new return receipt each time a returned contract receives the same return request.", "A repeat must return the existing receipt, not create a second one."],
    ["Allow a new check-out from overdue while the original rental is still active.", "Check-out is permitted only from available, and overdue remains an active rental stage."],
  ],
  13: [
    ["Permit appeals from both upheld and dismissed stages, then let staff decide whether dismissal is reversible.", "Dismissed items cannot be reopened, so accepting an appeal there violates the terminal-stage rule."],
    ["Allow an upheld item to accept unlimited appeals as long as each has new evidence.", "The prompt allows an appeal once; additional evidence does not make a second appeal legal."],
    ["Hide appeal and evidence actions in the screens but let the item API accept them in any stage.", "The shared item API would still allow operations that the lifecycle excludes, regardless of what a screen displays."],
  ],
  15: [
    ["Rewrite the accepted carrier label after handoff and send a correction notice as a separate step.", "After acceptance, the local label must not be rewritten; correction uses a separate exception request."],
    ["Let support return a delivered parcel to in-transit when it changes the address.", "Delivery is terminal; changing an address cannot reverse that completed lifecycle state."],
    ["Allow an address correction in transit by editing the label and notifying the carrier afterward.", "The prompt allows correction only before acceptance; a later edit cannot substitute for the required exception request."],
  ],
  16: [
    ["Confirm a waitlisted learner first and search for a seat afterward if one becomes free.", "A seat must be assigned before confirmation; the later search cannot satisfy that prerequisite."],
    ["Reopen a withdrawn enrollment when registration retries confirmation, then treat it as requested.", "Withdrawn cannot be confirmed or restored by retry; it is the terminal state in the prompt."],
    ["Confirm after a waitlist offer is sent, even if the learner has not accepted it.", "A waitlisted learner must accept the offered seat before the enrollment can become confirmed."],
  ],
  17: [
    ["Refund when the return is requested and let the warehouse record receipt afterward.", "Refund is permitted only after receipt, so this performs the financial operation before its stated prerequisite."],
    ["Receive an item directly from requested and infer authorization from the warehouse scan.", "A return must be authorized before receipt; a scan is not the required authorization transition."],
    ["Create another refund record whenever a caller repeats the request after the first refund.", "The refunded state must return the existing refund record, not create a duplicate."],
  ],
  18: [
    ["Confirm a held booking after its deadline and let a cleanup job cancel it later.", "An expired hold is not eligible for confirmation; later cleanup exposes an invalid confirmed booking."],
    ["Reopen a canceled booking as tentative when a cancellation request is repeated.", "Canceled is terminal, and repetition must return its existing cancellation result."],
    ["Reject every repeated cancel request after the first cancellation, even when the caller asks for the same result.", "The prompt requires the same cancellation result on repetition, not an error."],
  ],
};

const special = {
  1: {
    prompt: "A referral moves through received, consented, and transmitted stages. A transmission request before consent must leave it received; after consent it records the external handoff. Both an API and a scheduled retry worker call the same request method without inspecting the stage. How should the referral respond?",
    key: "Use one owner-local transition rule: before consent, retain received; after consent, record the external handoff and advance state.",
    reason: "The API and retry worker use the same operation, but the legal outcome depends on consent stage. Enforcing that transition on the referral owner protects both entry points without requiring a separate State class.",
    details: {
      mechanismOrProperty: "The referral keeps an explicit current stage and evaluates transmission in a local conditional or transition table. Separate State objects are optional; the consent rule must be enforced where the referral's stage is owned.",
      scenarioApplication: "The shared method leaves received unchanged before consent, then records the handoff and advances after consent. The API and retry worker therefore follow the same rule.",
      errorCorrection: "Checking consent only in the API is tempting, but the scheduled worker calls the same method and would bypass a screen-level check.",
      boundaryOrTradeoff: "For one operation and two stable states, an owner-local conditional or table is simple. Separate State objects may help if operations acquire more independent stage-specific behavior, but they are not required here.",
      transfer: "Enforce a lifecycle precondition at the owner when several entry points invoke the same operation without reading the current stage.",
    },
  },
  2: {
    prompt: "A digital order can be drafted, submitted, or approved. Its complete operation matrix is: draft permits edit; submitted permits withdraw; approved permits fulfill. Which policy should the order enforce?",
    key: "Keep the order's three-stage operation matrix in one explicit lifecycle rule.",
    reason: "The three stages permit different operations, so one explicit transition rule keeps edit, withdraw, and fulfill aligned with the order's current stage.",
  },
  3: {
    prompt: "A loan application is received, under review, decided, or archived. Review may request documents; only a decided application may be archived. Archiving creates one record, and repeating the request from archived returns that existing result. Where should the stage-dependent archive behavior live?",
    key: "Keep archive behavior on the application lifecycle: decided creates the record; archived returns it on repetition.",
    reason: "The application has an explicit archived stage with a defined repeated outcome. Keeping that rule with its lifecycle prevents a second archive record or an early archive.",
  },
  5: {
    prompt: "A membership is trial, active, or expired. Trial members can activate; active members can renew; expired members can reactivate only after a new eligibility check. A renewal request must never reactivate an expired membership. What should govern these operations?",
    key: "Keep activation, renewal, and reactivation distinct in the membership lifecycle.",
    reason: "The same membership method cannot treat renewal and reactivation as interchangeable: the expired stage requires a fresh eligibility check first.",
  },
  6: {
    prompt: "A lab sample is collected, prepared, measured, or discarded. Only a prepared sample may be measured; a discarded sample cannot be restored. The measurement station and discard worker call the same sample operations without reading status. Which boundary should enforce the lifecycle?",
    key: "Keep measurement and restoration behavior with the sample's current lifecycle stage.",
    reason: "The same sample operations are reached from different callers, while measurement and restoration legality depends on sample stage. The owner must enforce those transitions.",
  },
  7: {
    prompt: "A reservation is held, confirmed, checked in, or released. A held reservation may expire; check-in is allowed only after confirmation; release prevents check-in. After a successful check-in, repeating the same request returns its existing check-in result. What should the lifecycle return?",
    key: "Let reservation stage govern check-in and return its existing result after a successful repeat.",
    reason: "The repeated result belongs to the checked-in stage; held and released remain ineligible. The reservation lifecycle can distinguish all three outcomes without claiming network-level exactly-once delivery.",
  },
  11: { key: "Allow capture only from approved; a captured retry returns its stored result." },
  12: { key: "Check out only when available; return from checked-out or overdue, then replay the returned receipt." },
  13: { key: "Permit evidence during review, one appeal after uphold, and no reopening after dismissal." },
  15: { key: "Edit before acceptance; afterward issue an exception, and keep delivery terminal." },
  16: { key: "Confirm only with a seat; handle offers separately and reject withdrawn enrollment." },
  17: { key: "Receive only after authorization; refund after receipt, then replay the stored result." },
  18: { key: "Confirm only a valid hold; canceled stays terminal and repeats its result." },
}

for (const [candidateNumber, fixes] of Object.entries(optionFixes)) {
  const target = questions.find((question) => question.questionId.endsWith(`i${String(Number(candidateNumber) + 18).padStart(3, "0")}`));
  assert(target, `missing frozen candidate i${Number(candidateNumber) + 18}`);
  assert.equal(target.interaction.options.filter((option) => option.optionId !== target.answer.optionId).length, 3);
  const wrongOptions = target.interaction.options.filter((option) => option.optionId !== target.answer.optionId);
  const wrongMessages = new Map(target.feedback.messages.map((message) => [message.targetId, message]));
  for (const [index, [text, feedback]] of fixes.entries()) {
    const oldOption = wrongOptions[index];
    const oldMessage = wrongMessages.get(oldOption.optionId);
    assert(oldMessage, `${target.questionId} missing wrong-option diagnostic ${oldOption.optionId}`);
    const newOptionId = `n06_b02_v2_i${String(candidateNumber).padStart(3, "0")}_alt${index + 1}`;
    oldOption.optionId = newOptionId;
    oldOption.text = text;
    oldMessage.targetId = newOptionId;
    oldMessage.text = feedback;
  }
}

for (const [oldNumberText, update] of Object.entries(special)) {
  const oldNumber = Number(oldNumberText);
  const candidateNumber = oldNumber + 18;
  const question = questions.find((item) => item.questionId.endsWith(`i${String(candidateNumber).padStart(3, "0")}`));
  assert(question);
  question.questionId = `ood-n06-b02-i${String(oldNumber).padStart(3, "0")}`;
  if (update.prompt) question.prompt = update.prompt;
  if (update.key) question.interaction.options.find((option) => option.optionId === question.answer.optionId).text = update.key;
  if (update.reason) question.feedback.reason = update.reason;
  if (update.details) question.feedback.details = update.details;
  if (oldNumber === 7) {
    const oldAnswerId = question.answer.optionId;
    const newAnswerId = "n06_b02_v2_i007_policy";
    question.answer.optionId = newAnswerId;
    question.interaction.options.find((option) => option.optionId === oldAnswerId).optionId = newAnswerId;
  }
}

const sourcePath = path.resolve("patternly-content/content/object-oriented-design-interview/behavior_state_commands_events_and_workflows/OOD-N06-B02.json");
const sourceBytes = readFileSync(sourcePath);
assert.equal(digest(sourceBytes), "9201e8880000b15c65b02dde6998ce1917058fd83c2d9a31461635e4e604587d");
const source = JSON.parse(sourceBytes.toString("utf8"));
assert.equal(source.length, 18);
const notesPath = path.join(packet, "AUTHOR-NOTES-B01-B05.json");
const notes = JSON.parse(readFileSync(notesPath, "utf8"));
const b02Notes = notes.items.filter((item) => item.mentalUnitId === "OOD-N06-B02");
assert.equal(b02Notes.length, 18);
for (const [index, question] of questions.entries()) {
  const before = source[index];
  assert(before, `missing source question at position ${index}`);
  question.questionId = before.questionId;
  const oldKey = before.interaction.options.find((option) => option.optionId === before.answer.optionId)?.text;
  const note = b02Notes.find((item) => item.beforeQuestionId === before.questionId);
  assert(note, `missing note for ${before.questionId}`);
  note.questionId = question.questionId;
  note.identityAction = "preserve_question_id";
  note.identityReason = `The original item asks about ${before.prompt.split(" The interview lens")[0]} Its accepted key says “${oldKey}” and assesses explicit lifecycle-stage behavior. This version retains that same State-machine decision while making the allowed operations and outcomes case-specific: “${note.decisiveFact}” Preserve the original question ID.`;
}

const proposalBytes = Buffer.from(`${JSON.stringify(questions, null, 2)}\n`);
writeFileSync(path.join(packet, "proposals/N06-B02.json"), proposalBytes);
writeFileSync(notesPath, `${JSON.stringify(notes, null, 2)}\n`);
console.log(JSON.stringify({
  result: "PROPOSAL-V2-WRITTEN",
  frozenV1Sha256: digest(frozenProposal),
  proposalV2Sha256: digest(proposalBytes),
  sourceSha256: digest(sourceBytes),
  objectCount: questions.length,
  restoredQuestionIds: questions.map((question) => question.questionId),
  notesChanged: b02Notes.length,
  notePath: path.relative(process.cwd(), notesPath),
}, null, 2));
