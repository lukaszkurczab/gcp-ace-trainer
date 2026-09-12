# ODK-109 — legal information: account sync and deletion scopes

Status: **VERIFIED_CLOSED / done**, 2026-09-12. Scope is ODK-109 only.

## Result

The Legal information hub now says that learning data is stored on the device while supported signed-in account records can also synchronize with the account cloud. The detail sheet preserves the guest/device boundary and names the supported sync categories: active track, goals and plans, completed sessions, attempts, and review items.

Reset limits now distinguishes three separate scopes: resetting supported learning history on this device, deleting the account and synchronized learning data, and retaining limited pseudonymized deletion safeguards or minimal completion evidence for defined periods. It also states that normal account synchronization can restore supported records after a local reset and that account deletion does not itself cancel an App Store subscription. The hub remains a short guide; exact scope, periods, legal bases, backup limits, and rights remain in the local Privacy Policy.

## Review and verification

Controller scores (fit, simplicity, risk, maintainability): **0.97 / 0.96 / 0.92 / 0.95**, minimum **0.92**. The change updates the canonical localized information model and its existing bottom sheets without adding a second legal-information path.

The PL flow passed on `Patternly_QA_Guest_20260908`; the independent EN flow passed on `Maestro_IOS_iPhone-17_26`. Both variants exercised the hub plus Local storage and Reset limits sheets. The captured text is readable in light and dark appearance respectively, with no clipping that prevents access to the complete scrollable copy.

| Check | Actual result |
| --- | --- |
| Focused preferences and settings tests | **32/32 PASS** |
| PL hub, local storage, and deletion-scope flow | **PASS** |
| EN hub, local storage, and deletion-scope flow | **PASS** |
| Manual visual review of six captures | **PASS** |
| Independent QA | **PASS — no P0/P1** |
| EN/PL legal resource shape | **34/34 keys; equal shape** |
| ODK-109 scoped `git diff --check` | **PASS** |
| Repository typecheck | **Not attributed while concurrent SIMP-05 changes the shared runtime contracts** |

PL evidence is under `/Users/lukaszkurczab/.maestro/tests/2026-09-12_195630/ODK-109 legal sync and deletion scopes — PL/takeScreenshot`. EN evidence is under `/Users/lukaszkurczab/.maestro/tests/2026-09-12_201047/ODK-109 legal sync and deletion scopes — EN/takeScreenshot`. Reproducible flows are under [odk109](odk109/).

## Limitations

The details intentionally summarize rather than duplicate the full local Privacy Policy. The local reset does not promise cloud deletion or forensic erasure, and account deletion does not promise cancellation of an App Store subscription. The shared development runtime was temporarily unstable during the active SIMP-05 migration; the final PL and EN flows nevertheless completed independently on two simulators.

Independent QA recorded two P2 coverage notes: the locale-specific flows use the locale already selected on their dedicated simulator, and they verify the Privacy Policy reference in copy without reopening the existing local policy route. The route and `privacy-policy-document` contract remain covered statically and were not changed by ODK-109.
