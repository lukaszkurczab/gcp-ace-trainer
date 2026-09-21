# APPCHK-03 — native App Check build configuration

**Status:** `done` locally. Real attestation of a frozen device build remains ODK-E2E-084.

## Contract and evidence

- `app.config.js` requires Android `playIntegrity` and one Apple production provider (`deviceCheck`, `appAttest`, or `appAttestWithDeviceCheckFallback`) for sandbox and release artifacts. Missing, debug, or unknown providers fail configuration before prebuild.
- Local smoke builds can use debug providers. `AccountSessionProvider` composes the native Firebase App Check provider from the configured pair; missing or failed composition leaves the provider unavailable. No production token is fabricated.
- The new matrix test checks every accepted Apple provider and the missing, debug, and unsupported values on both platforms in sandbox and release. The existing account test verifies that an absent provider yields `null`; API client tests verify that unavailable attestation stops mobile transport.

## Verification

- `node --import tsx --test scripts/buildRuntimeConfiguration.test.ts` — 8/8 passed.
- `npm run typecheck`, `git diff --check` — passed.
- Independent briefing validation: `gpt-5.6-luna`/`max`, approved; consistency 0.94, simplicity 0.92, risk 0.88, maintainability 0.93, minimum **0.88**.
- Independent post-change QA: `gpt-5.6-luna`/`max`, **PASS**; consistency 0.95, simplicity 0.92, risk 0.89, maintainability 0.93, minimum **0.89**. No concrete missing local behavior found.

## External gate

These local checks prove configuration policy, not issuance or verification of a production token. ODK-E2E-084 still requires a frozen build on a real device and representative guest and authenticated requests with valid, missing, invalid, and unavailable attestation.
