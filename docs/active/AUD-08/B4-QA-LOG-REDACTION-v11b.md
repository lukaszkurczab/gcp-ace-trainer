# AUD-08-B4 — final v11b scoped log-redaction QA

**PASS.** Independent gpt-6-luna high reviewer `b4_replacement_qa`, qa-gate, read-only; root transcription. WholeB4 is not accepted.

## Evidence

Pre/post consumer46/46 and producer27/27 pins match, HEADs unchanged. Integration SHA256 `81aa9d77943fb084d6bf273ae9279bec40dddaf3fc42d7317ec9826044ab3302`. RequiredHTTP gate4PASS/0FAIL/0SKIP, exit0, isolated shutdown; logSHA256 `6734e8d96799a19b84595480a6d321d0d2ab9066d5e0a73b237933e7c721cefb`. Same-source fullstatic1561PASS/0FAIL/4dedicatedSKIP, exit0; logSHA256 `649379a514f4b2869477b29a966416a338cc2c179407c7785a89cffd7f224987`. Reviewer bothrepo whitespacechecks PASS; no emulator/fullgate rerun or edits.

## Issue closure and criteria

Only integration test differs in 46-pin v11→v11b comparison. Both lowercased proofid/deletionproofid forms are included in known-secret and forbidden-key sets; validated extracted deletion proof is explicitly remembered before verification. Recursive response scanning captures proof values only in memory. Forbidden-key scan rejects either field. Fixed boolean failure messages and counts-only diagnostics remain intact. Missing v11 required detector is closed.

Four canonical info logger memory streams; actual request/completion reqId method/status correlation and exact HTTP multiset, safe shapes/enums/static error, known token/code/identity/password/AppCheck/deletionsecret/proof values plus credential patterns supported. Recorded redaction counts requests/2xx/4xx+:29/27/2,7/6/1,7/7/0,9/8/1. No rawlogs/body/secret artifacts.

## Limits

Local HTTP/SDK/Admin/Firestore with AppCheck/scheduling/transport fixtures and memoryvault/same-process reconstruction. Not nativeconsume/persistence/restart/productionprovider/externalproviderlogs or nativeargvcleanup. Forcedhangcleanup branch unexecuted. Scope PASS and sourcefreeze release supported; no wholeB4 acceptance/commit/push.
