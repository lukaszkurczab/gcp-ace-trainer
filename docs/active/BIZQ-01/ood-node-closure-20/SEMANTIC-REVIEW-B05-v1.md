# Independent semantic review: OOD-N04-B05

Verdict: **REVISE this proposal snapshot before source activation.** This review is bound to proposal SHA `734ee5a299b3c18beef68dac68763d06788563c21f9c3db647ec8e949f4bd0a7`, manifest SHA `74f929fef0122d1d75412e07d6b86ab2b634056dd0ed0a98a7051baca7e0eec0`, and current source-file SHA `1f617f0282d8284dfcef1569f7504efb200ce040722c36c7f64425d063294a75`. The source bytes match the fixed manifest, and each of the 18 manifest before-object hashes matches the corresponding current source object. The proposal has 18 objects in manifest order; all 18 retain their existing question IDs and have matching `preserve_question_id` author notes. That identity choice is justified: both old and proposed items ask the same dependency-inversion decision, and the proposal adds a concrete policy/mechanism scenario rather than changing the unit’s primary decision. The reserved IDs are not an obligation to mint new IDs. The option IDs are newly named for this content.

The central question is whether the stable policy should own the abstraction while changing integrations translate their own representations. Every proposed stem gives the learner enough visible facts to answer that question: the policy rule stays fixed, the provider representation changes, and the policy owner is identified. I checked all keys, all four wrong-option messages against their target IDs, Reason, and all five Details fields. The keys express the same valid dependency-inversion principle, while the scenarios supply different policy inputs: charge settlement, verified income, delivery status/time, consent and destination capability, invoice totals, notices, insurance value, risk bands, retention dates, seat intervals, moderation labels, grant evidence, coverage intervals, warranty family, debt ratio, credential expiry, payout conditions, and consent purpose. The four recurring alternatives represent distinct errors—delegating the decision to a provider, leaving its type in the policy, splitting interpretation across callers, or placing an ambiguous contract in a neutral package. Their feedback IDs and explanations match the selected wrong alternatives.

Microsoft’s architectural-principles guidance supports the general claim used here: dependency inversion points compile-time dependencies toward abstractions controlled by the higher-level consumer, while runtime calls can still reach implementations. It does not establish any of the fictional scenario facts; those are appropriately presented as prompt premises. [Microsoft Learn: Architectural principles](https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/architectural-principles).

Two concrete corrections remain:

1. **B05-i013** (`feedback.details.boundaryOrTradeoff`) refers to “the scenario’s inclusive-end rule,” but the prompt only says the loss date must fall inside the insured coverage period. It never states whether the interval is inclusive. This adds an unsupported premise to Details under BIZQ-01 §§4.1 and 4.4. Keep the accepted key and question ID; rewrite the sentence to say that the prompt leaves endpoint convention unspecified and the policy contract must define it, without claiming the scenario chose inclusivity.
2. **B05-i001, i002, i005, i006, i009, i010, i013, i014, i017, and i018** have a repeated option-specificity pattern: the correct choice is uniquely the longest option in all ten. For example, i001 is 26 words versus a longest distractor of 21; i005 is 28 versus 24; i013 is 28 versus 24; and i017 is 26 versus 23. The correct choice repeatedly names the policy boundary, adapter action, and case input, while distractors reuse short generic forms. This is not a demand for equal word counts; it is a concrete group-level risk under §4.3 that answer length becomes a systematic cue and that distractors are less concrete than the key. Revise the affected option sets so the wrong models are comparably specific and plausible for their stated scenario, without padding them or changing their diagnosed meaning. The other eight keys are not uniquely longest.

The repeated dependency-inversion decision is intentional practice within this one mental unit, not a requirement for 18 unique concepts. N03-B05’s accepted items also practice dependency direction with changing provider types, but these N04 prompts use different policy facts and scenarios; I do not treat that shared principle alone as a duplicate or an identity-change trigger. The wording patterns and answer-length concern above should still be considered in the later whole-N04 cross-unit review.

| Item | Decision / identity | Review |
|---|---|---|
| B05-i001 | Renewal rule vs gateway representations; retain ID | REVISE: option specificity cue |
| B05-i002 | Credit eligibility vs bureau schema; retain ID | REVISE: option specificity cue |
| B05-i003 | Delivery policy vs carrier events; retain ID | PASS |
| B05-i004 | Referral policy vs directory codes; retain ID | PASS |
| B05-i005 | Invoice invariant vs ledger types; retain ID | REVISE: option specificity cue |
| B05-i006 | Release policy vs notice-platform fields; retain ID | REVISE: option specificity cue |
| B05-i007 | Coverage limit vs carrier representation; retain ID | PASS |
| B05-i008 | Transfer risk policy vs vendor bands; retain ID | PASS |
| B05-i009 | Retention rule vs deployment configuration; retain ID | REVISE: option specificity cue |
| B05-i010 | Seat-booking overlap rule vs inventory providers; retain ID | REVISE: option specificity cue |
| B05-i011 | Moderation policy vs SDK labels; retain ID | PASS |
| B05-i012 | Grant completeness vs document tools; retain ID | PASS |
| B05-i013 | Coverage decision vs provider representation; retain ID | REVISE: unsupported endpoint premise and option specificity cue |
| B05-i014 | Warranty policy vs retailer categories; retain ID | REVISE: option specificity cue |
| B05-i015 | Loan rule vs finance DTOs; retain ID | PASS |
| B05-i016 | Badge expiry policy vs vendor timestamps; retain ID | PASS |
| B05-i017 | Payout policy vs settlement events; retain ID | REVISE: option specificity cue |
| B05-i018 | Consent policy vs storage providers; retain ID | REVISE: option specificity cue |

Copy cleanup is also advisable but not independently blocking: a few feedback strings have subject–verb agreement errors (for example, “carrier payloads supplies” in i003 and plural API/tool subjects in i012, i014–i018), and several transfer strings form awkward possessives. These do not change the mapped diagnosis, but should be corrected while editing the affected text.

This is a semantic review of the frozen B05 proposal only. It does not accept other N04 units, producer proof, consumers, native behavior, or full BIZQ-01.
