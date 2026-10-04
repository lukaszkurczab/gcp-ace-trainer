# Independent semantic review — OOD-N07-B08 v4

**Verdict: REVISE.** Exact frozen proposal SHA-256: `be7d5acfc2e2ccfa469ad6a70764572842bc873626e29414afd2f107f037bc2b`. Mechanical check: 18 objects / 90 options, PASS; this establishes shape/scoring only.

I reviewed the exact before and v4 whole objects, including each visible fact, key, alternative, Reason, all Details fields, and every stable-ID diagnostic. The v4 delta is bound above; I reused unchanged v3 conclusions only where the exact fields are unchanged. The exact v3 reports remain historical and untouched.

## Findings

The v4 revisions resolve the two local fact contradictions from v3. For i001, prompt and both constraints now say the $80 commit succeeded and the retry reuses the same operation ID with a changed $95 payload. For i018, prompt and both constraints now say the cancellation committed before the response was lost, and the retry has the same command identity. The answers and diagnostics are supported. The remaining 16 Details suffix edits remove the exact repeated boundary sentence without changing the case explanation.

All 18 item identities require retargeting. The before objects apply distinct original case rules (the JSON records each exact old prompt/key/rule); the current items ask different item-level decisions such as payload binding, write conflicts, transaction/outbox use, remote status, event deduplication, and command replay. The shared unit lens does not preserve each accepted meaning. Use the corresponding reserved i019–i036 IDs in item order. i018’s practice overlap with prior retry-result cases is a separate nonblocking cross-unit comparison.

## Binding and limits

Before-source SHA-256: `dfb46bf77f5f819acbac3e70123933c70f126441a29b17ae180b36ce7192511f`; manifest SHA-256: `07b9663946f5de9587434e9a3bd5836f71fa70dec772bfced94524ab3fc4fc01`. The JSON binds every question’s before/current ID, accepted option meanings, reviewed nearest alternative, and explanation. This review does not accept source activation, producer integration, app runtime, release/admission, native, Premium, or full BIZQ-01.
