# N05 / package 21 consumer test

This slice adds `src/content/bizq01OodNodeClosure21.test.ts`. It binds the activated source proof (`patternly-content/evidence/business-quality/bizq-01-ood-node-closure-21.json`, SHA-256 `4a216a75e8fbce5bb88e828d8dce420ffd1fbb349cc176af07fd5924492bc56f`) to the frozen producer map (`ROOT-N05-PRODUCER-MAP.json`, SHA-256 `0d95dbf77a32f657197fa4789166a24fd68edad81cd367e9ea7b29c8578e6b70`; registry SHA-256 `f7f50f13bb2f957c6f41442f1e6d79bb843a096fd7911b77103087fde71624ee`). The fixed target is source version `object-oriented-design-interview-authoring-v2026.10.04-bizq01-21` and question-set SHA-256 `6d19a75e8eae86869b3ce31b63ad57a6be13fc30532c22e993db6fbc3d0d4d12`.

The test verifies that the proof carries all 153 same-ID corrections and nine source bindings, checks each raw source file hash and each full source/proof question object against the frozen map, and compares all 153 exact objects with the loaded runtime. It also exercises the application scorer and feedback/presentation functions against each fixed source object for every option in both original and reversed order, checks exact wrong-option target IDs, and ensures the pre-answer projection hides answers and feedback. A final test checks accepted N01–N04 node counts and exact membership of each of the three ordinary N01 pools; no N05 question is expected in those pools.

The pre-sync command is:

```sh
node --import tsx --test src/content/bizq01OodNodeClosure21.test.ts
```

It was run after source21 and proof21 activation but before app artifact synchronization. The preserved output is [`CONSUMER-RED.log`](./CONSUMER-RED.log): 3 of 4 tests pass. The proof/source binding, scorer/presentation checks, and N01–N04 counts/pools pass. The one expected failure is the runtime whole-object equality check because the app still loads v20 for the retained question IDs. This is a real pre-sync runtime mismatch, not a missing proof or source binding. Re-run the same focused command after app synchronization for the source-to-runtime GREEN result; this authoring slice does not claim it has passed.

`npm run typecheck` passed with the new test. The package test script already discovers `src/**/*.test.ts`, so no package-script or pin changes were needed. No content source, artifact, lock, runtime, API, account, device, or release state was changed here. These checks do not establish native/Premium eligibility, full BIZQ-01 completion, or release acceptance.
