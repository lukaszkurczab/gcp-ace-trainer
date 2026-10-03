# BIZQ-04 completed-result integrity implementation

The Coding completed-result facade now verifies the stored completion and its committed attempts against the saved occurrence plan before constructing result or answer-review feedback. It resolves the exact saved package once, validates response completeness and canonical score parity, checks the ordered result partition and aggregate counts/points, and reuses those resolved questions for the projection. Inconsistencies return `summary_unavailable`; the abandoned-summary path is unchanged.

The validator does not require a particular result-ID string format or a newly mandatory historical fingerprint. Existing fingerprints are checked when present. Completion timestamps compare as instants, and no extra foreground-time consistency gate was added. No writes, selectors, scoring rules, persistence schemas, content, Premium policy, or shared runtime code changed.

Changed owned files:

- `src/application/coding-interview/codingInterviewSessionFacade.ts`
- `src/application/coding-interview/codingInterviewCompletedResultIntegrity.test.ts`

Verification run from the repository root:

- `node --import tsx --test src/application/coding-interview/codingInterviewCompletedResultIntegrity.test.ts src/application/coding-interview/codingInterviewSimulationResult.integration.test.ts` — passed, 14 tests. Covers valid completed practice, completed conditional reinsertion, the real 40-item Mock result path while exact content validation is deliberately pending, the existing abandoned-summary path with no read writes, source-session orphan/duplicate/missing attempts, scorer mismatch, wrong family/session/time/coverage/counts/points, invalid response, track/mode/item/artifact mismatch, unrelated-session attempts, and no storage mutation on unavailable projections.
- `npm run typecheck` — passed.
- `npm run validate:content-boundary` — passed.
- `npm run validate:runtime-privacy-boundary` — passed.

The checks use actual content and memory-backed repositories with the existing Premium authorizer stub. They do not establish native storage/provider behavior. Root's separate actual-runtime probe is recorded in `ROOT-RUNTIME-GREEN.log`; it confirms the original out-of-plan orphan attempt now produces `summary_unavailable` without changing history. Independent acceptance review remains separate from this implementation record.
