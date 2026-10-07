# Q13 preservation receipt revision proposal

**Status: proposal for independent review; no preservation-hook implementation is authorized by this document.** The existing exact-ref attestation tool remains unchanged in scope and version. This revision addresses one concrete evidence gap: the existing Release run cannot use the Metro inspector snapshot helper, while the Q13 acceptance still needs source-bound evidence that the same unanswered item, option order, and allowed canonical state survived the old-build resume and the new-build exact-identity rejection.

## Decision

Extend the already reviewed test-only resume observer to take one read-only preservation snapshot after the original resume operation settles. On old OOD23 `exact_resume_success`, write the old-build baseline. On OOD24 `identity_mismatch`, write the post-update snapshot. Both snapshots use that build's existing fresh nonce and current public catalog identity. A missing, unavailable, malformed, or unclassified required read produces no preservation receipt and cannot change the original resume result or error. No extra runtime command, native debugger, bootstrap, storage initialization, or storage mutation is introduced.

This is evidence from an instrumented test build. It does not claim that an unmodified Release binary ran, and it does not establish app-install identity by itself. Existing source, patch, app-tree, embedded-JS, native bundle-ID, and install records remain separately bound as the Q13 run requires.

## Source facts

- `src/infrastructure/storage/mmkvClient.ts` exposes `getKeyValueStorage()` only after storage is published; before that it throws `encrypted_storage_not_initialized`. `getActiveStorageProfileOrNull()` and `isProfileTransitionActive()` are read-only published-state checks. The helper must call these only at the already-running resume observer, never at module entry. If storage is not published or a transition is active, it stops and records no preservation receipt.
- `KeyValueStorage` exposes only `getString`, `getAllKeys`, and mutation methods. The proposal uses only `getAllKeys` and `getString`; no repository writer, bootstrap, migration, `setString`, `remove`, native MMKV export, or file-level database read is needed.
- `src/storage/keys.ts` defines the canonical key namespace and the stored session, attempt, settings, goal, plan, journal, and timer key families. `docs/active/BIZQ-01/native-partial-29/snapshot-canonical-state.mjs` provides the existing category rules and explicitly distinguishes learning progress, lifecycle, goals/plans, settings, reminders, history, account lifecycle, metadata, outbox, and unclassified keys.
- `src/infrastructure/identity/sha256.ts` provides the existing pure synchronous `sha256Utf8`. `src/infrastructure/identity/canonicalSerialization.ts` is the existing canonical serialization path for semantic projections.
- `TrainingSession` stores ordered `itemOrder`, `optionOrderByOccurrence`, `currentItemIndex`, content identity, and `activeForegroundMs` (`src/domain/learning/trainingSession.ts`). Attempt records carry responses and session identity (`src/domain/learning/trainingAttempt.ts`); draft responses are separately represented in `TrainingSessionDraft` (`src/domain/learning/trainingSessionDraft.ts`). The receipt can count attempts and persisted draft responses for the active session without emitting either identifiers or responses.
- Existing preservation reports show the concrete expected timer-only drift: envelope revision, timer `accumulatedForegroundMs`, `checkpointRevision`, `lastCheckpointAt`, and session `activeForegroundMs`. Those exact exceptions are recorded in `Q13-CACHE-CAPABILITY-PRESERVATION.json`, `SOURCE-TEXT-FIX-ACCEPTANCE-QA.md`, and `DESIGN-CONTROL-FIX-ACCEPTANCE-QA.md`. No other payload field is excluded.

## Proposed hook and read contract

The only hook site is the current generated test helper called by `TrainingLifecycleUseCases.resumeActiveSession` around the existing `resolveRuntimeForSession(session)` operation. After the operation succeeds or throws, the helper attempts a synchronous read from the already-published storage facade. Existing observation semantics stay exact: on success it returns the identical result; on failure it rethrows the same error object. Snapshot, serialization, and cache-write failures are contained at the test hook, reported only as a fixed safe stage/category, and leave the receipt absent so the runner fails closed.

The read guard requires a non-null published profile, `transitionActive === false`, a readable complete key inventory, canonical namespace keys with known classifications, and valid canonical envelopes for every record in the required categories. It does not initialize storage or retry a read. The helper reads only key names and string values in memory. It never serializes raw values, keys, profile IDs, session IDs, item or option IDs, answers, UID, credentials, manifests, or native constants into the receipt or logs.

For each required category (`active-track`, `learning-lifecycle`, `learning-progress`, `goals-and-plans`, and `user-settings`), record a sorted inventory of `{keySha256, category, present, rawValueSha256, semanticSha256}`. Hash keys with `sha256Utf8(key)` and raw strings with `sha256Utf8(raw)`. `semanticSha256` hashes a canonical serialization of the validated schema identity and payload after applying only the narrowly defined volatile-field projection below. A missing key remains represented by its hashed key and `present: false`; added or removed keys change the inventory. Hashes are evidence of equality, not a substitute for validating the active-session facts below.

Known categories outside this preservation scope remain represented in a redacted inventory by key hash and category only; account lifecycle payloads remain unread. An `unclassified-canonical-key-unread` entry blocks a whole-canonical-state claim and the helper must report that coverage gap. The report remains explicitly scoped to required categories and makes no claim about unread metadata, account lifecycle, notification APIs, or outbox values.

The active-session projection records only safe facts: active session present, public OOD track/content version/artifact hash, `actualLength`, `currentItemIndex`, status, `itemOrder.length`, `sha256Utf8` of the ordered item identity vector, and `sha256Utf8` of the ordered option-ID vectors keyed by their in-memory occurrence association. It also records the attempt count for that session, persisted draft response count, active journal present/absent, and a boolean that the required old public pin matches OOD23. For this Q13 fixture, acceptance requires a one-item active session at index zero, zero attempts, zero draft responses, no active journal, and the exact same ordered-vector digests and old session pin in both receipts. No IDs, labels, response values, or content text leave memory.

The current catalog identity already recorded by the attestation remains separate from the persisted session pin: baseline must report current OOD23, and the mismatch receipt must report current OOD24 while retaining the exact OOD23 persisted session pin. The identity-mismatch stage is still accepted only when the original resolver returns the exact current no-match error.

## Semantic comparison rules

The receipt keeps the raw-value hash to show which stored strings changed. Acceptance compares semantic hashes for required categories and treats raw-hash differences as explanatory diagnostics only when semantic equality is retained under the enumerated volatile projection.

The semantic projection may omit only:

- the canonical envelope's top-level `revision` field;
- `.payload.accumulatedForegroundMs`, `.payload.checkpointRevision`, and `.payload.lastCheckpointAt` for the `active-foreground-timer` record;
- `.payload.activeForegroundMs` for `training-session:<id>` records.

Every other field remains in the semantic hash, including `currentItemIndex`, `itemOrder`, `optionOrderByOccurrence`, content identity, attempt indexes and records, draft response facts, settings, goals, and plans. Timer exceptions apply only at these exact key/category paths; no recursive field-name stripping or general timestamp/revision deletion is allowed. A changed path outside this set is a preservation mismatch, even when the raw MMKV file differs for understandable reasons.

## Bounded future implementation and verification

If independently accepted, implementation ownership remains the existing `q13-test-attestation/` tool and generated helper only. The change must not touch product source, app configuration, native project files, schema, content, scoring, or canonical storage. The tool version and binding hash must advance. Do not touch the current isolated build checkout while its build is running. After that build completes and its hashes are recorded, a reviewed revision may be applied to a historical isolated checkout only after hash-guarding the four existing generated/instrumented files against their private binding. Restore only the owned `App.tsx` and lifecycle bytes from that checkout's exact admitted `HEAD`, remove only the two owned generated helper files, and reapply the updated generator with a fresh nonce and new external binding. Do not use `git reset`, `git clean`, stash, or touch the current checkout or foreign files. The previous v1 binding remains truthful for its exact prior source/patch and must not be reused to claim the revised helper's build or runtime evidence; new source/patch/build hashes and fresh-nonce Release receipts are mandatory. Rebuild only the JS bundle when the reviewed build process proves the native binary is unchanged.

Before another Release build, focused pure tests must cover: deterministic ordered item/option digests; zero-attempt and zero-draft counts; exact timer-field projection; arbitrary non-timer payload change rejection; key add/remove detection; unknown-key fail-closed behavior; unpublished storage and active-transition fail-closed behavior; and preservation of the original resolve value/error when storage reads or receipt writes fail. Then run the focused Q13 tests and `npm run typecheck`, review the generated exact-ref diff and tool hashes, and use the real Release run only for the actual old success and new mismatch receipts. Compare only after both private receipts are present and nonce/build bindings match; absent or stale receipt means no Q13 preservation PASS.

## Scores

| Dimension | Score | Reason |
| --- | ---: | --- |
| Objective and architecture fit | 0.91 | Reads the same published facade and existing canonical categories; the observer already brackets the exact required operation. |
| Simplicity | 0.86 | Adds one bounded post-operation read and deterministic digest projection to existing test tooling; no new runtime route or storage abstraction. |
| Risk | 0.84 | Read-only access avoids canonical mutation and secrets, while strict allowlists and no-receipt failure prevent a partial snapshot from appearing accepted. Remaining risk is Release-specific execution, which still needs actual receipts. |
| Maintainability | 0.85 | Reuses existing key, profile, serialization, hashing, and category contracts; one explicit timer exception list is auditable. |

**Minimum: 0.84.** This is a proposal score only. It does not approve implementation or satisfy the runtime preservation criterion.
