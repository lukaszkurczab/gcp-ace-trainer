# Independent semantic review — N05-B05 proposal v2

**Verdict: PASS for the frozen B05 v2 proposal.** The two v1 findings are corrected: i006 now states the exact identity returned after a successful seal, and i014 now tests a protection proxy guarding caller access. The remaining 15 whole objects are byte-identical to the previously reviewed v1 objects and reuse their PASS findings.

## Frozen inputs and scope

- Proposal `review-inputs/N05-B05-v2.json`: SHA-256 `b7cfa499a82d56e10a1619c09512f6a304ffb7cda11498175e55262e5928e409`
- Prior proposal `review-inputs/N05-B05-v1.json`: SHA-256 `b623a7aad4d0dc9f6e4e6ce1eea8321dff7e3bc3b8eb193e7c12ad4c07a48c3c`
- Prior review `SEMANTIC-B05-v1.json`: SHA-256 `787e4951c1cffbd58cdcce991649530b9c67d48bc84898f9d1eb1e5fb5224184`
- `N05-MANIFEST.json`: SHA-256 `bdef2880a62de54f54e3c06cb9ffc9bd5c900be31c6135d7a0b16c7583ab320a`
- `N05-CONTRACT.json`: SHA-256 `f1252079b899164632accbf4168e5c77c46fb004879a6865f218c8f5707a53f2`
- BIZQ-01 spec: SHA-256 `67aba008969eb570c86e1fbefc5b88a5e65f422d160fc7dcfd38084b59ff67d5`
- Canonical `docs/07-content-guidelines.md`: SHA-256 `5a949d18184d4713642eff447821c7b06aae04304454c72226372c4fd8b268af`

I compared each v2 object against the frozen v1 object. Exactly i006 and i014 changed; the other 15 whole objects match byte-for-byte and reuse their prior semantic PASS findings. I reread the two changed whole objects, including their prompt, every option, keyed answer, Reason, all five Details fields, every wrong-option message, and source references.

## Changed objects

**i006 — PASS, retain `ood-n05-b05-i006`.** The prompt now states that, on success, the notarization service returns the exact revision ID and digest covered by the seal. That is the decisive premise for the key: a decorator can delegate the unchanged seal call and audit the returned identity after success. The Reason and Details follow that causal order; the wrong-option messages point to their actual stable option IDs and explain why caller-side hashing, changing sealed bytes, or replacing the result contract fails the visible requirement. The atomic-persistence boundary is explicitly distinguished: if audit and sealing must be atomic, the target service owns both effects. That is a useful transfer limit, not a new assumption used to choose the answer.

**i014 — PASS, retain `ood-n05-b05-i014`.** Shipment temperature and hand-off rules stay with the shipment operation; dispatch entitlement is a separate access policy that every caller must pass before reassignment. The key places the policy check in a protection proxy and delegates the unchanged operation. Client-only checks, moving policy into shipment, and logging without rejecting an unapproved caller are distinct and plausible wrong actions; each feedback message diagnoses its target. The Reason and Details separate access control from shipment validity and identify when the boundary would change. This restores the same wrapper/proxy learning objective as the old i014 rather than the Adapter translation proposed in v1.

## Identity and carried-forward review

The old B05 key teaches wrapping a stable contract to add separable policy or access behavior without changing the underlying obligation. Both corrected items retain that decision. Their question IDs are unchanged, and their new option IDs track changed meanings. The other 15 objects are exact v1 matches, so their prior whole-object PASS findings remain applicable. The v1 review had no other blocking findings.

The GoF pattern reference and the cited Microsoft `RealProxy` article are relevant to the broad wrapper/proxy mechanism. This review makes no claim that the archived .NET Framework API is available or recommended in a current runtime; the authored scenarios are requirements, not claims about a particular platform.

## Acceptance boundary

This is a semantic PASS for the frozen B05 v2 proposal only. It does not establish final N05 cross-unit acceptance, source integration, producer proof, app admission, mode eligibility, native/Premium acceptance, or full BIZQ-01 completion.
