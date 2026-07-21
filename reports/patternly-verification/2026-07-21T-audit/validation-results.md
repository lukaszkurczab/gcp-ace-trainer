# Validation results

| Scope | Command | Result | Evidence classification |
| --- | --- | --- | --- |
| Content architecture | `npm test` | PASS, 32 tests | STATICALLY_VERIFIED |
| Algorithms ingress | `npm run inspect:real:algorithms` | PASS | STATICALLY_VERIFIED |
| Algorithms release candidate | `npm run validate:real:algorithms` | PASS | STATICALLY_VERIFIED |
| Certification ingress | `npm run validate:real:certification` | FAIL: `EMPTY_INGRESS` | STATICALLY_VERIFIED |
| App typecheck | `npm run typecheck` | PASS | STATICALLY_VERIFIED |
| App boundary | `npm run validate:content-boundary` | PASS | STATICALLY_VERIFIED |
| App tests | `npm test` | FAIL: 277 pass, 2 fail | STATICALLY_VERIFIED |
| App cross-repo test | `npm run test:algorithms-cross-repo` | FAIL: `DIRTY_INTEGRATION_INPUT` | BLOCKED |
| iOS runtime | `npm run ios -- --device 'iPhone 17'` | Launch and UI observed | OBSERVED |

The two application test failures are distinct. `practiceFlowModel.test.ts` expects three options but current runtime produces four, including `Default Practice`; that is a test/behavior contract mismatch in the dirty worktree. The cross-repo integration test intentionally requires clean app inputs and is blocked by the 80 pre-existing entries in the app worktree. Full logs are in `commands/`.
