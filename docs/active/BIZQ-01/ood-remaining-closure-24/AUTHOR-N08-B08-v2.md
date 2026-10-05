# N08-B08 author correction v2

Proposal SHA-256: `9af6fbc77d988e88f85cea358f32060e760f7cd08ba946ad3f1ff96e1261dbe1`

Changed only the accepted-option text for all 18 cases: concise outcome decisions replace full recipe echoes, and i010 drops the unsupported access-check mechanism. Question IDs, accepted option IDs/meanings, distractors, messages, Reason, Details, prompts, and option array order are unchanged. Runtime presentation order is owned by the root fix.

## ood-n08-b08-i001

Expose the committed local/external effect accurately and represent collaborator failure at its actual commit boundary.

Decisive case fact: In A board-game campaign manager, A reward updates character points and campaign phase in one local command. If the optional audit publisher fails after that command commits, the reward remains accepted and the audit event is marked pending. What outcome should the operation expose after the collaborator fails?

Nearest alternative: Roll back points after the audit publisher fails, even though the reward command already committed.

The committed-versus-pending outcome remains the same primary decision. The key was shortened to state that outcome without restating every case fact; i010 no longer asserts an unstated access-check architecture.

## ood-n08-b08-i002

Expose the committed local/external effect accurately and represent collaborator failure at its actual commit boundary.

Decisive case fact: In A cold-chain logistics console, The new carrier accepts a shipment hand-off before a notification service fails. The hand-off is the ownership commit point; the notification is a later notice and can be retried. What outcome should the operation expose after the collaborator fails?

Nearest alternative: Undo the shipment hand-off when notification fails, even though the new carrier has accepted responsibility.

The committed-versus-pending outcome remains the same primary decision. The key was shortened to state that outcome without restating every case fact; i010 no longer asserts an unstated access-check architecture.

## ood-n08-b08-i003

Expose the committed local/external effect accurately and represent collaborator failure at its actual commit boundary.

Decisive case fact: In A cooperative lending ledger, The account's balance reduction and repayment entry are in one local transaction. If entry validation fails before commit, neither change is visible and the repayment can be corrected. What outcome should the operation expose after the collaborator fails?

Nearest alternative: Keep the reduced balance and omit the entry because the balance write succeeded first.

The committed-versus-pending outcome remains the same primary decision. The key was shortened to state that outcome without restating every case fact; i010 no longer asserts an unstated access-check architecture.

## ood-n08-b08-i004

Expose the committed local/external effect accurately and represent collaborator failure at its actual commit boundary.

Decisive case fact: In A tournament bracket service, The match result is accepted and stored, but writing the next bracket slot fails. The match result remains authoritative; the slot transition is visibly pending and no later match may start yet. What outcome should the operation expose after the collaborator fails?

Nearest alternative: Erase the accepted result when the slot write fails, then ask the official to submit it again.

The committed-versus-pending outcome remains the same primary decision. The key was shortened to state that outcome without restating every case fact; i010 no longer asserts an unstated access-check architecture.

## ood-n08-b08-i005

Expose the committed local/external effect accurately and represent collaborator failure at its actual commit boundary.

Decisive case fact: In A returns inspection workflow, Inspection findings commit before a separate refund review begins. If refund review fails, the submitted findings remain immutable and the refund result is pending. What outcome should the operation expose after the collaborator fails?

Nearest alternative: Edit the inspection findings to make them pass refund review after the review service fails.

The committed-versus-pending outcome remains the same primary decision. The key was shortened to state that outcome without restating every case fact; i010 no longer asserts an unstated access-check architecture.

## ood-n08-b08-i006

Expose the committed local/external effect accurately and represent collaborator failure at its actual commit boundary.

Decisive case fact: In A research-notebook platform, A job writes a complete output file, then catalog publication fails. The file is still private until the catalog points to it; the run must report publication failure without exposing the output. What outcome should the operation expose after the collaborator fails?

Nearest alternative: Publish the output file directly to readers before the catalog registration succeeds.

The committed-versus-pending outcome remains the same primary decision. The key was shortened to state that outcome without restating every case fact; i010 no longer asserts an unstated access-check architecture.

## ood-n08-b08-i007

Expose the committed local/external effect accurately and represent collaborator failure at its actual commit boundary.

Decisive case fact: In A collaborative annotation workspace, The comment is accepted with author and revision. Notification delivery fails afterward; the comment remains accepted, while delivery is separately retryable. What outcome should the operation expose after the collaborator fails?

Nearest alternative: Delete the comment because the author did not receive a notification.

The committed-versus-pending outcome remains the same primary decision. The key was shortened to state that outcome without restating every case fact; i010 no longer asserts an unstated access-check architecture.

## ood-n08-b08-i008

Expose the committed local/external effect accurately and represent collaborator failure at its actual commit boundary.

Decisive case fact: In A mobile field-inspection app, Upload chunks are staged, but the final checksum has not passed. The server must not mark the inspection complete; it can keep the upload retryable and identify the staged attempt. What outcome should the operation expose after the collaborator fails?

Nearest alternative: Mark the inspection complete after the first chunk and repair missing fields on a later upload.

The committed-versus-pending outcome remains the same primary decision. The key was shortened to state that outcome without restating every case fact; i010 no longer asserts an unstated access-check architecture.

## ood-n08-b08-i009

Expose the committed local/external effect accurately and represent collaborator failure at its actual commit boundary.

Decisive case fact: In A digital invoice exchange, The exchange may accept an invoice, but the response connection can fail before the client receives the acknowledgement. The local outcome is unknown until the operation is reconciled; it is not safe to label it rejected. What outcome should the operation expose after the collaborator fails?

Nearest alternative: Mark the invoice rejected as soon as the response read fails.

The committed-versus-pending outcome remains the same primary decision. The key was shortened to state that outcome without restating every case fact; i010 no longer asserts an unstated access-check architecture.

## ood-n08-b08-i010

Expose the committed local/external effect accurately and represent collaborator failure at its actual commit boundary.

Decisive case fact: In A smart-building access controller, Revocation commits at the badge authority. A door update service then fails to refresh its copy; until it confirms the authority's current revision, it must not claim that the revocation reached that door. What outcome should the operation expose after the collaborator fails?

Nearest alternative: Undo the revocation because one door's cache update failed.

The committed-versus-pending outcome remains the same primary decision. The key was shortened to state that outcome without restating every case fact; i010 no longer asserts an unstated access-check architecture.

## ood-n08-b08-i011

Expose the committed local/external effect accurately and represent collaborator failure at its actual commit boundary.

Decisive case fact: In A package-label generation service, A physical label prints successfully, then saving its audit record fails. The printed label cannot be unprinted; the job must report printed-but-audit-pending and retain the shipment revision it used. What outcome should the operation expose after the collaborator fails?

Nearest alternative: Report the whole print failed and print a second label immediately.

The committed-versus-pending outcome remains the same primary decision. The key was shortened to state that outcome without restating every case fact; i010 no longer asserts an unstated access-check architecture.

## ood-n08-b08-i012

Expose the committed local/external effect accurately and represent collaborator failure at its actual commit boundary.

Decisive case fact: In A multi-tenant rehearsal scheduler, A move reserves the destination and commits the new booking, but release of the old room fails. The move operation must expose the new booking plus an old-room cleanup pending state; other rooms remain available. What outcome should the operation expose after the collaborator fails?

Nearest alternative: Delete the new booking because the old-room release failed after commit.

The committed-versus-pending outcome remains the same primary decision. The key was shortened to state that outcome without restating every case fact; i010 no longer asserts an unstated access-check architecture.

## ood-n08-b08-i013

Expose the committed local/external effect accurately and represent collaborator failure at its actual commit boundary.

Decisive case fact: In A museum exhibit controller, The controller records maintenance mode before sending a hardware stop command. If the stop command fails, unsafe commands remain rejected and the hardware action is explicitly pending. What outcome should the operation expose after the collaborator fails?

Nearest alternative: Restore running mode when the hardware stop call fails, even though the safety state was already committed.

The committed-versus-pending outcome remains the same primary decision. The key was shortened to state that outcome without restating every case fact; i010 no longer asserts an unstated access-check architecture.

## ood-n08-b08-i014

Expose the committed local/external effect accurately and represent collaborator failure at its actual commit boundary.

Decisive case fact: In A video-learning library, The lesson availability change and progress mapping are prepared together. If the mapping check fails before publication, the current lesson remains available and progress continues on the same identity. What outcome should the operation expose after the collaborator fails?

Nearest alternative: Hide the lesson first, then let a later job guess how progress should map.

The committed-versus-pending outcome remains the same primary decision. The key was shortened to state that outcome without restating every case fact; i010 no longer asserts an unstated access-check architecture.

## ood-n08-b08-i015

Expose the committed local/external effect accurately and represent collaborator failure at its actual commit boundary.

Decisive case fact: In A shared whiteboard application, The export file is complete, but adding its index entry fails. The live board remains active; users must be told the export exists as an unindexed result rather than as a completed history listing. What outcome should the operation expose after the collaborator fails?

Nearest alternative: Close the board because the export index write failed.

The committed-versus-pending outcome remains the same primary decision. The key was shortened to state that outcome without restating every case fact; i010 no longer asserts an unstated access-check architecture.

## ood-n08-b08-i016

Expose the committed local/external effect accurately and represent collaborator failure at its actual commit boundary.

Decisive case fact: In A customer-support escalation desk, The escalation command commits assignee and deadline together. A later email notification fails; ownership and deadline remain committed, while the notification is pending. What outcome should the operation expose after the collaborator fails?

Nearest alternative: Restore the former assignee because the email was not sent.

The committed-versus-pending outcome remains the same primary decision. The key was shortened to state that outcome without restating every case fact; i010 no longer asserts an unstated access-check architecture.

## ood-n08-b08-i017

Expose the committed local/external effect accurately and represent collaborator failure at its actual commit boundary.

Decisive case fact: In A regional produce marketplace, Price and stock are validated and published together. A search-index update then fails; buyers use the catalog revision, and indexing is a pending projection rather than the publication commit. What outcome should the operation expose after the collaborator fails?

Nearest alternative: Roll back price and stock because the index did not refresh.

The committed-versus-pending outcome remains the same primary decision. The key was shortened to state that outcome without restating every case fact; i010 no longer asserts an unstated access-check architecture.

## ood-n08-b08-i018

Expose the committed local/external effect accurately and represent collaborator failure at its actual commit boundary.

Decisive case fact: In A repair-parts marketplace, Both vendor checks pass and the split is committed under the original request. A later notification to one vendor fails; the split and delivery promise remain accepted, while that notice is pending. What outcome should the operation expose after the collaborator fails?

Nearest alternative: Undo the committed split and restore the original request because one notification failed.

The committed-versus-pending outcome remains the same primary decision. The key was shortened to state that outcome without restating every case fact; i010 no longer asserts an unstated access-check architecture.
