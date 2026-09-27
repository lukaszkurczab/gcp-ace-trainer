# UI-26-02B — first-use Apple / Google sign-in contract

**Status:** implementation-ready contract; no 02B code is implied by this document.

**Parent task:** UI-26-02A.

**Owner repositories:** `patternly` (iOS app) and `patternly-backend` (account identity and legal evidence).

**Decision basis:** current source and tests listed below, plus the approved product direction recorded in the active plan: provider buttons live only on Sign in; a known Patternly account enters directly, while a new provider identity must review and separately confirm Terms and acknowledge Privacy before Patternly account creation.

**Approach assessment:** goal/architecture `0.95`; simplicity `0.90`; risk `0.84`; maintainability `0.91`; minimum `0.84`. This keeps the existing atomic registration boundary and changes the provider entry flow only. Main risks are interrupted provider sessions, legal text/version drift, and accidentally associating guest data with an existing account.

## 1. Goal and user value

Allow a person to use Apple or Google from **Sign in** without implying that provider authentication itself creates or legally registers a Patternly account. Existing Patternly identities should regain access without being asked to repeat first-use legal confirmations. A genuinely new identity must be shown the complete applicable Terms and Privacy Policy, then give two distinct confirmations before a Patternly account is created.

The person can cancel or decline without a Patternly account being created, without guest data being uploaded, merged, discarded, or exposed to the provider account, and without losing the ability to retry later.

## 2. Confirmed current implementation

Re-open and inspect these files, their callers, tests, and current diffs at the start of 02B. This inventory is orientation, not a substitute for that inspection.

### App (`patternly`)

- `src/features/account/AccountEntryScreen.tsx` renders Apple and Google on both Sign in (around the provider actions in the sign-in branch) and Create account (registration branch). Create account currently gates both provider buttons on one `acceptedTerms` boolean. The checkbox copy/accessibility label uses separate localized phrases for agreeing to Terms and acknowledging Privacy (`src/locales/en/account.json`, `src/locales/pl/account.json`).
- The same screen opens the full legal documents through `ROUTES.TERMS_OF_SERVICE` and `ROUTES.PRIVACY_POLICY`. `src/legal/legalDocumentMap.ts` marks `en` and `pl` canonical and the `de/fr/es/it/et` drafts unapproved; `getLegalDocument` returns `unavailable-unapproved` for those draft locales in release runtime. Do not bypass that release behavior.
- `src/application/account/AccountSessionProvider.tsx` exposes separate provider sign-in and registration commands. `signInWithApple` / `signInWithGoogle` authenticate then finalize an existing account; when identity resolution returns `accountNotFound`, current `signOutRejectedIdentity` signs the user out. `registerWithApple` / `registerWithGoogle` authenticate and call `registerAuthenticatedIdentity` with registration evidence. That helper uses an in-flight per-UID promise, blocks the auth observer during the server decision, calls `/v1/account/registration`, marks guest adoption pending only when the server says `created`, and fails closed on transport uncertainty (including best-effort sign-out).
- `registrationEvidence` currently takes the same `legalVariables.documentVersion[locale]` value for Terms and Privacy, and sends independent `termsVersion`/`termsLocale` and `privacyPolicyVersion`/`privacyPolicyLocale` fields plus `privacyPolicyAcknowledged: true`.
- `src/infrastructure/clients/PatternlyApiClientAdapter.ts` defines the registration request with both document versions/locales and the acknowledgement. Its current `AccountRegistrationResponseDto` only types the returned acceptance as `{ termsVersion, acceptedAt } | null`; the backend/OpenAPI response contains all version, locale, and Privacy acknowledgement fields. Resolve this concrete client response-contract mismatch in the owning implementation path; do not weaken the backend/OpenAPI contract to fit the narrow DTO.
- `src/legal/legalVariables.ts` selects release configuration or a local fixture. `config/public-legal.release.json` currently sets `documentVersion.en` and `.pl` to `2026-09-05`; it also contains unresolved release fields, so do not treat this as proof that a public release/legal publication is ready. The 02B registration must use the actual currently approved and rendered document versions, not hard-code this observed value.
- Existing-account data loading and guest adoption are deliberately distinct. Registration marks adoption pending only for a newly created account; `finalizeCurrent`/profile loading and `selectAccountProfileAndRestart` govern which profile becomes active. Do not infer or change adoption policy from the visual flow alone.

### Backend (`patternly-backend`)

- `src/api/app.ts` exposes `POST /v1/account/registration` behind the authenticated App Check route. It strictly validates both versions/locales and requires literal `privacyPolicyAcknowledged: true`.
- `src/modules/users/store.ts` implements `registerUser` as a Firestore transaction. It rejects active deletion tombstones, returns `created: false` and `acceptance: null` for a mapped existing identity without changing legal evidence, and atomically creates the new user, identity mapping, `acceptedTermsVersion`, and one immutable `legalAcceptances/terms-<version>` evidence record for a new identity.
- The stored evidence kind is `terms_acceptance_and_privacy_acknowledgement`; fields remain separately named: `termsVersion`, `termsLocale`, `privacyPolicyVersion`, `privacyPolicyLocale`, `privacyPolicyAcknowledged`, and `acceptedAt`.
- `src/api/openapi.ts` describes the same input/output boundary. `tests/firestore.emulator.test.ts` proves concurrent registration produces one creation and one existing result, and a replay with changed values does not rewrite the recorded legal evidence.
- Authenticated identity resolution is based on the verified Firebase identity mapping and subject, not a client-supplied email or a provider email match. Do not add email-based account linking as a shortcut.

## 3. Terms acceptance versus Privacy acknowledgement

Use these terms precisely in code names, test descriptions, UI accessibility text, request/response fields, evidence records, and reports:

| Concept | Required meaning | Evidence field(s) |
| --- | --- | --- |
| **Terms acceptance** | The user affirmatively agrees to the applicable Terms of Service as a condition of creating a Patternly account. | `termsVersion`, `termsLocale`; account `acceptedTermsVersion`. |
| **Privacy acknowledgement** | The user confirms that they have been shown and acknowledge the separate Privacy Policy. This is not a claim that the user accepts, consents to, or waives rights under the Privacy Policy. | `privacyPolicyAcknowledged: true`, `privacyPolicyVersion`, `privacyPolicyLocale`. |

The UI must use two separate, initially unchecked affirmative controls: one for accepting Terms and one for acknowledging Privacy. Each control has its own complete label and link to the matching full document. Neither control may toggle the other, and opening or scrolling either document is not confirmation. Do not label the Privacy action “accept”, “agree”, “consent”, or an equivalent. Preserve this backend field naming and evidence kind.

If product/legal later chooses **Privacy acceptance** instead of acknowledgement, that is a legal/product decision requiring explicit PO/legal approval and a separately planned cross-repository contract change (app copy and state, request/API schema, persistence/evidence semantics, export, and tests). Do not make that change inside 02B.

## 4. Required state machine

The implementation may use an existing reducer/coordinator or a minimal local state representation after inspecting the current code. It must make these states and transitions observably equivalent; do not add a second auth path or persist provider secrets to simulate resumability.

| State | Entry / required behavior | Allowed next states |
| --- | --- | --- |
| `sign_in_idle` | Apple is available only on iOS when configured; Google only when its client configuration is valid. Neither provider button appears on Create account. Email/password and Guest paths remain distinct. | `provider_pending`, existing account finalization, `sign_in_idle` on safe failure/cancel. |
| `provider_pending` | Start one provider operation. Disable/reject duplicate taps while it is in flight. Do not create a Patternly account, read/write guest data, or treat a Firebase credential as a Patternly session. | `existing_identity`, `new_identity_legal_review`, `sign_in_idle` on cancellation/failure. |
| `existing_identity` | Resolve the verified Firebase identity against backend mapping. If it exists and is active, continue the established account finalization path immediately; do not show or record first-use Terms/Privacy confirmations. A tombstoned/deleted identity is rejected by the backend and must not become a new account through a client fallback. | `authenticated`, explicit error/recovery state. |
| `new_identity_legal_review` | Identity is authenticated with Firebase but has no Patternly mapping. Keep it provisional and observer-blocked as required by the current session coordinator. Show the complete applicable Terms and Privacy Policy with separate links and two explicit, independently understandable confirmations; both must be affirmative before submission. | `registration_pending`, `sign_in_idle` after cancel/decline/sign-out. |
| `registration_pending` | Send one immutable registration request containing the exact current Terms version/locale and Privacy version/locale plus the Privacy acknowledgement. Backend transaction is the sole authority for account creation and evidence. | `new_account_adoption_pending` only on verified `created: true`; `existing_identity` if a concurrent/replayed backend mapping proves an account already exists; retry/recovery on a known failure; safe sign-out on unresolved outcome if current policy requires it. |
| `new_account_adoption_pending` | Follow the existing new-account guest-adoption preview/decision path. No guest data is merged automatically. The authenticated account is isolated from guest storage until explicit resolution. | Existing guest adoption states, authenticated account state, or existing failure/retry state. |

Identity classification must come from verified backend account mapping (the existing account session exchange/`/v1/me` boundary or another already-owned authenticated read after inspection), never from email, `displayName`, provider response shape, or whether Firebase returned a “new user” flag. A newly created Firebase Auth identity can exist even when no Patternly account exists; that fact alone is not Patternly account creation.

Concurrent registration is possible: if an account mapping appears between classification and submission, backend response `created: false` means authenticate that mapped account and do not replace its legal evidence. Do not show a second acceptance flow or treat the returned `acceptance: null` as failed registration.

## 5. Responsibility and invariants

### App responsibilities

- Provider launch/cancel state, one in-flight operation, clear user feedback, and exact mapping from the active UI/legal locale to a canonical approved legal document locale.
- Present full rendered documents and distinct Terms acceptance/Privacy acknowledgement. Record neither action from opening a link, scrolling, provider login, app launch, prior guest use, nor pre-checked state.
- Submit only versions that match the documents actually rendered to the user. Freeze the submitted versions/locales for the pending attempt; changing locale/document invalidates the prior confirmations.
- Hold the provisional UID from account observers and account-data consumers until account classification/registration is resolved. Recheck auth UID/session generation after every async boundary before changing state or data scope.
- For a newly created Patternly account only, invoke the already-defined guest-adoption workflow. Ask before transfer/discard per its existing contract. Existing-account sign-in must not offer or upload local guest records.

### Firebase responsibilities

- Apple/Google authenticate the identity and produce Firebase-authenticated credentials. Provider cancellation/errors are distinct from Patternly registration result.
- Firebase Auth is not the Patternly account store and does not hold Terms/Privacy evidence. Do not expose/store OAuth authorization codes, ID tokens, access tokens, raw provider credentials, or provider profile payloads in app state, persistent storage, logs, analytics, screenshots, or evidence.

### Backend responsibilities

- Verify Firebase bearer and App Check through the existing guards; resolve identity by verified provider/subject mapping; enforce deletion tombstones.
- Be authoritative for existing/new classification and for atomic Patternly user, identity mapping, and legal evidence creation.
- Enforce request schema, exact supported locales, bounded version format, and immutable first-registration evidence. Registration replay for an existing account never changes evidence.
- Return explicit, typed results sufficient for app to distinguish newly created account (`201`/`created: true`), mapped existing account (`200`/`created: false`), validation/auth/tombstone failure, and transport-unknown outcome. Never log bearer tokens or provider secrets.

### Global invariants

1. No Patternly user, identity mapping, legal evidence, backend account data, guest adoption, or remote guest upload exists before both required statements are confirmed and backend creation commits.
2. Terms acceptance and Privacy acknowledgement are separate semantics and separately versioned evidence fields, even if the current published versions happen to have the same string.
3. Existing accounts sign in without first-use legal confirmation; backend evidence remains immutable on replay.
4. One Firebase identity maps to at most one Patternly account. Email equality never links accounts.
5. No asynchronous response may authenticate/switch profile after UID or operation generation changes.
6. Guest records never enter an existing account implicitly; new-account transfer/discard remains explicit and isolated.
7. Unknown, stale, unapproved, missing, mismatched, or unrenderable legal content/version fails closed before registration.
8. A transport timeout is an unknown server outcome, not proof of failure or success. No automatic repeat side effect without using the existing transaction’s same-identity replay semantics and an explicit user retry/result reconciliation.

## 6. Legal locale and version fail-closed contract

- Replace the current implicit `locale === "pl" ? "pl" : "en"` registration mapping in 02B. The accepted registration locale is currently `en | pl`; only these are marked canonical in `legalDocumentMap.ts`. For `de/fr/es/it/et` in release, provider account creation is fail-closed with a clear legal-documents-unavailable state. The user may deliberately switch the app/legal locale to canonical EN or PL and restart the review; the app must not switch it automatically, present English under a different selected locale, or record English evidence for an unapproved draft locale.
- Before enabling the final confirmation, retrieve both full document results and verify they are canonical/approved, non-empty, and correspond to the locale actually shown. If either document is unavailable, hide/disable submission and show a clear unavailable state; provider authentication alone must not create the Patternly account.
- Obtain the Terms and Privacy version from their canonical source independently. Although current config exposes one shared `documentVersion[locale]`, carry two distinct version fields through the request/evidence. Do not invent a hash/date/version or assume the versions must always be equal.
- The release fixture currently says `2026-09-05` for `en` and `pl`, but that is only observed configuration, not an implementation constant or approval signal. Local fixture versions must never be reported as release legal evidence.
- Confirm that displayed locale, Terms content, Privacy content, request locale/version, and immutable backend evidence all match. Any missing/unapproved release fields remain release-gate blockers outside 02B; the local behavior still must fail closed.

## 7. Cancellation, restart, network, retry, and rapid-tap behavior

- **Provider cancel/deny:** return to Sign in with a neutral canceled result; do not create a Patternly account, legal evidence, adoption marker, or remote data mutation. If Firebase created/authenticated a provisional user before cancellation, best-effort sign out and keep the guest profile selected. If sign-out itself is pending, expose the existing explicit pending/error state and block all account-data access until resolved.
- **Decline Terms or Privacy acknowledgement:** no registration request. Keep choices unchecked; provide a clear cancel/back action. Do not persist a partial legal confirmation as acceptance/evidence.
- **App background/kill before registration:** no account creation has occurred; after restart return to a safe signed-out/guest state or re-establish provider identity only through explicit user action. Do not silently continue consent or submit a remembered confirmation. If Firebase restores a provisional UID, classify it again against the backend before exposing account data.
- **Restart after request timeout:** server may have committed. Preserve no raw credential for replay. On explicit retry, reauthenticate through the provider as needed, resolve the same verified identity, and use backend’s idempotent registration result. If it is now mapped, sign into it; do not mutate its legal evidence. Never report “account not created” solely from a timeout.
- **Offline before provider auth or document retrieval:** do not advance; provide actionable retry. **Offline before submission:** do not submit and do not create an account. **Offline/timeout during submission:** show outcome-unknown/retry guidance and keep account data blocked; resolve same identity through the existing backend contract before adoption.
- **Backend validation, App Check, authentication, tombstone, or unavailable failure:** no client-side bypass, no fallback account, no adoption. Preserve the explicit error class already supported or add a narrowly typed one; do not present success.
- **Rapid taps / repeated callbacks:** at most one provider prompt and one registration operation per current UID/generation. Duplicate presses share the same in-flight result or are ignored/disabled. No duplicate evidence or repeated adoption side effect.
- **User changes auth identity / signs out during pending work:** invalidate the operation generation, ignore stale completion, do not submit consent from an old screen, and do not route data into either identity.

## 8. Guest data adoption and isolation

- A current Guest profile is device-local and separate from provider credential state. Provider authentication must not copy guest data to Firebase or backend.
- New Patternly account creation may mark guest adoption pending only after confirmed backend `created: true`. Then use the existing preview and explicit transfer/discard choices; preserve the existing merge/conflict rules and rollback/failure behavior. Do not auto-choose transfer or discard.
- Existing Patternly account login uses that account’s remote profile with the current existing-account isolation policy. Do not surface the guest adoption prompt or upload the current device guest records into that account.
- On cancel, declined terms, provider failure, legal unavailability, backend failure, or unknown outcome, guest profile/storage remains intact and selected until a verified new-account flow reaches its existing adoption checkpoint. Never revoke/delete guest keys as a cleanup shortcut.
- Reinspect current guest binding, storage router, and adoption tests before implementing; acceptance tests must prove guest A is not visible to an existing account B and that new account C enters the existing explicit adoption flow.

## 9. Security and observability

- Treat provider credentials, Firebase ID tokens, OAuth codes, email, and provider subject as sensitive. Redact them from logs, crash context, network diagnostics, test output, screenshots, Maestro hierarchy artifacts, and reports. Use synthetic emulator identities only.
- Client UI is responsible for obtaining the two explicit actions; the current backend cannot attest that controls were actually used. Backend validation only rejects a missing/false Privacy acknowledgement and malformed or unsupported version/locale fields, then stores the authenticated caller's asserted registration evidence atomically. Tests must prove the production UI cannot submit before both controls are affirmative, while backend tests prove schema enforcement and immutable evidence without overstating them as proof of human interaction. Backend identity mapping must be derived only from verified token claims.
- Never accept legal version/locale from untrusted display text or client release metadata without checking against app’s loaded canonical document; never let caller choose an arbitrary existing account ID.
- Keep legal evidence immutable and exportable under existing data export behavior. Do not add logging of checkbox contents or legal body.
- Do not claim emulator OAuth verifies Apple/Google. Report Firebase Auth emulator scenarios and real Apple/Google provider validation as separate evidence classes.

## 10. Implementation scope for UI-26-02B

### In scope

- `patternly`: account sign-in/create-account screen, account session/auth command orchestration, legal document readiness/version source integration, typed API DTO/response validation, app-local tests, all locale copy/accessibility affected by removing provider buttons from Create account or showing first-use consent, and Maestro flow/evidence.
- `patternly-backend`: only the narrow registration classification/evidence response or authenticated identity-resolution contract needed to let the app distinguish existing from genuinely new identities safely; strict validation and immutability tests; OpenAPI and Firestore emulator tests when a contract changes. Preserve current atomic transaction and tombstone checks.
- Cross-repo: keep app request/response types, OpenAPI schema, route validation, and Firestore evidence aligned. Update client contract tests against the actual backend response. Document each repo commit and integration proof in `patternly/docs/active/UI-26-02B/REPORT.md`.

### Explicit non-goals

- Changing the legal meaning from Privacy acknowledgement to Privacy acceptance/consent.
- Changing Terms, Privacy Policy substance, public legal publication, release legal values, operator identity, or supported legal locales.
- Adding email matching/account linking, multiple identity linking, account recovery, new provider, provider-specific account creation screen, or a new parallel registration endpoint without demonstrated need.
- Changing email/password registration, Guest entry, account deletion, existing-account legal re-consent, guest merge semantics, backend deployment, production data, or release publication.
- Storing provider secrets or consent state for silent background completion.

If current inspection proves an authenticated existing/new check cannot be made safely with the current boundary, stop and report the exact contract gap for an owner decision rather than adding an unauthenticated identity-enumeration API or overloading an unsafe endpoint.

## 11. Acceptance criteria

1. Apple/Google buttons appear only on Sign in, under current platform/configuration rules; Create account has no provider actions. Email/password Create account and Guest entry still work as before.
2. Sign-in with a verified mapped existing Apple/Google Firebase identity reaches its account without displaying first-use legal confirmation and without changing its evidence.
3. Sign-in with a verified unmapped provider identity presents complete canonical Terms and Privacy documents and separate unchecked affirmative controls. Neither document open nor provider login checks either control.
4. Missing either confirmation, missing/unapproved document, stale/mismatched version, cancel, provider denial, or a failed request does not create a Patternly user, mapping, legal evidence, or guest adoption marker.
5. Confirming both submits separate Terms and Privacy version/locale values and a literal Privacy acknowledgement. Backend transaction creates exactly one user, identity mapping, and immutable evidence; concurrent/replayed requests resolve to the same account and never overwrite evidence.
6. A successful new account enters existing explicit guest-adoption preview/transfer-or-discard flow. Existing account entry remains isolated from current guest data.
7. Restart, offline, timeout/unknown result, provider cancel, sign-out race, backend error, and rapid taps follow §7 with no false success, duplicate creation, stale profile switch, or implicit data movement.
8. App response types, route schema, OpenAPI, backend result, stored Firestore evidence, and data export agree on distinct Terms acceptance and Privacy acknowledgement. Resolve the current narrow app response DTO mismatch.
9. No token, authorization code, provider subject, or private identity value appears in logs/evidence. Test fixtures are synthetic.
10. Independent QA can reproduce required behavior with clean evidence, and cross-repo review shows no uncoordinated contract drift.

## 12. Verification and required evidence

### Deterministic app tests

- Provider control visibility by mode/platform/config; Create account has only email/password and its current legal controls.
- Existing identity success bypasses first-use confirmation and does not call registration; unknown identity cannot proceed without full legal readiness and both explicit confirmations.
- Legal locale mapping and fail-closed statuses across `en/pl` canonical and `de/fr/es/it/et` draft/unavailable behavior in release mode.
- Separate version/locale payload fields; no consent inferred from provider login, document open, old checkbox state, or stale state after locale/version change.
- State-machine tests for decline/cancel, provider error, app/session generation change, rapid tap, request result `created true/false`, malformed response, timeout retry, and legal evidence immutability.
- Guest isolation tests: existing B does not adopt Guest A; new C has explicit adoption pending and no transfer/discard without choice.

### Deterministic backend tests

- Route validation rejects missing/false acknowledgement, missing/invalid versions/locales, extra keys, unauthenticated or invalid App Check calls.
- Firestore emulator verifies atomic creation, existing identity result, concurrent race, tombstone rejection, immutable Terms/Privacy evidence, and exact persisted field names/versions/locales.
- Ensure request/response/OpenAPI/client adapter schemas match. Emulator evidence is local contract/integration evidence only.

### Runtime / external-provider evidence

- Use the already-running local Auth and Firestore emulators and existing iPhone 17 Simulator, one device only. Verify app points at the intended local backend. Capture Maestro evidence for UI state/order/actions and backend logs/database assertions separately; screenshots alone do not prove account creation or persistence.
- Emulator providers may simulate known/new identities for deterministic state coverage. Clearly label these as Firebase emulator tests; they do not prove live Apple/Google configuration, review state, or real provider credential claims.
- If local native flow can reach Apple/Google using already configured test credentials, test it without creating another simulator/install. Otherwise mark live-provider validation unverified and report what concrete provider setup/authorization is missing; do not claim emulator PASS as real-provider PASS.
- Never use personal production credentials or create production accounts for this task. Any real-provider run must use an explicitly authorized test identity and report only redacted outcomes.

### Required report contents

`docs/active/UI-26-02B/REPORT.md` must include changed paths in both repositories and commit SHAs; exact commands and counts; emulator vs real-provider distinction; Maestro flows/device; created/existing/declined/retry data assertions; locale/version evidence; guest isolation evidence; screenshot/hierarchy limits; independent `qa-gate` verdict; and all unverified gates/risks. Do not store raw tokens, real email addresses, or durable copies of provider secrets.

## 13. Risks and required stop points

- **Identity classification:** relying on email or Firebase’s “new user” flag can prompt existing users or attach the wrong account. Use verified backend mapping; if the authenticated path cannot distinguish account-not-found from other failures without creating records, stop for a contract decision.
- **Timeout after commit:** the user may believe registration failed although the transaction succeeded. Reconcile/retry the same identity; never create another mapping or rewrite evidence.
- **Locale/version divergence:** app language can differ from legal publication locale. Record only the locale of the full document actually shown and exact corresponding versions.
- **Shared current version key:** Terms and Privacy currently render from one shared `documentVersion`; they remain distinct contract fields. If legal owners require independent release version sources, record that as a separate legal/config contract decision rather than inventing fields silently.
- **Provider integration:** emulator cannot validate live Apple/Google callback configuration. Keep that evidence gap explicit.
- **Guest contamination:** an existing user signing in on a device with guest progress must not upload that progress. Exercise isolated guest A / existing account B runtime state.
- **Potential legal semantics request:** any request to change acknowledgement to acceptance pauses that part of 02B and requires explicit PO/legal decision plus a separate cross-repository task.

## 14. Completion condition

UI-26-02B is complete only when all acceptance criteria have current test/runtime evidence, the app/backend/OpenAPI/Firestore contract agrees, the existing iPhone 17 Maestro flow is recorded, live provider evidence is either performed with an authorized test identity or explicitly listed as an external unverified gate, independent `qa-gate` issues PASS, required repository commits are on their intended main branches, and no unresolved product/legal decision is hidden in implementation. No deployment or publication is part of completion.

## 15. Executory prompt for UI-26-02B

> Implement UI-26-02B strictly against `docs/active/UI-26-02A/CONTRACT.md`. Before editing, re-read all applicable AGENTS files, this contract, the active plan/working state, both repositories’ current branch/status/diff, and inspect the current provider sign-in, account session coordinator, legal document readiness/version source, API DTO, backend identity resolution, `/v1/account/registration`, Firestore evidence, guest adoption, and their tests. Preserve the approved semantics: Terms are accepted; Privacy is acknowledged, never accepted. Keep Apple/Google only on Sign in. Resolve a verified identity through backend mapping: existing accounts sign in immediately without first-use legal confirmation; an unmapped identity remains provisional until the complete canonical Terms and Privacy documents are shown and the two distinct confirmations are given. Keep account creation and legal evidence atomic on the backend; preserve replay immutability and deletion tombstones. Handle cancellation, restart, timeout/unknown result, offline, rapid tap, stale auth generation, and explicit guest adoption exactly as specified. Do not use email matching, hidden fallback, silent consent persistence, provider-secret logging, new device/app installs, deployment, or publication. If current code cannot safely identify an existing account without a new contract decision, stop and report the exact evidence. Run narrow deterministic app/backend tests, Firebase Auth/Firestore emulator integration, then Maestro on the existing iPhone 17; distinguish emulator proof from real Apple/Google proof. Update only implementation-owned files plus `docs/active/UI-26-02B/REPORT.md`, request independent Luna-high briefing validation and independent `qa-gate`, and finish with coordinated diff review and per-repository verification.
