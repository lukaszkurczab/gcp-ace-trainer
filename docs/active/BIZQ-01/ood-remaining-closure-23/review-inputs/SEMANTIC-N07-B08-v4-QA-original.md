# Independent semantic review — OOD-N07-B08 v4

**Verdict: REVISE.** Exact frozen proposal SHA-256: `be7d5acfc2e2ccfa469ad6a70764572842bc873626e29414afd2f107f037bc2b`. Mechanical check: 18 objects / 90 options, PASS; this establishes shape/scoring only.

I reviewed the exact before and v4 whole objects, including each visible fact, key, alternative, Reason, all Details fields, and every stable-ID diagnostic. The v4 delta is bound above; I reused unchanged v3 conclusions only where the exact fields are unchanged. The exact v3 reports remain historical and untouched.

## Findings

The v4 revisions resolve the two local fact contradictions from v3. For i001, prompt and both constraints now say the $80 commit succeeded and the retry reuses the same operation ID with a changed $95 payload. For i018, prompt and both constraints now say the cancellation committed before the response was lost, and the retry has the same command identity. The answers and diagnostics are supported. The remaining 16 Details suffix edits remove the exact repeated boundary sentence without changing the case explanation.

No item has a second supported persistence action under its visible contract. i018 overlaps the broad retry-result theme in accepted prior items, but its cancellation outcome case remains distinct and the overlap alone is not a defect. IDs are preserved: old and current accepted meanings both ask how persistence should maintain the scenario’s state/invariant across a write, retry, or failure boundary.

## Binding and limits

Before-source SHA-256: `dfb46bf77f5f819acbac3e70123933c70f126441a29b17ae180b36ce7192511f`; manifest SHA-256: `07b9663946f5de9587434e9a3bd5836f71fa70dec772bfced94524ab3fc4fc01`. The JSON binds every question’s before/current ID, accepted option meanings, reviewed nearest alternative, and explanation. This review does not accept source activation, producer integration, app runtime, release/admission, native, Premium, or full BIZQ-01.
