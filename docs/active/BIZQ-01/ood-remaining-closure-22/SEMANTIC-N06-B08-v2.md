# Independent semantic review — N06-B08 v2

**Verdict: PASS for this frozen unit.** Proposal SHA-256 7800c2a9bb1baa3fcfbb88f6120d7f28eb038c4059922f3f18baf1a032d1e702; author notes SHA-256 32336beac85504290ce963f1304ab19df982a6809f46af2db5073057549e0bc2. I compared all 18 before/current complete objects, resolved keyed answers by answer.optionId, and checked scenario facts, every option, Reason, five Details fields, keyed feedback, and identity.

The accepted predecessor decision is to separate traversal from the operation when their variation and ownership boundaries differ. Current keys retain that decision. The prompts now make the mechanism choice concrete: homogeneous ordered records with shared scans and collection-owned storage support an iterator boundary; stable heterogeneous node types with new type-specific operations support visitors while the structure retains containment. The wrong answers and diagnostic messages are generally targeted to those stated tradeoffs. Preserve all 18 question IDs; use current option IDs for the newly case-specific choices.

All 18 current keyed choices carry the existing console’s sole-longest advisory. The stem facts describe the exact collection shape and ownership contract needed to choose between traversal mechanisms, so key length alone does not show answer disclosure. The keys and distractors state different structures; this is a qualitative §4.3 consideration, not an automatic rejection or word-count threshold.

**Limits:** unit-level proposal review only; no source integration, producer migration, N06-wide/cross-unit acceptance, app admission, native execution, or full BIZQ-01.

| Items | Disposition |
|---|---|
| i001–i018 | PASS; preserve question IDs. Keys, explanations, and feedback align with the visible traversal/operation contract. See JSON for per-item fingerprints and accepted meanings. |
