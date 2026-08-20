# DATA-02 — Device-session remote boundary

Date: 2026-08-20  
Scope: terminal account-record validation and sync error mapping

## Scope

The canonical data contract keeps the active session pointer, draft, item
position, foreground timer, and mutation journal on the device. Terminal
learning records may be synchronized, but they must not smuggle those
device-owned fields into a remote payload.

The account-record validator now rejects those keys recursively in every
terminal payload, including nested objects and arrays. The HTTP sync boundary
maps the rejection to the closed public `400 invalid_request` response. The
existing rejection of non-terminal `trainingSession` records remains intact.

## Repository changes

- Added the canonical device-only key set and recursive validation in
  `server/src/accountData.ts`.
- Added the explicit `device_only_record_remote_sync_forbidden` service error
  mapping in `server/src/http.ts`.
- Added coverage for nested device-owned fields in terminal records in
  `tests/serverAccountAdoption.test.ts`.

No remote session owner, fallback, compatibility path, or account lifecycle
authority was introduced. This is a fail-closed boundary hardening slice;
complete mobile outbox/account integration and provider evidence remain open.

## Verification

- `npm run typecheck` — passed.
- Focused account/adoption/snapshot/canonical tests — 62/62 passed with a
  local listener.
- `npm run validate:runtime-privacy-boundary` — passed.
- `npm run gate:contract-change` — passed.
- `git diff --check` — passed.

