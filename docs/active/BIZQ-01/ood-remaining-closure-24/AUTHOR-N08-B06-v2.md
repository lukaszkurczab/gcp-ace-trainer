# N08-B06 author correction v2

Proposal SHA-256: `5bb9402840b735f3b5516a0abe927266ef266cf5fbb0e7a1c12b7ec9a2b4ca72`

Kept the same async lifecycle decisions and correct option IDs. Reworked the three wrong alternatives in each object into case-specific competing contracts and rebound their messages; no array reordering, external delivery guarantee, or rollback promise was added.

## ood-n08-b06-i001

Distinguish cancellation of waiting from operation ownership, commit state, and cleanup obligations in the stated async case.

Nearest competing contract: Cancel the shared render when any caller cancels, even while another caller still needs it.

The accepted lifecycle boundary and owner_preserves_contract decision remain the same; only competing policy meanings were rewritten and therefore receive fresh option IDs.

## ood-n08-b06-i002

Distinguish cancellation of waiting from operation ownership, commit state, and cleanup obligations in the stated async case.

Nearest competing contract: Keep the slot after timeout because the coordinator may retry later.

The accepted lifecycle boundary and owner_preserves_contract decision remain the same; only competing policy meanings were rewritten and therefore receive fresh option IDs.

## ood-n08-b06-i003

Distinguish cancellation of waiting from operation ownership, commit state, and cleanup obligations in the stated async case.

Nearest competing contract: Show canceled as soon as the UI request arrives and ignore a later acceptance response.

The accepted lifecycle boundary and owner_preserves_contract decision remain the same; only competing policy meanings were rewritten and therefore receive fresh option IDs.

## ood-n08-b06-i004

Distinguish cancellation of waiting from operation ownership, commit state, and cleanup obligations in the stated async case.

Nearest competing contract: Hide the lesson when work starts and restore it if cancellation later arrives.

The accepted lifecycle boundary and owner_preserves_contract decision remain the same; only competing policy meanings were rewritten and therefore receive fresh option IDs.

## ood-n08-b06-i005

Distinguish cancellation of waiting from operation ownership, commit state, and cleanup obligations in the stated async case.

Nearest competing contract: Leave the temporary file open when the host cancels so a later request can take it over.

The accepted lifecycle boundary and owner_preserves_contract decision remain the same; only competing policy meanings were rewritten and therefore receive fresh option IDs.

## ood-n08-b06-i006

Distinguish cancellation of waiting from operation ownership, commit state, and cleanup obligations in the stated async case.

Nearest competing contract: Treat a lost response at the deadline as a confirmed rejection.

The accepted lifecycle boundary and owner_preserves_contract decision remain the same; only competing policy meanings were rewritten and therefore receive fresh option IDs.

## ood-n08-b06-i007

Distinguish cancellation of waiting from operation ownership, commit state, and cleanup obligations in the stated async case.

Nearest competing contract: Show the candidate price before validation and retract it after a failed check.

The accepted lifecycle boundary and owner_preserves_contract decision remain the same; only competing policy meanings were rewritten and therefore receive fresh option IDs.

## ood-n08-b06-i008

Distinguish cancellation of waiting from operation ownership, commit state, and cleanup obligations in the stated async case.

Nearest competing contract: Publish the first child and show the other as pending despite the all-checks contract.

The accepted lifecycle boundary and owner_preserves_contract decision remain the same; only competing policy meanings were rewritten and therefore receive fresh option IDs.

## ood-n08-b06-i009

Distinguish cancellation of waiting from operation ownership, commit state, and cleanup obligations in the stated async case.

Nearest competing contract: Move the plot before approval, then restore it if the service denies the transfer.

The accepted lifecycle boundary and owner_preserves_contract decision remain the same; only competing policy meanings were rewritten and therefore receive fresh option IDs.

## ood-n08-b06-i010

Distinguish cancellation of waiting from operation ownership, commit state, and cleanup obligations in the stated async case.

Nearest competing contract: Publish while component checks continue, then replace the bundle if a check fails.

The accepted lifecycle boundary and owner_preserves_contract decision remain the same; only competing policy meanings were rewritten and therefore receive fresh option IDs.

## ood-n08-b06-i011

Distinguish cancellation of waiting from operation ownership, commit state, and cleanup obligations in the stated async case.

Nearest competing contract: Keep an expired requester hold indefinitely to make retry easier.

The accepted lifecycle boundary and owner_preserves_contract decision remain the same; only competing policy meanings were rewritten and therefore receive fresh option IDs.

## ood-n08-b06-i012

Distinguish cancellation of waiting from operation ownership, commit state, and cleanup obligations in the stated async case.

Nearest competing contract: Write fields as they are transformed, then restore them if cancellation is observed.

The accepted lifecycle boundary and owner_preserves_contract decision remain the same; only competing policy meanings were rewritten and therefore receive fresh option IDs.

## ood-n08-b06-i013

Distinguish cancellation of waiting from operation ownership, commit state, and cleanup obligations in the stated async case.

Nearest competing contract: Publish provisional approval and remove it later if the check fails.

The accepted lifecycle boundary and owner_preserves_contract decision remain the same; only competing policy meanings were rewritten and therefore receive fresh option IDs.

## ood-n08-b06-i014

Distinguish cancellation of waiting from operation ownership, commit state, and cleanup obligations in the stated async case.

Nearest competing contract: Replace the mapping at start and restore it if cancellation arrives.

The accepted lifecycle boundary and owner_preserves_contract decision remain the same; only competing policy meanings were rewritten and therefore receive fresh option IDs.

## ood-n08-b06-i015

Distinguish cancellation of waiting from operation ownership, commit state, and cleanup obligations in the stated async case.

Nearest competing contract: Report cancellation when the navigator closes the screen even after acknowledgement.

The accepted lifecycle boundary and owner_preserves_contract decision remain the same; only competing policy meanings were rewritten and therefore receive fresh option IDs.

## ood-n08-b06-i016

Distinguish cancellation of waiting from operation ownership, commit state, and cleanup obligations in the stated async case.

Nearest competing contract: Cancel a shared scoring worker when one view closes even if another still uses it.

The accepted lifecycle boundary and owner_preserves_contract decision remain the same; only competing policy meanings were rewritten and therefore receive fresh option IDs.

## ood-n08-b06-i017

Distinguish cancellation of waiting from operation ownership, commit state, and cleanup obligations in the stated async case.

Nearest competing contract: Catch task failure and leave the manager with pending status forever.

The accepted lifecycle boundary and owner_preserves_contract decision remain the same; only competing policy meanings were rewritten and therefore receive fresh option IDs.

## ood-n08-b06-i018

Distinguish cancellation of waiting from operation ownership, commit state, and cleanup obligations in the stated async case.

Nearest competing contract: Point the episode to the temp file at start, then restore the old pointer on cancellation.

The accepted lifecycle boundary and owner_preserves_contract decision remain the same; only competing policy meanings were rewritten and therefore receive fresh option IDs.
