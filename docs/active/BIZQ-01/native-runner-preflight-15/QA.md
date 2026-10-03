# Independent native preflight QA

**Verdict: PASS WITH GAPS for the bounded current-source identity, cold-launch, and guest-preservation preflight.** This is not acceptance of BIZQ-01, Premium sessions, the repaired seed questions in a native runner, or the Premium offer copy.

## Independently checked

- Read the briefing, flow definitions, execution logs, identity evidence, screenshot manifest, and report. Inspected all five listed screenshots. They show the same iPhone 17 UUID, a guest in English with System appearance (dark observed); text size was not measured.
- Re-ran `check-bundle-identity.mjs` against `/private/tmp/patternly-bizq01-native15.bundle`. It passed with all ten exact canonical JSON payloads present (nine track artifacts plus `content-lock.json`), and its generated result matched `EXACT-BUNDLE-PAYLOADS.json` byte-for-byte. Independently ran `node scripts/candidateContentReleaseLock.mjs check`; it passed. Source confirms `runtimeCatalog.ts` imports those nine artifacts and the content lock; candidate `release.lock` is an integration contract, not a runtime import. The earlier absent-`candidateId` probe is therefore a probe mismatch, not evidence of a stale runtime bundle.
- The recorded cold flow completed `stopApp`, `launchApp` with `clearState: false`, existing dev-client URL, and Home assertion. The corrected preservation flow completed every command: it read Monday 09:15, Wednesday 18:00, Saturday 18:00 in the existing schedule without editing or saving; observed Guest in Settings; opened the Premium entry; and returned to Home. The screenshots corroborate the Home/Progress state, schedule editor, account state, and account-required Premium gate. The recorded assertions found the offer summary visible and no Premium success or session-root element on that screen.
- Source agrees with the observed guest path: the Premium screen keys its account-required state from authenticated account status, while premium product-mode admission fails closed when admission is absent or denied. The visible local testing control is a separate sandbox/smoke affordance; this run did not use it.

## Evidence limits and concrete issue

The preservation claim is limited to the observed guest identity, visible existing GCP plan/progress state, and the read-only schedule values across the cold launch. It does not establish whole-store equality, notification delivery, interruption recovery, or persisted-session behavior.

The Premium screen visibly renders `[TO BE COMPLETED: premiumServiceScope]` in the offer summary (`src/features/premium/PremiumPurchaseScreen.tsx:104–116`, sourced from `src/legal/legalVariablesLocalFixture.ts:36`). This is a concrete user-visible content defect in the screen shown, so this packet cannot establish Premium offer presentation or disclosure quality. It does not invalidate the narrower guest-gate observation, and this diagnostic package does not authorize changing business/legal copy.

The flow logs preserve two unsuccessful attempts: the first stopped at Springboard because it lacked an explicit launch; the second launched but the developer LogBox overlay obscured the tab navigation. The final flow added the launch and dismissed the visibly observed overlay at its screenshot-measured close coordinate; `PRESERVE-GREEN.log` records completion of every command. These are corrected test-flow failures, not successful evidence and not a production-source fix.

No authenticated eligible Premium profile was exercised, and the N02/N04 seeds remain outside the active legal mode pools. No purchase, account switch, answer/session write, toggle-based entitlement, selector widening, build/install, app-data clearing, or service configuration occurred. Native correct/wrong/partial answer behavior, Details, accessibility/theme variants, Premium SDK/provider behavior, and full BIZQ-01 remain open under their existing owners and contracts.

## Evidence references

- `REPORT.md`, `COLD.log`, `PRESERVE-GREEN.log`, and the two preserved failure logs record execution and corrections.
- `EXACT-BUNDLE-PAYLOADS.json` and `BUNDLE-IDENTITY.json` retain identity evidence and the initial probe history; the latter's absent candidate-ID result is not treated as a failed runtime identity check.
- `screenshot-manifest.json` records screenshot hashes and observed conditions; screenshots are under `screens/`.
- Relevant source inspected: `src/content/canonical/runtimeCatalog.ts`, `src/features/premium/PremiumPurchaseScreen.tsx`, `src/application/trainingLifecycle/TrainingLifecycleUseCases.ts`, and `src/features/home/tabs/SettingsTab.tsx`.
