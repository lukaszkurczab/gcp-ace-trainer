# 13 — Risk Register

| Risk                                               | Severity | Signal                                                             | Required mitigation                                                                                       |
| -------------------------------------------------- | -------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Silent substitute hides incomplete migration       | Critical | Missing data produces an ordinary session                          | Fail explicitly; remove default branches and test them absent.                                            |
| Permanent translator creates a second architecture | Critical | Old records or types are interpreted beside canonical ones         | Delete old records and paths; no historical translation.                                                  |
| AsyncStorage survives the MMKV switch              | Critical | Any import, key, or read/write remains                             | Delete it; use one MMKV infrastructure client and repositories.                                           |
| Old model remains reachable                        | Critical | Imports, routes, tests, or state access old owner                  | Delete references and prove unreachable with focused tests/search.                                        |
| Exam profile drifts from official behaviour        | High     | Profile lacks official source/date or runtime uses global defaults | Require versioned `ExamExperienceProfile`; test every change; block faithful claim if unclear.            |
| Weak explanation passes structural validation      | High     | Reason/Details exist but do not teach mechanism or selected error  | Human editorial sign-off against the batch rubric.                                                        |
| Review is filled with unrelated items              | High     | Requested length exceeds compatible reviewed pool                  | Shorten and disclose actual length; never widen or duplicate.                                             |
| Evidence becomes status theatre                    | High     | Confidence or synthetic percentage returns                         | Separate evidence volume, learning stage evidence, and performance signals; show only actionable metrics. |
| Journal loses or duplicates a committed outcome    | Critical | Feedback appears before durable intent or retry changes counts     | Journal-before-feedback, deterministic outcome, idempotency, force-close tests.                           |
| Codex improvises missing design                    | High     | Required interaction has no approved reference                     | Treat missing design as implementation blocker.                                                           |
| Unsupported content is hidden                      | High     | Unknown ID/payload gives a generic item or answer                  | Validate boundaries and display explicit error.                                                           |

## Mandatory recovery rule

If an existing model, record, flow, or module cannot be moved into the canonical structure without preserving obsolete semantics, delete it. Do not create fallbacks, translators, compatibility adapters, or parallel paths. Backward compatibility is not required for pre-production storage, content, or runtime models. An explicit runtime failure is a valuable signal that migration work remains; it must not be hidden by substituting defaults or reading the old system.

Risk review rejects changes that retain old keys, dual ownership, silent defaults, permanent status flags, or untested exam-profile changes. Current legacy code is an implementation risk, not a reason to weaken this mitigation.
