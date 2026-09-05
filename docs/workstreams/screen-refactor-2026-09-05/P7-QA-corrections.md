# P7 QA corrections

Status: correction source stable in the shared checkout; no commit created.

Model: `gpt-5.6-luna`

Effort: `max`

## Pre-change validation

The correction scored 0.88 for consistency, 0.89 for simplicity, 0.84 for risk, and 0.88 for maintainability. The minimum score is 0.84, above the required 0.80 threshold. The scope is limited to the provider preparation rejection, truthful account-state presentation, and the requested regression coverage.

## Confirmed findings and constraints

- `prepareAccountSignOut` reads the durable account sync marker before its internal guarded catch. A storage read or lifecycle-state initialization failure can therefore reject after the provider has published `signingOut`; the outer command catch returned a failure while leaving that state active.
- The provider already owns the generation, UID, and account-binding guards. The correction keeps those guards and restores the prior authenticated state before returning an explicit failure. Firebase sign-out, session revocation, and local cleanup remain after successful preparation only.
- A synced `AccountDataSession` can still carry `lastFailureCode`, `pendingMutationCount`, or `blockingConflictCode` in a provider fixture or after a failed account command. Those fields make the management view misleading unless they enter the existing recovery presentation.
- `verificationPending` and `guestAccessBlocked` are distinct provider states and need distinct Settings presentation statuses and copy. Neither should promise sync, retry, or sign-out behavior through a generic sync message.

## Changes

- Added `restoreAuthenticatedAfterSignOutFailure` and `normalizeAccountSignOutPreparationFailure` to the account provider. The sign-out command catches preparation rejection, checks the existing generation/UID guard, restores authenticated state, preserves an existing binding mismatch, and maps generic local storage failures to the existing `localDeletionFailure` contract.
- Added an injected `ACCOUNT_SYNC` read-failure/retry lifecycle test that proves the first attempt performs no remote revoke or local clear and the retry completes successfully.
- Tightened Settings account mapping so synced data with any durable failure, pending mutation, or blocking conflict is `attention`. Verification-pending and blocked guest access now have separate typed statuses and localized copy.
- Restricted account management to healthy synced data. The existing AccountEntry recovery presentation now handles metadata warnings and can show retryable pending, conflict, or failure states without presenting the management description as if synchronization were healthy.
- Added provider wiring/state-restoration assertions and expanded the account presentation matrix tests. Existing P6/P7 source edits remain in place.

## Files

- `src/application/account/AccountSessionProvider.tsx`
- `src/application/account/accountIdentityComposition.test.ts`
- `src/application/account/accountLifecycle.test.ts`
- `src/features/account/AccountEntryScreen.tsx`
- `src/features/home/tabs/SettingsTab.tsx`
- `src/features/home/tabs/settingsAccountPresentation.ts`
- `src/features/home/tabs/settingsAccountPresentation.test.ts`
- `src/locales/en/settings.json`
- `src/locales/pl/settings.json`
- `src/preferences/settingsPresentation.test.ts`
- `docs/workstreams/screen-refactor-2026-09-05/P7-QA-corrections.md`

No backend, Firebase client, storage implementation, deletion, recovery-code, navigation-guard, or native file was changed for this correction.

## Verification

- `node --import tsx --test src/features/home/tabs/settingsAccountPresentation.test.ts src/application/account/accountIdentityComposition.test.ts src/application/account/accountLifecycle.test.ts src/preferences/settingsPresentation.test.ts src/i18n/i18nLocaleParity.test.ts` — **62/62 passed**.
- `npm run typecheck` — **passed**.
- `git diff --check` — **passed**.

Full `npm test`, `npm run qa:static`, native flows, and commits remain parent owned by request.
