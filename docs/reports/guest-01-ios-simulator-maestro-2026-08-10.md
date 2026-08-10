# GUEST-01 iOS Simulator Maestro evidence

**Verdict: VERIFIED for the GUEST-01 first-value acceptance.** This report is
durable metadata for the executable evidence; it does not claim signed
physical-device or release-binary validation.

On 2026-08-10, application commit
`26db12ced015481d63dab5ddfc882582c825a680` was installed on an iPhone 16 Pro
Simulator running iOS 18.6. The tracked
`.maestro/screenshot-capture/guest-01/10-free-primary-learn-relaunch.yaml`
then ran through the canonical local RC runner.

The complete command sequence passed: audit listener 5/5, explicit learning
reset 3/3, Coding Interview selection 9/9, and the guest journey 33/33. The
journey opened the primary bundled Free configuration — Learn Approach, length
10, `complexity_and_constraints` — answered the first question, rendered
authored feedback, Reason and Details, paused, killed and relaunched the app,
and resumed the exact same question/configuration/feedback.

The non-versioned capture pack is at
`artifacts/maestro-screen-capture/guest-01/2026-08-10-ios-simulator/`. Its
`manifest.json` records each screenshot SHA-256 and every asserted stage. The
run does not replace `REL-07`, which still requires signed physical-device
release evidence.

The run exposed one reusable tooling issue: iOS may localize the deep-link
confirmation to `Otwórz`. The audit-reset flow now handles that system prompt
as well as `Open`, so the explicit reset evidence remains repeatable without
changing product behavior.
