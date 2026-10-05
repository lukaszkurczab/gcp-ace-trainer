# N08-B02 author notes — proposal v1

Before source SHA-256: `1db1cf0b1c16746d2899fadd9dd2afdfb2d40e3fc945e220a79404b0883efba8`
Proposal SHA-256: `bd6dd7da862836111d3f03d0655884b45a69635e8cd2af3eef8a919c3fb2dc1c`

Proposal-only authorship rationale. IDs and the broad coordination-key identity are retained; the case now identifies the concrete scope and ordering or transfer facts. Every former generic distractor was replaced with three case-specific meanings using new IDs, and feedback maps to those exact options. Existing source references are retained; scenario guarantees are premises supplied in the stem. This record is not semantic acceptance or source activation.

## ood-n08-b02-i001
Objective: Scope coordination to the state that must change together or the sequence that defines acceptance. Keep independent aggregates moving, and pass immutable records when a consumer needs a stable view.
Decisive facts: In A marketplace payout service, The finance operator releases a seller payout. Settlement and release requests can overlap for one order; an order must be settled before its payout is accepted, while unrelated orders should continue. Which coordination boundary best preserves the stated ordering and state?
Nearest alternative: Read settled status in the finance screen, then submit a release based on that earlier result.
Identity: preserve_question_id — The old key was: Choose one synchronization owner or immutable transfer model so a compound invariant has one coordination point. In this case, that keeps the rule “release is idempotent and tied to a settled order” inside the owner that can observe and enforce it. The current key still chooses one coordination boundary or immutable handoff for the same unit decision; its per-case mechanism specializes that accepted meaning to the newly explicit case facts.
Option changes: coordinator_exports_state → caller_snapshot_01, inheritance_for_reuse → shared_global_01, representation_leaks → split_transition_01
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b02-i002
Objective: Scope coordination to the state that must change together or the sequence that defines acceptance. Keep independent aggregates moving, and pass immutable records when a consumer needs a stable view.
Decisive facts: In A public-transit disruption board, Each platform change receives an effective sequence number before publication. A delayed earlier update must not appear after a later effective update; separate lines publish independently. Which coordination boundary best preserves the stated ordering and state?
Nearest alternative: Publish each update as soon as its network request arrives and sort the board afterward.
Identity: preserve_question_id — The old key was: Choose one synchronization owner or immutable transfer model so a compound invariant has one coordination point. In this case, that keeps the rule “passengers receive the change in the order in which it becomes effective” inside the owner that can observe and enforce it. The current key still chooses one coordination boundary or immutable handoff for the same unit decision; its per-case mechanism specializes that accepted meaning to the newly explicit case facts.
Option changes: coordinator_exports_state → caller_snapshot_02, inheritance_for_reuse → shared_global_02, representation_leaks → split_transition_02
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b02-i003
Objective: Scope coordination to the state that must change together or the sequence that defines acceptance. Keep independent aggregates moving, and pass immutable records when a consumer needs a stable view.
Decisive facts: In A neighborhood energy-sharing service, Two reservation requests can overlap for the same meter and time window. The service must never confirm both; reservations for different meters should proceed independently. Which coordination boundary best preserves the stated ordering and state?
Nearest alternative: Check for an open window, release coordination, and insert the reservation in a later step.
Identity: preserve_question_id — The old key was: Choose one synchronization owner or immutable transfer model so a compound invariant has one coordination point. In this case, that keeps the rule “a meter cannot be committed twice for an overlapping window” inside the owner that can observe and enforce it. The current key still chooses one coordination boundary or immutable handoff for the same unit decision; its per-case mechanism specializes that accepted meaning to the newly explicit case facts.
Option changes: inheritance_for_reuse → caller_snapshot_03, representation_leaks → shared_global_03, speculative_indirection → split_transition_03
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b02-i004
Objective: Scope coordination to the state that must change together or the sequence that defines acceptance. Keep independent aggregates moving, and pass immutable records when a consumer needs a stable view.
Decisive facts: In A live captioning studio, A stream keeps the provider configuration it began with, including its timing and error contract. A provider switch should affect new streams only; active streams may continue while the next stream starts. Which coordination boundary best preserves the stated ordering and state?
Nearest alternative: Mutate the shared provider object while all active stream handlers keep references to it.
Identity: preserve_question_id — The old key was: Choose one synchronization owner or immutable transfer model so a compound invariant has one coordination point. In this case, that keeps the rule “the current stream keeps its timing and error contract” inside the owner that can observe and enforce it. The current key still chooses one coordination boundary or immutable handoff for the same unit decision; its per-case mechanism specializes that accepted meaning to the newly explicit case facts.
Option changes: representation_leaks → caller_snapshot_04, speculative_indirection → shared_global_04, coordinator_exports_state → split_transition_04
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b02-i005
Objective: Scope coordination to the state that must change together or the sequence that defines acceptance. Keep independent aggregates moving, and pass immutable records when a consumer needs a stable view.
Decisive facts: In A volunteer coordination hub, Two volunteers exchange shifts in one operation. Both skills and availability checks must pass for the same pair of assignments; other shift pairs can be updated independently. Which coordination boundary best preserves the stated ordering and state?
Nearest alternative: Write the first volunteer's new shift, then check and write the second; compensate the first write if the second check fails.
Identity: preserve_question_id — The old key was: Choose one synchronization owner or immutable transfer model so a compound invariant has one coordination point. In this case, that keeps the rule “skills and availability constraints hold for both assignments” inside the owner that can observe and enforce it. The current key still chooses one coordination boundary or immutable handoff for the same unit decision; its per-case mechanism specializes that accepted meaning to the newly explicit case facts.
Option changes: speculative_indirection → caller_snapshot_05, coordinator_exports_state → shared_global_05, inheritance_for_reuse → split_transition_05
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b02-i006
Objective: Scope coordination to the state that must change together or the sequence that defines acceptance. Keep independent aggregates moving, and pass immutable records when a consumer needs a stable view.
Decisive facts: In A local-first map editor, Each offline route proposal records its base revision. Two devices can submit against the same base; if one has already been accepted, the other must receive a conflict rather than replace it. Which coordination boundary best preserves the stated ordering and state?
Nearest alternative: Check the revision on the device before upload, then overwrite the route when the upload finishes.
Identity: preserve_question_id — The old key was: Choose one synchronization owner or immutable transfer model so a compound invariant has one coordination point. In this case, that keeps the rule “conflicts are explicit and never silently overwrite accepted geometry” inside the owner that can observe and enforce it. The current key still chooses one coordination boundary or immutable handoff for the same unit decision; its per-case mechanism specializes that accepted meaning to the newly explicit case facts.
Option changes: coordinator_exports_state → caller_snapshot_06, inheritance_for_reuse → shared_global_06, representation_leaks → split_transition_06
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b02-i007
Objective: Scope coordination to the state that must change together or the sequence that defines acceptance. Keep independent aggregates moving, and pass immutable records when a consumer needs a stable view.
Decisive facts: In A board-game campaign manager, Reward actions are legal only in the current campaign phase. A host and moderator can issue them concurrently, but actions in separate campaigns are independent. Which coordination boundary best preserves the stated ordering and state?
Nearest alternative: Let each screen compute the next phase from its displayed campaign copy and replace the phase after applying rewards.
Identity: preserve_question_id — The old key was: Choose one synchronization owner or immutable transfer model so a compound invariant has one coordination point. In this case, that keeps the rule “reward rules depend on the current legal campaign state” inside the owner that can observe and enforce it. The current key still chooses one coordination boundary or immutable handoff for the same unit decision; its per-case mechanism specializes that accepted meaning to the newly explicit case facts.
Option changes: coordinator_exports_state → caller_snapshot_07, inheritance_for_reuse → shared_global_07, representation_leaks → split_transition_07
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b02-i008
Objective: Scope coordination to the state that must change together or the sequence that defines acceptance. Keep independent aggregates moving, and pass immutable records when a consumer needs a stable view.
Decisive facts: In A cold-chain logistics console, A carrier hand-off changes carrier and hand-off status together, while the shipment's temperature limits stay attached. The old carrier may finish reading its view after transfer; only one carrier owns new work after acceptance. Which coordination boundary best preserves the stated ordering and state?
Nearest alternative: Give both carriers a mutable reference to the same shipment and let each mark its own hand-off complete.
Identity: preserve_question_id — The old key was: Choose one synchronization owner or immutable transfer model so a compound invariant has one coordination point. In this case, that keeps the rule “temperature restrictions and hand-off ownership travel with the shipment” inside the owner that can observe and enforce it. The current key still chooses one coordination boundary or immutable handoff for the same unit decision; its per-case mechanism specializes that accepted meaning to the newly explicit case facts.
Option changes: inheritance_for_reuse → caller_snapshot_08, representation_leaks → shared_global_08, speculative_indirection → split_transition_08
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b02-i009
Objective: Scope coordination to the state that must change together or the sequence that defines acceptance. Keep independent aggregates moving, and pass immutable records when a consumer needs a stable view.
Decisive facts: In A cooperative lending ledger, Concurrent repayments for one account must not allocate more than its current outstanding balance. Each accepted allocation needs a matching ledger entry; other accounts can be handled at the same time. Which coordination boundary best preserves the stated ordering and state?
Nearest alternative: Have each repayment screen compute a remaining balance and write it with a separate ledger entry.
Identity: preserve_question_id — The old key was: Choose one synchronization owner or immutable transfer model so a compound invariant has one coordination point. In this case, that keeps the rule “a repayment cannot reduce the outstanding balance below zero” inside the owner that can observe and enforce it. The current key still chooses one coordination boundary or immutable handoff for the same unit decision; its per-case mechanism specializes that accepted meaning to the newly explicit case facts.
Option changes: representation_leaks → caller_snapshot_09, speculative_indirection → shared_global_09, coordinator_exports_state → split_transition_09
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b02-i010
Objective: Scope coordination to the state that must change together or the sequence that defines acceptance. Keep independent aggregates moving, and pass immutable records when a consumer needs a stable view.
Decisive facts: In A tournament bracket service, A match can receive both a timeout and an official result. The match's accepted terminal result must advance the bracket once; another match must not wait for it. Which coordination boundary best preserves the stated ordering and state?
Nearest alternative: Let the timer and official handler each write the next bracket slot, then deduplicate duplicate slots later.
Identity: preserve_question_id — The old key was: Choose one synchronization owner or immutable transfer model so a compound invariant has one coordination point. In this case, that keeps the rule “the bracket advances only from a legal match state” inside the owner that can observe and enforce it. The current key still chooses one coordination boundary or immutable handoff for the same unit decision; its per-case mechanism specializes that accepted meaning to the newly explicit case facts.
Option changes: speculative_indirection → caller_snapshot_10, coordinator_exports_state → shared_global_10, inheritance_for_reuse → split_transition_10
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b02-i011
Objective: Scope coordination to the state that must change together or the sequence that defines acceptance. Keep independent aggregates moving, and pass immutable records when a consumer needs a stable view.
Decisive facts: In A returns inspection workflow, The inspection record captures condition and evidence. A refund reviewer can read that record while another inspection is being completed; the reviewer must not change the inspection facts. Which coordination boundary best preserves the stated ordering and state?
Nearest alternative: Let the reviewer update the inspection fields to show whether the refund was approved.
Identity: preserve_question_id — The old key was: Choose one synchronization owner or immutable transfer model so a compound invariant has one coordination point. In this case, that keeps the rule “classification and refund eligibility are not the same responsibility” inside the owner that can observe and enforce it. The current key still chooses one coordination boundary or immutable handoff for the same unit decision; its per-case mechanism specializes that accepted meaning to the newly explicit case facts.
Option changes: coordinator_exports_state → caller_snapshot_11, inheritance_for_reuse → shared_global_11, representation_leaks → split_transition_11
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b02-i012
Objective: Scope coordination to the state that must change together or the sequence that defines acceptance. Keep independent aggregates moving, and pass immutable records when a consumer needs a stable view.
Decisive facts: In A research-notebook platform, A publication uses one selected dataset and code revision. Notebook edits may continue while the job runs; the output must identify the exact selection used. Which coordination boundary best preserves the stated ordering and state?
Nearest alternative: Let the job read the live notebook whenever each stage starts and infer the revision from the last stage.
Identity: preserve_question_id — The old key was: Choose one synchronization owner or immutable transfer model so a compound invariant has one coordination point. In this case, that keeps the rule “published outputs reference immutable inputs and code versions” inside the owner that can observe and enforce it. The current key still chooses one coordination boundary or immutable handoff for the same unit decision; its per-case mechanism specializes that accepted meaning to the newly explicit case facts.
Option changes: coordinator_exports_state → caller_snapshot_12, inheritance_for_reuse → shared_global_12, representation_leaks → split_transition_12
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b02-i013
Objective: Scope coordination to the state that must change together or the sequence that defines acceptance. Keep independent aggregates moving, and pass immutable records when a consumer needs a stable view.
Decisive facts: In A collaborative annotation workspace, An accepted comment names its author and document revision. Notification can be delayed or retried, but the same accepted comment must keep those values. Which coordination boundary best preserves the stated ordering and state?
Nearest alternative: Have the notification handler fill in author and revision from whichever editor is current when it sends.
Identity: preserve_question_id — The old key was: Choose one synchronization owner or immutable transfer model so a compound invariant has one coordination point. In this case, that keeps the rule “accepted comments must retain their author and document revision” inside the owner that can observe and enforce it. The current key still chooses one coordination boundary or immutable handoff for the same unit decision; its per-case mechanism specializes that accepted meaning to the newly explicit case facts.
Option changes: inheritance_for_reuse → caller_snapshot_13, representation_leaks → shared_global_13, speculative_indirection → split_transition_13
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b02-i014
Objective: Scope coordination to the state that must change together or the sequence that defines acceptance. Keep independent aggregates moving, and pass immutable records when a consumer needs a stable view.
Decisive facts: In A mobile field-inspection app, The inspector can edit a later draft while an earlier revision is being submitted. The server returns complete or retryable for the submitted revision; it must not mark later edits complete by mistake. Which coordination boundary best preserves the stated ordering and state?
Nearest alternative: Let the server read the live draft throughout submission and mark the current draft complete when its response arrives.
Identity: preserve_question_id — The old key was: Choose one synchronization owner or immutable transfer model so a compound invariant has one coordination point. In this case, that keeps the rule “a submission is either complete or explicitly retryable” inside the owner that can observe and enforce it. The current key still chooses one coordination boundary or immutable handoff for the same unit decision; its per-case mechanism specializes that accepted meaning to the newly explicit case facts.
Option changes: representation_leaks → caller_snapshot_14, speculative_indirection → shared_global_14, coordinator_exports_state → split_transition_14
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b02-i015
Objective: Scope coordination to the state that must change together or the sequence that defines acceptance. Keep independent aggregates moving, and pass immutable records when a consumer needs a stable view.
Decisive facts: In A digital invoice exchange, The invoice exchange can return a response after an operator has begun a corrected issue. Each issued copy must retain its submitted values and the exchange result must attach to the matching copy. Which coordination boundary best preserves the stated ordering and state?
Nearest alternative: Update one mutable invoice object when each exchange response arrives, regardless of which issue it answers.
Identity: preserve_question_id — The old key was: Choose one synchronization owner or immutable transfer model so a compound invariant has one coordination point. In this case, that keeps the rule “the new issue is traceable and does not double-charge the customer” inside the owner that can observe and enforce it. The current key still chooses one coordination boundary or immutable handoff for the same unit decision; its per-case mechanism specializes that accepted meaning to the newly explicit case facts.
Option changes: speculative_indirection → caller_snapshot_15, coordinator_exports_state → shared_global_15, inheritance_for_reuse → split_transition_15
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b02-i016
Objective: Scope coordination to the state that must change together or the sequence that defines acceptance. Keep independent aggregates moving, and pass immutable records when a consumer needs a stable view.
Decisive facts: In A smart-building access controller, The authority assigns a new badge revision on revocation. A door request carries the revision it checked; if revocation has advanced the authority's revision, the request must not grant from its older view. Which coordination boundary best preserves the stated ordering and state?
Nearest alternative: Let each door write revocation into its local badge cache and reconcile with the authority later.
Identity: preserve_question_id — The old key was: Choose one synchronization owner or immutable transfer model so a compound invariant has one coordination point. In this case, that keeps the rule “revocation is visible to the door policy before access is granted” inside the owner that can observe and enforce it. The current key still chooses one coordination boundary or immutable handoff for the same unit decision; its per-case mechanism specializes that accepted meaning to the newly explicit case facts.
Option changes: coordinator_exports_state → caller_snapshot_16, inheritance_for_reuse → shared_global_16, representation_leaks → split_transition_16
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b02-i017
Objective: Scope coordination to the state that must change together or the sequence that defines acceptance. Keep independent aggregates moving, and pass immutable records when a consumer needs a stable view.
Decisive facts: In A package-label generation service, A correction creates a new approved shipment revision. An already-running print job must use the revision it started with; a later job should use the new approved revision. Which coordination boundary best preserves the stated ordering and state?
Nearest alternative: Let the print callback read the shipment's current address for every label field as it renders.
Identity: preserve_question_id — The old key was: Choose one synchronization owner or immutable transfer model so a compound invariant has one coordination point. In this case, that keeps the rule “the printed label represents the current approved shipment data” inside the owner that can observe and enforce it. The current key still chooses one coordination boundary or immutable handoff for the same unit decision; its per-case mechanism specializes that accepted meaning to the newly explicit case facts.
Option changes: coordinator_exports_state → caller_snapshot_17, inheritance_for_reuse → shared_global_17, representation_leaks → split_transition_17
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b02-i018
Objective: Scope coordination to the state that must change together or the sequence that defines acceptance. Keep independent aggregates moving, and pass immutable records when a consumer needs a stable view.
Decisive facts: In A multi-tenant rehearsal scheduler, A room has capacity three for overlapping bookings. Two coordinators can reserve the final slot concurrently; reservations in other rooms should proceed independently. Which coordination boundary best preserves the stated ordering and state?
Nearest alternative: Let each coordinator check a search result and add a booking after returning to the form.
Identity: preserve_question_id — The old key was: Choose one synchronization owner or immutable transfer model so a compound invariant has one coordination point. In this case, that keeps the rule “the room capacity and cancellation policy must remain consistent” inside the owner that can observe and enforce it. The current key still chooses one coordination boundary or immutable handoff for the same unit decision; its per-case mechanism specializes that accepted meaning to the newly explicit case facts.
Option changes: inheritance_for_reuse → caller_snapshot_18, representation_leaks → shared_global_18, speculative_indirection → split_transition_18
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines
