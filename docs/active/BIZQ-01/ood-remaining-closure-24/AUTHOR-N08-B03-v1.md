# N08-B03 author notes — proposal v1

Before source SHA-256: `f5d4bddc1bff1672949c81722bb919e15ed204a923a86726e9aae1a4b0969d41`
Proposal SHA-256: `383147e8592bc1120d912bb70391a9944b3fb5af58e4d5ea3c28a59d5abca41e`

Proposal-only authorship rationale. The cases now identify which values and readers form one coherent visible revision under the specified interleaving. The accepted coordination/atomicity decision remains the same; question IDs are retained. All old wrong-choice meanings were replaced with case-specific options under new IDs, with feedback keyed to each option. Scenario concurrency and delivery behavior are premises supplied by the stem. This is not semantic acceptance or source activation.

## ood-n08-b03-i001
Objective: Identify the smallest multi-field state change that readers must observe coherently; separate the publication boundary from individual field locks and unrelated workloads.
Decisive facts: In A music practice tracker, A completion stores both exercise revision and score policy. An instructor can publish a new exercise revision while a learner submits; the completion must refer to one matching pair. Which change should become visible as one coherent state?
Nearest alternative: Save the score first and read the current exercise revision afterward when writing completion.
Identity: preserve_question_id — The original keyed decision was: Reason about visibility and the entire read-modify-write operation, not just whether each method is individually synchronized. In this case, that keeps the rule “completion records the exercise version and score policy” inside the owner that can observe and enforce it. The current key still reasons about the same case invariant and the visibility of one coherent operation; the additional interleaving facts make the required atomic boundary concrete.
Option changes: coordinator_exports_state → partial_write_01, inheritance_for_reuse → global_coordination_01, representation_leaks → caller_merge_01
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b03-i002
Objective: Identify the smallest multi-field state change that readers must observe coherently; separate the publication boundary from individual field locks and unrelated workloads.
Decisive facts: In A procurement approval queue, An approval references a named exception and the control checks that were required for it. A retry may arrive after the first approval committed; it must not create a second approval or lose attribution. Which change should become visible as one coherent state?
Nearest alternative: Write approval status before saving the exception and reviewer identity in separate updates.
Identity: preserve_question_id — The original keyed decision was: Reason about visibility and the entire read-modify-write operation, not just whether each method is individually synchronized. In this case, that keeps the rule “approval is attributable, bounded, and cannot bypass required controls” inside the owner that can observe and enforce it. The current key still reasons about the same case invariant and the visibility of one coherent operation; the additional interleaving facts make the required atomic boundary concrete.
Option changes: coordinator_exports_state → partial_write_02, inheritance_for_reuse → global_coordination_02, representation_leaks → caller_merge_02
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b03-i003
Objective: Identify the smallest multi-field state change that readers must observe coherently; separate the publication boundary from individual field locks and unrelated workloads.
Decisive facts: In A podcast production desk, Replacing a recording creates a new revision. Existing annotations point to stable segment IDs; listeners must see either the old recording with its annotations or the new recording with the matching segment map. Which change should become visible as one coherent state?
Nearest alternative: Replace the audio file first and remap annotation offsets afterward.
Identity: preserve_question_id — The original keyed decision was: Reason about visibility and the entire read-modify-write operation, not just whether each method is individually synchronized. In this case, that keeps the rule “annotations follow stable segments rather than file offsets” inside the owner that can observe and enforce it. The current key still reasons about the same case invariant and the visibility of one coherent operation; the additional interleaving facts make the required atomic boundary concrete.
Option changes: inheritance_for_reuse → partial_write_03, representation_leaks → global_coordination_03, speculative_indirection → caller_merge_03
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b03-i004
Objective: Identify the smallest multi-field state change that readers must observe coherently; separate the publication boundary from individual field locks and unrelated workloads.
Decisive facts: In A permissions review service, A temporary grant is valid only with its approving decision and expiry instant. The access check must never observe an active role without those two fields. Which change should become visible as one coherent state?
Nearest alternative: Set the role active first, then attach its approver and expiry in a later audit update.
Identity: preserve_question_id — The original keyed decision was: Reason about visibility and the entire read-modify-write operation, not just whether each method is individually synchronized. In this case, that keeps the rule “the role expires and is attributable to a specific approval” inside the owner that can observe and enforce it. The current key still reasons about the same case invariant and the visibility of one coherent operation; the additional interleaving facts make the required atomic boundary concrete.
Option changes: representation_leaks → partial_write_04, speculative_indirection → global_coordination_04, coordinator_exports_state → caller_merge_04
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b03-i005
Objective: Identify the smallest multi-field state change that readers must observe coherently; separate the publication boundary from individual field locks and unrelated workloads.
Decisive facts: In A document notarization service, A seal names a specific immutable document revision. A new document revision may be uploaded while sealing runs; the seal must not be attached to whichever revision happens to be current later. Which change should become visible as one coherent state?
Nearest alternative: Read the current document revision before hashing, then look up the latest revision again when storing the seal.
Identity: preserve_question_id — The original keyed decision was: Reason about visibility and the entire read-modify-write operation, not just whether each method is individually synchronized. In this case, that keeps the rule “the seal covers the exact immutable revision” inside the owner that can observe and enforce it. The current key still reasons about the same case invariant and the visibility of one coherent operation; the additional interleaving facts make the required atomic boundary concrete.
Option changes: speculative_indirection → partial_write_05, coordinator_exports_state → global_coordination_05, inheritance_for_reuse → caller_merge_05
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b03-i006
Objective: Identify the smallest multi-field state change that readers must observe coherently; separate the publication boundary from individual field locks and unrelated workloads.
Decisive facts: In A marketplace payout service, An order may settle while payout release is being requested. A release is accepted only for a settled order, and the order's settlement state and release record must be observed together. Which change should become visible as one coherent state?
Nearest alternative: Read settlement in one handler and write payout release through a second independently synchronized method.
Identity: preserve_question_id — The original keyed decision was: Reason about visibility and the entire read-modify-write operation, not just whether each method is individually synchronized. In this case, that keeps the rule “release is idempotent and tied to a settled order” inside the owner that can observe and enforce it. The current key still reasons about the same case invariant and the visibility of one coherent operation; the additional interleaving facts make the required atomic boundary concrete.
Option changes: coordinator_exports_state → partial_write_06, inheritance_for_reuse → global_coordination_06, representation_leaks → caller_merge_06
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b03-i007
Objective: Identify the smallest multi-field state change that readers must observe coherently; separate the publication boundary from individual field locks and unrelated workloads.
Decisive facts: In A public-transit disruption board, A route update has an effective sequence assigned by the controller. Delivery may be delayed or reordered; passengers must see later effective changes only after earlier ones for that route. Which change should become visible as one coherent state?
Nearest alternative: Publish on arrival and sort the visible text after all updates have been delivered.
Identity: preserve_question_id — The original keyed decision was: Reason about visibility and the entire read-modify-write operation, not just whether each method is individually synchronized. In this case, that keeps the rule “passengers receive the change in the order in which it becomes effective” inside the owner that can observe and enforce it. The current key still reasons about the same case invariant and the visibility of one coherent operation; the additional interleaving facts make the required atomic boundary concrete.
Option changes: coordinator_exports_state → partial_write_07, inheritance_for_reuse → global_coordination_07, representation_leaks → caller_merge_07
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b03-i008
Objective: Identify the smallest multi-field state change that readers must observe coherently; separate the publication boundary from individual field locks and unrelated workloads.
Decisive facts: In A neighborhood energy-sharing service, A reserved discharge window covers a meter and interval. Two overlapping requests may race; the service must expose either the prior schedule or one accepted reservation, never a partially written interval list. Which change should become visible as one coherent state?
Nearest alternative: Mark the interval occupied before recording its reservation ID, then fill in the remaining fields.
Identity: preserve_question_id — The original keyed decision was: Reason about visibility and the entire read-modify-write operation, not just whether each method is individually synchronized. In this case, that keeps the rule “a meter cannot be committed twice for an overlapping window” inside the owner that can observe and enforce it. The current key still reasons about the same case invariant and the visibility of one coherent operation; the additional interleaving facts make the required atomic boundary concrete.
Option changes: inheritance_for_reuse → partial_write_08, representation_leaks → global_coordination_08, speculative_indirection → caller_merge_08
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b03-i009
Objective: Identify the smallest multi-field state change that readers must observe coherently; separate the publication boundary from individual field locks and unrelated workloads.
Decisive facts: In A live captioning studio, Each stream uses a provider configuration and timing contract selected at stream start. Switching providers may affect new streams but must not change the configuration an active stream already uses. Which change should become visible as one coherent state?
Nearest alternative: Mutate one shared provider configuration field by field while active streams read it.
Identity: preserve_question_id — The original keyed decision was: Reason about visibility and the entire read-modify-write operation, not just whether each method is individually synchronized. In this case, that keeps the rule “the current stream keeps its timing and error contract” inside the owner that can observe and enforce it. The current key still reasons about the same case invariant and the visibility of one coherent operation; the additional interleaving facts make the required atomic boundary concrete.
Option changes: representation_leaks → partial_write_09, speculative_indirection → global_coordination_09, coordinator_exports_state → caller_merge_09
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b03-i010
Objective: Identify the smallest multi-field state change that readers must observe coherently; separate the publication boundary from individual field locks and unrelated workloads.
Decisive facts: In A volunteer coordination hub, A two-person shift swap requires both assignments to satisfy skill and availability checks. The roster must show either the original pair or the accepted swapped pair, not one moved assignment alone. Which change should become visible as one coherent state?
Nearest alternative: Write the first assignment and then validate the second, undoing the first if it fails.
Identity: preserve_question_id — The original keyed decision was: Reason about visibility and the entire read-modify-write operation, not just whether each method is individually synchronized. In this case, that keeps the rule “skills and availability constraints hold for both assignments” inside the owner that can observe and enforce it. The current key still reasons about the same case invariant and the visibility of one coherent operation; the additional interleaving facts make the required atomic boundary concrete.
Option changes: speculative_indirection → partial_write_10, coordinator_exports_state → global_coordination_10, inheritance_for_reuse → caller_merge_10
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b03-i011
Objective: Identify the smallest multi-field state change that readers must observe coherently; separate the publication boundary from individual field locks and unrelated workloads.
Decisive facts: In A local-first map editor, An offline edit submits its base route revision and proposed geometry. If another edit was accepted first, the service must preserve the accepted route and return a conflict for the later proposal. Which change should become visible as one coherent state?
Nearest alternative: Check the base revision before upload and overwrite geometry after upload completes.
Identity: preserve_question_id — The original keyed decision was: Reason about visibility and the entire read-modify-write operation, not just whether each method is individually synchronized. In this case, that keeps the rule “conflicts are explicit and never silently overwrite accepted geometry” inside the owner that can observe and enforce it. The current key still reasons about the same case invariant and the visibility of one coherent operation; the additional interleaving facts make the required atomic boundary concrete.
Option changes: coordinator_exports_state → partial_write_11, inheritance_for_reuse → global_coordination_11, representation_leaks → caller_merge_11
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b03-i012
Objective: Identify the smallest multi-field state change that readers must observe coherently; separate the publication boundary from individual field locks and unrelated workloads.
Decisive facts: In A board-game campaign manager, A reward is legal only in the current campaign phase and updates both points and phase. A host and moderator may act concurrently; readers must not see points from the reward with the old phase. Which change should become visible as one coherent state?
Nearest alternative: Update points and phase in separate synchronized methods and let readers combine their latest values.
Identity: preserve_question_id — The original keyed decision was: Reason about visibility and the entire read-modify-write operation, not just whether each method is individually synchronized. In this case, that keeps the rule “reward rules depend on the current legal campaign state” inside the owner that can observe and enforce it. The current key still reasons about the same case invariant and the visibility of one coherent operation; the additional interleaving facts make the required atomic boundary concrete.
Option changes: coordinator_exports_state → partial_write_12, inheritance_for_reuse → global_coordination_12, representation_leaks → caller_merge_12
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b03-i013
Objective: Identify the smallest multi-field state change that readers must observe coherently; separate the publication boundary from individual field locks and unrelated workloads.
Decisive facts: In A cold-chain logistics console, A hand-off binds carrier, temperature restriction, and acceptance state. Dispatch and carrier responses can interleave; external readers must see the old owner or the complete new hand-off. Which change should become visible as one coherent state?
Nearest alternative: Change carrier first and let the new carrier fetch temperature limits after accepting work.
Identity: preserve_question_id — The original keyed decision was: Reason about visibility and the entire read-modify-write operation, not just whether each method is individually synchronized. In this case, that keeps the rule “temperature restrictions and hand-off ownership travel with the shipment” inside the owner that can observe and enforce it. The current key still reasons about the same case invariant and the visibility of one coherent operation; the additional interleaving facts make the required atomic boundary concrete.
Option changes: inheritance_for_reuse → partial_write_13, representation_leaks → global_coordination_13, speculative_indirection → caller_merge_13
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b03-i014
Objective: Identify the smallest multi-field state change that readers must observe coherently; separate the publication boundary from individual field locks and unrelated workloads.
Decisive facts: In A cooperative lending ledger, The account's outstanding amount and repayment entry must agree at every visible revision. Two allocations to one account may overlap; a report reader must never see only one side of an accepted allocation. Which change should become visible as one coherent state?
Nearest alternative: Reduce the amount and append its ledger entry in separate operations, each with its own lock.
Identity: preserve_question_id — The original keyed decision was: Reason about visibility and the entire read-modify-write operation, not just whether each method is individually synchronized. In this case, that keeps the rule “a repayment cannot reduce the outstanding balance below zero” inside the owner that can observe and enforce it. The current key still reasons about the same case invariant and the visibility of one coherent operation; the additional interleaving facts make the required atomic boundary concrete.
Option changes: representation_leaks → partial_write_14, speculative_indirection → global_coordination_14, coordinator_exports_state → caller_merge_14
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b03-i015
Objective: Identify the smallest multi-field state change that readers must observe coherently; separate the publication boundary from individual field locks and unrelated workloads.
Decisive facts: In A tournament bracket service, A terminal match result and advancement to the next bracket slot are one decision. Timeout and official result can arrive together; the next match must not start from a half-advanced bracket. Which change should become visible as one coherent state?
Nearest alternative: Mark the match terminal, then advance the bracket in a separate handler that retries on failure.
Identity: preserve_question_id — The original keyed decision was: Reason about visibility and the entire read-modify-write operation, not just whether each method is individually synchronized. In this case, that keeps the rule “the bracket advances only from a legal match state” inside the owner that can observe and enforce it. The current key still reasons about the same case invariant and the visibility of one coherent operation; the additional interleaving facts make the required atomic boundary concrete.
Option changes: speculative_indirection → partial_write_15, coordinator_exports_state → global_coordination_15, inheritance_for_reuse → caller_merge_15
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b03-i016
Objective: Identify the smallest multi-field state change that readers must observe coherently; separate the publication boundary from individual field locks and unrelated workloads.
Decisive facts: In A returns inspection workflow, The inspector's findings are immutable once submitted; refund review may proceed later and can produce a separate outcome. The system must preserve the inspection facts even if a refund is denied. Which change should become visible as one coherent state?
Nearest alternative: Let the refund reviewer edit inspection findings to make them agree with the eligibility decision.
Identity: preserve_question_id — The original keyed decision was: Reason about visibility and the entire read-modify-write operation, not just whether each method is individually synchronized. In this case, that keeps the rule “classification and refund eligibility are not the same responsibility” inside the owner that can observe and enforce it. The current key still reasons about the same case invariant and the visibility of one coherent operation; the additional interleaving facts make the required atomic boundary concrete.
Option changes: coordinator_exports_state → partial_write_16, inheritance_for_reuse → global_coordination_16, representation_leaks → caller_merge_16
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b03-i017
Objective: Identify the smallest multi-field state change that readers must observe coherently; separate the publication boundary from individual field locks and unrelated workloads.
Decisive facts: In A research-notebook platform, A publication run uses a selected immutable dataset revision and code revision. The editor can keep working; every output row must identify the same selected pair. Which change should become visible as one coherent state?
Nearest alternative: Read the dataset and code version separately at each stage from the current notebook.
Identity: preserve_question_id — The original keyed decision was: Reason about visibility and the entire read-modify-write operation, not just whether each method is individually synchronized. In this case, that keeps the rule “published outputs reference immutable inputs and code versions” inside the owner that can observe and enforce it. The current key still reasons about the same case invariant and the visibility of one coherent operation; the additional interleaving facts make the required atomic boundary concrete.
Option changes: coordinator_exports_state → partial_write_17, inheritance_for_reuse → global_coordination_17, representation_leaks → caller_merge_17
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b03-i018
Objective: Identify the smallest multi-field state change that readers must observe coherently; separate the publication boundary from individual field locks and unrelated workloads.
Decisive facts: In A collaborative annotation workspace, A comment is accepted against one author and document revision. Notification can fail after acceptance; retry must send the accepted comment identity without changing what was committed. Which change should become visible as one coherent state?
Nearest alternative: Send the notification before committing and create the comment only after delivery succeeds.
Identity: preserve_question_id — The original keyed decision was: Reason about visibility and the entire read-modify-write operation, not just whether each method is individually synchronized. In this case, that keeps the rule “accepted comments must retain their author and document revision” inside the owner that can observe and enforce it. The current key still reasons about the same case invariant and the visibility of one coherent operation; the additional interleaving facts make the required atomic boundary concrete.
Option changes: inheritance_for_reuse → partial_write_18, representation_leaks → global_coordination_18, speculative_indirection → caller_merge_18
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines
