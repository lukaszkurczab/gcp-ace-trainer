# Independent semantic review — OOD-N07-B07 v4

**Verdict: REVISE.** Exact frozen proposal SHA-256: `a3748cdb5ee1d91b334ece3a85ee7b61a061e9c25feef282aac496e20de485f7`. Mechanical check: 18 objects / 90 options, PASS; this establishes shape/scoring only.

I reviewed the exact before and v4 whole objects, including each visible fact, key, alternative, Reason, all Details fields, and every stable-ID diagnostic. The v4 delta is bound above; I reused unchanged v3 conclusions only where the exact fields are unchanged. The exact v3 reports remain historical and untouched.

## Findings

The unit remains **REVISE**. Six items have a second read plan that returns the requested data within the stated facts, so the single-choice key is not established by the stem. The gaps are case-specific, not a general ORM rule: i001 per-station counts; i002 lazy names within a 25-row page; i003 application aggregation; i004 keeping the bounded transaction open through upload; i011 separate relationship reads before the decision; i013 loading optional rendition history. The exact competing option IDs and minimal visible discriminator are recorded per item in the JSON.

The other flagged nearest alternatives are resolved by visible bounds: i005 says the detail is read in one short request; i008 and i009 have explicit two-read budgets; i014 has an explicit two-read budget and ten-row cap. Other current items’ prompt/key/diagnostics and case-local explanations are supported on this review. Identity is preserved per item because the old and new accepted meanings both ask which caller-specific read plan fits the access pattern; the rewrite narrows the evidence without changing that primary choice.

## Binding and limits

Before-source SHA-256: `de40c1e90fd9d8ce2bfd88424cfa6b34dc271ebe682ac7a49eb29ce30da6dea6`; manifest SHA-256: `07b9663946f5de9587434e9a3bd5836f71fa70dec772bfced94524ab3fc4fc01`. The JSON binds every question’s before/current ID, accepted option meanings, reviewed nearest alternative, and explanation. This review does not accept source activation, producer integration, app runtime, release/admission, native, Premium, or full BIZQ-01.
