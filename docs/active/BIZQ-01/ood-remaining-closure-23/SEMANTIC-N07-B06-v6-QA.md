# Independent semantic review — OOD-N07-B06 v6

**Verdict: REVISE.** Frozen input SHA-256: `5eafc6852700e0efd4a14e6419146ead10314a261c067fd575e581a977a76cfd`. The mechanical check passes 18 objects / 90 options; it verifies schema/scoring and exact target IDs, not semantic correctness.

I read all 18 exact current and before whole objects: prompt, constraints, every option and answer, Reason, all Details fields, every option-ID diagnostic, source refs and item identity. The v5→v6 receipt binds 36 changed Details fields and 22 changed diagnostic texts. The accepted boundary-mapping decision is supported in the reviewed prompts; the 18 question IDs remain appropriate because each old and current key tests external-representation translation at the boundary while preserving the item’s domain contract. The source reference supplies the general mapping concept; the case facts remain authored premises.

## Findings

Seventeen items have an exact repeated conditional sentence at the end of the errorCorrection field and in boundaryOrTradeoff. The first sentence of errorCorrection is still specific and useful, so this is a bounded redundant tail, not a reason to discard the diagnosis or boundary field. The affected IDs are ood-n07-b06-i001, ood-n07-b06-i002, ood-n07-b06-i003, ood-n07-b06-i004, ood-n07-b06-i005, ood-n07-b06-i006, ood-n07-b06-i008, ood-n07-b06-i009, ood-n07-b06-i010, ood-n07-b06-i011, ood-n07-b06-i012, ood-n07-b06-i013, ood-n07-b06-i014, ood-n07-b06-i015, ood-n07-b06-i016, ood-n07-b06-i017, ood-n07-b06-i018. Removing only that repeated sentence would retain the case-local correction and boundary explanation. This finding is based on actual repeated learner-facing text, not an item-count threshold.

Two independent item-level corrections remain:

- **i014:** wrong_4 says to store the signed bank amount unchanged as a balance delta. Its diagnostic talks about currency and reference failing to retain reversal direction; the option already contains the signed amount. The message should explain that a negative event must take the separate reversal path rather than ordinary positive-Money allocation.
- **i016:** wrong_3 discards the observed condition after eligibility is calculated. The stem separates classification and refund eligibility, but does not require evidence retention or later traceability. The alternative can perform the two decisions separately and then store only the refund amount. The feedback adds an unstated audit/trace requirement; state it if intended or replace that alternative.

The old/current identity comparison is recorded per item in the JSON with the actual old scenario rule and both accepted options. i005’s selected R17 and D17 digest comparison, and i007’s supplied numeric UTC offset during repeated local time, are explicit visible facts; no external provider guarantee was assumed.

## Binding and limits

Before-source SHA-256: `040d2eeb44b56fc1cf54e189534e4408a01034a74d394da763502ae879aa92c5`; manifest SHA-256: `07b9663946f5de9587434e9a3bd5836f71fa70dec772bfced94524ab3fc4fc01`. The JSON binds all 18 object hashes, the exact v5→v6 field delta, and the item-specific issues. This review does not accept source activation, producer integration, app runtime, release/admission, native, Premium, or full BIZQ-01.
