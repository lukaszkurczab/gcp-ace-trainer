# OOD N04 consumer test implementation

Added `patternly/src/content/bizq01OodNodeClosure20.test.ts` as the app-side consumer check for the frozen package-20 payloads. It pins all nine proposal byte hashes and all nine proposed source byte hashes; checks the 162 question IDs against the reviewed map (144 reserved replacements, 18 retained B05 identities); compares each full source object with the loaded app runtime; confirms replaced predecessor IDs are absent; and exercises every option through app scoring and option reversal, stable-ID feedback, Reason/Details, pre-answer projection, and accessibility controls. The pool assertion preserves the current 136-question N01 node and three exact ordinary N01 pools while also checking N02=152 and N03=162. Existing N03 and 19a tests were left unchanged.

## Pre-sync result

Command, from `patternly/`:

```sh
node --import tsx --test src/content/bizq01OodNodeClosure20.test.ts
```

The expected pre-sync result is **RED: 20 tests, 2 pass, 18 fail**. The frozen proposal/source hash and identity-map test passes, as does the unchanged-node/pool test. All nine source-versus-runtime cases fail at current artifact parity: the app still bundles the 19a OOD artifact, which does not contain the eight units' reserved `i019`–`i036` items and has stale B05 contents under its retained IDs. The eight new-ID scoring/presentation cases cannot find the first new ID in runtime; B05's scoring/presentation case finds its retained ID but the loaded object differs from the frozen current payload. This is the intended integration signal, not a producer hash or source mismatch.

The first TypeScript check exposed answer-union narrowing errors in the proposal reader. The test now uses a real single-choice type guard matching the frozen payload contract. `npm run typecheck` then passed. The full actual pre-sync TAP output is retained at `ROOT-CONSUMER-RED.log`; it records the 20/2/18 result above.

## Post-sync result

After root synchronized the app artifact and release binding, reran from `patternly/`:

```sh
node --import tsx --test src/content/bizq01OodNodeClosure20.test.ts
```

Result: **GREEN, 20 tests passed, 0 failed**. All nine current source arrays match their frozen proposal bytes and objects in the loaded app artifact; replacement IDs are present and their predecessors are absent; all 162 questions pass real app scoring and presentation checks for every option and reversed order; and the existing N01/N02/N03 counts plus three ordinary pools remain unchanged.

The checked app OOD artifact SHA-256 is `fa015cbcdb5b4a0865c39ce7958a4832a08e8b10811dd7f396dc12cc79c6de82`, matching its content-lock entry. Its content version is `object-oriented-design-interview-authoring-v2026.10.04-bizq01-20`, its question count is 1,413, and the serialized question-array SHA-256 is `5b552f935cc3fa8bb142ccd38dc747a19a57823a8c7c8fd243fc786d43f0fe72`, matching the reviewed package binding. Root's synced candidate ID is `3001b254f9a1c4f9d15a01577f5457b8cb4ad79723f9958ecbdb7c8c5658417b`.

This is bounded app consumer evidence for the nine package-20 N04 payloads against that local artifact. It is not a full app static-suite, web build, native-device, Premium, deployment, or overall BIZQ-01 acceptance claim. The pre-sync RED log is retained as history; the post-sync test output above is the current result.

No source, generated artifact, lock, admission, runtime, mode/pool configuration, web file, or historical consumer fixture was modified. The test is auto-discovered by the existing `patternly` test script. Do not treat the pre-sync RED as app consumer acceptance; rerun after root's exact artifact and release/admission sync, then inspect any failures against the frozen package bindings.
