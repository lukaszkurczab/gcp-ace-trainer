# N08-B08 author notes — proposal v1

Before source SHA-256: `b222555c7a79b975fde1a321c045b516733612f8f88b483c9c329a1438f5785c`
Proposal SHA-256: `7b1fa356e8aa25acc102793da1abad04f42eba87293692c60261b3617481aaf7`

Proposal-only authorship rationale. Every stem names what committed, the later collaborator failure, and which effects remain pending or retryable. The existing failure/partial-effects learning decision and question IDs remain. Wrong-option meanings are rewritten as specific incorrect outcomes using new option IDs with matching diagnostics. Any commit/irreversibility behavior is explicitly a scenario premise, not a universal distributed-systems guarantee attributed to a source. This is not semantic acceptance or activation.

## ood-n08-b08-i001
Objective: Trace which effects committed before a collaborator failed; preserve known outcomes and expose later pending, retryable, or failed work accurately.
Decisive facts: In A board-game campaign manager, A reward updates character points and campaign phase in one local command. If the optional audit publisher fails after that command commits, the reward remains accepted and the audit event is marked pending. What outcome should the operation expose after the collaborator fails?
Nearest alternative: Roll back points after the audit publisher fails, even though the reward command already committed.
Identity: preserve_question_id — The original keyed decision was: Specify which effects commit, roll back, or remain retryable when a collaborator fails midway. In this case, that keeps the rule “reward rules depend on the current legal campaign state” inside the owner that can observe and enforce it. The revised answer remains about specifying committed, rolled-back, and retryable effects when a collaborator fails; the stem makes the failure point and known state visible.
Option changes: coordinator_exports_state → undo_or_rewrite_01, inheritance_for_reuse → claim_uncommitted_01, representation_leaks → discard_failure_01
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b08-i002
Objective: Trace which effects committed before a collaborator failed; preserve known outcomes and expose later pending, retryable, or failed work accurately.
Decisive facts: In A cold-chain logistics console, The new carrier accepts a shipment hand-off before a notification service fails. The hand-off is the ownership commit point; the notification is a later notice and can be retried. What outcome should the operation expose after the collaborator fails?
Nearest alternative: Undo the shipment hand-off when notification fails, even though the new carrier has accepted responsibility.
Identity: preserve_question_id — The original keyed decision was: Specify which effects commit, roll back, or remain retryable when a collaborator fails midway. In this case, that keeps the rule “temperature restrictions and hand-off ownership travel with the shipment” inside the owner that can observe and enforce it. The revised answer remains about specifying committed, rolled-back, and retryable effects when a collaborator fails; the stem makes the failure point and known state visible.
Option changes: coordinator_exports_state → undo_or_rewrite_02, inheritance_for_reuse → claim_uncommitted_02, representation_leaks → discard_failure_02
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b08-i003
Objective: Trace which effects committed before a collaborator failed; preserve known outcomes and expose later pending, retryable, or failed work accurately.
Decisive facts: In A cooperative lending ledger, The account's balance reduction and repayment entry are in one local transaction. If entry validation fails before commit, neither change is visible and the repayment can be corrected. What outcome should the operation expose after the collaborator fails?
Nearest alternative: Keep the reduced balance and omit the entry because the balance write succeeded first.
Identity: preserve_question_id — The original keyed decision was: Specify which effects commit, roll back, or remain retryable when a collaborator fails midway. In this case, that keeps the rule “a repayment cannot reduce the outstanding balance below zero” inside the owner that can observe and enforce it. The revised answer remains about specifying committed, rolled-back, and retryable effects when a collaborator fails; the stem makes the failure point and known state visible.
Option changes: inheritance_for_reuse → undo_or_rewrite_03, representation_leaks → claim_uncommitted_03, speculative_indirection → discard_failure_03
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b08-i004
Objective: Trace which effects committed before a collaborator failed; preserve known outcomes and expose later pending, retryable, or failed work accurately.
Decisive facts: In A tournament bracket service, The match result is accepted and stored, but writing the next bracket slot fails. The match result remains authoritative; the slot transition is visibly pending and no later match may start yet. What outcome should the operation expose after the collaborator fails?
Nearest alternative: Erase the accepted result when the slot write fails, then ask the official to submit it again.
Identity: preserve_question_id — The original keyed decision was: Specify which effects commit, roll back, or remain retryable when a collaborator fails midway. In this case, that keeps the rule “the bracket advances only from a legal match state” inside the owner that can observe and enforce it. The revised answer remains about specifying committed, rolled-back, and retryable effects when a collaborator fails; the stem makes the failure point and known state visible.
Option changes: representation_leaks → undo_or_rewrite_04, speculative_indirection → claim_uncommitted_04, coordinator_exports_state → discard_failure_04
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b08-i005
Objective: Trace which effects committed before a collaborator failed; preserve known outcomes and expose later pending, retryable, or failed work accurately.
Decisive facts: In A returns inspection workflow, Inspection findings commit before a separate refund review begins. If refund review fails, the submitted findings remain immutable and the refund result is pending. What outcome should the operation expose after the collaborator fails?
Nearest alternative: Edit the inspection findings to make them pass refund review after the review service fails.
Identity: preserve_question_id — The original keyed decision was: Specify which effects commit, roll back, or remain retryable when a collaborator fails midway. In this case, that keeps the rule “classification and refund eligibility are not the same responsibility” inside the owner that can observe and enforce it. The revised answer remains about specifying committed, rolled-back, and retryable effects when a collaborator fails; the stem makes the failure point and known state visible.
Option changes: speculative_indirection → undo_or_rewrite_05, coordinator_exports_state → claim_uncommitted_05, inheritance_for_reuse → discard_failure_05
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b08-i006
Objective: Trace which effects committed before a collaborator failed; preserve known outcomes and expose later pending, retryable, or failed work accurately.
Decisive facts: In A research-notebook platform, A job writes a complete output file, then catalog publication fails. The file is still private until the catalog points to it; the run must report publication failure without exposing the output. What outcome should the operation expose after the collaborator fails?
Nearest alternative: Publish the output file directly to readers before the catalog registration succeeds.
Identity: preserve_question_id — The original keyed decision was: Specify which effects commit, roll back, or remain retryable when a collaborator fails midway. In this case, that keeps the rule “published outputs reference immutable inputs and code versions” inside the owner that can observe and enforce it. The revised answer remains about specifying committed, rolled-back, and retryable effects when a collaborator fails; the stem makes the failure point and known state visible.
Option changes: coordinator_exports_state → undo_or_rewrite_06, inheritance_for_reuse → claim_uncommitted_06, representation_leaks → discard_failure_06
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b08-i007
Objective: Trace which effects committed before a collaborator failed; preserve known outcomes and expose later pending, retryable, or failed work accurately.
Decisive facts: In A collaborative annotation workspace, The comment is accepted with author and revision. Notification delivery fails afterward; the comment remains accepted, while delivery is separately retryable. What outcome should the operation expose after the collaborator fails?
Nearest alternative: Delete the comment because the author did not receive a notification.
Identity: preserve_question_id — The original keyed decision was: Specify which effects commit, roll back, or remain retryable when a collaborator fails midway. In this case, that keeps the rule “accepted comments must retain their author and document revision” inside the owner that can observe and enforce it. The revised answer remains about specifying committed, rolled-back, and retryable effects when a collaborator fails; the stem makes the failure point and known state visible.
Option changes: coordinator_exports_state → undo_or_rewrite_07, inheritance_for_reuse → claim_uncommitted_07, representation_leaks → discard_failure_07
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b08-i008
Objective: Trace which effects committed before a collaborator failed; preserve known outcomes and expose later pending, retryable, or failed work accurately.
Decisive facts: In A mobile field-inspection app, Upload chunks are staged, but the final checksum has not passed. The server must not mark the inspection complete; it can keep the upload retryable and identify the staged attempt. What outcome should the operation expose after the collaborator fails?
Nearest alternative: Mark the inspection complete after the first chunk and repair missing fields on a later upload.
Identity: preserve_question_id — The original keyed decision was: Specify which effects commit, roll back, or remain retryable when a collaborator fails midway. In this case, that keeps the rule “a submission is either complete or explicitly retryable” inside the owner that can observe and enforce it. The revised answer remains about specifying committed, rolled-back, and retryable effects when a collaborator fails; the stem makes the failure point and known state visible.
Option changes: inheritance_for_reuse → undo_or_rewrite_08, representation_leaks → claim_uncommitted_08, speculative_indirection → discard_failure_08
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b08-i009
Objective: Trace which effects committed before a collaborator failed; preserve known outcomes and expose later pending, retryable, or failed work accurately.
Decisive facts: In A digital invoice exchange, The exchange may accept an invoice, but the response connection can fail before the client receives the acknowledgement. The local outcome is unknown until the operation is reconciled; it is not safe to label it rejected. What outcome should the operation expose after the collaborator fails?
Nearest alternative: Mark the invoice rejected as soon as the response read fails.
Identity: preserve_question_id — The original keyed decision was: Specify which effects commit, roll back, or remain retryable when a collaborator fails midway. In this case, that keeps the rule “the new issue is traceable and does not double-charge the customer” inside the owner that can observe and enforce it. The revised answer remains about specifying committed, rolled-back, and retryable effects when a collaborator fails; the stem makes the failure point and known state visible.
Option changes: representation_leaks → undo_or_rewrite_09, speculative_indirection → claim_uncommitted_09, coordinator_exports_state → discard_failure_09
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b08-i010
Objective: Trace which effects committed before a collaborator failed; preserve known outcomes and expose later pending, retryable, or failed work accurately.
Decisive facts: In A smart-building access controller, Revocation commits at the badge authority. A door update service then fails to refresh its copy; until it confirms the authority's current revision, it must not claim that the revocation reached that door. What outcome should the operation expose after the collaborator fails?
Nearest alternative: Undo the revocation because one door's cache update failed.
Identity: preserve_question_id — The original keyed decision was: Specify which effects commit, roll back, or remain retryable when a collaborator fails midway. In this case, that keeps the rule “revocation is visible to the door policy before access is granted” inside the owner that can observe and enforce it. The revised answer remains about specifying committed, rolled-back, and retryable effects when a collaborator fails; the stem makes the failure point and known state visible.
Option changes: speculative_indirection → undo_or_rewrite_10, coordinator_exports_state → claim_uncommitted_10, inheritance_for_reuse → discard_failure_10
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b08-i011
Objective: Trace which effects committed before a collaborator failed; preserve known outcomes and expose later pending, retryable, or failed work accurately.
Decisive facts: In A package-label generation service, A physical label prints successfully, then saving its audit record fails. The printed label cannot be unprinted; the job must report printed-but-audit-pending and retain the shipment revision it used. What outcome should the operation expose after the collaborator fails?
Nearest alternative: Report the whole print failed and print a second label immediately.
Identity: preserve_question_id — The original keyed decision was: Specify which effects commit, roll back, or remain retryable when a collaborator fails midway. In this case, that keeps the rule “the printed label represents the current approved shipment data” inside the owner that can observe and enforce it. The revised answer remains about specifying committed, rolled-back, and retryable effects when a collaborator fails; the stem makes the failure point and known state visible.
Option changes: coordinator_exports_state → undo_or_rewrite_11, inheritance_for_reuse → claim_uncommitted_11, representation_leaks → discard_failure_11
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b08-i012
Objective: Trace which effects committed before a collaborator failed; preserve known outcomes and expose later pending, retryable, or failed work accurately.
Decisive facts: In A multi-tenant rehearsal scheduler, A move reserves the destination and commits the new booking, but release of the old room fails. The move operation must expose the new booking plus an old-room cleanup pending state; other rooms remain available. What outcome should the operation expose after the collaborator fails?
Nearest alternative: Delete the new booking because the old-room release failed after commit.
Identity: preserve_question_id — The original keyed decision was: Specify which effects commit, roll back, or remain retryable when a collaborator fails midway. In this case, that keeps the rule “the room capacity and cancellation policy must remain consistent” inside the owner that can observe and enforce it. The revised answer remains about specifying committed, rolled-back, and retryable effects when a collaborator fails; the stem makes the failure point and known state visible.
Option changes: coordinator_exports_state → undo_or_rewrite_12, inheritance_for_reuse → claim_uncommitted_12, representation_leaks → discard_failure_12
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b08-i013
Objective: Trace which effects committed before a collaborator failed; preserve known outcomes and expose later pending, retryable, or failed work accurately.
Decisive facts: In A museum exhibit controller, The controller records maintenance mode before sending a hardware stop command. If the stop command fails, unsafe commands remain rejected and the hardware action is explicitly pending. What outcome should the operation expose after the collaborator fails?
Nearest alternative: Restore running mode when the hardware stop call fails, even though the safety state was already committed.
Identity: preserve_question_id — The original keyed decision was: Specify which effects commit, roll back, or remain retryable when a collaborator fails midway. In this case, that keeps the rule “unsafe commands are rejected while maintenance is active” inside the owner that can observe and enforce it. The revised answer remains about specifying committed, rolled-back, and retryable effects when a collaborator fails; the stem makes the failure point and known state visible.
Option changes: inheritance_for_reuse → undo_or_rewrite_13, representation_leaks → claim_uncommitted_13, speculative_indirection → discard_failure_13
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b08-i014
Objective: Trace which effects committed before a collaborator failed; preserve known outcomes and expose later pending, retryable, or failed work accurately.
Decisive facts: In A video-learning library, The lesson availability change and progress mapping are prepared together. If the mapping check fails before publication, the current lesson remains available and progress continues on the same identity. What outcome should the operation expose after the collaborator fails?
Nearest alternative: Hide the lesson first, then let a later job guess how progress should map.
Identity: preserve_question_id — The original keyed decision was: Specify which effects commit, roll back, or remain retryable when a collaborator fails midway. In this case, that keeps the rule “progress refers to a stable lesson identity” inside the owner that can observe and enforce it. The revised answer remains about specifying committed, rolled-back, and retryable effects when a collaborator fails; the stem makes the failure point and known state visible.
Option changes: representation_leaks → undo_or_rewrite_14, speculative_indirection → claim_uncommitted_14, coordinator_exports_state → discard_failure_14
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b08-i015
Objective: Trace which effects committed before a collaborator failed; preserve known outcomes and expose later pending, retryable, or failed work accurately.
Decisive facts: In A shared whiteboard application, The export file is complete, but adding its index entry fails. The live board remains active; users must be told the export exists as an unindexed result rather than as a completed history listing. What outcome should the operation expose after the collaborator fails?
Nearest alternative: Close the board because the export index write failed.
Identity: preserve_question_id — The original keyed decision was: Specify which effects commit, roll back, or remain retryable when a collaborator fails midway. In this case, that keeps the rule “export observes a stable session state” inside the owner that can observe and enforce it. The revised answer remains about specifying committed, rolled-back, and retryable effects when a collaborator fails; the stem makes the failure point and known state visible.
Option changes: speculative_indirection → undo_or_rewrite_15, coordinator_exports_state → claim_uncommitted_15, inheritance_for_reuse → discard_failure_15
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b08-i016
Objective: Trace which effects committed before a collaborator failed; preserve known outcomes and expose later pending, retryable, or failed work accurately.
Decisive facts: In A customer-support escalation desk, The escalation command commits assignee and deadline together. A later email notification fails; ownership and deadline remain committed, while the notification is pending. What outcome should the operation expose after the collaborator fails?
Nearest alternative: Restore the former assignee because the email was not sent.
Identity: preserve_question_id — The original keyed decision was: Specify which effects commit, roll back, or remain retryable when a collaborator fails midway. In this case, that keeps the rule “the escalation keeps ownership and response deadlines” inside the owner that can observe and enforce it. The revised answer remains about specifying committed, rolled-back, and retryable effects when a collaborator fails; the stem makes the failure point and known state visible.
Option changes: coordinator_exports_state → undo_or_rewrite_16, inheritance_for_reuse → claim_uncommitted_16, representation_leaks → discard_failure_16
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b08-i017
Objective: Trace which effects committed before a collaborator failed; preserve known outcomes and expose later pending, retryable, or failed work accurately.
Decisive facts: In A regional produce marketplace, Price and stock are validated and published together. A search-index update then fails; buyers use the catalog revision, and indexing is a pending projection rather than the publication commit. What outcome should the operation expose after the collaborator fails?
Nearest alternative: Roll back price and stock because the index did not refresh.
Identity: preserve_question_id — The original keyed decision was: Specify which effects commit, roll back, or remain retryable when a collaborator fails midway. In this case, that keeps the rule “a listing cannot become visible before its price and stock rule are valid” inside the owner that can observe and enforce it. The revised answer remains about specifying committed, rolled-back, and retryable effects when a collaborator fails; the stem makes the failure point and known state visible.
Option changes: coordinator_exports_state → undo_or_rewrite_17, inheritance_for_reuse → claim_uncommitted_17, representation_leaks → discard_failure_17
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b08-i018
Objective: Trace which effects committed before a collaborator failed; preserve known outcomes and expose later pending, retryable, or failed work accurately.
Decisive facts: In A repair-parts marketplace, Both vendor checks pass and the split is committed under the original request. A later notification to one vendor fails; the split and delivery promise remain accepted, while that notice is pending. What outcome should the operation expose after the collaborator fails?
Nearest alternative: Undo the committed split and restore the original request because one notification failed.
Identity: preserve_question_id — The original keyed decision was: Specify which effects commit, roll back, or remain retryable when a collaborator fails midway. In this case, that keeps the rule “each split retains the original request identity and delivery promise” inside the owner that can observe and enforce it. The revised answer remains about specifying committed, rolled-back, and retryable effects when a collaborator fails; the stem makes the failure point and known state visible.
Option changes: inheritance_for_reuse → undo_or_rewrite_18, representation_leaks → claim_uncommitted_18, speculative_indirection → discard_failure_18
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines
