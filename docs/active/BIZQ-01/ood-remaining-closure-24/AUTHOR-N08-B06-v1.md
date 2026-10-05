# N08-B06 author notes — proposal v1

Before source SHA-256: `e89dc87ab83957715099a8eee747f07eb435ce4e3fe7d7d1ef04145ff25263bd`
Proposal SHA-256: `7a369798cc0469b6eb49f08e011d2d35a6c62331e8c6a0f93dbe59697b1f9299`

Proposal-only authorship rationale. Each case now distinguishes cancellation/timeout of a wait from completion or rollback of an operation and names the relevant cleanup/result boundary. Existing question IDs and broad unit key identity are retained. The generic wrong choices were replaced with case-specific meanings and new option IDs; diagnostics target those meanings. Application cancellation/commit behaviors are fictional facts stated in each stem, not guarantees attributed to a technology source. This is not semantic acceptance or source activation.

## ood-n08-b06-i001
Objective: Distinguish a caller cancellation or timeout from operation completion; assign cleanup, cancellation, and result reporting to the correct async owner and commit boundary.
Decisive facts: In A package-label generation service, A print job can be shared by two callers. If one caller cancels its wait, the other still needs the same approved shipment revision rendered; the shared job must release its temporary file on completion. Which async-operation contract should the owner expose?
Nearest alternative: Cancel the shared render task whenever any one caller stops waiting.
Identity: preserve_question_id — The original keyed decision was: Propagate cancellation, timeout, and completion ownership through the workflow instead of abandoning the resource. In this case, that keeps the rule “the printed label represents the current approved shipment data” inside the owner that can observe and enforce it. The new key remains about cancellation, timeout, or completion ownership for the same operation; the revised facts expose the exact point where the caller's wait and the operation's state differ.
Option changes: coordinator_exports_state → detach_or_swallow_01, inheritance_for_reuse → misreport_completion_01, representation_leaks → wide_cancellation_01
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b06-i002
Objective: Distinguish a caller cancellation or timeout from operation completion; assign cleanup, cancellation, and result reporting to the correct async owner and commit boundary.
Decisive facts: In A multi-tenant rehearsal scheduler, A room move holds a temporary destination slot while a coordinator waits for confirmation. If the operation times out or is canceled, the slot must be released unless the move has committed; other rooms remain available. Which async-operation contract should the owner expose?
Nearest alternative: Let the coordinator abandon its wait while the destination slot remains reserved for a future retry.
Identity: preserve_question_id — The original keyed decision was: Propagate cancellation, timeout, and completion ownership through the workflow instead of abandoning the resource. In this case, that keeps the rule “the room capacity and cancellation policy must remain consistent” inside the owner that can observe and enforce it. The new key remains about cancellation, timeout, or completion ownership for the same operation; the revised facts expose the exact point where the caller's wait and the operation's state differ.
Option changes: coordinator_exports_state → detach_or_swallow_02, inheritance_for_reuse → misreport_completion_02, representation_leaks → wide_cancellation_02
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b06-i003
Objective: Distinguish a caller cancellation or timeout from operation completion; assign cleanup, cancellation, and result reporting to the correct async owner and commit boundary.
Decisive facts: In A museum exhibit controller, An unsafe command can be queued before maintenance begins. Cancellation before dispatch should remove that command; after the controller has accepted it, the caller must receive the accepted outcome rather than a false canceled result. Which async-operation contract should the owner expose?
Nearest alternative: Let the user interface show canceled immediately and discard any later controller response.
Identity: preserve_question_id — The original keyed decision was: Propagate cancellation, timeout, and completion ownership through the workflow instead of abandoning the resource. In this case, that keeps the rule “unsafe commands are rejected while maintenance is active” inside the owner that can observe and enforce it. The new key remains about cancellation, timeout, or completion ownership for the same operation; the revised facts expose the exact point where the caller's wait and the operation's state differ.
Option changes: inheritance_for_reuse → detach_or_swallow_03, representation_leaks → misreport_completion_03, speculative_indirection → wide_cancellation_03
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b06-i004
Objective: Distinguish a caller cancellation or timeout from operation completion; assign cleanup, cancellation, and result reporting to the correct async owner and commit boundary.
Decisive facts: In A video-learning library, Retirement updates catalog availability and schedules a progress-preservation task. If the editor cancels before publication, learners must still see the old lesson; after publication, the preserved progress mapping must be reported complete. Which async-operation contract should the owner expose?
Nearest alternative: Hide the lesson as soon as the background task starts and restore it if cancellation arrives later.
Identity: preserve_question_id — The original keyed decision was: Propagate cancellation, timeout, and completion ownership through the workflow instead of abandoning the resource. In this case, that keeps the rule “progress refers to a stable lesson identity” inside the owner that can observe and enforce it. The new key remains about cancellation, timeout, or completion ownership for the same operation; the revised facts expose the exact point where the caller's wait and the operation's state differ.
Option changes: representation_leaks → detach_or_swallow_04, speculative_indirection → misreport_completion_04, coordinator_exports_state → wide_cancellation_04
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b06-i005
Objective: Distinguish a caller cancellation or timeout from operation completion; assign cleanup, cancellation, and result reporting to the correct async owner and commit boundary.
Decisive facts: In A shared whiteboard application, Export reads a stable board snapshot into a temporary file. If the host cancels export, the file must be closed and removed, but participants must keep editing the board. Which async-operation contract should the owner expose?
Nearest alternative: Cancel the export wait but leave its temporary file open for whoever retries later.
Identity: preserve_question_id — The original keyed decision was: Propagate cancellation, timeout, and completion ownership through the workflow instead of abandoning the resource. In this case, that keeps the rule “export observes a stable session state” inside the owner that can observe and enforce it. The new key remains about cancellation, timeout, or completion ownership for the same operation; the revised facts expose the exact point where the caller's wait and the operation's state differ.
Option changes: speculative_indirection → detach_or_swallow_05, coordinator_exports_state → misreport_completion_05, inheritance_for_reuse → wide_cancellation_05
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b06-i006
Objective: Distinguish a caller cancellation or timeout from operation completion; assign cleanup, cancellation, and result reporting to the correct async owner and commit boundary.
Decisive facts: In A customer-support escalation desk, An escalation command may commit just before the network response is lost. A client timeout is not a rejection; support staff need to distinguish pending/unknown from a confirmed failed command. Which async-operation contract should the owner expose?
Nearest alternative: Tell the agent the escalation failed as soon as the response deadline passes.
Identity: preserve_question_id — The original keyed decision was: Propagate cancellation, timeout, and completion ownership through the workflow instead of abandoning the resource. In this case, that keeps the rule “the escalation keeps ownership and response deadlines” inside the owner that can observe and enforce it. The new key remains about cancellation, timeout, or completion ownership for the same operation; the revised facts expose the exact point where the caller's wait and the operation's state differ.
Option changes: coordinator_exports_state → detach_or_swallow_06, inheritance_for_reuse → misreport_completion_06, representation_leaks → wide_cancellation_06
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b06-i007
Objective: Distinguish a caller cancellation or timeout from operation completion; assign cleanup, cancellation, and result reporting to the correct async owner and commit boundary.
Decisive facts: In A regional produce marketplace, Listing validation is asynchronous. Buyers must not see a listing until validation commits; if validation is canceled before commit, the prior published revision remains visible. Which async-operation contract should the owner expose?
Nearest alternative: Expose the candidate price immediately and retract it if the validation task later fails.
Identity: preserve_question_id — The original keyed decision was: Propagate cancellation, timeout, and completion ownership through the workflow instead of abandoning the resource. In this case, that keeps the rule “a listing cannot become visible before its price and stock rule are valid” inside the owner that can observe and enforce it. The new key remains about cancellation, timeout, or completion ownership for the same operation; the revised facts expose the exact point where the caller's wait and the operation's state differ.
Option changes: coordinator_exports_state → detach_or_swallow_07, inheritance_for_reuse → misreport_completion_07, representation_leaks → wide_cancellation_07
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b06-i008
Objective: Distinguish a caller cancellation or timeout from operation completion; assign cleanup, cancellation, and result reporting to the correct async owner and commit boundary.
Decisive facts: In A repair-parts marketplace, A split starts two vendor checks concurrently. If either check fails before acceptance, the parent request remains unchanged; cancellation should stop remaining checks and retain the original delivery promise. Which async-operation contract should the owner expose?
Nearest alternative: Publish the first vendor child immediately and mark the second as pending even when the request contract says the split is complete.
Identity: preserve_question_id — The original keyed decision was: Propagate cancellation, timeout, and completion ownership through the workflow instead of abandoning the resource. In this case, that keeps the rule “each split retains the original request identity and delivery promise” inside the owner that can observe and enforce it. The new key remains about cancellation, timeout, or completion ownership for the same operation; the revised facts expose the exact point where the caller's wait and the operation's state differ.
Option changes: inheritance_for_reuse → detach_or_swallow_08, representation_leaks → misreport_completion_08, speculative_indirection → wide_cancellation_08
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b06-i009
Objective: Distinguish a caller cancellation or timeout from operation completion; assign cleanup, cancellation, and result reporting to the correct async owner and commit boundary.
Decisive facts: In A community garden allocation tool, A transfer waits for an approval service. While waiting, the plot remains with its current member; canceling the request releases only the transfer's temporary reservation, not the existing reservation. Which async-operation contract should the owner expose?
Nearest alternative: Move the plot to the new member before waiting for approval, then restore it if approval is denied.
Identity: preserve_question_id — The original keyed decision was: Propagate cancellation, timeout, and completion ownership through the workflow instead of abandoning the resource. In this case, that keeps the rule “transfer preserves the plot boundary and approval history” inside the owner that can observe and enforce it. The new key remains about cancellation, timeout, or completion ownership for the same operation; the revised facts expose the exact point where the caller's wait and the operation's state differ.
Option changes: representation_leaks → detach_or_swallow_09, speculative_indirection → misreport_completion_09, coordinator_exports_state → wide_cancellation_09
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b06-i010
Objective: Distinguish a caller cancellation or timeout from operation completion; assign cleanup, cancellation, and result reporting to the correct async owner and commit boundary.
Decisive facts: In A subscription packaging service, Bundle validation awaits pricing and component checks. If one check fails, publication must fail and the bundle must remain on its prior revision; no task may run unobserved after the result is returned. Which async-operation contract should the owner expose?
Nearest alternative: Start component checks as background tasks and publish the new bundle before they complete.
Identity: preserve_question_id — The original keyed decision was: Propagate cancellation, timeout, and completion ownership through the workflow instead of abandoning the resource. In this case, that keeps the rule “the bundle pricing policy remains consistent with its components” inside the owner that can observe and enforce it. The new key remains about cancellation, timeout, or completion ownership for the same operation; the revised facts expose the exact point where the caller's wait and the operation's state differ.
Option changes: speculative_indirection → detach_or_swallow_10, coordinator_exports_state → misreport_completion_10, inheritance_for_reuse → wide_cancellation_10
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b06-i011
Objective: Distinguish a caller cancellation or timeout from operation completion; assign cleanup, cancellation, and result reporting to the correct async owner and commit boundary.
Decisive facts: In A fleet charging coordinator, A reservation request owns a temporary charger hold until its capacity check finishes. If the request is canceled before acceptance, the hold must expire or be released; a confirmed reservation remains valid. Which async-operation contract should the owner expose?
Nearest alternative: Leave the hold indefinitely when the requester times out so a retry can reuse it.
Identity: preserve_question_id — The original keyed decision was: Propagate cancellation, timeout, and completion ownership through the workflow instead of abandoning the resource. In this case, that keeps the rule “charger capacity and reservation expiry are coordinated” inside the owner that can observe and enforce it. The new key remains about cancellation, timeout, or completion ownership for the same operation; the revised facts expose the exact point where the caller's wait and the operation's state differ.
Option changes: coordinator_exports_state → detach_or_swallow_11, inheritance_for_reuse → misreport_completion_11, representation_leaks → wide_cancellation_11
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b06-i012
Objective: Distinguish a caller cancellation or timeout from operation completion; assign cleanup, cancellation, and result reporting to the correct async owner and commit boundary.
Decisive facts: In A photo-archive curation tool, A merge builds a candidate metadata record from two curator edits. Cancellation before the final compare-and-replace must leave the current asset unchanged; success publishes one new revision. Which async-operation contract should the owner expose?
Nearest alternative: Write each metadata field as it is transformed and restore the old values if cancellation arrives.
Identity: preserve_question_id — The original keyed decision was: Propagate cancellation, timeout, and completion ownership through the workflow instead of abandoning the resource. In this case, that keeps the rule “asset identity remains stable while descriptive values are replaced” inside the owner that can observe and enforce it. The new key remains about cancellation, timeout, or completion ownership for the same operation; the revised facts expose the exact point where the caller's wait and the operation's state differ.
Option changes: coordinator_exports_state → detach_or_swallow_12, inheritance_for_reuse → misreport_completion_12, representation_leaks → wide_cancellation_12
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b06-i013
Objective: Distinguish a caller cancellation or timeout from operation completion; assign cleanup, cancellation, and result reporting to the correct async owner and commit boundary.
Decisive facts: In A digital rights clearance tool, A territory approval waits for an external license check. No approval is visible until the check completes; cancellation before that result must leave the territory unapproved. Which async-operation contract should the owner expose?
Nearest alternative: Create a provisional approval before the check and rely on a later job to remove it on failure.
Identity: preserve_question_id — The original keyed decision was: Propagate cancellation, timeout, and completion ownership through the workflow instead of abandoning the resource. In this case, that keeps the rule “approval requires an explicit territory and expiration” inside the owner that can observe and enforce it. The new key remains about cancellation, timeout, or completion ownership for the same operation; the revised facts expose the exact point where the caller's wait and the operation's state differ.
Option changes: inheritance_for_reuse → detach_or_swallow_13, representation_leaks → misreport_completion_13, speculative_indirection → wide_cancellation_13
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b06-i014
Objective: Distinguish a caller cancellation or timeout from operation completion; assign cleanup, cancellation, and result reporting to the correct async owner and commit boundary.
Decisive facts: In A drone maintenance planner, A battery replacement has a pending assignment hold. The current aircraft/battery mapping remains valid until the replacement is accepted; cancellation before acceptance releases the hold. Which async-operation contract should the owner expose?
Nearest alternative: Replace the aircraft mapping when work starts, then restore it if the technician cancels.
Identity: preserve_question_id — The original keyed decision was: Propagate cancellation, timeout, and completion ownership through the workflow instead of abandoning the resource. In this case, that keeps the rule “a battery cannot be assigned to two aircraft at once” inside the owner that can observe and enforce it. The new key remains about cancellation, timeout, or completion ownership for the same operation; the revised facts expose the exact point where the caller's wait and the operation's state differ.
Option changes: representation_leaks → detach_or_swallow_14, speculative_indirection → misreport_completion_14, coordinator_exports_state → wide_cancellation_14
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b06-i015
Objective: Distinguish a caller cancellation or timeout from operation completion; assign cleanup, cancellation, and result reporting to the correct async owner and commit boundary.
Decisive facts: In A clinic referral coordinator, The referral send may be canceled before any disclosure. Once the specialist has acknowledged receipt, the caller must learn that outcome and must not be told the referral was withdrawn. Which async-operation contract should the owner expose?
Nearest alternative: Report the referral canceled as soon as the navigator closes the screen, even if the specialist already acknowledged it.
Identity: preserve_question_id — The original keyed decision was: Propagate cancellation, timeout, and completion ownership through the workflow instead of abandoning the resource. In this case, that keeps the rule “privacy and consent rules apply before external disclosure” inside the owner that can observe and enforce it. The new key remains about cancellation, timeout, or completion ownership for the same operation; the revised facts expose the exact point where the caller's wait and the operation's state differ.
Option changes: speculative_indirection → detach_or_swallow_15, coordinator_exports_state → misreport_completion_15, inheritance_for_reuse → wide_cancellation_15
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b06-i016
Objective: Distinguish a caller cancellation or timeout from operation completion; assign cleanup, cancellation, and result reporting to the correct async owner and commit boundary.
Decisive facts: In A music practice tracker, A learner can stop waiting for a timed exercise result, but the scoring task may still finish. The exercise revision and score policy used by that task must remain attached to its result. Which async-operation contract should the owner expose?
Nearest alternative: Discard the scoring task whenever the learner closes the screen, even if the shared scoring worker serves other views.
Identity: preserve_question_id — The original keyed decision was: Propagate cancellation, timeout, and completion ownership through the workflow instead of abandoning the resource. In this case, that keeps the rule “completion records the exercise version and score policy” inside the owner that can observe and enforce it. The new key remains about cancellation, timeout, or completion ownership for the same operation; the revised facts expose the exact point where the caller's wait and the operation's state differ.
Option changes: coordinator_exports_state → detach_or_swallow_16, inheritance_for_reuse → misreport_completion_16, representation_leaks → wide_cancellation_16
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b06-i017
Objective: Distinguish a caller cancellation or timeout from operation completion; assign cleanup, cancellation, and result reporting to the correct async owner and commit boundary.
Decisive facts: In A procurement approval queue, An approval task can fail after checking controls. The manager must receive that failure, and no approved status may appear unless the decision and required evidence committed. Which async-operation contract should the owner expose?
Nearest alternative: Catch every task exception and show the approval as pending forever without a failure path.
Identity: preserve_question_id — The original keyed decision was: Propagate cancellation, timeout, and completion ownership through the workflow instead of abandoning the resource. In this case, that keeps the rule “approval is attributable, bounded, and cannot bypass required controls” inside the owner that can observe and enforce it. The new key remains about cancellation, timeout, or completion ownership for the same operation; the revised facts expose the exact point where the caller's wait and the operation's state differ.
Option changes: coordinator_exports_state → detach_or_swallow_17, inheritance_for_reuse → misreport_completion_17, representation_leaks → wide_cancellation_17
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b06-i018
Objective: Distinguish a caller cancellation or timeout from operation completion; assign cleanup, cancellation, and result reporting to the correct async owner and commit boundary.
Decisive facts: In A podcast production desk, A replacement recording is written to a temporary file before it becomes current. If the producer cancels during transcoding, the temp file must be disposed and the old recording remain available. Which async-operation contract should the owner expose?
Nearest alternative: Switch the episode pointer to the temporary file at the start and restore the old one if cancellation arrives.
Identity: preserve_question_id — The original keyed decision was: Propagate cancellation, timeout, and completion ownership through the workflow instead of abandoning the resource. In this case, that keeps the rule “annotations follow stable segments rather than file offsets” inside the owner that can observe and enforce it. The new key remains about cancellation, timeout, or completion ownership for the same operation; the revised facts expose the exact point where the caller's wait and the operation's state differ.
Option changes: inheritance_for_reuse → detach_or_swallow_18, representation_leaks → misreport_completion_18, speculative_indirection → wide_cancellation_18
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines
