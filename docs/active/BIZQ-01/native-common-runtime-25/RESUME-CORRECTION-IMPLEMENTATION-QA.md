# Native 25 resume correction implementation QA

**Verdict: PASS for the bounded source and regression-test correction.** Both ordinary resume consumers now agree with the canonical runtime’s exact configuration snapshot: an absent `navigation` property is accepted, while an explicitly present value is rejected. The producer, snapshot shape, fingerprint, session lifecycle, and Premium policy are unchanged.

The implementation changes only the navigation predicates in `src/features/practice/sessionConfig.ts`. Certification and Design Interview no longer require `navigation === "linear"`; each rejects the property when it is present. The existing configuration checks remain in place for submission, feedback, answer changes, timer, reinsert policy where applicable, status, track, mode, package, requested length, active session identity, and canonical content identity.

The regression test in `src/features/practice/practiceSessionConfig.test.ts` removes the synthetic `navigation: "linear"` field and exercises the real `CanonicalTrainingRuntime.prepare` and `validateResume` path. It covers all 12 node-selected ordinary Certification and Design Interview mode/feedback combinations. For each, it checks route identity and configuration values, then confirms Home exposes the matching enabled resume action for that session. It also verifies that explicitly adding either `linear` or `free` navigation makes the route builder reject the session.

I ran the focused source tests on the final reviewed files:

```text
/opt/homebrew/opt/node@22/bin/node --import tsx --test \
  src/features/practice/practiceSessionConfig.test.ts \
  src/features/home/tabs/homeTabModel.test.ts

13 tests passed, 0 failed.
```

The repository TypeScript check also passed, recorded in `ROOT-RESUME-TYPECHECK-FINAL.log`. The independent boundary checks recorded `CONTENT_BOUNDARY_CHECK=passed` and `RUNTIME_PRIVACY_BOUNDARY_CHECK=passed` in their respective root logs.

The report does not claim a native rerun or prove persistence across a device restart. Those checks remain with the native owner. This QA confirms the source-level producer-to-route-to-Home path and the explicit-navigation rejection behavior; it does not expand the full BIZQ acceptance scope.
