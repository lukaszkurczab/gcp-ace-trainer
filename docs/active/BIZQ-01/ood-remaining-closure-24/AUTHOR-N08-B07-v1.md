# N08-B07 author notes — proposal v1

Before source SHA-256: `b535b0f1672a873e59c5f61c53fd9164f5bab43499801804990ff4134fdddf20`
Proposal SHA-256: `e4c9de058852ac2624b66e4ff48e69ba9cb516589e3d87a581e1b3290923ba3a`

Proposal-only authorship rationale. Each case now names the temporary resource, its owner, and the terminal event that requires cleanup or a successful ownership transfer. Existing question IDs and broad resource-lifetime decision are retained. Wrong-option meanings are case-specific replacements with fresh option IDs and matching diagnostics. Resource and cancellation guarantees are explicit scenario premises; source references are preserved as supporting context and do not establish fictional application behavior. This is not semantic acceptance or source activation.

## ood-n08-b07-i001
Objective: Assign each temporary resource a clear owner, scope its lifetime to actual use, and close or transfer it correctly on success, failure, or cancellation.
Decisive facts: In A research-notebook platform, A publication job opens a dataset handle and a temporary output file. The job owns both until it publishes the result; any failed or canceled run must close the handle and remove the temporary file. Which resource-lifetime boundary is correct?
Nearest alternative: Leave the dataset handle open in the editor so a retry can reuse it after the job exits.
Identity: preserve_question_id — The original keyed decision was: Acquire and release resources through a scope that survives errors and makes ownership visible. In this case, that keeps the rule “published outputs reference immutable inputs and code versions” inside the owner that can observe and enforce it. The current key still applies explicit resource ownership and cleanup to the same case; the new facts identify the resource lifecycle that the original stem left implicit.
Option changes: coordinator_exports_state → leak_after_exit_01, inheritance_for_reuse → release_too_early_01, representation_leaks → borrow_without_owner_01
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b07-i002
Objective: Assign each temporary resource a clear owner, scope its lifetime to actual use, and close or transfer it correctly on success, failure, or cancellation.
Decisive facts: In A collaborative annotation workspace, An editor subscribes to document-revision notifications while its review panel is open. Closing the panel ends that subscription, but accepted comments and their attribution remain stored. Which resource-lifetime boundary is correct?
Nearest alternative: Keep the subscription for the lifetime of the application so reopening the panel is faster.
Identity: preserve_question_id — The original keyed decision was: Acquire and release resources through a scope that survives errors and makes ownership visible. In this case, that keeps the rule “accepted comments must retain their author and document revision” inside the owner that can observe and enforce it. The current key still applies explicit resource ownership and cleanup to the same case; the new facts identify the resource lifecycle that the original stem left implicit.
Option changes: coordinator_exports_state → leak_after_exit_02, inheritance_for_reuse → release_too_early_02, representation_leaks → borrow_without_owner_02
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b07-i003
Objective: Assign each temporary resource a clear owner, scope its lifetime to actual use, and close or transfer it correctly on success, failure, or cancellation.
Decisive facts: In A mobile field-inspection app, Each upload attempt opens a file stream for one frozen inspection revision. The stream belongs to that attempt and must close on success, cancellation, or retryable failure; the inspection draft itself remains available. Which resource-lifetime boundary is correct?
Nearest alternative: Keep the stream open on retryable failure and reuse it from a later upload attempt.
Identity: preserve_question_id — The original keyed decision was: Acquire and release resources through a scope that survives errors and makes ownership visible. In this case, that keeps the rule “a submission is either complete or explicitly retryable” inside the owner that can observe and enforce it. The current key still applies explicit resource ownership and cleanup to the same case; the new facts identify the resource lifecycle that the original stem left implicit.
Option changes: inheritance_for_reuse → leak_after_exit_03, representation_leaks → release_too_early_03, speculative_indirection → borrow_without_owner_03
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b07-i004
Objective: Assign each temporary resource a clear owner, scope its lifetime to actual use, and close or transfer it correctly on success, failure, or cancellation.
Decisive facts: In A digital invoice exchange, The exchange client returns a response body stream. The invoice operation reads it to determine acceptance and owns it until parsing finishes; the response must close whether parsing succeeds or throws. Which resource-lifetime boundary is correct?
Nearest alternative: Keep every response body open until the invoice is paid so support can inspect it later.
Identity: preserve_question_id — The original keyed decision was: Acquire and release resources through a scope that survives errors and makes ownership visible. In this case, that keeps the rule “the new issue is traceable and does not double-charge the customer” inside the owner that can observe and enforce it. The current key still applies explicit resource ownership and cleanup to the same case; the new facts identify the resource lifecycle that the original stem left implicit.
Option changes: representation_leaks → leak_after_exit_04, speculative_indirection → release_too_early_04, coordinator_exports_state → borrow_without_owner_04
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b07-i005
Objective: Assign each temporary resource a clear owner, scope its lifetime to actual use, and close or transfer it correctly on success, failure, or cancellation.
Decisive facts: In A smart-building access controller, Each door subscribes to badge-revocation updates while its controller is active. Shutting down that door ends its subscription; the authority's badge record remains valid for other doors. Which resource-lifetime boundary is correct?
Nearest alternative: Keep every door subscription active after shutdown so it can receive future revocations.
Identity: preserve_question_id — The original keyed decision was: Acquire and release resources through a scope that survives errors and makes ownership visible. In this case, that keeps the rule “revocation is visible to the door policy before access is granted” inside the owner that can observe and enforce it. The current key still applies explicit resource ownership and cleanup to the same case; the new facts identify the resource lifecycle that the original stem left implicit.
Option changes: speculative_indirection → leak_after_exit_05, coordinator_exports_state → release_too_early_05, inheritance_for_reuse → borrow_without_owner_05
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b07-i006
Objective: Assign each temporary resource a clear owner, scope its lifetime to actual use, and close or transfer it correctly on success, failure, or cancellation.
Decisive facts: In A package-label generation service, A print attempt writes to a temporary file. The printer opens only the completed file; after print handoff, the print attempt must close its file handle, and failed attempts must remove incomplete files. Which resource-lifetime boundary is correct?
Nearest alternative: Open the final label path at the start and let the printer read while the generator continues writing.
Identity: preserve_question_id — The original keyed decision was: Acquire and release resources through a scope that survives errors and makes ownership visible. In this case, that keeps the rule “the printed label represents the current approved shipment data” inside the owner that can observe and enforce it. The current key still applies explicit resource ownership and cleanup to the same case; the new facts identify the resource lifecycle that the original stem left implicit.
Option changes: coordinator_exports_state → leak_after_exit_06, inheritance_for_reuse → release_too_early_06, representation_leaks → borrow_without_owner_06
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b07-i007
Objective: Assign each temporary resource a clear owner, scope its lifetime to actual use, and close or transfer it correctly on success, failure, or cancellation.
Decisive facts: In A multi-tenant rehearsal scheduler, A room move acquires a temporary destination hold while awaiting coordinator approval. The move operation owns that hold; denial or cancellation releases it, while a committed move consumes it as the booking. Which resource-lifetime boundary is correct?
Nearest alternative: Leave the hold active after denial so the coordinator can reconsider without reacquiring it.
Identity: preserve_question_id — The original keyed decision was: Acquire and release resources through a scope that survives errors and makes ownership visible. In this case, that keeps the rule “the room capacity and cancellation policy must remain consistent” inside the owner that can observe and enforce it. The current key still applies explicit resource ownership and cleanup to the same case; the new facts identify the resource lifecycle that the original stem left implicit.
Option changes: coordinator_exports_state → leak_after_exit_07, inheritance_for_reuse → release_too_early_07, representation_leaks → borrow_without_owner_07
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b07-i008
Objective: Assign each temporary resource a clear owner, scope its lifetime to actual use, and close or transfer it correctly on success, failure, or cancellation.
Decisive facts: In A museum exhibit controller, A maintenance command acquires a hardware session. The session belongs to that command and must close when the command completes or fails; the exhibit's mode remains owned by the controller. Which resource-lifetime boundary is correct?
Nearest alternative: Keep the hardware session open after command failure so a later command can inherit it without checking status.
Identity: preserve_question_id — The original keyed decision was: Acquire and release resources through a scope that survives errors and makes ownership visible. In this case, that keeps the rule “unsafe commands are rejected while maintenance is active” inside the owner that can observe and enforce it. The current key still applies explicit resource ownership and cleanup to the same case; the new facts identify the resource lifecycle that the original stem left implicit.
Option changes: inheritance_for_reuse → leak_after_exit_08, representation_leaks → release_too_early_08, speculative_indirection → borrow_without_owner_08
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b07-i009
Objective: Assign each temporary resource a clear owner, scope its lifetime to actual use, and close or transfer it correctly on success, failure, or cancellation.
Decisive facts: In A video-learning library, Retirement scans a learner-progress cursor. The scan owns the cursor only while reading; closing it must not delete or re-key the stable progress records. Which resource-lifetime boundary is correct?
Nearest alternative: Keep the cursor open so later retirements can resume from the same live cursor.
Identity: preserve_question_id — The original keyed decision was: Acquire and release resources through a scope that survives errors and makes ownership visible. In this case, that keeps the rule “progress refers to a stable lesson identity” inside the owner that can observe and enforce it. The current key still applies explicit resource ownership and cleanup to the same case; the new facts identify the resource lifecycle that the original stem left implicit.
Option changes: representation_leaks → leak_after_exit_09, speculative_indirection → release_too_early_09, coordinator_exports_state → borrow_without_owner_09
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b07-i010
Objective: Assign each temporary resource a clear owner, scope its lifetime to actual use, and close or transfer it correctly on success, failure, or cancellation.
Decisive facts: In A shared whiteboard application, Export owns a snapshot cursor and an output file while producing history. Canceling export must close both, but the live board continues accepting strokes. Which resource-lifetime boundary is correct?
Nearest alternative: Close the board session together with the export cursor so the snapshot cannot change.
Identity: preserve_question_id — The original keyed decision was: Acquire and release resources through a scope that survives errors and makes ownership visible. In this case, that keeps the rule “export observes a stable session state” inside the owner that can observe and enforce it. The current key still applies explicit resource ownership and cleanup to the same case; the new facts identify the resource lifecycle that the original stem left implicit.
Option changes: speculative_indirection → leak_after_exit_10, coordinator_exports_state → release_too_early_10, inheritance_for_reuse → borrow_without_owner_10
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b07-i011
Objective: Assign each temporary resource a clear owner, scope its lifetime to actual use, and close or transfer it correctly on success, failure, or cancellation.
Decisive facts: In A customer-support escalation desk, An escalation starts a deadline timer for a conversation. The escalation operation owns the timer until it completes; a successful escalation cancels the timer, while a failed attempt returns a retryable state and leaves no timer running. Which resource-lifetime boundary is correct?
Nearest alternative: Keep the timer running after completion so it can notify the next agent again.
Identity: preserve_question_id — The original keyed decision was: Acquire and release resources through a scope that survives errors and makes ownership visible. In this case, that keeps the rule “the escalation keeps ownership and response deadlines” inside the owner that can observe and enforce it. The current key still applies explicit resource ownership and cleanup to the same case; the new facts identify the resource lifecycle that the original stem left implicit.
Option changes: coordinator_exports_state → leak_after_exit_11, inheritance_for_reuse → release_too_early_11, representation_leaks → borrow_without_owner_11
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b07-i012
Objective: Assign each temporary resource a clear owner, scope its lifetime to actual use, and close or transfer it correctly on success, failure, or cancellation.
Decisive facts: In A regional produce marketplace, Validation opens a short database transaction for one listing revision. If price/stock checks fail, the transaction must roll back and close; a successful revision is committed before publication. Which resource-lifetime boundary is correct?
Nearest alternative: Keep the transaction open while buyers read the listing so the validation remains visible.
Identity: preserve_question_id — The original keyed decision was: Acquire and release resources through a scope that survives errors and makes ownership visible. In this case, that keeps the rule “a listing cannot become visible before its price and stock rule are valid” inside the owner that can observe and enforce it. The current key still applies explicit resource ownership and cleanup to the same case; the new facts identify the resource lifecycle that the original stem left implicit.
Option changes: coordinator_exports_state → leak_after_exit_12, inheritance_for_reuse → release_too_early_12, representation_leaks → borrow_without_owner_12
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b07-i013
Objective: Assign each temporary resource a clear owner, scope its lifetime to actual use, and close or transfer it correctly on success, failure, or cancellation.
Decisive facts: In A repair-parts marketplace, A split operation launches two vendor checks. Each check owns its response stream; if one fails, the operation cancels the other check and closes any stream it already opened before leaving the parent request unchanged. Which resource-lifetime boundary is correct?
Nearest alternative: Leave the successful vendor stream open while waiting for the failed vendor to be retried.
Identity: preserve_question_id — The original keyed decision was: Acquire and release resources through a scope that survives errors and makes ownership visible. In this case, that keeps the rule “each split retains the original request identity and delivery promise” inside the owner that can observe and enforce it. The current key still applies explicit resource ownership and cleanup to the same case; the new facts identify the resource lifecycle that the original stem left implicit.
Option changes: inheritance_for_reuse → leak_after_exit_13, representation_leaks → release_too_early_13, speculative_indirection → borrow_without_owner_13
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b07-i014
Objective: Assign each temporary resource a clear owner, scope its lifetime to actual use, and close or transfer it correctly on success, failure, or cancellation.
Decisive facts: In A community garden allocation tool, A plot transfer holds a temporary approval token. The transfer operation owns that token until commit or denial; the existing reservation remains with its current member until commit. Which resource-lifetime boundary is correct?
Nearest alternative: Keep the token after the transfer ends so another member cannot request the plot.
Identity: preserve_question_id — The original keyed decision was: Acquire and release resources through a scope that survives errors and makes ownership visible. In this case, that keeps the rule “transfer preserves the plot boundary and approval history” inside the owner that can observe and enforce it. The current key still applies explicit resource ownership and cleanup to the same case; the new facts identify the resource lifecycle that the original stem left implicit.
Option changes: representation_leaks → leak_after_exit_14, speculative_indirection → release_too_early_14, coordinator_exports_state → borrow_without_owner_14
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b07-i015
Objective: Assign each temporary resource a clear owner, scope its lifetime to actual use, and close or transfer it correctly on success, failure, or cancellation.
Decisive facts: In A subscription packaging service, A bundle build opens component streams and a temporary package file. The build operation owns them until validation completes; after success it publishes a new package, and on failure it must close streams and discard the temporary file. Which resource-lifetime boundary is correct?
Nearest alternative: Keep component streams open after success so checkout can reread them later.
Identity: preserve_question_id — The original keyed decision was: Acquire and release resources through a scope that survives errors and makes ownership visible. In this case, that keeps the rule “the bundle pricing policy remains consistent with its components” inside the owner that can observe and enforce it. The current key still applies explicit resource ownership and cleanup to the same case; the new facts identify the resource lifecycle that the original stem left implicit.
Option changes: speculative_indirection → leak_after_exit_15, coordinator_exports_state → release_too_early_15, inheritance_for_reuse → borrow_without_owner_15
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b07-i016
Objective: Assign each temporary resource a clear owner, scope its lifetime to actual use, and close or transfer it correctly on success, failure, or cancellation.
Decisive facts: In A fleet charging coordinator, A reservation acquires a temporary charger lease with an expiry. The reservation operation owns the lease until confirmation; cancellation before confirmation releases it, while confirmation transfers it to the booking. Which resource-lifetime boundary is correct?
Nearest alternative: Keep the lease after cancellation so the requester can return without another capacity check.
Identity: preserve_question_id — The original keyed decision was: Acquire and release resources through a scope that survives errors and makes ownership visible. In this case, that keeps the rule “charger capacity and reservation expiry are coordinated” inside the owner that can observe and enforce it. The current key still applies explicit resource ownership and cleanup to the same case; the new facts identify the resource lifecycle that the original stem left implicit.
Option changes: coordinator_exports_state → leak_after_exit_16, inheritance_for_reuse → release_too_early_16, representation_leaks → borrow_without_owner_16
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b07-i017
Objective: Assign each temporary resource a clear owner, scope its lifetime to actual use, and close or transfer it correctly on success, failure, or cancellation.
Decisive facts: In A photo-archive curation tool, A metadata merge opens two asset locks and a temporary merge record. The merge operation owns all three; a conflict or cancellation releases both locks and discards the temporary record without changing the accepted asset. Which resource-lifetime boundary is correct?
Nearest alternative: Keep the first lock held while asking a curator to resolve the conflict later.
Identity: preserve_question_id — The original keyed decision was: Acquire and release resources through a scope that survives errors and makes ownership visible. In this case, that keeps the rule “asset identity remains stable while descriptive values are replaced” inside the owner that can observe and enforce it. The current key still applies explicit resource ownership and cleanup to the same case; the new facts identify the resource lifecycle that the original stem left implicit.
Option changes: coordinator_exports_state → leak_after_exit_17, inheritance_for_reuse → release_too_early_17, representation_leaks → borrow_without_owner_17
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b07-i018
Objective: Assign each temporary resource a clear owner, scope its lifetime to actual use, and close or transfer it correctly on success, failure, or cancellation.
Decisive facts: In A digital rights clearance tool, A license check opens an external response stream. The clearance operation owns it until the result is read; denial, error, or cancellation must close it and leave the territory unapproved. Which resource-lifetime boundary is correct?
Nearest alternative: Leave the response stream open after denial so another territory can inspect it.
Identity: preserve_question_id — The original keyed decision was: Acquire and release resources through a scope that survives errors and makes ownership visible. In this case, that keeps the rule “approval requires an explicit territory and expiration” inside the owner that can observe and enforce it. The current key still applies explicit resource ownership and cleanup to the same case; the new facts identify the resource lifecycle that the original stem left implicit.
Option changes: inheritance_for_reuse → leak_after_exit_18, representation_leaks → release_too_early_18, speculative_indirection → borrow_without_owner_18
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines
