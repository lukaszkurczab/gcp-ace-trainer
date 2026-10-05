# N08-B02 author correction v3

Prior v2 proposal SHA-256: `b1cf5583d99cd754ee91fe159134d84cdc7a5012a1886ddfefb3fd1d8495d5d7`
v3 proposal SHA-256: `de9bb542883a708eb7f64cc5c2eabdf4dbe1ccd3c4a052a952cfd69753b0f7c7`

Revised the four choice texts, every wrong-option message, and errorCorrection detail while keeping the supported primary decision, all question and option IDs, answer meanings, question order, prompts, Reason, other Details, sourceRefs, taxonomy and scoring. The answer position remains source order; correcting learner-facing order is owned by the root presentation work, so no array rotation is included here.

The all-first source order finding is not addressed here; the root’s runtime-order work owns learner-facing mixed order. No source option array rotation was made.

## ood-n08-b02-i001

Decision: Release only after the order owner checks current settlement.
Nearest alternative: The nearest caller-side release from its earlier screen read fails because the state may change before acceptance.
Revision: Choice texts now contrast a current order-scoped check with stale read, overbroad lock, and caller inference after timeout.

## ood-n08-b02-i002

Decision: Publish updates for each line in effective-sequence order.
Nearest alternative: Arrival order and passenger-local merges can show the earlier effective update after the later one.
Revision: Choice texts now compare effective sequencing with arrival publication, cross-line queueing, and per-passenger copies.

## ood-n08-b02-i003

Decision: Check the meter window and reserve it as one operation.
Nearest alternative: A check-then-insert permits two overlapping requests to confirm the same final window.
Revision: Choice texts now compare the meter-scoped overlap decision with the TOCTOU gap, service-wide lock, and stale schedule snapshot.

## ood-n08-b02-i004

Decision: Keep each active stream on the provider configuration it captured.
Nearest alternative: A mutable provider reference or per-caption lookup can change the active stream contract during a switch.
Revision: Choice texts now compare per-stream captured config with shared mutation, unnecessary stream restarts, and callback-time lookup.

## ood-n08-b02-i005

Decision: Validate and commit both shift assignments together.
Nearest alternative: The first write can escape before the second skill/availability check fails.
Revision: Choice texts now compare pairwise roster commit with compensating writes, whole-directory locking, and independent client changes.

## ood-n08-b02-i006

Decision: Compare the proposal base with the current route revision before accepting.
Nearest alternative: The device may upload from a superseded base; last-arrival-wins omits the required conflict.
Revision: Choice texts now distinguish route-scoped revision comparison from stale device checks, silent last-arrival selection, and map-wide blocking.

## ood-n08-b02-i007

Decision: Evaluate campaign reward legality against current phase at command acceptance.
Nearest alternative: The phase displayed on a screen may be stale, and separate host/moderator writes can interleave.
Revision: Choice texts now compare current campaign state with screen-derived phase, cross-campaign queueing, and separate owner writes.

## ood-n08-b02-i008

Decision: Transfer a versioned shipment and activate the new carrier on acceptance.
Nearest alternative: New-carrier work cannot begin before the hand-off is accepted with the shipment limits retained.
Revision: Choice texts now distinguish accepted-version ownership from simultaneous writers, delayed limit copying, and duplicated shipment records.

## ood-n08-b02-i009

Decision: Check current account balance and record its allocation together.
Nearest alternative: Two screens can spend the same amount if allocation and ledger recording are separate.
Revision: Choice texts now compare the account-scoped transition with stale calculations, whole-ledger lock, and post-check event acceptance.

## ood-n08-b02-i010

Decision: Accept one legal terminal result before advancing the match.
Nearest alternative: Timer and official can both advance from one open-state read; unrelated matches should not block.
Revision: Choice texts now distinguish match-scoped current transition from duplicate handler writes, tournament mutex, and stale screen replacement.

## ood-n08-b02-i011

Decision: Let refund review read the accepted inspection revision.
Nearest alternative: Refund outcome is not an inspection fact, and a replacement record would lose the source inspection.
Revision: Choice texts now compare immutable inspection input with reviewer edits, shared record replacement, and a refund-specific copy.

## ood-n08-b02-i012

Decision: Pin publication to its selected dataset and code revisions.
Nearest alternative: Live stage reads can use different inputs, while workspace-wide locking blocks independent experiments.
Revision: Choice texts now contrast pinned inputs with live reads, workspace lock, and an editor-writable publication record.

## ood-n08-b02-i013

Decision: Notify from author and revision stored on the accepted comment.
Nearest alternative: Delivery-time lookup can attach another editor or document revision after a retry.
Revision: Choice texts now compare accepted-comment metadata with delivery lookup, shared list repair, and unrelated global queueing.

## ood-n08-b02-i014

Decision: Bind the server result to the frozen submitted revision.
Nearest alternative: A live draft response can mark later edits complete; shared draft merging can mix revisions.
Revision: Choice texts now compare revision-bound result with live reads, shared copies, and an unnecessarily global upload lock.

## ood-n08-b02-i015

Decision: Attach the exchange result to the exact submitted invoice revision.
Nearest alternative: A late response cannot safely update a mutable invoice representing a corrected issue.
Revision: Choice texts now compare per-revision results with shared mutable state, cross-seller queueing, and in-place edits.

## ood-n08-b02-i016

Decision: Check current authority revision before the door grants.
Nearest alternative: A local cache or previously valid badge revision can be stale at grant time.
Revision: Choice texts now distinguish authority-current grant from local writes, old cached approval, and a building-wide lock.

## ood-n08-b02-i017

Decision: Give each print job its approved shipment revision.
Nearest alternative: Reading current fields while rendering can combine two approved address revisions.
Revision: Choice texts now compare job-pinned revision with live field reads, shared mutable buffer, and cross-shipment blocking.

## ood-n08-b02-i018

Decision: Check overlap and accept a reservation within the room scope.
Nearest alternative: A stale search view can let two coordinators take the final slot.
Revision: Choice texts now compare room-scoped acceptance with stale UI, a schedule-wide lock, and private room copies.

## Verification status

This proposal needs actual question-contract/scoring validation and independent review. No semantic acceptance is claimed.
