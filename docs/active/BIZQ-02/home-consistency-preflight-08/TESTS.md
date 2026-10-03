# Home08 read-fence verification

Run from `patternly/`:

```sh
node --import tsx --test src/application/homeShellReadFence.test.ts src/application/homeShellProfileReadIntegration.test.ts
```

Result: **14 tests passed, 0 failed**. The direct fence tests use the existing in-memory canonical storage adapter and repository write APIs. They verify invalidation after goal CAS, a valid accepted-plan CAS at the current goal revision, review and attempt insertion, terminal-session insertion, adding a result to an already-persisted completed session, active-session insertion and active-pointer clearing, and selected-track changes from selected and null states (including an unchanged null-track fence). A pending journal and malformed canonical session index invalidate an already-captured fence and make a new capture fail closed. The onboarding dismissal mutation invalidates its captured fact; its optional read-error fallback remains stable. An unrelated canonical reminder-settings write does not invalidate the snapshot.

The Home AST integration suite separately verifies that same-profile attempts written after the parallel reads or after the final dashboard await prevent success setters from publishing stale data, preserve the stored records, and become visible on explicit retry. Stable same-profile publication and existing profile-switch/transition cases remain covered.

The fixtures are domain-validated records persisted through the repositories. These checks establish local source/repository behavior; they do not claim React rendering or native MMKV/notification SDK fidelity.
