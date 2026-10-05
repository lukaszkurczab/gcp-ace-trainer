# N08-B02 author notes (v2)

- Frozen v1 proposal: `proposals/N08-B02.json` (SHA-256 `bd6dd7da862836111d3f03d0655884b45a69635e8cd2af3eef8a919c3fb2dc1c`).
- v2 proposal: `proposals/N08-B02-v2.json` (SHA-256 `b1cf5583d99cd754ee91fe159134d84cdc7a5012a1886ddfefb3fd1d8495d5d7`).
- Source SHA-256: `1db1cf0b1c16746d2899fadd9dd2afdfb2d40e3fc945e220a79404b0883efba8`.

This additive revision addresses the independent §4.3 finding by shortening the accepted-option text to its case-specific decision. It preserves question and option IDs, prompts, distractor text, answer bindings, Reason, Details, diagnostics, and every other field from v1. It does not impose a word-count or equal-length target. The same decision remains keyed in every item; the correction removes redundant workflow clauses that made keys systematically more complete-looking than their alternatives.

## ood-n08-b02-i001

- Accepted key v1: Serialize settlement and release for that order at its order-state owner; recheck settled status in the same operation that records release.
- Accepted key v2: Check settlement and serialize release for that order.
- All other question fields and options are unchanged.

## ood-n08-b02-i002

- Accepted key v1: Queue updates by line and apply them in effective-sequence order, so delayed delivery does not redefine event order.
- Accepted key v2: Apply each line's updates in effective-sequence order.
- All other question fields and options are unchanged.

## ood-n08-b02-i003

- Accepted key v1: Make the meter reservation operation check overlap and record the winning window as one serialized decision scoped to that meter.
- Accepted key v2: Serialize each meter's overlap check and reservation write.
- All other question fields and options are unchanged.

## ood-n08-b02-i004

- Accepted key v1: Create an immutable provider configuration for each stream and atomically select the new configuration for streams started after the switch.
- Accepted key v2: Pin each stream to one immutable provider configuration; switch only new streams.
- All other question fields and options are unchanged.

## ood-n08-b02-i005

- Accepted key v1: Have the roster owner validate both target assignments and commit the pair together for that shift window.
- Accepted key v2: Validate and commit the two assignments together at the roster owner.
- All other question fields and options are unchanged.

## ood-n08-b02-i006

- Accepted key v1: Compare the submitted base revision with the current accepted revision and commit the proposal at one route-owner boundary.
- Accepted key v2: Reject proposals based on a superseded route revision.
- All other question fields and options are unchanged.

## ood-n08-b02-i007

- Accepted key v1: Send each campaign's commands through its state owner, which evaluates each against the latest phase before recording the accepted transition.
- Accepted key v2: Evaluate campaign commands against the latest phase at the campaign owner.
- All other question fields and options are unchanged.

## ood-n08-b02-i008

- Accepted key v1: Transfer a versioned shipment record containing the current limits and new carrier, then make the new owner active only for that accepted version.
- Accepted key v2: Transfer one versioned shipment; activate its carrier only for the accepted version.
- All other question fields and options are unchanged.

## ood-n08-b02-i009

- Accepted key v1: At the account ledger boundary, coordinate the balance check, allocation, and matching entry as one accepted account operation.
- Accepted key v2: Validate and commit the allocation with its matching ledger entry as one account operation.
- All other question fields and options are unchanged.

## ood-n08-b02-i010

- Accepted key v1: Serialize result commands at the match owner and accept only the first legal transition from the current match state.
- Accepted key v2: Accept only the first legal terminal transition at the match owner.
- All other question fields and options are unchanged.

## ood-n08-b02-i011

- Accepted key v1: Store accepted findings as an immutable inspection revision and give the refund decision that revision to evaluate.
- Accepted key v2: Give refund review the accepted, immutable inspection revision.
- All other question fields and options are unchanged.

## ood-n08-b02-i012

- Accepted key v1: Capture the chosen dataset and code revision in an immutable publication input before the job reads it.
- Accepted key v2: Pin publication input to its selected dataset and code revisions.
- All other question fields and options are unchanged.

## ood-n08-b02-i013

- Accepted key v1: Commit the comment with author and revision, then emit a notification description containing that accepted record's identity.
- Accepted key v2: Notify using the accepted comment's stored author and revision.
- All other question fields and options are unchanged.

## ood-n08-b02-i014

- Accepted key v1: Freeze the submitted revision and bind the returned completion state to that revision, leaving later edits as a separate draft.
- Accepted key v2: Bind completion to the frozen submission; keep later edits separate.
- All other question fields and options are unchanged.

## ood-n08-b02-i015

- Accepted key v1: Send an immutable invoice revision and attach the response to that revision's exchange record, leaving the corrected issue separate.
- Accepted key v2: Attach each exchange result to the submitted invoice revision.
- All other question fields and options are unchanged.

## ood-n08-b02-i016

- Accepted key v1: Compare the request's checked revision with the authority's current badge revision at the grant decision and reject an older view.
- Accepted key v2: Check the current badge revision at the grant decision.
- All other question fields and options are unchanged.

## ood-n08-b02-i017

- Accepted key v1: Pass each print job an immutable approved shipment revision and do not mutate the in-flight job's input.
- Accepted key v2: Give each print job an immutable approved shipment revision.
- All other question fields and options are unchanged.

## ood-n08-b02-i018

- Accepted key v1: At the room's booking owner, check the current overlap count and accept a reservation as one room-scoped decision.
- Accepted key v2: Check overlap and accept each reservation in one room-scoped operation.
- All other question fields and options are unchanged.
