# Independent semantic review: N08-B09 v5

**Verdict: PASS for this inactive 18-question content proposal.** The v5 set resolves the v4 identity finding with a genuine primary-decision change and the corresponding reserved IDs. Its retry policies are supported by the scenarios, the three competing models are plausible, and their feedback gives case-grounded consequences. I found no remaining qualitative answer-form cue that independently blocks this unit.

## Inputs and method

- Frozen proposal: `review-inputs/N08-B09-v5.json`, SHA-256 `7068f9df47d5576317266e3e549574a4145307cfe211c6df2335b4fdb213032a`.
- Manifest: `N08-N09-MANIFEST.json`, SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`.
- Contract: `N08-N09-CONTRACT.json`, SHA-256 `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`.
- Source before file: `patternly-content/content/object-oriented-design-interview/concurrency_thread_safety_resources_and_failure_handling/OOD-N08-B09.json`, SHA-256 `093bdea05d1a2e9854c474025fea368aac46a1c70f57f4a8371c990f0461e15d`. Its bytes match the manifest's frozen `beforeSourceText`.
- The prior v4 review, SHA-256 `0a5f2a3ee5607c3eca5d750b11ad5429e27f3e2faaa89de7ab5977581c2b8152`, identified the original owner-boundary versus current retry-identity decision shift and found the v4 presentation issue resolved. I re-read the before source and every v5 whole object rather than carrying forward its conclusion automatically.
- The independent production API check is `INDEPENDENT-CHECK-N08-B09-v5.mjs` (SHA-256 `c8f4697c5f50eb36a7317fdf8e74db971984d15e3f1463e4d61b8050296d2229`) with receipt `INDEPENDENT-CHECK-N08-B09-v5.json` (SHA-256 `07f927bbf7922bc6aa3efc893c2535db31bad1eab1268ed956bb09b9026cfd12`).

The check bound all 18 before objects to the manifest and current source, validated every proposal, scored each accepted option and all distractors, checked reversed option order, and matched wrong-option feedback target sets. I compared the original and current decision for every mapped item. The report JSON contains the item-by-item findings and fingerprints.

## Primary decision and identity

The source questions ask where a retry/idempotency invariant should live: inside its enforcing object boundary or in a coordinator, exposed representation, or other boundary. V5 instead asks which operation identity should recover an uncertain outcome while preserving a distinct later operation. That is a genuine primary-decision change, not a wording change inferred from the shared unit label. Each source i001–i018 maps in order to its corresponding reserved i019–i036 question ID, and all answer and distractor IDs are fresh per replacement question. The actual manifest, source objects, current prompts, and option keys support that map.

## Decision coverage

| Source item → v5 item | Case decision tested |
| --- | --- |
| i001 → i019 | Reconcile a platform change by change ID while allowing a later edit on the same platform. |
| i002 → i020 | Resolve a meter-window reservation while allowing a later interval. |
| i003 → i021 | Resolve a provider switch whose callback may outlive the caller timeout. |
| i004 → i022 | Recover a two-assignment swap without conflating a later swap by the same volunteers. |
| i005 → i023 | Recover one route proposal against its base revision; evaluate a separate proposal under its own revision. |
| i006 → i024 | Recover one campaign reward action without deduplicating later campaign actions. |
| i007 → i025 | Resolve one carrier hand-off while keeping a later carrier change distinct. |
| i008 → i026 | Resolve one repayment debit by receipt ID while allowing another repayment by the same member. |
| i009 → i027 | Recover one bracket result event while checking a later correction against current match state. |
| i010 → i028 | Retrieve findings for one submitted inspection revision while allowing a corrected revision. |
| i011 → i029 | Recover one publication run; changed input revisions are a separate run. |
| i012 → i030 | Retry delivery for one accepted comment without conflating another comment in the thread. |
| i013 → i031 | Recover a frozen offline submission; later edits are a new submission. |
| i014 → i032 | Reconcile one invoice issue before treating a corrected reissue as separate. |
| i015 → i033 | Resolve one badge revocation while keeping a later authorized reactivation distinct. |
| i016 → i034 | Resolve a print job for one approved shipment revision; a corrected revision is another job. |
| i017 → i035 | Recover one room move while checking a later move against current capacity. |
| i018 → i036 | Resolve one desired-mode command while representing a later authorized change separately. |

Each stem supplies the decisive scope facts: a stable ID for one operation, uncertain acknowledgement or completion, and a distinct later action. The keyed policy retains that operation identity to reconcile the uncertain result. The alternatives model a fresh key per attempt, a resource-wide key, or treating a timeout as rejection and compensating/reissuing. The first can duplicate an effect that may already have applied; the second can suppress the later valid action; the third guesses an outcome from silence. The wrong-option messages tie those risks to the specific sequence, reservation, event, revision, issue, or state transition in each case.

The option sets no longer append an adverse consequence to each distractor. They present competing policies, while `Reason`, `errorCorrection`, and the option-specific messages explain consequences afterward. Correct options are uniquely shortest in one item, uniquely longest in four, and intermediate or tied in thirteen. Those ranks are descriptive; no length threshold was used. The repeated retry identity principle reflects this mental unit's objective, while each case varies the operation and the consequence of confusing its identity scope.

The invoice control at i032 retains its supported stable-issue-ID reconciliation and duplicate-charge concern. Neither the prompts nor the feedback promise exactly-once delivery. RFC 9110 defines idempotence in terms of repeated requests' intended server effect and cautions against retrying a non-idempotent request without semantics that make it safe; it does not say that a stable application identifier alone provides deduplication. The proposals are assessed as design policies, not proof that a particular external provider has implemented an idempotency lookup. [RFC 9110 §9.2.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2)

## Verification and limits

The production validator/scorer check passed **18/18 valid questions, 18/18 keyed answers, 54/54 incorrect distractors, 18/18 reversed-order answers, 18/18 feedback-target sets, and 18/18 reserved identity bindings**. These checks support the encoded mapping and scoring; the semantic verdict above comes from whole-object review.

The source references were retained from the prior objects and are not relied on to establish retry protocol guarantees. Scenario premises are treated as authored fictional facts. This scoped PASS does not accept the full N08/N09 cohort, source activation, producer proof, consumer parity, admission/runtime, native/Premium, or full BIZQ-01.
