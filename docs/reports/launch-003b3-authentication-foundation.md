# Launch 003B-3 — Firebase Authentication foundation

**Date:** 2026-08-01  
**Status:** complete; independent QA `pass`  
**Controller decision:** `pass`

## Authorization and scope

`PO-023` authorizes standard Firebase Authentication in
`patternly-app-sandbox` and `patternly-app-production` with email/password and
improved email privacy only. Identity Platform, billing, Firebase app
registration, users and every other provider or cloud service remain excluded.

## External operation

After the documented initialization blocker, the owner completed the standard
Firebase Authentication provider setup manually for both exact projects. The
closure worker did not mutate cloud state; it performed only sanitized,
read-only verification.

Before that owner operation, one narrowly masked Admin v2 `projects.updateConfig`
attempt against sandbox returned `404 CONFIGURATION_NOT_FOUND`. It did not
create a config or any resource, and production did not receive an update.

## Sanitized post-operation evidence

The evidence collector selected only named booleans, enum values and counts. It
did not print or persist `hashConfig`, `signerKey`, API keys, tokens, credentials
or other secret-bearing fields.

| Check | `patternly-app-sandbox` | `patternly-app-production` |
| --- | --- | --- |
| Auth config subtype | `FIREBASE_AUTH` | `FIREBASE_AUTH` |
| Email sign-in | enabled | enabled |
| Password required | `true` | `true` |
| Improved email privacy | `true` | `true` |
| Anonymous sign-in | disabled | disabled |
| Phone sign-in | disabled | disabled |
| Duplicate email identities | disabled | disabled |
| MFA state / providers | `DISABLED` / `0` | `DISABLED` / `0` |
| Blocking-function triggers | `0` | `0` |
| Multi-tenancy allowed | `false` | `false` |
| Default social providers | `0` | `0` |
| OIDC providers | `0` | `0` |
| SAML providers | `0` | `0` |
| Users (`maxResults=1` read) | `0`, no next page | `0`, no next page |
| Firebase apps | `0` | `0` |
| Billing | `billingEnabled: false` | `billingEnabled: false` |

The tenant-list endpoint rejects these standard `FIREBASE_AUTH` projects with
`INVALID_PROJECT_ID`; it is not used as evidence of an empty list. The config's
`multiTenant.allowTenants: false`, together with subtype `FIREBASE_AUTH`, proves
that multi-tenancy is not enabled. This report does not claim an independently
enumerated tenant list.

## Scope result

The requested provider foundation is present in both projects and remains
inside the approved no-billing boundary. No Firebase app or user was created;
no Identity Platform upgrade, billing link, social/OIDC/SAML provider, tenant,
MFA factor or blocking function is enabled. The closure worker changed only
this report, the launch completion plan and the product-owner decision register.

## Verification

- Sanitized Admin v2 reads succeeded for both exact project configs.
- Default social, OIDC and SAML list reads each returned zero entries in both
  projects.
- A one-user page read returned no users and no continuation token in either
  project.
- Fresh Firebase app-list reads returned `[]` for both projects.
- Fresh Cloud Billing reads returned `billingEnabled: false` for both projects.
- Pre-QA focused documentation checks found the expected `partial`,
  implementation-complete / QA-pending and historical-blocker markers. After
  the repeated QA pass, closure checks confirmed the final `done`, `QA pass`
  and 3B-4 first-next-task markers.
- `npm run gate:contract-change -- HEAD` passed with
  `CONTRACT_CHANGE_CHANGED_PATHS=41`.
- `git diff --check` passed.
- First independent QA: `fail` on one stale report phrase (`in review` after
  the plan had already changed to `partial`); no cloud or architecture finding.
- Repair: changed only that phrase, then reran the contract gate and diff check;
  both passed.
- Repeated independent QA: `pass`; all cloud-state, scope, documentation,
  architecture and debt criteria were accepted.
