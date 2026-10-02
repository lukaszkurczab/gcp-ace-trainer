# Guest learning preservation contract audit v1

**Result: source-supported, narrowly scoped local guest-learning preservation; not full B3 acceptance.** The app’s persisted learning state is stored through the canonical MMKV repository boundary, and v7 derives its key allowlist from the complete current `STORAGE_KEYS` registry plus the one pinned Premium cache key. The public corrected diagnostic reports that the complete recognized domain changed from seven rows to six: six rows remained equal and the owned expired Premium row was removed. Taken together, the source contract and that aggregate result support preservation of persisted local learning records in the compared guest profile. The public result does not identify those six rows individually, and the diagnostic still reports `strictMismatchRemains: true`, `preservationAccepted: false`, and `writerProvenance: "unknown"`.

## Coverage established from source

`src/storage/repositories/canonicalRecordCodec.ts` is documented as the sole MMKV access boundary for app-owned persistence; repository methods use it to read, write, verify, and remove versioned canonical envelopes. `src/infrastructure/storage/mmkvClient.ts` supplies the active profile-scoped view, while `profileStorageRouter.ts` and `encryptedStorageBootstrap.ts` select and initialize the encrypted profile store. The v7 source pins bind those routing/bootstrap sources, `src/storage/keys.ts`, and the SHA implementation. I rehashed all five current app sources against v7’s declared SHA-256 values; all matched.

The canonical key registry’s learning-bearing records and indexes are: active track/session/draft/timer; training sessions, results and attempts; review entries; goals and learning plans; archival and unavailable-content history; goal-onboarding preferences; learning reminder settings/journal; and the active learning mutation journal. `learningReadModels.ts` exposes reads for active track, goals, attempts, practice history, reviews, sessions, results, and drafts. The repositories behind these reads use the registry and canonical codec. `mutationJournalRepository.ts` records learning mutations against those same keys. `accountDataRepository.ts` explicitly identifies its syncable learning types and its guest-owned learning keys/prefixes, corroborating which canonical records represent local learning state. This includes unavailable-content tombstones and archival history, so those records are not silently excluded from the preservation scope.

Other rows in the same compared domain are canonical metadata, guest/account lifecycle controls, the account-sync state/outbox, content-report outbox, UI settings, and the separately identified Premium cache. These are part of the strict complete-domain result, not learning records. This categorization explains why the six equal aggregate entries cannot be described as six learning entries, while the complete-domain comparison still covers all learning-bearing keys that are present.

The v7 wrapper builds its exact/pattern allowlist from every exported value in `STORAGE_KEYS`, then adds only the Premium cache key obtained from the separately pinned Premium repository source. The native source iterates all keys in the selected profile namespace. It rejects an unrecognized key in that namespace instead of omitting it, and emits an entry for each recognized non-marker key. Guest installation and access markers are compared in the separate marker set. Thus the complete-domain comparison covers every present canonical learning key or pattern in the selected modern guest scope; a learning key absent on both sides is unchanged absence within that scope.

The current app hashes for the five v7-bound app dependencies matched exactly:

| Source | SHA-256 result |
| --- | --- |
| `src/infrastructure/storage/encryptedStorageBootstrap.ts` | `04f7562b…2c92b91` matched |
| `src/infrastructure/storage/profileStorageRouter.ts` | `edd97c6d…9b26ae` matched |
| `src/storage/keys.ts` | `878496d7…49b1f0b7` matched |
| `src/infrastructure/identity/sha256.ts` | `acf43201…f333dd4c` matched |
| `src/storage/repositories/premiumEntitlementCacheRepository.ts` | `9c63de3f…d2d68d` matched |

The inspected v7 wrapper, native source, canonical validator source, and README also match their declared artifact hashes. v7 metadata reports 43/43 original synthetic cases and 3/3 supplemental source-rebind cases passing, and declares `realStorageAccess: false`. This was a source review; I did not execute the inspector or read its fixtures. The permitted Core60 inventory metadata lists 60 files and the same path/content-manifest digest as v7 metadata, but this audit did not rehash those Core files. The inventory’s `pathHashEncodingMatched` field is empty, so Core60 identity is not independently established here.

## Boundaries and interpretation

This conclusion concerns persisted **local guest learning records** in the selected encrypted MMKV profile. It does not claim that every guest setting, marker, Premium cache, account-sync outbox, or auth state was unchanged. The diagnostic intentionally records a full-domain mismatch because the Premium record was removed and the access marker was added; its preservation flag remains false. That strict result must remain visible even though learning-record preservation can be inferred from complete recognized-domain equality after the separately classified Premium removal.

The app also stores verified content-package artifacts and manifests under the Documents filesystem directory `patternly-content-node-packages-v1`; active package pointers use the profile storage view under a separate `patternly.content-node.active.v1.*` key namespace. These are content selection/package bytes, not the learning session, attempt, review, goal, plan, or recovery records mapped above. Because v7 accepts only canonical keys and the pinned Premium key in the selected guest namespace, a present scoped package pointer would fail the domain inspection as unrecognized. The diagnostic therefore cannot certify preservation of external package files or make a broader claim about the selected content catalog. Source search found no production AsyncStorage use in the reviewed app tree. Expo SecureStore is used for encrypted-storage manifests/keys, Firebase auth persistence, recovery-operation material, recovery clipboard data, and guest privacy drafts; none is a learning-record repository, so these stores are outside this MMKV comparison.

`accountDataRepository.ts` defines cloud synchronization/materialization separately from the local guest repositories. Equality of local guest MMKV rows does not prove that backend/cloud copies, remote acknowledgements, or account-profile data were unchanged or transferred. Likewise, source hashes and helper metadata do not bind the exact JavaScript bytes executed by Hermes in the native app, and the public result explicitly leaves writer provenance unknown. The v6 lifecycle reader/projection narrows inspection to installation and Premium-cache records; it is not a second complete learning-domain comparison.

The public corrected actual metadata records one diagnostic attempt, six unchanged entries in the complete recognized guest domain, removal of the owned expired Premium record, unchanged installation payload with revision advanced by one, and a newly granted guest-access marker. Public QA labels this `PASS_WITH_LIMITS`, says the six rows include metadata/settings/account-state keys and are not exclusively learning records, and confirms that private runtime attestations were not independently replayed. This audit refines the domain meaning from app source without claiming to identify the six opaque rows from the public aggregate.

**Fit / simplicity / risk / maintainability:** 0.93 / 0.92 / 0.90 / 0.91. The conclusion follows existing repository and key-registry contracts; it needs no storage change or broader acceptance rule. The main limit is evidence provenance: the public aggregate has no per-row labels, Core60 files were not rehashed here, and executed-JS/cloud state is outside the permitted proof.

## Evidence references

- App sources: `src/storage/keys.ts`, `src/storage/repositories/canonicalRecordCodec.ts`, `src/storage/repositories/accountDataRepository.ts`, `src/storage/repositories/mutationJournalRepository.ts`, `src/infrastructure/storage/{mmkvClient,profileStorageRouter,encryptedStorageBootstrap,encryptedStorageNative}.ts`, `src/application/{learningReadModels,practiceReadModels}.ts`, `src/content/runtime/nodePackageStorage.ts`.
- Inspector sources and metadata: `/private/tmp/aud08-guest-entry-inspector-v7/{PINS.json,wrapper.mjs,guest_mmkv_inspector.mm,canonicalValidators.mjs,README.md}`.
- Inventory metadata: `/private/tmp/aud08-v5-core-source-inventory.json` (metadata only; Core file hashes not re-read).
- Public runtime metadata: `POST-SAFE-EXIT-CONTROLLER-v1-CORRECTED-ACTUAL.json` and `POST-SAFE-EXIT-CONTROLLER-v1-CORRECTED-ACTUAL-QA.json` in this evidence directory.

No fixture, key, current head, private identity binding, raw runtime record, private diagnostic output, native device, or backend was read or accessed for this audit.
