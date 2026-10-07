# BIZQ-01 Guest removal34 — Stage 1 evidence and Stage 2 maintenance

The authorized scope is to remove the exact original local modern Guest while preserving the other nine profiles and unrelated state. The user’s latest instruction authorizes removing this Guest; it is not evidence of corruption. Stage 1 actual reconciliation/canary/post-cold evidence passed. Root completed the one-time Stage 2 transaction; its bounded receipt is `STAGE2-NATIVE-REMOVAL.json`. Root then performed the ordinary cold initialization and the separate read-only checker: `STAGE2-NATIVE-POST-COLD.json` and independent `STAGE2-NATIVE-QA.json` record PASS. The exact old-prefix count was zero, both registry slots selected the replacement, the journal was absent, and protected comparisons matched. Ordinary OOD first-run selection then reached Home without starting a session or answering; `STAGE2-POST-COLD-HOME-UI-QA.json` records independent bounded PASS. This package does not establish full BIZQ-01 acceptance or release readiness.

The first Stage 1 runner attempt returned a Hermes Promise object instead of a by-value result. A subsequent root-owned read-only observation found the original Guest still active and the transition barrier active. It did not prove whether the canary key was removed. Treat that attempt as outcome-unknown; never repeat the first attempt’s nonce or infer a canary pass from it.

The revised tool has two explicit modes. It has no default effect:

- `reconcile` is read-only and runs only after root has stopped the owned Metro, the source has been updated and independently QAed, and root has performed one ordinary cold initialization. The helper checks the selected modern Guest against its exact ID and installation hashes, reports the transition flag as observed, refuses active session/draft/timer/journal work, and hashes current account/global/adapter state. It checks the current Guest projection has 84 logical keys (81 recognized records plus the three known metadata keys) against the prior non-secret receipt’s counts, and reports only a hash of current key names. It also reports count and hash inventory for the reserved canary-key family; it never removes a residual key. The runtime expression reads only the already initialized MMKV, SecureStore, and SHA exports. It reads exactly SecureStore registry slots `patternly.profile-root.v1.a` and `.b` plus `patternly.local-logout-control.v2`, verifies checksums and compares non-secret profile/control hashes against the accepted nine-account + original-Guest and six-pending-pair baseline. It outputs no profile IDs, keys, values, credentials, or raw logs. Key/record counts and current hashes do not establish historical all-account-data preservation or a whole-store claim.
- `canary` requires a fresh successful private reconciliation receipt from the same source/tool/app/device context. It creates and fsyncs a mode-0600 private effect-intent containing its fresh nonce before sending the mutating Inspector expression. It invokes the synchronous canary helper directly and accepts only a by-value fixed-schema result. That helper checks the exact Guest and absence of learning work, enters the transition barrier, writes/reads/enumerates/removes one nonce-key in an unregistered namespace, and compares protected adapter hashes around that one operation. The result receipt is written only after a valid response and clean Inspector close. An interrupted or malformed run leaves its private intent and cannot be treated as a pass.

For either Stage 1 mode, root must separately verify that the sole Metro listener’s working directory is the intended checkout. The tool’s source ref/hash records local source identity but does not prove what Metro loaded. Target selection requires one `node` Inspector target for app `com.lkurczab.patternly`, device `iPhone 17`, and the observed IPv6 loopback endpoint. The tool uses initialized module metadata only; it does not load module factories. Runtime effect, cold initialization, and later reconciliation are root-owned. Never run either command during code QA.

After independent tool QA, root may run the read-only reconciliation command once against a new private path:

```sh
node docs/active/BIZQ-01/guest-removal-34/run-canary.mjs reconcile \
  --receipt /private/tmp/bizq01-guest-removal34-reconcile.json
```

Only after the reconciliation result is reviewed as `passed` may root decide whether the separately authorized single canary invocation is appropriate:

```sh
node docs/active/BIZQ-01/guest-removal-34/run-canary.mjs canary \
  --reconciliation /private/tmp/bizq01-guest-removal34-reconcile.json \
  --intent /private/tmp/bizq01-guest-removal34-canary-intent.json \
  --receipt /private/tmp/bizq01-guest-removal34-canary-result.json
```

Use new direct-child files under `/private/tmp`, keep them private, and do not repeat an invocation whose outcome is uncertain. A successful reconciliation establishes the live exact Guest, registry-slot, logout-control, and empty canary-family conditions at that observation, not historical learning-data preservation. A successful canary establishes only the bounded adapter behavior and before/after hashes for that attempt. Neither establishes Q13/full BIZQ acceptance, provider purchase provenance, educational effectiveness, or release readiness.

## Stage 2 exact Guest removal

`run-removal.mjs` is the versioned, explicit Stage 2 maintenance command. Root must first verify that the sole Metro listener’s working directory is the intended checkout; the runner’s local source hash does not prove which bundle Metro loaded. It reads the fixed Stage 1 reconciliation receipt as a non-secret baseline, then invokes only the initialized `removeOriginalGuest34` export for the exact current app/device Node Inspector target. It does not load module factories. The expected state is rechecked by the transaction against the live selected modern Guest, active-work state, account/global hashes, both registry slots, and logout controls before it writes its durable SecureStore journal. The transaction creates a replacement Guest identity, commits both alternating registry generations without the target, removes only keys below the target’s physical profile prefix, verifies protected state and the new selection, then clears the journal. Startup resumes a valid pending journal before publishing a profile; malformed, mismatched, or unrecoverable state leaves storage unavailable.

The CLI requires explicit `remove` mode and fresh, nonexistent direct-child paths under `/private/tmp`. It fsyncs a mode-0600 intent before sending the native command. Hermes completion is collected through a unique console marker after the asynchronous transaction settles; it does not depend on returning a Promise by value. The digest/count-only result receipt is written only after valid completion and a clean Inspector close. An intent without a matching result means the operation outcome is unresolved: do not rerun it. Root owns any read-only recovery assessment and the actual one-time command.

After independent implementation QA and root preflight, the root-owned invocation is:

```sh
node docs/active/BIZQ-01/guest-removal-34/run-removal.mjs remove \
  --intent /private/tmp/bizq01-guest-removal34-remove-intent.json \
  --receipt /private/tmp/bizq01-guest-removal34-remove-result.json
```

The private receipt contains only safe stage, counts, and state/identity hashes; the private intent never contains raw profile IDs or storage names. A passed receipt is bounded evidence that this exact local transaction completed and protected comparisons matched. It does not claim a whole-store comparison, all historical account preservation beyond measured categories, full BIZQ acceptance, educational effectiveness, provider purchase provenance, or release readiness.

## Stage 2 read-only post-cold verification

After root performs one ordinary cold initialization and independently confirms the sole Metro process is serving this checkout, root may run the versioned read-only verifier with a fresh private receipt path:

```sh
node docs/active/BIZQ-01/guest-removal-34/run-postcold.mjs postcold \
  --receipt /private/tmp/bizq01-guest-removal34-postcold.json
```

The verifier accepts one exact `node` Inspector target for the configured app and iPhone 17. From initialized module exports only, it reads the current Guest installation marker through the active public storage adapter; checks current Guest, work-barrier, account/global hashes and the exact removed Guest’s physical profile-prefix key count; reads both registry slots, logout control and removal journal through SecureStore’s initialized public API; and compares their hashes/profile inventory with the Stage 1 and Stage 2 receipts. The old-prefix scan hashes UUIDs in memory and reports only `oldPrefixKeyCount`; it never returns profile IDs, key names, values, credentials or raw logs. The exact old-prefix count must be zero. The receipt is written privately only after a valid result and clean Inspector close.

This post-cold observation verifies current selected-Guest and registry/control state plus absence of physical keys for the exact removed Guest ID. It does not compare a whole native store or establish historical account data beyond the recorded protected categories. Offline tests validate the tool’s modeled contracts; they do not prove simulator state. Root owns the cold initialization, runtime invocation and review of resulting private evidence.

## Tool verification

Offline tests cover fixed target selection, baseline shape, both registry-slot and logout-control claim requirements, synchronous canary result validation, explicit CLI modes, private intent fsync-before-command ordering, post-cold exact-prefix/checker refusal contracts, and receipt suppression when Inspector close fails. Stage 2 tests model exact transaction recovery at journal, marker, alternating registry, key cleanup, and journal removal boundaries, including protected account/global/logout state and prepublication recovery. Maintenance-runner tests verify initialized export selection, asynchronous marker transport, safe digest-only result validation, intent-before-command ordering, and receipt suppression when Inspector close fails. These tests model contracts; they do not prove runtime behavior. Root owns the native effect and actual post-operation cold/recovery evidence.
