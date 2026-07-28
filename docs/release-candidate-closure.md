# Patternly — release-candidate closure

## Goal

Reach `RC_VERIFIED` only when the pushed application and content commits identify
one immutable multi-track release, the active product paths are canonical, and
current iOS/Android acceptance and accessibility evidence is complete. Otherwise
the state is `BLOCKED` with a reproducible reason.

## Reconciled status — 2026-07-28

Source and current execution evidence take precedence over the previous RC plan.
The completed implementation descriptions were removed from this active document;
their immutable history remains in Git.

| Area | Status | Current evidence |
| --- | --- | --- |
| Canonical Certification mode vocabulary (RC-002) | done | Seven enabled modes, including `certification-exam-simulation`; retired runtime state and duplicate scorer removed. |
| Certification simulation policy and profile (RC-003) | done | Product-owned Patternly policy is published in the profile; the user approved this decision. |
| Canonical simulation lifecycle, draft, timer and finalization (RC-004–RC-007) | done | `CertificationFamilyRuntime` and shared lifecycle own prepare, durable drafts, deadline finalization and result evidence. |
| Parallel exam runtime removal (RC-008) | done | Active UI surfaces use the shared lifecycle and durable projections; duplicate state and scoring paths are removed. |
| Certification feedback and pool readiness (RC-009–RC-010) | done | Every published Certification item has `Reason`, structured `Details` and exact option explanations; publication requires all seven declared modes and profile-compatible capacity. |
| Algorithms readiness and content ingress cleanup (RC-011–RC-012) | done | Previous verified evidence remains valid for the current content source. |
| Immutable multi-track content release (RC-013) | done | `patternly-core-0014` remains pinned by the application lock; the cross-repo release test verifies the manifest and both checksums. |
| Content gate and local privacy boundaries (RC-014–RC-017) | done | Existing source, tests and CI configuration remain the canonical implementation. |
| iOS acceptance (RC-018) | done | iPhone 17 completed Algorithms M1–M7 and Certification Exam Simulation on the explicit reset path. The final Certification run also completed at the iOS accessibility-large Dynamic Type size. |
| Android acceptance (RC-019) | done | `emulator-5554` completed Algorithms M1–M7 and Certification Exam Simulation from deterministic clean dev-client state. The final Certification run also completed at font scale `1.3`. |
| Accessibility and visual review (RC-020) | partial | No P0–P3 issue remains in reviewed current Certification captures. TalkBack was enabled on Android and the runtime hierarchy exposed labelled controls, roles and selected state. iOS semantic, reduced-motion and large-text checks pass; physical-device VoiceOver remains required. |
| Final RC evidence pack (RC-021) | blocking | Requires the current application commit to be pushed and one physical-iPhone VoiceOver traversal; Apple documents that VoiceOver itself is unavailable on Simulator. |

## Current release identity

| Field | Value |
| --- | --- |
| Release | `patternly-core-0014` |
| Producer release commit | `e18fc731e1b577750f954e8f017520e546afc7f9` |
| Content source commit | `7b2e96a5e357264e6ce06a75dbeb11e386a3dea1` |
| Algorithms artifact | `algorithms-core-0007`, `89462b2e0f6f47b5b5c3c62652937609fa8be37d0d399b02b6629c58cdbcec54` |
| Certification artifact | `gcp-ace-0013`, `55dff7ce486cbd1c21b2a8094d60c5ab47d48635256c28c2b2bf83088dc274a2` |

## Current evidence

- `npm run qa:static`: 354 tests passed; type, content-boundary, runtime-privacy and recovery checks passed.
- `npm run test:content-release-cross-repo`: the pinned multi-track release passed.
- The current Certification Exam flow completed on iPhone 17 and `emulator-5554`, at normal scale and at the largest tested text setting. Current large-text screenshots are under `docs/audits/rc-verification-2026-07-28/{ios,android}-accessibility-large-text/screenshots/`.
- Android TalkBack was enabled for hierarchy inspection. Buttons and tabs exposed their accessible labels and selected state; the emulator was then restored to its ordinary settings.
- iOS dynamic type was restored after capture. The product already listens to the native reduce-motion setting and suppresses the navigator transition when it is enabled; that behavior is statically covered. Apple’s accessibility guidance requires a physical iPhone for a real VoiceOver traversal, so this is the one remaining non-simulated acceptance check.
