# N08-B09 author notes (v1)

- Source: `patternly-content/content/object-oriented-design-interview/concurrency_thread_safety_resources_and_failure_handling/OOD-N08-B09.json` (SHA-256 `093bdea05d1a2e9854c474025fea368aac46a1c70f57f4a8371c990f0461e15d`).
- Proposal: `patternly/docs/active/BIZQ-01/ood-remaining-closure-24/proposals/N08-B09.json` (SHA-256 `74cf1619df104dd12c649c8994241400a171342a6401792664c4de2098cc7b8a`).
- Learning objective: retryable and idempotent object boundaries. Each fictional case states the relevant effect, stable operation identity, and retry/acknowledgement condition in the stem. Those authored premises define the case; the source references are not presented as proof of those guarantees.
- Identity: all 18 keep their existing question IDs because each still assesses whether a replay is the same effect or a genuinely new command/revision. The old generic distractor set is replaced with three case-specific alternatives per question; there is no claimed one-to-one mapping for retired generic distractors.
- Verification: actual question-contract validation and scoring/reversed-option check completed with 18 questions and no failures. This verifies structure and scoring only, not semantic acceptance.

## ood-n08-b09-i001

- Decisive facts: In A public-transit disruption board, Each platform change has a stable change ID and effective sequence. If the acknowledgement is lost, the controller retries the same change ID; a distinct later change has a different ID. Which retry identity should the operation honor?
- Nearest alternative: Generate a new change ID after every lost acknowledgement and publish the same platform change again.
- Identity: The old keyed meaning was to make retry identity or an idempotent state transition part of the boundary before retrying; its case condition was ““passengers receive the change in the order in which it becomes effective”.” The current key still binds replay of one operation to its recorded effect/result, and the new case facts make the retry boundary observable. This preserves the unit decision while replacing an unsupported broad stem.
- Old distractor IDs retired: coordinator_exports_state, inheritance_for_reuse, representation_leaks, speculative_indirection.
- Current distractors are individually authored with fresh IDs: new_identity_retry_01, dedupe_too_broad_01, assume_no_commit_01.
- References: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b09-i002

- Decisive facts: In A neighborhood energy-sharing service, Every discharge reservation has a request ID. A timeout may occur after the meter accepted the window; retrying the same ID must return the original reservation result, while a new ID is a new request. Which retry identity should the operation honor?
- Nearest alternative: Assign a new ID on timeout and try to reserve the same interval again.
- Identity: The old keyed meaning was to make retry identity or an idempotent state transition part of the boundary before retrying; its case condition was ““a meter cannot be committed twice for an overlapping window”.” The current key still binds replay of one operation to its recorded effect/result, and the new case facts make the retry boundary observable. This preserves the unit decision while replacing an unsupported broad stem.
- Old distractor IDs retired: coordinator_exports_state, inheritance_for_reuse, representation_leaks, speculative_indirection.
- Current distractors are individually authored with fresh IDs: new_identity_retry_02, dedupe_too_broad_02, assume_no_commit_02.
- References: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b09-i003

- Decisive facts: In A live captioning studio, A provider-switch command has a switch ID. The callback can finish after the supervisor times out; retrying that same switch must not create a second stream transition, while a later switch uses a different ID. Which retry identity should the operation honor?
- Nearest alternative: Create a new switch ID for every retry and apply each command to active streams again.
- Identity: The old keyed meaning was to make retry identity or an idempotent state transition part of the boundary before retrying; its case condition was ““the current stream keeps its timing and error contract”.” The current key still binds replay of one operation to its recorded effect/result, and the new case facts make the retry boundary observable. This preserves the unit decision while replacing an unsupported broad stem.
- Old distractor IDs retired: inheritance_for_reuse, representation_leaks, speculative_indirection, coordinator_exports_state.
- Current distractors are individually authored with fresh IDs: new_identity_retry_03, dedupe_too_broad_03, assume_no_commit_03.
- References: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b09-i004

- Decisive facts: In A volunteer coordination hub, A two-volunteer swap uses one swap ID. The response can be lost after both assignments changed; a retry must return that swap's result instead of swapping them back. Which retry identity should the operation honor?
- Nearest alternative: Create a new swap ID each time the manager retries after a lost response.
- Identity: The old keyed meaning was to make retry identity or an idempotent state transition part of the boundary before retrying; its case condition was ““skills and availability constraints hold for both assignments”.” The current key still binds replay of one operation to its recorded effect/result, and the new case facts make the retry boundary observable. This preserves the unit decision while replacing an unsupported broad stem.
- Old distractor IDs retired: representation_leaks, speculative_indirection, coordinator_exports_state, inheritance_for_reuse.
- Current distractors are individually authored with fresh IDs: new_identity_retry_04, dedupe_too_broad_04, assume_no_commit_04.
- References: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b09-i005

- Decisive facts: In A local-first map editor, A proposal carries a proposal ID and base route revision. A lost response after acceptance can be retried with the same ID; a different proposal based on an old revision must still receive a conflict. Which retry identity should the operation honor?
- Nearest alternative: Generate a fresh proposal ID on retry so the geometry is uploaded again as a new edit.
- Identity: The old keyed meaning was to make retry identity or an idempotent state transition part of the boundary before retrying; its case condition was ““conflicts are explicit and never silently overwrite accepted geometry”.” The current key still binds replay of one operation to its recorded effect/result, and the new case facts make the retry boundary observable. This preserves the unit decision while replacing an unsupported broad stem.
- Old distractor IDs retired: speculative_indirection, coordinator_exports_state, inheritance_for_reuse, representation_leaks.
- Current distractors are individually authored with fresh IDs: new_identity_retry_05, dedupe_too_broad_05, assume_no_commit_05.
- References: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b09-i006

- Decisive facts: In A board-game campaign manager, A reward command has a campaign ID and action ID. The host may retry after losing the response; the same action must not award points twice, but a different action in the campaign remains valid. Which retry identity should the operation honor?
- Nearest alternative: Generate a new action ID after timeout and award the same points a second time.
- Identity: The old keyed meaning was to make retry identity or an idempotent state transition part of the boundary before retrying; its case condition was ““reward rules depend on the current legal campaign state”.” The current key still binds replay of one operation to its recorded effect/result, and the new case facts make the retry boundary observable. This preserves the unit decision while replacing an unsupported broad stem.
- Old distractor IDs retired: coordinator_exports_state, inheritance_for_reuse, representation_leaks, speculative_indirection.
- Current distractors are individually authored with fresh IDs: new_identity_retry_06, dedupe_too_broad_06, assume_no_commit_06.
- References: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b09-i007

- Decisive facts: In A cold-chain logistics console, A hand-off request includes a transfer ID. The carrier may accept before the dispatch screen times out; retrying the same transfer must not create another ownership change. Which retry identity should the operation honor?
- Nearest alternative: Mint a new transfer ID after timeout and resend the same carrier change as another transfer.
- Identity: The old keyed meaning was to make retry identity or an idempotent state transition part of the boundary before retrying; its case condition was ““temperature restrictions and hand-off ownership travel with the shipment”.” The current key still binds replay of one operation to its recorded effect/result, and the new case facts make the retry boundary observable. This preserves the unit decision while replacing an unsupported broad stem.
- Old distractor IDs retired: coordinator_exports_state, inheritance_for_reuse, representation_leaks, speculative_indirection.
- Current distractors are individually authored with fresh IDs: new_identity_retry_07, dedupe_too_broad_07, assume_no_commit_07.
- References: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b09-i008

- Decisive facts: In A cooperative lending ledger, A repayment carries a receipt ID. The account may be debited before the client receives the receipt; retrying the same receipt ID must not reduce the balance twice, while another receipt remains a new repayment. Which retry identity should the operation honor?
- Nearest alternative: Create a new receipt ID after timeout and debit the account again.
- Identity: The old keyed meaning was to make retry identity or an idempotent state transition part of the boundary before retrying; its case condition was ““a repayment cannot reduce the outstanding balance below zero”.” The current key still binds replay of one operation to its recorded effect/result, and the new case facts make the retry boundary observable. This preserves the unit decision while replacing an unsupported broad stem.
- Old distractor IDs retired: inheritance_for_reuse, representation_leaks, speculative_indirection, coordinator_exports_state.
- Current distractors are individually authored with fresh IDs: new_identity_retry_08, dedupe_too_broad_08, assume_no_commit_08.
- References: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b09-i009

- Decisive facts: In A tournament bracket service, A terminal result has a match ID and result-event ID. The bracket may advance before the official sees the response; replaying the same event must not advance twice, while a new legal event is evaluated against current match state. Which retry identity should the operation honor?
- Nearest alternative: Generate a new result-event ID after timeout and advance the same bracket slot again.
- Identity: The old keyed meaning was to make retry identity or an idempotent state transition part of the boundary before retrying; its case condition was ““the bracket advances only from a legal match state”.” The current key still binds replay of one operation to its recorded effect/result, and the new case facts make the retry boundary observable. This preserves the unit decision while replacing an unsupported broad stem.
- Old distractor IDs retired: representation_leaks, speculative_indirection, coordinator_exports_state, inheritance_for_reuse.
- Current distractors are individually authored with fresh IDs: new_identity_retry_09, dedupe_too_broad_09, assume_no_commit_09.
- References: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b09-i010

- Decisive facts: In A returns inspection workflow, Each submitted inspection revision has a submission ID. If its acknowledgement is lost, retrying that submission must preserve the same findings; a later corrected inspection gets a new revision and ID. Which retry identity should the operation honor?
- Nearest alternative: Create a new submission ID for each retry and append another inspection of the same revision.
- Identity: The old keyed meaning was to make retry identity or an idempotent state transition part of the boundary before retrying; its case condition was ““classification and refund eligibility are not the same responsibility”.” The current key still binds replay of one operation to its recorded effect/result, and the new case facts make the retry boundary observable. This preserves the unit decision while replacing an unsupported broad stem.
- Old distractor IDs retired: speculative_indirection, coordinator_exports_state, inheritance_for_reuse, representation_leaks.
- Current distractors are individually authored with fresh IDs: new_identity_retry_10, dedupe_too_broad_10, assume_no_commit_10.
- References: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b09-i011

- Decisive facts: In A research-notebook platform, A publication request has a run ID and selected input revisions. If the job finishes but its response is lost, retrying that run ID must return the same publication; a changed input selection uses a new run ID. Which retry identity should the operation honor?
- Nearest alternative: Generate a new run ID after timeout and publish the same output again as another result.
- Identity: The old keyed meaning was to make retry identity or an idempotent state transition part of the boundary before retrying; its case condition was ““published outputs reference immutable inputs and code versions”.” The current key still binds replay of one operation to its recorded effect/result, and the new case facts make the retry boundary observable. This preserves the unit decision while replacing an unsupported broad stem.
- Old distractor IDs retired: coordinator_exports_state, inheritance_for_reuse, representation_leaks, speculative_indirection.
- Current distractors are individually authored with fresh IDs: new_identity_retry_11, dedupe_too_broad_11, assume_no_commit_11.
- References: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b09-i012

- Decisive facts: In A collaborative annotation workspace, A comment submission has a comment ID. Notification may be retried after acceptance; the same notification must refer to the accepted comment, while a new comment has a new ID. Which retry identity should the operation honor?
- Nearest alternative: Create a new comment ID for every notification retry and append the same text again.
- Identity: The old keyed meaning was to make retry identity or an idempotent state transition part of the boundary before retrying; its case condition was ““accepted comments must retain their author and document revision”.” The current key still binds replay of one operation to its recorded effect/result, and the new case facts make the retry boundary observable. This preserves the unit decision while replacing an unsupported broad stem.
- Old distractor IDs retired: coordinator_exports_state, inheritance_for_reuse, representation_leaks, speculative_indirection.
- Current distractors are individually authored with fresh IDs: new_identity_retry_12, dedupe_too_broad_12, assume_no_commit_12.
- References: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b09-i013

- Decisive facts: In A mobile field-inspection app, An offline submission has a submission ID and frozen draft revision. The server may finish it before the device receives an acknowledgement; replaying the same ID must return complete/retryable for that revision, not submit later edits. Which retry identity should the operation honor?
- Nearest alternative: Create a new submission ID each time the device retries after reconnecting.
- Identity: The old keyed meaning was to make retry identity or an idempotent state transition part of the boundary before retrying; its case condition was ““a submission is either complete or explicitly retryable”.” The current key still binds replay of one operation to its recorded effect/result, and the new case facts make the retry boundary observable. This preserves the unit decision while replacing an unsupported broad stem.
- Old distractor IDs retired: inheritance_for_reuse, representation_leaks, speculative_indirection, coordinator_exports_state.
- Current distractors are individually authored with fresh IDs: new_identity_retry_13, dedupe_too_broad_13, assume_no_commit_13.
- References: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b09-i014

- Decisive facts: In A digital invoice exchange, Each invoice issue has a stable issue ID. The exchange can accept before the response is lost; retrying the same issue ID must return the same accepted/rejected outcome without charging twice. Which retry identity should the operation honor?
- Nearest alternative: Create a new issue ID after every timeout and resend the invoice as a new chargeable issue.
- Identity: The old keyed meaning was to make retry identity or an idempotent state transition part of the boundary before retrying; its case condition was ““the new issue is traceable and does not double-charge the customer”.” The current key still binds replay of one operation to its recorded effect/result, and the new case facts make the retry boundary observable. This preserves the unit decision while replacing an unsupported broad stem.
- Old distractor IDs retired: representation_leaks, speculative_indirection, coordinator_exports_state, inheritance_for_reuse.
- Current distractors are individually authored with fresh IDs: new_identity_retry_14, dedupe_too_broad_14, assume_no_commit_14.
- References: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b09-i015

- Decisive facts: In A smart-building access controller, A badge revocation command has a command ID. A door may apply the revocation before the administrator sees the acknowledgement; retrying the same command must not toggle the badge back to active. Which retry identity should the operation honor?
- Nearest alternative: Use a toggle command and send it again whenever the administrator sees no acknowledgement.
- Identity: The old keyed meaning was to make retry identity or an idempotent state transition part of the boundary before retrying; its case condition was ““revocation is visible to the door policy before access is granted”.” The current key still binds replay of one operation to its recorded effect/result, and the new case facts make the retry boundary observable. This preserves the unit decision while replacing an unsupported broad stem.
- Old distractor IDs retired: speculative_indirection, coordinator_exports_state, inheritance_for_reuse, representation_leaks.
- Current distractors are individually authored with fresh IDs: new_identity_retry_15, dedupe_too_broad_15, assume_no_commit_15.
- References: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b09-i016

- Decisive facts: In A package-label generation service, A label request has a print-job ID tied to an approved shipment revision. The printer can finish before its acknowledgement arrives; replay must identify that print job rather than print another label. Which retry identity should the operation honor?
- Nearest alternative: Generate a fresh print-job ID whenever the operator retries a missing acknowledgement.
- Identity: The old keyed meaning was to make retry identity or an idempotent state transition part of the boundary before retrying; its case condition was ““the printed label represents the current approved shipment data”.” The current key still binds replay of one operation to its recorded effect/result, and the new case facts make the retry boundary observable. This preserves the unit decision while replacing an unsupported broad stem.
- Old distractor IDs retired: coordinator_exports_state, inheritance_for_reuse, representation_leaks, speculative_indirection.
- Current distractors are individually authored with fresh IDs: new_identity_retry_16, dedupe_too_broad_16, assume_no_commit_16.
- References: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b09-i017

- Decisive facts: In A multi-tenant rehearsal scheduler, A room-move request has a move ID. The move may commit before the coordinator receives its response; retrying the same ID must not move the booking again, while a later new move remains allowed. Which retry identity should the operation honor?
- Nearest alternative: Create a new move ID after a timeout and move the booking from its current room again.
- Identity: The old keyed meaning was to make retry identity or an idempotent state transition part of the boundary before retrying; its case condition was ““the room capacity and cancellation policy must remain consistent”.” The current key still binds replay of one operation to its recorded effect/result, and the new case facts make the retry boundary observable. This preserves the unit decision while replacing an unsupported broad stem.
- Old distractor IDs retired: coordinator_exports_state, inheritance_for_reuse, representation_leaks, speculative_indirection.
- Current distractors are individually authored with fresh IDs: new_identity_retry_17, dedupe_too_broad_17, assume_no_commit_17.
- References: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines

## ood-n08-b09-i018

- Decisive facts: In A museum exhibit controller, A maintenance command has a command ID and desired mode. The controller may set maintenance before the operator receives the acknowledgement; repeating the same command must not toggle back to running. Which retry identity should the operation honor?
- Nearest alternative: Implement maintenance as a toggle and retry it when the response is late.
- Identity: The old keyed meaning was to make retry identity or an idempotent state transition part of the boundary before retrying; its case condition was ““unsafe commands are rejected while maintenance is active”.” The current key still binds replay of one operation to its recorded effect/result, and the new case facts make the retry boundary observable. This preserves the unit decision while replacing an unsupported broad stem.
- Old distractor IDs retired: inheritance_for_reuse, representation_leaks, speculative_indirection, coordinator_exports_state.
- Current distractors are individually authored with fresh IDs: new_identity_retry_18, dedupe_too_broad_18, assume_no_commit_18.
- References: https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html, https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines, https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/, https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines
