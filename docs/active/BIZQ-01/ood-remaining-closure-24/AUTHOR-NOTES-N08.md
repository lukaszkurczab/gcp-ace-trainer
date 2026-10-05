# N08 author notes — incremental unit B01

Source objects: 18. Proposal objects: 18.

Proposal-only authorship record. The 18 question IDs and `owner_preserves_contract` correct-option ID remain because each old and new key tests the same accepted decision: keep the shared mutable domain state behind its owning boundary instead of synchronizing caller-owned copies. The new stems add concrete overlapping operations and the exact state relation that makes this decision testable. All wrong-option meanings changed, so each uses a fresh per-question ID and its own matching feedback. Existing source references are preserved as context; scenario guarantees are stated facts authored in the question, not technical claims attributed to the links. This note does not record semantic acceptance or source activation.

Before source SHA-256: `54965b9ec48485096bf94f11ede2c0a7e9c53a16bccf1a7bd22cd23d46f631f3`
Current proposal SHA-256: `1383b96bb94e9a23adef6c4a3f88d796d8e8a99c838b8e3f2823cebeff169118`

## ood-n08-b01-i001
Objective: Choose a single ownership boundary for shared mutable state so concurrent callers cannot bypass the case invariant; distinguish object-local ownership from caller copies, shared registries, and case subtypes.
Decisive case facts: In A local-first map editor, The route has an accepted revision and a separate offline proposal. Two devices can submit edits before either sees the other's save. A conflicting geometry must be surfaced; neither device may silently replace the accepted route.
Nearest alternative: Let each device replace the route it last downloaded; a later upload wins and the user can compare versions afterward.
Identity: preserve_question_id — The original keyed decision was: Confine or replace shared mutable state before adding synchronization to every caller. In this case, that keeps the rule “conflicts are explicit and never silently overwrite accepted geometry” inside the owner that can observe and enforce it. The revised key still chooses confinement of the same mutable domain state before callers coordinate; the added facts make the same decision testable in this case rather than changing its primary meaning.
Option changes: coordinator_exports_state → caller_copy_001, inheritance_for_reuse → shared_registry_001, representation_leaks → subtype_split_001
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b01-i002
Objective: Choose a single ownership boundary for shared mutable state so concurrent callers cannot bypass the case invariant; distinguish object-local ownership from caller copies, shared registries, and case subtypes.
Decisive case facts: In A board-game campaign manager, A reward changes both a character's available points and the campaign's legal phase. A host and a moderator may apply actions at the same time, while campaigns remain independent.
Nearest alternative: Have the host read points and phase, calculate a new pair, then send both values for replacement.
Identity: preserve_question_id — The original keyed decision was: Confine or replace shared mutable state before adding synchronization to every caller. In this case, that keeps the rule “reward rules depend on the current legal campaign state” inside the owner that can observe and enforce it. The revised key still chooses confinement of the same mutable domain state before callers coordinate; the added facts make the same decision testable in this case rather than changing its primary meaning.
Option changes: coordinator_exports_state → caller_copy_002, inheritance_for_reuse → shared_registry_002, representation_leaks → subtype_split_002
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b01-i003
Objective: Choose a single ownership boundary for shared mutable state so concurrent callers cannot bypass the case invariant; distinguish object-local ownership from caller copies, shared registries, and case subtypes.
Decisive case facts: In A cold-chain logistics console, A shipment's carrier, temperature limits, and hand-off status change as one dispatch decision. Dispatchers and the carrier portal can overlap; a hand-off to a new carrier must retain the shipment's existing limits.
Nearest alternative: Let each client update carrier and hand-off fields separately, then repair missing temperature data during reconciliation.
Identity: preserve_question_id — The original keyed decision was: Confine or replace shared mutable state before adding synchronization to every caller. In this case, that keeps the rule “temperature restrictions and hand-off ownership travel with the shipment” inside the owner that can observe and enforce it. The revised key still chooses confinement of the same mutable domain state before callers coordinate; the added facts make the same decision testable in this case rather than changing its primary meaning.
Option changes: inheritance_for_reuse → caller_copy_003, representation_leaks → shared_registry_003, speculative_indirection → subtype_split_003
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b01-i004
Objective: Choose a single ownership boundary for shared mutable state so concurrent callers cannot bypass the case invariant; distinguish object-local ownership from caller copies, shared registries, and case subtypes.
Decisive case facts: In A cooperative lending ledger, A repayment allocation changes the member's outstanding amount and the ledger entry that explains it. Two stewards can allocate repayments for the same account; separate accounts must continue independently.
Nearest alternative: Read the outstanding amount in each steward screen and submit a replacement balance plus a separate ledger entry.
Identity: preserve_question_id — The original keyed decision was: Confine or replace shared mutable state before adding synchronization to every caller. In this case, that keeps the rule “a repayment cannot reduce the outstanding balance below zero” inside the owner that can observe and enforce it. The revised key still chooses confinement of the same mutable domain state before callers coordinate; the added facts make the same decision testable in this case rather than changing its primary meaning.
Option changes: representation_leaks → caller_copy_004, speculative_indirection → shared_registry_004, coordinator_exports_state → subtype_split_004
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b01-i005
Objective: Choose a single ownership boundary for shared mutable state so concurrent callers cannot bypass the case invariant; distinguish object-local ownership from caller copies, shared registries, and case subtypes.
Decisive case facts: In A tournament bracket service, A match can receive a timeout and an official's result close together. The bracket may advance only once from the match's current legal state, and other matches must proceed independently.
Nearest alternative: Have timer and official handlers each write the next bracket slot, then reconcile if both advanced it.
Identity: preserve_question_id — The original keyed decision was: Confine or replace shared mutable state before adding synchronization to every caller. In this case, that keeps the rule “the bracket advances only from a legal match state” inside the owner that can observe and enforce it. The revised key still chooses confinement of the same mutable domain state before callers coordinate; the added facts make the same decision testable in this case rather than changing its primary meaning.
Option changes: speculative_indirection → caller_copy_005, coordinator_exports_state → shared_registry_005, inheritance_for_reuse → subtype_split_005
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b01-i006
Objective: Choose a single ownership boundary for shared mutable state so concurrent callers cannot bypass the case invariant; distinguish object-local ownership from caller copies, shared registries, and case subtypes.
Decisive case facts: In A returns inspection workflow, An inspection records item condition and evidence; a separate refund review uses that record. Inspectors and reviewers may update their own work at the same time, but a refund decision must not rewrite the inspection.
Nearest alternative: Let the refund reviewer edit condition fields on the same inspection object while deciding eligibility.
Identity: preserve_question_id — The original keyed decision was: Confine or replace shared mutable state before adding synchronization to every caller. In this case, that keeps the rule “classification and refund eligibility are not the same responsibility” inside the owner that can observe and enforce it. The revised key still chooses confinement of the same mutable domain state before callers coordinate; the added facts make the same decision testable in this case rather than changing its primary meaning.
Option changes: coordinator_exports_state → caller_copy_006, inheritance_for_reuse → shared_registry_006, representation_leaks → subtype_split_006
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b01-i007
Objective: Choose a single ownership boundary for shared mutable state so concurrent callers cannot bypass the case invariant; distinguish object-local ownership from caller copies, shared registries, and case subtypes.
Decisive case facts: In A research-notebook platform, An experiment owner can edit a notebook while a publication job runs. A published result must identify the exact input dataset and code revision used, even if the notebook changes later.
Nearest alternative: Let the job retain a live reference to the notebook and read its current inputs when each stage runs.
Identity: preserve_question_id — The original keyed decision was: Confine or replace shared mutable state before adding synchronization to every caller. In this case, that keeps the rule “published outputs reference immutable inputs and code versions” inside the owner that can observe and enforce it. The revised key still chooses confinement of the same mutable domain state before callers coordinate; the added facts make the same decision testable in this case rather than changing its primary meaning.
Option changes: coordinator_exports_state → caller_copy_007, inheritance_for_reuse → shared_registry_007, representation_leaks → subtype_split_007
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b01-i008
Objective: Choose a single ownership boundary for shared mutable state so concurrent callers cannot bypass the case invariant; distinguish object-local ownership from caller copies, shared registries, and case subtypes.
Decisive case facts: In A collaborative annotation workspace, A document has an accepted revision. Reviewers can submit comments concurrently; each accepted comment must retain its author and the document revision it addressed. Notification delivery may be retried separately.
Nearest alternative: Let each reviewer append directly to a shared comment array and let notification handlers fill in missing author or revision fields later.
Identity: preserve_question_id — The original keyed decision was: Confine or replace shared mutable state before adding synchronization to every caller. In this case, that keeps the rule “accepted comments must retain their author and document revision” inside the owner that can observe and enforce it. The revised key still chooses confinement of the same mutable domain state before callers coordinate; the added facts make the same decision testable in this case rather than changing its primary meaning.
Option changes: inheritance_for_reuse → caller_copy_008, representation_leaks → shared_registry_008, speculative_indirection → subtype_split_008
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b01-i009
Objective: Choose a single ownership boundary for shared mutable state so concurrent callers cannot bypass the case invariant; distinguish object-local ownership from caller copies, shared registries, and case subtypes.
Decisive case facts: In A mobile field-inspection app, The inspector may edit a draft offline while a submission is in flight. The server reports either a complete accepted submission or a retryable result; it must not mix fields from two draft revisions.
Nearest alternative: Let the submission read the live draft field by field, then mark whichever draft is current as complete.
Identity: preserve_question_id — The original keyed decision was: Confine or replace shared mutable state before adding synchronization to every caller. In this case, that keeps the rule “a submission is either complete or explicitly retryable” inside the owner that can observe and enforce it. The revised key still chooses confinement of the same mutable domain state before callers coordinate; the added facts make the same decision testable in this case rather than changing its primary meaning.
Option changes: representation_leaks → caller_copy_009, speculative_indirection → shared_registry_009, coordinator_exports_state → subtype_split_009
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b01-i010
Objective: Choose a single ownership boundary for shared mutable state so concurrent callers cannot bypass the case invariant; distinguish object-local ownership from caller copies, shared registries, and case subtypes.
Decisive case facts: In A digital invoice exchange, The operator can correct invoice details while a rejected issue is being prepared again. The customer must be charged only for an accepted issue, and each issued revision must remain traceable.
Nearest alternative: Let the operator mutate the invoice in place after sending it, then treat the latest invoice fields as the issued copy.
Identity: preserve_question_id — The original keyed decision was: Confine or replace shared mutable state before adding synchronization to every caller. In this case, that keeps the rule “the new issue is traceable and does not double-charge the customer” inside the owner that can observe and enforce it. The revised key still chooses confinement of the same mutable domain state before callers coordinate; the added facts make the same decision testable in this case rather than changing its primary meaning.
Option changes: speculative_indirection → caller_copy_010, coordinator_exports_state → shared_registry_010, inheritance_for_reuse → subtype_split_010
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b01-i011
Objective: Choose a single ownership boundary for shared mutable state so concurrent callers cannot bypass the case invariant; distinguish object-local ownership from caller copies, shared registries, and case subtypes.
Decisive case facts: In A smart-building access controller, A badge can be revoked while a door request is being evaluated. The decision must use the current badge status at the access authority; a door may cache a read view but cannot approve a revoked badge from an old copy.
Nearest alternative: Let the door change its local badge copy and report revocation to the authority later.
Identity: preserve_question_id — The original keyed decision was: Confine or replace shared mutable state before adding synchronization to every caller. In this case, that keeps the rule “revocation is visible to the door policy before access is granted” inside the owner that can observe and enforce it. The revised key still chooses confinement of the same mutable domain state before callers coordinate; the added facts make the same decision testable in this case rather than changing its primary meaning.
Option changes: coordinator_exports_state → caller_copy_011, inheritance_for_reuse → shared_registry_011, representation_leaks → subtype_split_011
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b01-i012
Objective: Choose a single ownership boundary for shared mutable state so concurrent callers cannot bypass the case invariant; distinguish object-local ownership from caller copies, shared registries, and case subtypes.
Decisive case facts: In A package-label generation service, Address corrections and label generation can overlap. A printed label must correspond to one approved shipment revision; label generation must not change the approved address.
Nearest alternative: Let the label generator edit the shipment's address after checking it, then print whichever value is present at the end.
Identity: preserve_question_id — The original keyed decision was: Confine or replace shared mutable state before adding synchronization to every caller. In this case, that keeps the rule “the printed label represents the current approved shipment data” inside the owner that can observe and enforce it. The revised key still chooses confinement of the same mutable domain state before callers coordinate; the added facts make the same decision testable in this case rather than changing its primary meaning.
Option changes: coordinator_exports_state → caller_copy_012, inheritance_for_reuse → shared_registry_012, representation_leaks → subtype_split_012
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b01-i013
Objective: Choose a single ownership boundary for shared mutable state so concurrent callers cannot bypass the case invariant; distinguish object-local ownership from caller copies, shared registries, and case subtypes.
Decisive case facts: In A multi-tenant rehearsal scheduler, Bookings for one room must respect capacity and cancellation rules. Coordinators may edit bookings concurrently; separate rooms should not block each other, and search results are only a view.
Nearest alternative: Let each coordinator reserve from a search result and replace the full result list after the change.
Identity: preserve_question_id — The original keyed decision was: Confine or replace shared mutable state before adding synchronization to every caller. In this case, that keeps the rule “the room capacity and cancellation policy must remain consistent” inside the owner that can observe and enforce it. The revised key still chooses confinement of the same mutable domain state before callers coordinate; the added facts make the same decision testable in this case rather than changing its primary meaning.
Option changes: inheritance_for_reuse → caller_copy_013, representation_leaks → shared_registry_013, speculative_indirection → subtype_split_013
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b01-i014
Objective: Choose a single ownership boundary for shared mutable state so concurrent callers cannot bypass the case invariant; distinguish object-local ownership from caller copies, shared registries, and case subtypes.
Decisive case facts: In A museum exhibit controller, When maintenance mode is active, unsafe exhibit commands are rejected. The operator can change the mode while command requests are arriving; the sensor adapter reports readings but must not change mode itself.
Nearest alternative: Let each command handler cache mode, accept unsafe commands if its copy says running, and reconcile later.
Identity: preserve_question_id — The original keyed decision was: Confine or replace shared mutable state before adding synchronization to every caller. In this case, that keeps the rule “unsafe commands are rejected while maintenance is active” inside the owner that can observe and enforce it. The revised key still chooses confinement of the same mutable domain state before callers coordinate; the added facts make the same decision testable in this case rather than changing its primary meaning.
Option changes: representation_leaks → caller_copy_014, speculative_indirection → shared_registry_014, coordinator_exports_state → subtype_split_014
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b01-i015
Objective: Choose a single ownership boundary for shared mutable state so concurrent callers cannot bypass the case invariant; distinguish object-local ownership from caller copies, shared registries, and case subtypes.
Decisive case facts: In A video-learning library, A lesson can be retired while learners are using it. Existing progress must remain attached to the stable lesson identity; new catalog views should stop offering retired lessons.
Nearest alternative: Delete the lesson row and let each learner client reconstruct progress from the title and current catalog position.
Identity: preserve_question_id — The original keyed decision was: Confine or replace shared mutable state before adding synchronization to every caller. In this case, that keeps the rule “progress refers to a stable lesson identity” inside the owner that can observe and enforce it. The revised key still chooses confinement of the same mutable domain state before callers coordinate; the added facts make the same decision testable in this case rather than changing its primary meaning.
Option changes: speculative_indirection → caller_copy_015, coordinator_exports_state → shared_registry_015, inheritance_for_reuse → subtype_split_015
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b01-i016
Objective: Choose a single ownership boundary for shared mutable state so concurrent callers cannot bypass the case invariant; distinguish object-local ownership from caller copies, shared registries, and case subtypes.
Decisive case facts: In A shared whiteboard application, Participants can add strokes while an export is running. The exported history must represent one stable board revision; a failed export can be retried without changing board contents.
Nearest alternative: Let the export worker read the live stroke list as it writes the file and mark the board closed when finished.
Identity: preserve_question_id — The original keyed decision was: Confine or replace shared mutable state before adding synchronization to every caller. In this case, that keeps the rule “export observes a stable session state” inside the owner that can observe and enforce it. The revised key still chooses confinement of the same mutable domain state before callers coordinate; the added facts make the same decision testable in this case rather than changing its primary meaning.
Option changes: coordinator_exports_state → caller_copy_016, inheritance_for_reuse → shared_registry_016, representation_leaks → subtype_split_016
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b01-i017
Objective: Choose a single ownership boundary for shared mutable state so concurrent callers cannot bypass the case invariant; distinguish object-local ownership from caller copies, shared registries, and case subtypes.
Decisive case facts: In A customer-support escalation desk, An escalation changes assignee and response deadline together. Two agents can act on a conversation at nearly the same time, and the customer-visible record must not pair one agent's assignment with another action's deadline.
Nearest alternative: Let each agent update assignee and deadline through separate editable fields and repair mismatches in a later report.
Identity: preserve_question_id — The original keyed decision was: Confine or replace shared mutable state before adding synchronization to every caller. In this case, that keeps the rule “the escalation keeps ownership and response deadlines” inside the owner that can observe and enforce it. The revised key still chooses confinement of the same mutable domain state before callers coordinate; the added facts make the same decision testable in this case rather than changing its primary meaning.
Option changes: coordinator_exports_state → caller_copy_017, inheritance_for_reuse → shared_registry_017, representation_leaks → subtype_split_017
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b01-i018
Objective: Choose a single ownership boundary for shared mutable state so concurrent callers cannot bypass the case invariant; distinguish object-local ownership from caller copies, shared registries, and case subtypes.
Decisive case facts: In A regional produce marketplace, A seller may edit price and stock while a publication request is being reviewed. A listing becomes visible only when both values satisfy the current listing rule; unrelated sellers should publish independently.
Nearest alternative: Let the marketplace update price and stock as separate public fields and hide mismatches with a later cleanup job.
Identity: preserve_question_id — The original keyed decision was: Confine or replace shared mutable state before adding synchronization to every caller. In this case, that keeps the rule “a listing cannot become visible before its price and stock rule are valid” inside the owner that can observe and enforce it. The revised key still chooses confinement of the same mutable domain state before callers coordinate; the added facts make the same decision testable in this case rather than changing its primary meaning.
Option changes: inheritance_for_reuse → caller_copy_018, representation_leaks → shared_registry_018, speculative_indirection → subtype_split_018
Sources: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines
