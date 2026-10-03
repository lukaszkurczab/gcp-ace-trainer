# OOD-N01-B01 cohort 13 authoring notes

This is an authoring record for the proposed 15 replacements in [PROPOSAL.json](PROPOSAL.json). It is not a semantic acceptance record and does not change canonical content, proof, runtime behavior, content version, or admission.

## Evidence and boundary

- The exact pre-edit source identity is recorded in `PREFLIGHT.json`: SHA-256 `46e72823ccc000657a4070193c4ef0bf7604f6508d9432208237471395657379`, 17 questions. The source still has i003–i017 repeating the same owner/invariant answer with generic alternatives; i018 and i019 remain the accepted adjacent examples and are preserved.
- The unit contract is actors, goals, use cases, domain vocabulary, and model boundaries. The authored questions make the actor, goal, subject, alternate result, and material conditions explicit in the stem. They do not put the accepted decision in constraints or name a pattern as a clue.
- Primary reference for UML actor/use-case/subject semantics: [OMG UML 2.5.1 normative PDF](https://www.omg.org/spec/UML/2.5.1/PDF), specifically the use-case metamodel and use-case/subject material referenced in the existing [source12 reference check](../ood-source-preflight-12/SOURCE-REFERENCES.md). Source12 records that the normative text supports actor/stakeholder value, offered subject behavior without prescribing internal structure, and variations including exceptional behavior/error handling. Scenario-specific promises in this proposal (for example, atomic preservation on a conflict or timing of a booking update) are authored constraints, not claimed as UML guarantees.
- Current BIZQ-01 requirements: [quality specification](../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md) and [content guidelines](../../../../../docs/07-content-guidelines.md). New IDs are used because the primary instructional decisions and answer meanings change. Every new option identity is also new; the original identities describe the old repeated decision.

## Per-item decision map

| Retired → proposed | Primary objective | Nearest misconception diagnosed |
|---|---|---|
| i003 → i020 | Business responsibility vs person/account identity | Treating an account, screen, affected volunteers, or internal validator as the initiating actor |
| i004 → i021 | One person acting in distinct roles with distinct goals | Merging the registrar and residence-coordinator interactions because one person uses one account, or substituting the recipients/system for those roles |
| i005 → i022 | Requesting actor vs beneficiary and responding external participant | Assigning the clerk-facing goal to the patron who benefits, or treating the responding partner system as the goal owner or subject |
| i006 → i023 | Actor outcome vs interface action | Confusing a button click or immediate revocation with scheduled termination |
| i007 → i024 | External event sender vs time condition | Treating midnight, a clerk, or an internal/externalized checker as the interacting role |
| i008 → i025 | External system actor vs human organization | Naming bank staff or data records where the gateway is the actual boundary-crossing participant |
| i009 → i026 | Customer goal and subject vs payment dependency | Modeling PayLine or a storage row instead of the traveler-facing booking behavior |
| i010 → i027 | Domain deliverable vs internal computation | Substituting byte rendering, digest calculation, or premature access for certified issuance |
| i011 → i028 | Multiple actor roles sharing one use-case goal and contract | Splitting identical report behavior by person, treating a direct requester as supporting, or making the reported fixture an actor |
| i012 → i029 | Stakeholder requirements vs actual subject interaction | Treating a policy-setting panel, beneficiary, or data record as an actor when the supervisor alone interacts with the subject |
| i013 → i030 | Primary goal owner vs supporting actor | Confusing a supporting external authority, event condition, or subject with the dispatcher’s goal |
| i014 → i031 | Boundary-relative actor/subject classification | Treating “API” as a permanent actor label or ignoring the expressly changed subject |
| i015 → i032 | Actor goal vs policy evidence | Modeling an approval record or one prerequisite check instead of the access decision requested |
| i016 → i033 | External actor participation through a one-way notification | Requiring every actor to issue a command, or misclassifying an internal trigger/indirect recipient as the external participant |
| i017 → i034 | One coherent goal vs feature bundle | Bundling adjacent clinic capabilities or violating the confirmed-replacement state boundary |

## Object and feedback contract

Each `newQuestion` keeps the existing `choice_single` / `exact_selected_set` contract and the current track, node, and mental-unit IDs. Each object includes a concise authored Reason, all five existing Details dimensions (`mechanismOrProperty`, `scenarioApplication`, `boundaryOrTradeoff`, `errorCorrection`, `transfer`), and a `wrong_option` message keyed to every distractor's stable option ID. The distractors represent distinct interpretation errors and the prompt supplies their deciding facts before submission. Correct options vary in position in the serialized option list.

## Acceptance still required

The proposal must be checked against the actual current source and the existing cohort verifier contract before implementation. Independent semantic QA must review each objective, uniqueness from accepted i018/i019 and the other proposed items, correctness and plausibility of every option, visible decision facts, feedback-to-option mapping, and UML attribution. Schema/scoring/ID/source-preservation checks and every downstream admission/runtime/release check remain with their existing owners. Passing this authoring check alone does not accept the cohort or establish full-unit or full-bank quality.

## Revision after independent semantic QA

The independently reviewed v1 is preserved at `REVIEWED-PROPOSAL-v1.json` (SHA-256 `8545db0756d07894c8881119a429a174be934891fb997356c3f5c1437ccbfa00`). In v2, all 15 proposed objects omit the optional `constraints` field: the stems already state the material scenario facts, while the prior lists also repeated actor/subject classifications that would be displayed before answering. This removes those labels without inventing replacement constraints. Item i031's two false classifications and i033's false outcome claims were removed with their full lists. The i024 feedback for `deadline_checker_actor` now explains that an internal PermitOffice checker would not be an external actor, and directly binds the diagnosis to the prompt's no-internal-timer fact and CalendarService sender.

The v1 reviewer also identified possible overlap among i022/i029, i024/i025/i028, and i023/i027. V2 revised i028 to multiple actor roles sharing the same use-case contract and i029 to a non-interacting policy stakeholder versus the actual requester. The v2 semantic review accepted those fixes but found i021, i022, and i033 blocked. The unchanged frozen-v2 artifact is `REVIEWED-PROPOSAL-v2.json` (SHA-256 `da1f78be9b1b9db66f9072d9caa12098d5db343d9b7976b1eb6d0cc355076be5`).

## Revision after independent semantic QA v2

The v3 change is limited to i021, i022, and i033 plus this item map. i021 now models one person exercising two roles with separate goals and results in the same subject; this differs from i020's single interaction contrast between business role and account identity. i022 keeps the clerk-facing loan request but replaces the implausible book-as-actor alternative with a responding partner system and a plausible competing subject/goal model; the prompt states the partner system actually exchanges a response with LendingExchange. i033 now tests that an external system can participate by receiving a one-way warning, without a command channel. Its stem states which components are internal and who receives/routes the outgoing message. These objectives follow UML 2.5.1's actor as an external role interacting with a subject through signals/data (the source12 primary-reference check cites §§18.1.3.1 and 18.2.5); they do not assert that every interested party or internal event is an actor.

All five Details fields, Reason, option text, and option-ID feedback were authored for the changed decisions. The 12 other proposed objects are byte-for-byte unchanged from frozen v2; accepted canonical i018/i019 and the frozen v1/v2 review artifacts remain untouched. V3 still requires independent semantic review of the changed objects before any canonical source edit.
