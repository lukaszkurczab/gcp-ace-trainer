const fs=require('fs');
const file='docs/active/BIZQ-01/ood-remaining-closure-22/proposals/N06-B06.json';
const qs=JSON.parse(fs.readFileSync(file,'utf8'));
const rows=[
{op:'classify a returned item',scope:'seal-condition and safety-recall reviewers handle the item in that order; refund eligibility is separate',effect:'one classification',alts:[
['Let the caller select a reviewer from the return category before either reviewer checks the seal or recall facts.','The category alone does not establish which reviewer can decide this item; choosing before eligibility bypasses the stated ordered checks.'],
['Let the seal reviewer and recall reviewer each return a class, then reconcile the two classifications afterward.','The prompt makes the ordered eligible result authoritative; reconciling both can replace that result with a competing class.'],
['Add seal, recall, and future return-class branches to the warehouse dispatcher.','That makes every independently owned return rule a dispatcher change, even though the checks already have their own reviewers.'],
['Run both reviews at once and use whichever classification arrives first.','Arrival time can let the recall reviewer win before the earlier seal check has determined whether it applies.']]},
{op:'publish a result snapshot',scope:'a backend passes unless it supports the exact immutable input and code-version pair',effect:'one complete snapshot bound to that pair',alts:[
['Choose one snapshot backend from the experiment type before checking support for its input and code version.','Experiment type does not prove backend support for this exact immutable pair; a preselected backend can reject when another ordered backend supports it.'],
['Combine snapshot fragments from every backend that supports either the input or the code version.','Partial compatibility with only one side of the pair is insufficient; combining fragments could bind output to incompatible versions.'],
['Add each backend and its version rules to the notebook publication switch.','The publication path would change whenever a backend is independently maintained, contrary to the separate-backend boundary.'],
['Ask all backends in parallel and publish the first response, even if an earlier configured backend supports the pair.','Fast response is not the stated support or ordering criterion and can publish from a later backend.']]},
{op:'accept a comment and notify its assigned author',scope:'the comment retains author and document revision; the first accepting channel owns one delivery',effect:'one notice to the assigned author',alts:[
['Let the assigned author choose a channel after acceptance without checking which channel handles that assignment.','The scenario puts channel eligibility in the handlers; a recipient choice bypasses those independent channel rules.'],
['Send the comment to every configured channel and reconcile delivery receipts afterward.','The contract gives the first accepting channel ownership; sending to all channels risks duplicate notices and does not honor that ownership.'],
['Add each channel’s assignment rules to the comment-acceptance operation.','That couples comment acceptance to independently maintained channel rules and makes each channel change alter the editor.'],
['Notify all channels concurrently and keep whichever receipt arrives first.','The fastest receipt does not establish which channel accepts the assigned author; other sends may already have occurred.']]},
{op:'submit an offline inspection',scope:'a handler accepts the complete payload or passes; partial submission is forbidden and the result is complete or retryable',effect:'one complete submission outcome',alts:[
['Choose local queue or online submission from a connectivity flag before either handler examines the payload.','Connectivity alone does not establish which handler can accept this offline payload; the prompt assigns that test to the handlers.'],
['Upload any sections each handler accepts, then combine them into an inspection record.','The case explicitly forbids partial submission; combining section writes can create a record that is neither complete nor retryable.'],
['Let local and online handlers both accept the same inspection and reconcile their records later.','Two accepted writes can duplicate one complete inspection instead of returning one complete or retryable outcome.'],
['Race local queue and online submission, accepting whichever finishes first.','A faster partial or unsupported attempt could win; the contract asks each handler to accept the whole payload or pass.']]},
{op:'reissue a rejected invoice',scope:'handlers own distinct rejection classes; the first eligible handler issues a traceable replacement and retries do not double-charge',effect:'one traceable replacement',alts:[
['Have the caller map the rejection label to one handler before the handler checks its rejection-class coverage.','A label-to-handler guess can bypass the stated coverage test; an ineligible handler must be able to pass.'],
['Ask every rejection-class handler to issue a replacement, then keep the most complete invoice.','More than one issue can charge the customer; reconciling afterward cannot undo the duplicate-charge risk in the stated workflow.'],
['Add every rejection class to one billing-service conditional and modify it for each new class.','That makes class-specific reissue rules part of the shared service instead of independently owned handlers.'],
['Run all reissue handlers concurrently and accept the earliest replacement response.','Response speed does not identify the eligible rejection-class owner and can start duplicate replacements.']]},
{op:'revoke a badge before access',scope:'revocation is an ordered terminal denial before schedule access; inapplicable rules pass and a later allow cannot reverse it',effect:'one terminal access decision',alts:[
['Check the schedule first and stop on its allow before looking for a badge revocation.','That reverses the specified priority and can grant access to a revoked badge.'],
['Let any applicable schedule allow override a revocation denial after all rules have run.','The prompt explicitly makes revocation terminal; aggregating allows would undo that stated denial.'],
['Make each door caller choose whether to run revocation or schedule checks.','Different callers could omit or reorder the required revocation-before-schedule sequence.'],
['Run revocation and schedule rules concurrently and use whichever responds first.','A schedule allow could arrive first and grant access before the revocation check finishes.']]},
{op:'print a corrected shipment label',scope:'the first formatter supporting both carrier and service owns a label for the approved shipment revision',effect:'one label for approved data',alts:[
['Select a formatter from the carrier alone, then use its label even if it does not support the selected service.','The prompt requires support for both carrier and service; a carrier-only match can produce an unsupported label.'],
['Merge carrier and service labels from every formatter into one final label.','The contract assigns one label to the first formatter matching both facts; merged outputs can conflict on the approved shipment fields.'],
['Put carrier/service-specific format rules in the shipping caller and extend it for every formatter.','This leaks formatter capability details into callers that the scenario says should stay independent of format details.'],
['Ask every formatter concurrently and print the first label returned, regardless of its carrier/service support.','A fast response is not evidence that the formatter supports both requested dimensions or the approved revision.']]},
{op:'move a booked rehearsal',scope:'a room qualifies only after both capacity and cancellation checks, and the first qualifying room is reserved',effect:'one qualifying destination room',alts:[
['Choose the room with the most capacity before checking whether its cancellation terms permit this booking.','Capacity alone is not sufficient; a larger room can fail the second stated eligibility check.'],
['Reserve every room that passes either capacity or cancellation, then choose one after all reservations complete.','The prompt requires both checks before reservation; reserving on either can leave a booking in an ineligible room.'],
['Put every room’s eligibility conditions in the coordinator and update its switch for new room types.','That makes the coordinator own the independently handled room checks instead of passing the request through them.'],
['Check all rooms concurrently and reserve whichever responds first.','Response speed does not establish both eligibility conditions or the stated first-qualifying order.']]},
{op:'switch an exhibit into maintenance mode',scope:'covered unsafe commands are terminally invalid; unrelated safety handlers may pass',effect:'the first applicable safety outcome',alts:[
['Treat the maintenance result as another pass so a later handler may execute the same unsafe command.','Maintenance makes covered commands terminally invalid; passing that result would let later execution bypass the safety decision.'],
['Allow a command whenever any safety handler approves it, even if another applicable handler rejects it.','An allow aggregation can override the terminal invalid result required for covered unsafe commands.'],
['Copy all safety predicates into each exhibit command caller.','Caller copies can omit or order the maintenance check differently, so the terminal safety boundary is no longer shared.'],
['Run safety checks concurrently and use the first response as the command outcome.','A later permissive response can arrive before the applicable maintenance rule returns its terminal invalid result.']]},
{op:'retire a lesson while preserving progress',scope:'each handler either supports the stored progress-record form or passes; progress remains linked to the stable lesson identity',effect:'one supported retirement operation',alts:[
['Have the caller choose a progress handler from the lesson category before checking which record form it supports.','Lesson category does not establish record-form support; the selected handler must be allowed to pass when the form is unsupported.'],
['Retire the lesson as soon as any handler can migrate one record, then discard remaining progress records.','Partial migration breaks the stated requirement to preserve learner progress for the stable lesson identity.'],
['Add every progress-record format to a central retirement switch.','Each new stored form would change the retirement coordinator rather than its independently maintained handlers.'],
['Run all progress handlers concurrently and combine the records they return.','Combining unsupported or overlapping migrations risks duplicate or incompatible progress for the same lesson.']]},
{op:'close a board and export its history',scope:'the export represents the captured session state before close',effect:'one complete history export from the captured state',alts:[
['Close the board first and ask export handlers to read the live session afterward.','The prompt says capture precedes close; reading after closure may no longer represent the captured session state.'],
['Ask every exporter to serialize a fragment and combine the fragments after the board closes.','Fragment combination does not guarantee one complete export of the already captured session state.'],
['Make the board-closing operation contain a branch for every export format.','That couples independent export handlers to the close operation and changes it whenever a format is added.'],
['Run exporters against the live board concurrently and keep whichever finishes first.','The fastest live read is not the captured pre-close state the export must represent.']]},
{op:'escalate a conversation',scope:'a tier may claim only if it can meet the deadline; the selected tier receives ownership and notice',effect:'one eligible tier assignment',alts:[
['Choose an escalation tier from the queue label before checking whether it can meet the response deadline.','Queue label does not establish deadline eligibility; a tier that cannot meet the deadline must pass.'],
['Assign every tier that might meet the deadline and reconcile ownership after notices are sent.','The prompt defines a selected eligible owner; multiple assignments and notices violate that outcome.'],
['Put each tier’s deadline and coverage rules into the support desk dispatcher.','That turns independent tier rules into central routing changes whenever a tier is added or maintained.'],
['Ask all tiers in parallel and assign the first one to respond, even if it misses the deadline.','Response speed can select an ineligible tier; the stated condition is ability to meet the deadline.']]},
{op:'publish a seasonal listing',scope:'the category handler may publish only after both price and stock are valid; other categories pass',effect:'a visible listing after both checks pass',alts:[
['Publish when the matching category handler validates price, then check stock after the listing is visible.','The prompt requires both price and stock validity before visibility; a later stock check is too late.'],
['Let the category handler pass after a failed price or stock check so another category handler can publish.','Pass means the handler does not own that category, not that another category may override a failed required validation.'],
['Add each category and its price/stock rules to the marketplace publication switch.','That makes independently owned category rules central branches, so every category change alters publication code.'],
['Run category handlers concurrently and publish the first response that approves either price or stock.','Approval of either one is insufficient and response timing cannot replace both required checks.']]},
{op:'split a backordered request across vendors',scope:'each vendor can accept part of the remaining quantity; the unfilled remainder continues with the same request identity and promise',effect:'accepted splits plus the final unfilled remainder',alts:[
['Stop after the first vendor accepts any quantity and leave the rest outside the request.','The contract explicitly passes the unfilled remainder onward; stopping loses the remaining quantity and promise.'],
['Send the original full quantity to each later vendor after a partial acceptance.','That can allocate the same units more than once; later handlers must receive only the unfilled remainder.'],
['Start all vendor offers concurrently and reconcile their quantities after replies arrive.','Concurrent offers can commit overlapping quantities before reconciliation, unlike the ordered remainder handoff.'],
['Have the dispatcher own each vendor’s stock rules and calculate every split itself.','The prompt gives vendors their own acceptance decision; duplicating those rules centrally risks inconsistent allocations.']]},
{op:'transfer a plot reservation',scope:'an authority returns terminal approve/deny only for a boundary it covers; otherwise it passes; history stays with the reservation',effect:'one applicable approval or denial with history',alts:[
['Accept the first authority response even when that authority does not cover this plot boundary.','An uncovered authority must pass; accepting its result gives a decision to the wrong boundary owner.'],
['Require every authority in the list to approve before any reservation can transfer.','The prompt assigns one covered authority to decide; requiring unrelated authorities changes that approval contract.'],
['Let each calling screen choose an authority from the plot name without applying coverage checks.','A plot name alone may select an authority that does not cover its boundary, duplicating eligibility logic in callers.'],
['Run all authorities concurrently and keep whichever approve/deny response arrives first.','Fastest response does not establish boundary coverage and can select an unrelated authority.']]},
{op:'add a regional bundle',scope:'the first handler for the bundle region computes from current component pricing inputs; other regions pass',effect:'one bundle price based on current component inputs',alts:[
['Use the bundle price cached when it was first created, regardless of current component pricing inputs.','The prompt requires the matching region handler to compute from current component inputs, so a stale cached price can violate that basis.'],
['Combine prices returned by every regional handler into one bundle price.','Different regions are alternatives, not additive components; combining their returns mixes incompatible regional calculations.'],
['Put regional formulas in one bundle-creation switch and add each region there.','That centralizes rules the scenario assigns to regional handlers and requires dispatcher edits for each region.'],
['Ask regional handlers concurrently and use the first price returned without checking its region.','Response time does not establish that the handler matches the bundle region.']]},
{op:'reserve a charger',scope:'a station claims only when capacity and expiry both permit the slot, following station priority',effect:'one eligible station claim',alts:[
['Claim the first slot with capacity, then check whether its reservation expiry permits the requested time.','Capacity alone is insufficient; the claim must satisfy both facts before reserving.'],
['Reserve the slot at every station that reports capacity and cancel all but one afterward.','Multiple claims can exist before cancellation and may conflict; the case requires a priority-ordered eligible claim.'],
['Let the operator choose a station from its name and perform capacity/expiry checks in the caller.','This duplicates station eligibility and can bypass the required priority order across handlers.'],
['Ask stations concurrently and keep the first response, even when an earlier-priority station is eligible.','Arrival order can bypass station priority or select a response that has not passed the expiry check.']]},
{op:'merge duplicate metadata',scope:'the handler that recognizes the conflict resolves it; others pass without changing either record, and asset identity remains stable',effect:'one recognized conflict resolution without changing asset identity',alts:[
['Let every metadata handler apply its changes even when it does not recognize the conflict, then roll back if needed.','The prompt requires non-owning handlers to pass without changing either record; later rollback is not that pass contract.'],
['Merge each field in the caller by asking all handlers for a preferred value.','That bypasses conflict ownership and may combine incompatible changes across the two source records.'],
['Create a new asset identity for each resolved metadata conflict.','The case explicitly keeps asset identity stable while descriptive values are replaced.'],
['Run every conflict handler at once and retain the first mutation observed.','A concurrent mutation can come from a handler that does not own the conflict and may alter a record before ownership is known.']]},
];
if(qs.length!==rows.length) throw Error('expected 18 B06 items');
for(let i=0;i<qs.length;i++){
 const q=qs[i],r=rows[i],n=String(i+1).padStart(3,'0');
 const wrong=q.interaction.options.filter(o=>o.optionId!==q.answer.optionId);
 if(wrong.length!==4||r.alts.length!==4)throw Error(`wrong option count ${i+1}`);
 const optionsById=new Map();
 for(let j=0;j<wrong.length;j++){const o=wrong[j],id=`n06b06_i${n}_alt${j+1}`;optionsById.set(o.optionId,{optionId:id,text:r.alts[j][0]});}
 q.interaction.options=q.interaction.options.map(o=>o.optionId===q.answer.optionId?o:optionsById.get(o.optionId));
 q.feedback.messages=wrong.map((o,j)=>({kind:'wrong_option',targetId:`n06b06_i${n}_alt${j+1}`,text:r.alts[j][1]}));
 q.feedback.reason=`${r.scope.charAt(0).toUpperCase()+r.scope.slice(1)}. ${i===13?'This uses an ordered remainder handoff rather than a one-winner chain.':'The ordered pass-or-terminal contract keeps that eligibility decision with the handler that owns it.'}`;
 const continuation=i===13?'Each vendor receives only the still-unfilled quantity. A partial acceptance records that split and passes the remainder onward with the original request identity and delivery promise.':'An applicable handler returns its result and ends evaluation; a handler whose stated qualification does not apply passes so the next ordered handler can inspect the request.';
 q.feedback.details={
   mechanismOrProperty:`${continuation} This separates sequencing from each handler’s case-specific eligibility rule.`,
   scenarioApplication:`For ${r.op}, the deciding facts are: ${r.scope}. ${i===13?'Each accepted split contributes quantity while the same request and promise continue.':'The first applicable handler owns the stated result; facts outside that handler’s scope remain separate.'}`,
   errorCorrection:`The closest wrong approach is ${r.alts[0][0].charAt(0).toLowerCase()+r.alts[0][0].slice(1)} ${r.alts[0][1]} The contract instead requires ${r.effect}.`,
   boundaryOrTradeoff:i===13?'The ordered remainder handoff fits while each vendor may accept part and the next receives only what remains. If allocation must optimize across all vendors globally or commit every split atomically, use an explicit allocation coordinator.':`Use this ordered pass-or-terminal design while ${r.scope}. If the contract changes to require all checks or multiple owners, make that composition explicit rather than treating a pass as an additional result.`,
   transfer:`For a new ${r.op} case, reuse the chain only if its handler can state when it owns the request and whether the outcome is terminal${i===13?' or passes a remaining quantity':' or passes to the next handler'}.`,
 };
}
fs.writeFileSync(file,JSON.stringify(qs,null,2)+'\n');
console.log('wrote case-specific B06 v2 corrections:',qs.length);
