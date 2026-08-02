# Patternly account lifecycle design

## Authority and status

- Design reference: `account-lifecycle-001`
- Status: `APPROVED` — focused transition, controller inspection and repeated
  independent QA completed on 2026-08-01 with verdict `pass`.
- Owner: `product-owner`
- Authority: owner authorization recorded on 2026-08-01 permits derivation now
  and permits `APPROVED` only after every acceptance criterion is met,
  controller inspection passes and independent QA returns `pass`. Candidate
  review supplied that evidence before this status transition; the transition
  itself then passed controller inspection and repeated independent QA.
- Visual source: `docs/designs/product-direction-options/option-3.png` — Quiet
  Layered, selected by `PO-009`.
- Composite reference:
  `docs/designs/account_lifecycle/account-lifecycle-reference.png`.

This document is the account-lifecycle design authority for copy, coverage and
behavior. The raster is a representative hierarchy and archetype reference; it
does not replace the complete matrix below. It does not implement runtime UI.

## Visual system

Account surfaces extend Quiet Layered without creating a second shell: near-
black navy foundations, restrained translucent cards, cool-gray borders,
off-white text, violet focus/primary emphasis, amber attention and red only for
destructive meaning. Layout uses generous vertical space and one dominant
action per state. Before account bootstrap there is no bottom navigation.

Dark and light appearances use the existing semantic theme tokens rather than
literal raster colors. Light appearance preserves the same hierarchy and
contrast roles; it does not invert destructive or attention meaning.

## Archetypes

| Archetype | Responsibility | Dominant action rule |
| --- | --- | --- |
| `entry` | Explain why an account is required and route to account creation or sign-in. | One filled continuation action; the alternate path is a text link. |
| `form` | Collect email, password or confirmation input with field-level feedback. | One filled submit action; help/recovery is secondary. |
| `action-link` | Explain and complete verification, reset or possession-link work. | One action for the current token state; expired/used states offer one safe restart. |
| `operation` | Show truthful pending, offline or remote operation state. | No action while irreversible work is progressing; otherwise one retry/recovery action. |
| `conflict` | Preserve both verified sources and request an explicit resolution. | One review/continue action; no implicit overwrite or default choice. |
| `destructive` | State exact scope and require explicit confirmation. | One destructive action after confirmation; cancel remains secondary. |
| `result` | Report only a verified terminal outcome. | One next-step action where a next step exists; never report success early. |

## Exact canonical surface and state matrix

The identifiers and ordering in this table exactly mirror
`accountData.surfaces` in the canonical contract.

| # | Surface | Archetype(s) | Canonical states |
| ---: | --- | --- | --- |
| 1 | `accountEntry` | `entry`, `operation` | `required`, `offlineUnavailable` |
| 2 | `register` | `form`, `operation` | `editing`, `invalidInput`, `duplicateIdentity`, `rateLimited`, `offline`, `remoteFailure` |
| 3 | `verifyIdentity` | `action-link`, `form`, `operation`, `result` | `pending`, `resendPending`, `resendAccepted`, `changePendingEmail`, `changePendingEmailAccepted`, `invalidInput`, `duplicateIdentity`, `invalidLink`, `expiredLink`, `usedLink`, `rateLimited`, `offline`, `remoteFailure` |
| 4 | `signIn` | `form`, `operation` | `editing`, `invalidCredential`, `unverifiedIdentity`, `rateLimited`, `offline`, `remoteFailure` |
| 5 | `forgotPassword` | `form`, `operation`, `result` | `editing`, `acceptedNonEnumerating`, `invalidInput`, `rateLimited`, `offline`, `remoteFailure` |
| 6 | `resetPassword` | `action-link`, `form`, `operation`, `result` | `editing`, `invalidInput`, `invalidLink`, `expiredLink`, `usedLink`, `rateLimited`, `offline`, `remoteFailure`, `success` |
| 7 | `sessionExpiredReauthentication` | `form`, `operation` | `required`, `invalidCredential`, `revokedSession`, `rateLimited`, `offline`, `remoteFailure` |
| 8 | `accountProfile` | `operation` | `ready`, `offline`, `remoteFailure`, `journalRecoveryFailure` |
| 9 | `dataAdoption` | `operation`, `conflict`, `result` | `preview`, `uploading`, `restoring`, `activeSessionChoice`, `integrityConflict`, `adoptionConflict`, `offline`, `remoteFailure`, `completed` |
| 10 | `syncStatus` | `operation`, `conflict`, `result` | `initialSyncRequired`, `syncing`, `synced`, `offlinePending`, `conflict`, `failed`, `deletionPending`, `offline`, `remoteFailure`, `journalRecoveryFailure`, `localDeletionFailure`, `remoteAccountDeleted` |
| 11 | `signOut` | `destructive`, `operation`, `result` | `confirm`, `journalRecoveryFailure`, `pendingSyncRequiresNetwork`, `exportRequired`, `deletingLocal`, `localDeletionFailure`, `completed` |
| 12 | `deleteAccount` | `destructive`, `form`, `operation`, `result` | `scopeConfirmation`, `journalRecoveryFailure`, `reauthenticationRequired`, `deleting`, `rateLimited`, `offline`, `remoteFailure`, `deletionVerificationFailure`, `completed` |
| 13 | `publicDeleteRequest` | `form`, `action-link`, `operation`, `result` | `request`, `acceptedNonEnumerating`, `verifyPossession`, `invalidLink`, `expiredLink`, `usedLink`, `rateLimited`, `offline`, `remoteFailure`, `completed` |

## Exact operational copy map

Quoted text is the stable English copy. An em dash introduces the single
primary action. In-progress rows marked “no action” cannot offer navigation or
retry until the operation resolves. Validation owned by one field is rendered
beside that field; remote or form-wide failure is rendered once above the field
group and never assigned to the password or email field.

| Surface | State-to-copy rule |
| --- | --- |
| `accountEntry` | `required`: “Your practice starts with an account.” — “Continue”; secondary “Sign in”. `offlineUnavailable`: “Account setup needs a connection.” — “Try again”. |
| `register` | `editing`: “Create account” — “Create account”. `invalidInput`: “Check the highlighted fields.” — “Create account”. `duplicateIdentity`: “An account already exists for this email.” — “Sign in”; secondary “Reset password”. `rateLimited`: “Too many attempts. Try again later.” — “Try again”. `offline`: “You're offline. Connect to create an account.” — “Try again”. `remoteFailure`: “Account creation failed.” — “Try again”. |
| `verifyIdentity` | `pending`: “Check your email to verify your account.” — “Resend email”; secondary “Change email”. `resendPending`: “Sending a new link…” — no action. `resendAccepted`: “A new verification link was sent.” — “Done”. `changePendingEmail`: “Change email” — “Update email”. `changePendingEmailAccepted`: “Email updated. Check your inbox.” — “Done”. `invalidInput`: “Enter a valid email.” — “Update email”. `duplicateIdentity`: “An account already exists for this email.” — “Sign in”. `invalidLink`: “This verification link is invalid.” — “Send a new link”. `expiredLink`: “This verification link has expired.” — “Send a new link”. `usedLink`: “This verification link was already used.” — “Sign in”. `rateLimited`: “Too many attempts. Try again later.” — “Try again”. `offline`: “You're offline. Connect to verify your account.” — “Try again”. `remoteFailure`: “Verification failed.” — “Try again”. |
| `signIn` | `editing`: “Sign in” — “Sign in”; secondary “Forgot password?”. `invalidCredential`: “Email or password is incorrect.” — “Sign in”. `unverifiedIdentity`: “Verify your email before signing in.” — “Resend email”. `rateLimited`: “Too many attempts. Try again later.” — “Try again”. `offline`: “You're offline. Connect to sign in.” — “Try again”. `remoteFailure`: “Sign-in failed.” — “Try again”. |
| `forgotPassword` | `editing`: “Reset password” — “Send reset link”. `acceptedNonEnumerating`: “If an account exists, we'll send a reset link.” — “Done”. `invalidInput`: “Enter a valid email.” — “Send reset link”. `rateLimited`: “Too many attempts. Try again later.” — “Try again”. `offline`: “You're offline. Connect to request a reset.” — “Try again”. `remoteFailure`: “Reset request failed.” — “Try again”. |
| `resetPassword` | `editing`: “Choose a new password” — “Update password”. `invalidInput`: “Check the highlighted fields.” — “Update password”. `invalidLink`: “This reset link is invalid.” — “Request a new link”. `expiredLink`: “This reset link has expired.” — “Request a new link”. `usedLink`: “This reset link was already used.” — “Request a new link”. `rateLimited`: “Too many attempts. Try again later.” — “Try again”. `offline`: “You're offline. Connect to reset your password.” — “Try again”. `remoteFailure`: “Password update failed.” — “Try again”. `success`: “Password updated. Sign in again.” — “Sign in”. |
| `sessionExpiredReauthentication` | `required`: “Your session expired. Sign in again.” — “Sign in”. `invalidCredential`: “Password is incorrect.” — “Sign in”. `revokedSession`: “This session is no longer active. Sign in again.” — “Sign in”. `rateLimited`: “Too many attempts. Try again later.” — “Try again”. `offline`: “Connect to confirm your account.” — “Try again”. `remoteFailure`: “Account confirmation failed.” — “Try again”. |
| `accountProfile` | `ready`: “Account” — no forced action. `offline`: “You're offline. Account changes are unavailable.” — “Try again”. `remoteFailure`: “Account details couldn't be loaded.” — “Try again”. `journalRecoveryFailure`: “Recover saved work before changing account data.” — “Recover”. |
| `dataAdoption` | `preview`: “Review your account data.” — “Continue”. `uploading`: “Uploading this device's data…” — no action. `restoring`: “Restoring cloud data…” — no action. `activeSessionChoice`: “Choose which active session to keep.” — “Review sessions”. `integrityConflict`: “This data cannot be combined safely.” — “Review conflict”. `adoptionConflict`: “Choose how to resolve this data conflict.” — “Review conflict”. `offline`: “Connect to finish account setup.” — “Try again”. `remoteFailure`: “Account data setup failed.” — “Try again”. `completed`: “Account data is ready.” — “Continue”. |
| `syncStatus` | `initialSyncRequired`: “Sync required.” — “Sync now”. `syncing`: “Syncing…” — no action. `synced`: “Synced” — no forced action. `offlinePending`: “Changes are waiting for a connection.” — “Try again”. `conflict`: “Changes on this device and cloud data do not match.” — “Review conflict”. `failed`: “Sync failed.” — “Try again”. `deletionPending`: “Finishing account deletion…” — no action. `offline`: “You're offline.” — “Try again”. `remoteFailure`: “Sync service is unavailable.” — “Try again”. `journalRecoveryFailure`: “Recover saved work before syncing.” — “Recover”. `localDeletionFailure`: “Local account data couldn't be removed.” — “Try again”. `remoteAccountDeleted`: “This account was deleted on another device.” — “Remove local data”. |
| `signOut` | `confirm`: “Sign out and remove account data from this device?” — “Sign out”; secondary “Cancel”. `journalRecoveryFailure`: “Recover saved work before signing out.” — “Recover”. `pendingSyncRequiresNetwork`: “Connect to sync pending changes before signing out.” — “Sync now”. `exportRequired`: “Export pending changes before signing out.” — “Export data”; the verified-handoff and separate discard sequence below is mandatory. `deletingLocal`: “Removing account data from this device…” — no action. `localDeletionFailure`: “Local account data couldn't be removed.” — “Try again”. `completed`: “Signed out.” — “Continue”. |
| `deleteAccount` | `scopeConfirmation`: “Deletes your identity, sessions, profile, learning data, and sync operations.” plus “Type DELETE to confirm” — “Delete account”; secondary “Cancel”. `journalRecoveryFailure`: “Recover saved work before deleting your account.” — “Recover”. `reauthenticationRequired`: “Confirm your account before deletion.” — “Continue”. `deleting`: “Deleting account…” — no action. `rateLimited`: “Too many attempts. Try again later.” — “Try again”. `offline`: “Connect to delete your account.” — “Try again”. `remoteFailure`: “Account deletion failed.” — “Try again”. `deletionVerificationFailure`: “Deletion could not be verified.” — “Try again”. `completed`: “Account deleted.” — “Continue”. |
| `publicDeleteRequest` | `request`: “Delete an account without signing in” — “Send deletion link”. `acceptedNonEnumerating`: “If an account exists, we'll send a deletion link.” — “Done”. `verifyPossession`: “Deletes your identity, sessions, profile, learning data, and sync operations.” plus “Type DELETE to confirm” — “Delete account”; secondary “Cancel”. `invalidLink`: “This deletion link is invalid.” — “Request a new link”. `expiredLink`: “This deletion link has expired.” — “Request a new link”. `usedLink`: “This deletion link was already used.” — “Request a new link”. `rateLimited`: “Too many attempts. Try again later.” — “Try again”. `offline`: “Connect to request account deletion.” — “Try again”. `remoteFailure`: “Deletion request failed.” — “Try again”. `completed`: “Account deleted.” — “Continue”. |

## Semantic completeness requirements

### `accountProfile.ready`

The one Account screen presents these rows in this order without creating a
second settings surface:

1. **Identity:** the verified email address in human-readable display form and
   the label “Verified”. Internal account identifiers are never shown.
2. **Sync:** a human-readable current status, “Last synced” date/time from
   `lastSuccessfulSyncAt`, and the pluralized waiting-change count from
   `pendingMutationCount`. Conflict or failure detail follows the translation
   rules below.
3. **Security:** “Email verified” and “Session active on this device”. A
   reauthentication requirement is rendered by its canonical surface rather
   than invented as a profile action.
4. **Account actions:** “Sign out” opens `signOut.confirm`; “Delete account” is
   visually separated, destructive, and opens `deleteAccount.scopeConfirmation`.

### `dataAdoption.preview`

Every preview shows two labelled summaries—“This device” and “Cloud”—with
human-readable record counts, active-session presence and the last verified
activity available from each dataset. Missing data is shown as “No data”; raw
record IDs or revisions are not shown. The result and confirmation are fixed by
the canonical case:

| Canonical case | Local / remote summary | Required preview result and confirmation |
| --- | --- | --- |
| `emptyLocalEmptyRemote` | No data / no data | `createBoundEmptyDataset`: “Start with an empty account” — “Continue”. |
| `populatedLocalEmptyRemote` | Local data / no cloud data | `previewThenUploadExactLocalDataset`: state that this device's exact dataset will be uploaded — “Upload device data”. |
| `emptyLocalPopulatedRemote` | No local data / cloud data | `previewThenRestoreExactRemoteDataset`: state that the exact cloud dataset will be restored — “Restore cloud data”. |
| `populatedLocalPopulatedRemote` | Local data / cloud data | `previewThenReconcileByRecordPolicy`: show both summaries and the resulting add/keep/block groups before — “Review and continue”. |
| `activeSessionOnOneSide` | Mark the one side with an active session | `preserveThatSessionAndRejectSecondActiveSession`: name the preserved side and state that a second active session cannot be created — “Keep active session”. |
| `divergentActiveSessions` | Show both active sessions as “This device session” and “Cloud session”, with human-readable track/progress where available | `requireExplicitSessionChoiceAndConfirmedAbandonmentOfOtherDraft`: require the learner to select one, then show a separate confirmation naming the other draft that will be abandoned — “Keep selected session”; no preselected winner. |
| `divergentRecord` | Identify the affected human-readable data category on both sides | `applyRecordPolicyOrBlockWithoutMutation`: state the deterministic result when allowed or block without mutation — “Continue” or “Back”. |

Cancelling or failing any preview retains both last verified datasets unchanged.
No preview overwrites, uploads, restores, abandons or merges before its explicit
confirmation.

### `syncStatus` evidence

Every sync presentation includes the current human-readable state and renders
all declared evidence when available:

- `lastSuccessfulSyncAt`: “Last synced {localized date and time}”; when absent,
  “Not synced yet”.
- `pendingMutationCount`: “No changes waiting”, “1 change waiting” or
  “{count} changes waiting”.
- `blockingConflictCode`: translate through the bounded presentation map to a
  learner-facing conflict reason and next action.
- `lastFailureCode`: translate through the bounded presentation map to a
  learner-facing failure reason and retry/recovery action.

Raw `blockingConflictCode`, `lastFailureCode`, record IDs, revisions and stack
details never appear in visible text, accessibility text or diagnostics shown
to the learner. The Account sync row uses this same evidence presentation.

### `signOut.exportRequired`

The whole sequence remains inside the canonical `exportRequired` state and does
not add lifecycle states:

1. Present “Export pending changes before signing out.” with only “Export data”.
2. Treat export as complete only after the canonical file handoff and integrity
   verification succeed. A share sheet opening or export attempt is not success.
3. After verified handoff, show “Export complete.” and separately offer
   “Discard pending changes”.
4. That action opens a new confirmation within the same state: “Discard pending
   changes and sign out?” — “Discard and sign out”; secondary “Cancel”.
5. Cancellation or any export/discard failure keeps the account binding and
   verified data. Pending changes are never silently discarded.

### Possession-verified public deletion

`publicDeleteRequest.verifyPossession` repeats the exact authenticated deletion
scope—“Deletes your identity, sessions, profile, learning data, and sync
operations.”—before the same explicit `DELETE` confirmation and destructive
action. Possession verification does not reduce scope or imply early success.

## Disclosure boundary

- `forgotPassword.acceptedNonEnumerating` and
  `publicDeleteRequest.acceptedNonEnumerating` use the same accepted wording
  whether or not an account exists. No adjacent title, timing, action or error
  reveals existence.
- `register.duplicateIdentity` may say that an account already exists and route
  to sign-in or recovery.
- `signIn.unverifiedIdentity` is shown only after valid credentials establish
  the pending-verification identity. Invalid credentials use only
  `invalidCredential` copy.
- Verification, reset and deletion link errors identify token state, not
  whether an unverified email address exists in the service.
- Passwords, tokens, normalized email and private learning content never appear
  in diagnostics, result details or support copy.

## One form-field anatomy

Every email, password and confirmation field uses one anatomy in this order:

1. Persistent visible label; placeholder never substitutes for the label.
2. Input container with semantic surface/border tokens and a violet focus ring.
3. Secure input control where required; password reveal has an accessible name,
   a target of at least 48 by 48 logical pixels, and does not change value or
   focus.
4. Platform autofill/content type: email address, new password, current password
   or one-time code according to the command; password-manager paste and
   generated passwords remain supported. This does not add a username identity.
5. Optional helper text below the input.
6. Inline error below the same field with error color plus text; color is never
   the only signal.
7. On submit, focus moves to the first invalid field and the error is announced.

Labels, inputs, reveal controls and errors have unique accessibility names and
relationships. Inputs never clear after a remote failure unless the canonical
security boundary requires clearing a password.

### Field validation versus form failure

- Required/format/confirmation validation owned by one input is inline below
  that field, sets its error relationship and moves focus to it on submit.
- `signIn.invalidCredential`, `remoteFailure`, `rateLimited` and form-wide
  offline failures use one restrained error banner between the heading and the
  first field. The banner is announced as an alert and does not mark Email or
  Password invalid.
- `unverifiedIdentity`, duplicate identity and other declared operational
  outcomes use their form-level state content; they are not disguised as field
  validation.
- A remote/form error is rendered once. It is never duplicated in a banner and
  under a field.

## Layout and accessibility

- Small phone: one column, 24 px outer inset where available, no horizontal
  scrolling, form and primary action remain visible through vertical scrolling.
- Large text: content reflows without truncation; buttons grow vertically;
  labels, errors and destructive scope never clamp. At the largest supported
  size, secondary links move below the primary action.
- Keyboard: focused input and inline error remain visible; the layout uses
  keyboard avoidance and scroll-to-focus, and submit remains reachable without
  obscuring the final field.
- Focus: initial focus is on the heading, not a destructive control; validation
  moves focus to the first invalid field; modal conflict/destructive flows trap
  focus and return it to their invoker.
- Touch targets: all controls are at least 48 by 48 logical pixels with at least
  8 px separation. Text links receive padded hit areas.
- Contrast: text, focus, error and destructive states meet WCAG AA in both dark
  and light appearance; focus and state are not expressed by color alone.
- Motion: pending indicators respect reduced motion and never imply completion.

## Secondary Fitaly consistency evidence

Fitaly is a read-only, non-authoritative interaction reference. Static source
was sufficient; CoreSimulatorService is unavailable in this sandbox and no
Fitaly runtime was started. The comparison used:

- `../../Fitaly/fitaly/src/feature/Auth/components/AuthScreenLayout.tsx`
- `../../Fitaly/fitaly/src/feature/Auth/screens/LoginScreen.tsx`
- `../../Fitaly/fitaly/src/components/TextInput.tsx`
- `../../Fitaly/fitaly/src/components/FormScreenShell.tsx`
- `../../Fitaly/fitaly/src/feature/UserProfile/screens/DeleteAccountScreen.tsx`
- the referenced Fitaly theme spacing and typography definitions

Adopted interaction principles, expressed through Patternly primitives:

- persistent labels, optional helper text and inline validation owned by one
  field;
- secure reveal target of at least 44 logical pixels (Patternly requires 48),
  accessible naming and stable focus;
- platform autofill/content types and password-manager support;
- keyboard-aware scrolling and compact behavior that retain the focused field
  and submit action;
- safe-area-aware action placement that keeps the dominant action reachable;
- one form-level error banner for remote login failure;
- an explicit destructive `InfoBlock` before confirmation.

Rejected divergences are Fitaly's brand, olive/terracotta palette, ornament,
username and Terms fields, account-revealing reset behavior, exact copy and
backend-specific behavior. Patternly imports no Fitaly source, token,
dependency, copy or runtime convention.

## Task 2 primitive reuse

| Existing owner | Account usage |
| --- | --- |
| `Screen` | Safe area, page background and the single page-scroll owner. |
| `AppShellHeader` | Patternly identity and explicit back destination after entry; no new branded header. |
| `Card` | Layered form, attention, conflict and destructive grouping. |
| `Button` | Primary, secondary and destructive actions using the existing variants. |
| `InfoBlock` | Bounded warning, error and recovery explanation. |
| `LoadingState` | Non-destructive pending operations; destructive operations use the same busy semantics without a success claim. |
| `Icon` / existing assets | Existing cloud, alert, shield, close and trash symbols; no new icon language. |
| semantic theme tokens | Spacing, radius, type, color and appearance adaptation. |

`BottomTabBar` is deliberately absent until verified account bootstrap and
required data adoption finish. Shared primitives and navigation keep their
`focus-lab-core-shell-001` ownership; this design reference is not relabelled as
their owner.

## Completion and non-goals

A terminal success appears only after its declared verified boundary. Offline,
rate-limit, remote failure, conflict, journal recovery and deletion-verification
states remain visible and actionable; none silently falls back to success.

This package does not define legal terms, consent, marketing claims, another
identity method, another lifecycle state, runtime source, route, backend,
provider behavior, feature ownership mapping or alternate style direction.
The design content and raster are unchanged by approval finalization. Candidate
controller inspection and independent QA passed before the status transition;
controller inspection and repeated independent QA of the focused finalization
also passed.
