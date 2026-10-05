# N08-B01 author correction v3

Previous v2 proposal SHA-256: `031233aab469faddd56eef90a9b4c04759c250d4f60423dcd059e97426e64061`
v3 proposal SHA-256: `d2672b21eca943d2c9896b3944bce485a2e339b66f5aaadcc71f1d8eb15f165d`

Revised the four option texts per item, retained the same question and option IDs and primary decision, and aligned all wrong-option feedback and errorCorrection fields. Alternatives now name plausible case-specific competing boundaries and explain the exact visible condition they fail. This is a qualitative correction to the terse-key/overelaborate-wrong-choice cue; no length or option-count target is used.

The keyed operation-boundary decisions remain the same, and all question and option IDs are retained. Per-item notes identify the decisive case facts and nearest alternative. The option texts and diagnostics were rewritten together; prompts, answers, Reason, other Details fields, refs, taxonomy and scoring remain unchanged.

## ood-n08-b01-i001

Decision: Apply conflict checking at the route’s accepted-revision boundary.
Nearest alternative: A client can act from its own stale revision, while a shared route can still receive competing replacements.
Change: The choice set now distinguishes local revision checks, client-local shared-record writes, and per-device route copies; each risks accepting or postponing a conflict before it is surfaced.

## ood-n08-b01-i002

Decision: Apply a reward using the campaign’s current phase and change its points and phase together.
Nearest alternative: A moderator can replace from a stale read; a process-wide state also couples independent campaigns.
Change: Alternatives now cover stale host-side replacement, global serialization, and reward-specific types trusting caller phase; their feedback identifies the race, independence, or stale-phase failure.

## ood-n08-b01-i003

Decision: Keep carrier, status, and temperature limits together in a single shipment hand-off.
Nearest alternative: A portal writing fields it manages can publish a mixed revision, while carrier defaults can replace existing limits.
Change: Alternatives now distinguish split dispatch writes, independently replaced portal fields, and carrier-type defaults that lose the existing limits.

## ood-n08-b01-i004

Decision: Allocate against the current account balance and record the matching ledger entry.
Nearest alternative: Replacing from a steward read can overspend; a whole-ledger lock blocks unrelated accounts; source-specific balances can disagree with the ledger.
Change: Alternatives now contrast stale replacement, global locking, and separate source balances; each feedback message names its account-level failure.

## ood-n08-b01-i005

Decision: Accept only one timeout or result transition from the match’s current state.
Nearest alternative: Independent handler advances can both act on one open match; a bracket-wide lock couples other matches.
Change: Alternatives now contrast timer/official stale reads, global bracket serialization, and separate terminal match types that can both advance.

## ood-n08-b01-i006

Decision: Keep inspection evidence in its record and let refund review consume that record separately.
Nearest alternative: Refund review must not rewrite inspection; substituting a shared or copied return record loses the accepted evidence boundary.
Change: Alternatives now cover reviewer edits, replacement of a shared record, and a refund-specific copy; each message points to the separated inspection source.

## ood-n08-b01-i007

Decision: Freeze the selected dataset and code revision before publication runs.
Nearest alternative: Stage-time reads or an editor-writable shared record can make a result combine changing inputs.
Change: Alternatives now distinguish live stage reads, a shared editable input record, and a publication type still following live editor fields.

## ood-n08-b01-i008

Decision: Capture comment author and addressed revision when the document accepts each comment.
Nearest alternative: Notification retries may happen later, but must not resolve the accepted comment against a different author or document revision.
Change: Alternatives now contrast delivery-time metadata lookup, replacement of prior attribution, and channel-specific copies resolved on retry.

## ood-n08-b01-i009

Decision: Submit one frozen draft revision and attach its completion or retryable result to that revision.
Nearest alternative: A live read can mix revisions; device copies can overwrite the submitted draft; a type-level status does not identify the submitted revision.
Change: Alternatives now distinguish field-by-field live reads, stale device replacement, and completion flags on online/offline types.

## ood-n08-b01-i010

Decision: Issue a versioned invoice and record each response against the exact issued revision.
Nearest alternative: In-place edits or a shared invoice can change what a response appears to describe; a latest-attempt type loses earlier response links.
Change: Alternatives now contrast post-issue edits, a shared invoice updated by handlers, and responses recorded only on the latest attempt type.

## ood-n08-b01-i011

Decision: Check each grant against the access authority’s current badge status.
Nearest alternative: A door cache or door-specific revoked-badge interpretation can differ from current authority state.
Change: Alternatives now distinguish late-sync cached grants, door-written shared status, and per-door interpretation of a revoked subtype.

## ood-n08-b01-i012

Decision: Print from an immutable approved shipment address revision.
Nearest alternative: The generator must not normalize the approved address in place; a carrier copy can diverge from the revision it should print.
Change: Alternatives now compare job-side correction, shared print-time normalization, and carrier-specific copied addresses.

## ood-n08-b01-i013

Decision: Apply capacity and cancellation rules against current bookings for the room/day.
Nearest alternative: A search result can be stale; a schedule-wide lock couples rooms; coordinator-specific booking types can disagree on cancellation.
Change: Alternatives now distinguish stale-search replacement, global scheduling lock, and coordinator-specific cancellation policy.

## ood-n08-b01-i014

Decision: Check each command against current exhibit mode when accepting it.
Nearest alternative: The adapter reports readings but cannot change mode; a handler’s cached mode can be stale; replacing the exhibit type can use stale mode too.
Change: Alternatives now contrast cached handler mode, adapter writes, and mode-specific types whose cached state can accept an unsafe command.

## ood-n08-b01-i015

Decision: Retire catalog availability while keeping progress attached to the stable lesson ID.
Nearest alternative: Deletion loses that identity; stale catalog copies can still offer a retired lesson; moving progress changes its identity.
Change: Alternatives now distinguish rebuilding from title/position, stale screen-local availability, and progress moved to a retired-lesson type.

## ood-n08-b01-i016

Decision: Export one fixed board revision while leaving the live session unchanged.
Nearest alternative: Reading live strokes or sharing an appendable export buffer can mix revisions; a failed export must not replace session state.
Change: Alternatives now contrast live reads/closing, a shared appendable retry buffer, and replacing the session at export start.

## ood-n08-b01-i017

Decision: Apply assignee and deadline together through the current conversation transition.
Nearest alternative: Separate writes or stale shared-row replacement can create the mismatched customer-visible pair; a copied subtype can preserve an old deadline.
Change: Alternatives now distinguish separate agent edits, replacement from local reads, and escalation-specific copied assignment state.

## ood-n08-b01-i018

Decision: Validate price and stock together before publishing a listing revision.
Nearest alternative: A public row or early price publish can expose a listing before both current values satisfy the rule.
Change: Alternatives now distinguish sequential field publication, direct seller edits followed by cleanup, and an attempt visible before stock is copied in.

## Verification

The current proposal was checked with the repository’s real `validateQuestion` and `scoreQuestion` exports: 18/18 schema-valid questions and 72/72 option responses correct under original and reversed option order. These are structural/scoring checks only; independent semantic review remains required.
