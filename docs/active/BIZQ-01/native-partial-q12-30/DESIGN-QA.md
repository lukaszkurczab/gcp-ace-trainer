# Independent design review — existing partial Q12, package 30

**Verdict: PASS for the proposed bounded Q12 presentation check.** Reopening the already completed Claude session through Activity and reviewing its saved third answer is a coherent way to combine the actual partial response from package 29 with the still-unverified light/dark, maximum iOS text-size presentation conditions. The proposal preserves the ordinary result/review route and avoids creating another session or changing the active track.

The scope tracks BIZQ-01 §6: readable question/options and Details at large text in light and dark, with actions remaining reachable; VoiceOver is expressly excluded. The package narrows that requirement to the existing partial item, ordinal 3 of 10. It does not claim that this one moderate-length item covers long repaired options, the complete Q12 matrix, Premium, Q13, or full BIZQ-01. That limitation is explicit and appropriate.

The proposed route is supported by current source. Home opens Activity; Activity starts with the all-tracks filter, and its row action passes the saved session ID to the completed result. Result offers Review Answers for the same session. The review projection validates completed evidence and constructs the displayed rows from `session.itemOrder`; the review screen begins at its first occurrence, so two ordinary Next actions reach the recorded third item. Expanding Details is local component state. These steps do not submit an answer, change track, or write learning state. I verified all 11 source hashes listed in `ROUTE-PREFLIGHT.json` against the current files and checked that its target/session evidence agrees with the accepted package-29 receipts.

The environment plan is proportionate: use the existing iPhone 17 and current app, confirm the initial dark/Large state, temporarily select light then dark at `accessibility-extra-extra-extra-large`, read both settings back before each run, and restore both exact initial values in `finally` with a final readback. The app’s existing font cap remains in force, so the test is accurately described as the maximum supported iOS setting rather than unlimited in-app scaling. Root is the sole device operator. The proposal forbids answer/report/review-queue writes, session creation, track switching, account changes, reminders, installs, and service changes. A fresh read-only baseline in the packet confirms the category state matches the post-package-29 baseline; no active session or draft needs recovery.

The plan reuses package-28 repair/readability evidence only where the implementation and renderer are unchanged. That evidence shows the shared feedback path has been repaired and inspected in both themes; package 29 supplies the actual saved partial and its feedback. Package 30 still needs its own screenshots and root pixel inspection to establish the stated display conditions. A source route and earlier receipts alone are not native acceptance.

| Review dimension | Score | Assessment |
| --- | ---: | --- |
| Objective / architecture fit | 0.96 | Exercises the remaining available appearance/text-size condition on the exact stored partial answer through the ordinary read-only route. |
| Simplicity | 0.92 | Reuses one existing session, route, app, and device; no product code, fixture, or new runtime path. |
| Risk | 0.89 | State writes are excluded; simulator appearance and size are read back and restored. Root remains the only operator. |
| Maintainability | 0.94 | Small versioned route/flow and category receipts build on accepted 28/29 evidence without broadening their claims. |

Minimum score is 0.89, above the 0.8 threshold. I found no requirement-linked design blocker. The review accepts the proposal only; actual light/dark rendering, complete feedback reachability, exact environment restoration, and preservation remain implementation evidence to inspect after the run.

## Bindings and limits

- Proposal: `BRIEFING.md`, SHA-256 `b0a45dcf1a3be6af5627bfde80dac93d9bd8d9571932b60af843dfaff26e2353`.
- Route preflight: `ROUTE-PREFLIGHT.md`, SHA-256 `31d9858ad368e6657c79214184e37cc99969f1c90c2f90e721bac92e148bb047`; `ROUTE-PREFLIGHT.json`, SHA-256 `8077a9bca5b3de48ff429626115e1236470add36041544a70fbbdc8a57ab1a47`.
- Refreshed baseline: `ROOT-READONLY-PREFLIGHT.json`, SHA-256 `112b0c07a06160f945173efa58e15ba36c2ec60a92d5fa96ec2daea41840f5b6`. It records equality with the accepted package-29 after-state across the allowlisted records, profile, lifecycle fences, and notification readback; three profile metadata values remain unread.
- Prior native evidence: package-29 independent acceptance `native-partial-29/ACCEPTANCE-QA.json`, SHA-256 `6d3c6337ac9b11a0ba430aa5aba39d339326d2584dd4ff1a445dddb411e77680`; completed result `ROOT-COMPLETED10.json`, SHA-256 `dc44c46684d2ff0da432425273c8a0088460620111ffe7e57308dead50fdf621`; category preservation `ROOT-PRESERVATION.json`, SHA-256 `501b568f41ee805c9160a1b0f8ac5113bc46cede874c30ccb50451e89e11c155`.
- Existing Q12 contract: `docs/specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md`, SHA-256 `c10ce086ecd3b58d7d776a458cb453d0161ac4519ca2474deba952122ceac8a3`.
- Prior presentation repair receipt: `native-presentation-28/ROOT-PACKAGE28-ACCEPTANCE.json`, SHA-256 `ff9147b6e167f932982a6cf46ecfd49227294d6c4e6edd0cd9e37ef6cbf745a5`.
- Current route code: all 11 source-file hashes in the route JSON matched the checked-out source during this review.

This design review does not operate the simulator, establish the pixel result, prove whole-store equality, or accept Q12/BIZQ-01 as a whole. The test must remain bounded to the existing partial result and the declared theme/text-size variants.
