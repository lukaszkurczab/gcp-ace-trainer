# ODK-090 — inline legal-request validation

Status: **VERIFIED_CLOSED / done**, 2026-09-12. Scope is ODK-090 only.

## Result

Legal-request validation is now rendered beside the corresponding open form field. A required-description failure and an invalid guest-email failure keep the bottom sheet open, mark the field, and disappear as soon as that field is corrected. Invalid input returns before either authenticated or public create command can run.

The submission boundary remains canonical: valid authenticated requests route once to `createLegalRequest`, valid guest requests route once to `createPublicLegalRequest`, optional values are trimmed, and withdrawal continues to allow an empty narrative.

## Architecture and review

Controller pre-change scores (objective/architecture fit, simplicity, risk, maintainability): **0.95 / 0.90 / 0.86 / 0.90**, minimum **0.86**. The change isolates validation and routing in one production-used helper rather than duplicating rules in the screen.

Independent briefing validation used **gpt-5.6-luna / max** and returned conditional approval with **0.94 / 0.91 / 0.86 / 0.88**, minimum **0.86**. Its required proof—that invalid input invokes neither create command—was added as deterministic injected-callback tests.

Independent final QA used **gpt-5.6-luna / max** and returned **PASS**, with no P0, P1, or P2 product findings. It inspected implementation, tests, command artifacts, and all four screenshots. `VERIFIED_CLOSED` was explicitly approved.

## Verification

| Check | Actual result |
| --- | --- |
| Focused submission and settings-presentation tests | **22/22 PASS** |
| TypeScript typecheck | **PASS** |
| Authenticated iOS Maestro | **19 completed, 1 optional branch skipped, 0 failed; 2 screenshots** |
| Guest iOS Maestro | **27/27 completed, 0 failed; 2 screenshots** |
| Screenshot visual inspection | **PASS** — both inline error states and both corrected states |
| `git diff --check` | **PASS** |

The authenticated run used `Maestro_IOS_iPhone-17_26` (iPhone 17, iOS 26.4, dark appearance). The guest run used `Patternly_QA_Guest_20260908` (iOS 26.4, light appearance). Both exercised `com.lkurczab.patternly` against local-only infrastructure. Reproduction flows and artifact links are listed in the [evidence README](odk090/README.md).

The Maestro scenarios deliberately stop after correction and do not create a real request. Valid route preservation and the absence of any invalid send are proven at the production submission boundary by injected command spies. Production providers and physical-device behavior are outside ODK-090.

## Changed files and cleanup

- Added the production submission boundary and its focused tests.
- Updated `LegalRequestsScreen` to show and clear field-specific inline errors while preserving the open sheet.
- Extended the settings presentation contract checks.
- Added authenticated and guest Maestro flows plus this report.

No replaced implementation path remains in the touched submission logic. Unrelated ODK-104 and SIMP-05 changes were preserved. The temporary local API and isolated Metro were stopped, the main simulator was restored to `localhost:8081`, and the two extra simulators were shut down. Existing Auth and Firestore emulators were left running.
