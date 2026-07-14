# 08 — Storage and Offline

## Target

Patternly is offline-first with MMKV as the only persistence engine. Infrastructure imports MMKV once and creates one client. Repository implementations are the only read/write boundary. Static content is bundled and versioned; user data is local canonical state.

Delete old keys, local records, read/write APIs, and Cloud write-through. Do not preserve historical sessions, attempts, review, progress, or developer data. Do not implement historical data migration, record repair, translation, or AsyncStorage reads. `contentVersion` identifies the active bank and does not permit historical explanation or item reconstruction.

## Required recovery rule

If an existing model, record, flow, or module cannot be moved into the canonical structure without preserving obsolete semantics, delete it. Do not create fallbacks, translators, compatibility adapters, or parallel paths. Backward compatibility is not required for pre-production storage, content, or runtime models. An explicit runtime failure is a valuable signal that migration work remains; it must not be hidden by substituting defaults or reading the old system.

## Session persistence

Persist a session before its first item appears. Only one active session exists. Persist item order, shuffled option order, active foreground time for practice, mode/configuration, and active content version. Do not persist an unsubmitted current selection. Abandoned sessions do not appear in history, while already committed attempts remain. A content mismatch blocks resume with an explicit error.

## Hybrid durable journal

Submit follows this order:

```txt
validate and freeze
→ build deterministic attempt/session/review outcome
→ persist durable mutation journal
→ show feedback or transition
→ materialize canonical records
→ verify materialization and clear journal
```

No feedback or advance occurs before journal durability. Retry is idempotent. After force-close, recovery completes a journaled operation. It does not display partial-success copy and does not use an old store.

## Reset, errors, and privacy

Reset deletes local canonical learning records. Storage failure, unknown ID, unsupported payload, missing content, and content mismatch are explicit errors. Future policy for corrupt canonical MMKV records is a separate pre-release decision; it must never heuristically alter scoring or review semantics. Local-only storage minimizes personal data and there is no export/import contract in this recovery scope.
