# Independent consumer acceptance — OOD source11

**Verdict: PASS for the bounded producer-to-app consumer slice.** The exact source replacement is present in the app’s generated OOD artifact, eligible in the existing immediate Design pool, scored through the canonical single-choice contract, and delivered by the existing Design facade after durable materialization and lifecycle rebind. The retired ID is absent and is not silently substituted.

## Evidence I checked

- The added `src/content/bizq01OodSourceReplacement.test.ts` compares the generated app question with the current producer source object, checks the retired ID is absent from both, confirms the replacement is in the existing `design-interview-learn-framework` pool, and checks all five new stable option IDs and their scoring/message targets.
- The runtime probe uses the bundled loader, actual canonical runtime preparation and resume validation, the existing memory journal/repositories, Design facade submit, and a lifecycle rebind. It checked the correct option and all four incorrect options. Feedback was null before submission; the correct answer had no wrong-option messages; each wrong answer received exactly its existing authored message after one persisted attempt and journal clearance. It also rejected a session pinned to the prior version, artifact hash, and retired question ID.
- The probe selects a question that is actually in the existing pool, then pins that eligible item into its test fixture. This proves current pool membership and runtime handling for the item; it does not claim normal selection would randomly choose it.
- The generated OOD lock is content version `object-oriented-design-interview-authoring-v2026.10.03-bizq01-11`, SHA-256 `49e1bce7fe393145e04d46e4c3220b991c3f869be705e12cccdc2026490b08c4`, 1,413 questions. The app release lock has the same OOD version and checksum and references candidate `e7fbd82b4afab18994e406175feb442842ccf06b41be3efec0ae92cf2d394fbe`; its nine artifact entries are present. The matching candidate manifest reports `draft_not_admitted`. `node scripts/candidateContentReleaseLock.mjs check` passed. The candidate/source identity is therefore bound for this consumer review; admission is not granted by this result.
- The producer-to-app parity command below independently built all current producer artifacts from commit `0a4b8cbcf51b40f0c33b6c699606e2c85998705a` and compared the result with the app catalog and content lock. It passed for the current bundle.

## Commands and results

Run from `patternly/`:

```sh
node --import tsx --test \
  src/content/bizq01OodSourceReplacement.test.ts \
  src/domain/tracks/runtimeAdmissionLaunchTracks.test.ts
```

Result: **2/2 passed**.

```sh
PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA=0a4b8cbcf51b40f0c33b6c699606e2c85998705a \
  node --import tsx --test \
  --test-name-pattern='bundled canonical release|current canonical builder' \
  src/content/contentReleaseCrossRepo.test.ts
```

Result: **2/2 passed**.

```sh
node --import tsx docs/active/BIZQ-01/ood-source-preflight-11/runtime-preflight.ts
```

Result: exit 0. The probe reported five response cases, `staleVersionArtifactQuestionPinRejected: true`, and the explicit memory-store/test-Premium-authorizer boundaries.

```sh
node scripts/candidateContentReleaseLock.mjs check
npm run typecheck
node --import tsx --test src/application/trainingLifecycle/premiumProductModeLifecycle.test.ts
```

Results: lock check passed, typecheck exited 0, and the existing Premium lifecycle suite passed **7/7**. The Premium authorizer in the memory-backed probe is a test stub, not provider or native authorization evidence.

## Scope limits

This accepts the bounded app consumer path, not the candidate’s local runtime-admission record, release gate, deployment, publishing, or the overall BIZQ work. The draft remains `draft_not_admitted`. No native UI, VoiceOver, real provider authorization, or random/automatic question selection claim is made. The probe preserves and uses the existing Design mode and Premium gate.
