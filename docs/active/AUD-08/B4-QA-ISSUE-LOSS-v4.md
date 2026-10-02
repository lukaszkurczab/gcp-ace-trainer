# AUD-08-B4 issue and saved-ACK post-commit-loss QA — v4

**Scoped verdict: PASS WITH ISSUES.** The issue POST and saved-ACK response-loss slice is independently source-reviewed and its required isolated gate evidence is pinned and green. This does not accept all of B4 or B3.

Reviewer: GPT-6 Luna, high. Read-only review; no production/test/runner edits, services, devices, or emulator rerun. The required gate evidence is the recorded root run, not a run performed by this reviewer.

## Scope and evidence

- Read `B4-REPORT.md`, `scripts/recoveryOperationIntegration.emulator.test.ts`, `scripts/runRecoveryOperationIntegration.mjs`, `CONSUMER-SOURCE-PINS-v4.json`, and `HTTP-SDK-SOURCE-v4.log`.
- Current integration-test SHA-256 matches its v4 pin; runner SHA-256 also matches. The source-v4 log SHA-256 matches the supplied evidence digest `8e61227ae3854dc7b740b30c07a956eda380904e8fe8ee796cbecf61b015dd19`.
- The recorded dedicated gate ran one test with **1 pass, 0 failures, 0 skips**, on the isolated demo Auth/Firestore emulators, and shut those emulators down. This is the explicit required gate; an ordinary default-SKIP invocation is not evidence.

## Acceptance findings

The fetch fixture performs and awaits the real HTTP request before simulating loss. It only enters the loss branch after `response.ok`; before throwing, it reads the committed Firestore operation/result state. The issue path checks that the operation ID is already in the vault before the request, then checks the committed operation status and result-document existence. Assertions outside the fetch fixture verify exactly one actual issue POST, one recorded post-commit loss for that ID, and that the pre-request durable ID equals the committed ID.

A newly created coordinator over the same in-memory vault reloads the saved operation and reconciles through the exact same-ID status GET. Assertions verify a `result_available` snapshot, no additional issue POST, one added status GET for that ID, and the durable result remains. This proves same-process coordinator reconstruction, not an app-process restart or native SecureStore behavior.

For saved ACK, the fetch fixture checks `savedIntent` in the serialized vault record before sending the real ACK request. After a successful HTTP response, it checks the backend operation is `acknowledged` and the result document is deleted, records the committed operation ID, and then throws before returning the response to the adapter. The test verifies exactly one ACK POST, that the lost-response marker matches the issue operation, one added status GET, terminal acknowledged state, local vault removal, and absent backend result document. The wrapper’s assertions cannot silently yield a green false: its loss markers are added only after its backend checks, and the test asserts the markers, request counts, local state, and server state outside the wrapper.

## Limitations and remaining work

Before ACK, the test asserts that the result document exists but does not inspect its field shape to assert an encrypted envelope or absence of plaintext. The existing producer contract supplies that property; this slice proves persistence across response loss, not result-schema confidentiality itself.

The test uses a memory vault and a newly constructed coordinator; it does not mount the React provider, exercise app lifecycle termination, or verify the native SecureStore/Keychain. The stale-auth guard uses the documented single-request `Date.now` fixture; it is not an aged Firebase token. The unrelated wrong-generation probe is a controlled claim fixture.

The broader B4 gaps remain: consume POST/ACK loss after commit, local persistence failure after server commit, replacement replay, mobile revoke/deletion interaction and concurrency, and unresolved account-mismatch/SMTP policy cases. The existing consume-ACK failure remains explicitly pre-send. These do not invalidate this bounded issue/saved-ACK slice.
