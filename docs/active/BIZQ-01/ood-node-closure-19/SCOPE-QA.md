# Independent N03 scope and preflight QA

**Verdict: PASS for the proposed full-N03 scope and conditional identity policy.** This is a read-only source-scope review. It is not acceptance of any future replacement, source implementation, runtime/admission change, N03 session eligibility, native/Premium behavior, or full BIZQ-01 closure.

I reviewed all 162 current N03 objects in the nine unit files at content HEAD `90a1d83859c2be83c5266ffe981f487d3c29aeeb` before reading the author’s final preflight. I then compared the completed `MANIFEST.json` (SHA-256 `c344367f12072c110761664825bd95c6f40334eea89296cb56e9787ab847fe73`) against those sources. All nine manifest source hashes match the current files; each file has 18 questions in the stated i001–i018 order, and the per-item rows cover all 162 objects. The manifest binds 162 candidate mappings and keeps the mappings conditional on the item’s final semantic change.

## Why the whole node belongs in scope

The defect is deeper than malformed feedback. Across the units, the prompt states a generic business operation and names the unit lens, while the keyed answer repeats one generic rule and the same four caricature distractors recur. The case usually does not supply the facts that distinguish the named design decision. The coordinator distractor’s feedback is malformed template substitution in every item; the other feedback also repeats broad diagnoses instead of explaining an item-specific competing choice. A wording/feedback-only repair would leave the decision-selection problem in place for most items.

| Unit | Missing decision facts visible in the current cases |
|---|---|
| B01 — Associations, aggregation, composition, multiplicity | Relationship endpoints, cardinality, sharing, and whole-part lifetime are generally absent. A repayment invariant or plot transfer alone does not select multiplicity or composition. |
| B02 — Navigability and references | Prompts do not describe an object graph, client navigation path, or need/cost for reverse references. A provider switch or stable export state does not determine reference direction. |
| B03 — Ownership, lifetime, deletion | Some cases mention expiry, immutability, or idempotency, but do not assign creation, use, release, retention, or deletion responsibility to dependent objects. |
| B04 — Composition versus inheritance | A domain invariant does not establish a substitutable subtype, an independently replaceable collaborator, or the relevant caller-contract/lifecycle distinction. |
| B05 — Dependency direction and stable abstractions | A few cases mention provider/recording replacement, but generally omit the stable policy, volatile mechanism, dependent client, and change pressure needed to decide dependency direction. |
| B06 — Cycles, cohesion, package boundaries | The cases provide no dependency/import graph, cycle, or co-change evidence. A stable identity or outcome does not establish a package-boundary decision. |
| B07 — Dependency injection and service lifetime | Business operations do not define a composition root, dependency graph, resource lifetime, request/session scope, or scope mismatch. |
| B08 — Resource ownership and cleanup | The cases name no acquired resource or cleanup boundary to reason about on success, error, or cancellation. A legal business-state transition is not a resource-disposal case. |
| B09 — Visibility and internal APIs | The cases identify no module clients, public/internal operations, representation, or change boundary from which to choose an API surface. |

There are partial topical fits, especially B03’s expiring role, B04’s battery replacement, and B05’s provider switch. They still do not determine the keyed answer against realistic alternatives; in the battery case, exclusive assignment alone does not distinguish a subtype from a replaceable collaborator. These are not reasons to reduce the scope to feedback cleanup. They are prompts for the eventual author to make the smallest case-specific facts decisive and retain any sound existing objective where possible.

The malformed-feedback heuristic and older audit are corroboration only. The final manifest records exact source fingerprints and per-item visible-fact gaps; these align with the current source review. Neither the 162-row count nor the wider 1,125-match scan is itself a semantic verdict. The first just bounds this node’s documented cohort; the second does not justify including N04–N09.

## Identity and boundaries

The full-node inclusion is justified because the same substantive mismatch and malformed message recur across all nine current units. A smaller subset would leave that defect family active in the other N03 files. The evidence does not justify replacing other nodes or widening ordinary pools.

The current `i001–i018 → i019–i036` map is acceptable only as a conditional replacement map. Under `docs/07-content-guidelines.md` §3.3/§5C, a changed primary decision or accepted-answer meaning requires a new question ID; a repair that preserves the item’s decision and accepted meaning keeps its existing ID. Changed distractor meanings require fresh option IDs. I do not accept a blanket instruction to assign new IDs to every row before the authored objects exist. Record the identity action on each final whole object, then bind that exact action in the fixed proof.

The updated proposal to share one internal strict validator body between only the private source17/source19 descriptors is sound if the descriptors remain literal, closed code-owned values and all existing source17 guards remain in force. The proof must not supply its own approved scope or override those descriptors. The source17→16→13→12→11 historical reconstruction remains private validation; it grants no runtime or N03 pool eligibility.

The final briefing’s scores are fit 0.94, simplicity 0.85, risk 0.83, and maintainability 0.86 (minimum 0.83). Those scores reflect the refined private-validator plan; the separate author preflight’s manifest records its own independent scores. Both exceed the 0.8 floor. The material reason to proceed is the concrete N03-wide defect, with per-item semantic review controlling the risk of replacing 162 items.

No source, manifest, proof, catalog, tests, pools, or status were changed in this review. The next acceptance decision belongs to the authored whole objects and their item-specific identity actions, before any source activation.
