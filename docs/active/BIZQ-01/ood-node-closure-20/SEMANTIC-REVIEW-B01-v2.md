# Independent semantic review: OOD-N04-B01 v2

**Verdict: REVISE this frozen proposal before source activation.** This review binds to proposal SHA `f2641a526da48df3ce473532e2f9bd7df9d59c9c70d2dc5c4ab7f7dcd05da7ce`, notes SHA `bcecefc2ca66e73f8e340ab8e176d225e897c8bb79895558d6f4a365ab9dfaf7`, manifest SHA `74f929fef0122d1d75412e07d6b86ab2b634056dd0ed0a98a7051baca7e0eec0`, and current source SHA `3f7bfd0223ac5f8b67d343b8ec379240607e97cabd6f01afb6215aad9678fad6`. Proposal and notes hashes match `ROOT-B01-B05-V2-PRESERVATION.json`; the frozen delta is five changed whole objects and 13 unchanged objects. This is an independent semantic review, not structural or source-admission acceptance.

The B01 objective is interface contracts, abstraction, and information hiding. I reused the v1 whole-object conclusions only for the 13 byte-identical objects, then reviewed all five changed prompts, options, keys, Reasons, Details, and option-targeted messages: i019, i023, i026, i030, and i035. The changed objects close the earlier B01-i019 caller-authority gap, replace the i023/i026 overlaps with distinct projection and status-result decisions, remove i030’s unsupported “sensitive” diagnostic, and replace i035’s implausible `void()` distractor. Their corrected options and explanations align with the visible facts.

## Blocking findings

All three findings are single-answer ambiguities under existing BIZQ-01 §4.1. The proposed keys are sensible designs, but a competing option still satisfies the facts the learner sees.

1. **B01-i020 — dispatch-side consent enforcement is not required by the stem.** The prompt says the desk may submit only when consent is active and that the specialist must not receive the internal ledger. It does not prohibit the desk from reading consent state or building the summary itself. Option `n04b01_02_authority` therefore describes a feasible design under the stated facts; the audit client remains separate and read-only. Details adds that another dispatch path might bypass the desk, but the stem specifies no other dispatch client or requirement for a server-side check. To make the key unique, state that only the dispatch boundary may read/decide consent and that it must check consent as part of submission, or revise the alternative so it clearly violates a stated constraint.
2. **B01-i024 — reading a fixed expiry is compatible with the stated screen role.** The grant has a fixed expiry, and the resource screen only needs to know whether access is currently permitted; it may not extend or edit grants. Option `n04b01_06_authority` exposes the expiry timestamp for read-only comparison and does not violate either restriction. The prompt does not assign effectiveness calculation to the grant owner or forbid clients from interpreting the expiry. Add a visible policy/ownership boundary that requires an effective-access query, or replace the alternative with one that grants the forbidden edit authority. Do not rely on unstated revocation, suspension, or time-policy complexity.
3. **B01-i033 — typed failure detail is not required.** The stem requires acknowledgement and temperature-band checks to pass before assignment, but does not require the dispatcher to learn which check failed. Option `n04b01_15_caller` returns accepted/rejected and can still enforce both checks and avoid assigning the carrier early. The key adds a typed acknowledgement/band failure result; Details invents a need to address the specific rejection. State that the dispatcher must display or resolve the failing condition, or make the generic-result alternative violate another visible contract. Keep the stable ID if the primary handoff decision remains unchanged.

## Other review findings

**The other 15 items PASS.** In particular, v2 resolves all prior item-level findings: i019 now gives inspection and swap different capabilities; i023 is a storage-independent pass projection rather than a repeat of accepted recording replacement; i026 is a read-only typed three-state payout observation rather than a payout retry; i030 states an atomic pair-swap command with the required blocker identity; and i035 replaces the implausible `void()` choice with a realistic check-then-write race alternative. Their decisive facts appear in the prompt, and the wrong-option diagnostics match the revised option meanings.

**The earlier cohort length concern is materially reduced and is not an additional blocker.** Using whitespace-delimited words, the keyed option is uniquely longest in five of 18 items and tied for longest in four; in the other nine it is shorter than at least one distractor. The remaining longer keys (i023, i025, i033, i034, i036) enumerate scenario-required fields or outcomes rather than share one answer template. The corrected option sets also have concrete alternatives. In particular, i033’s extra diagnostic specificity is addressed as a visible-premise ambiguity above, not a separate length rule. This does not establish a word-count threshold or require equal-length options.

All 18 replacements use their reserved new IDs. The five corrections retain the new proposal identities because they still ask distinct decisions within the same B01 mental unit; the changed i023 and i026 are no longer duplicative of accepted N01-B02-i018 and i021. The other unchanged v1 item dispositions are reused only because their whole-object bytes match the frozen v2 preservation record. Scenario guarantees are treated as authored premises; references support the general interface-contract concept, not the fictional scenarios.

This review covers B01 v2 only. It does not accept the other N04 units, source implementation, consumer, native behavior, or full BIZQ-01.

| Item | Disposition |
|---|---|
| B01-i019 | PASS — changed caller capability is now explicit |
| B01-i020 | **REVISE — desk-side consent read/build remains compatible** |
| B01-i021–i023 | PASS — i023 is a distinct persistence projection |
| B01-i024 | **REVISE — fixed-expiry comparison is an allowed read-only alternative** |
| B01-i025–i032 | PASS — including corrected typed status, atomic swap, and diagnostic |
| B01-i033 | **REVISE — generic accepted/rejected can satisfy the stated handoff contract** |
| B01-i034–i036 | PASS — including the revised realistic i035 alternative |
