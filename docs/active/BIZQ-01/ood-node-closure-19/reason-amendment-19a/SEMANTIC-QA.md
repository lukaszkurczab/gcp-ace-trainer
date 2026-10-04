# Independent semantic review — Reason amendment 19a

**Verdict: PASS.** All 25 proposed Reasons identify a decisive scenario fact and connect it to the unchanged answer without merely paraphrasing the keyed option or introducing a new premise. The review is limited to this frozen payload.

## Frozen scope

- Manifest SHA-256: `725750aa6c8ebdba357f2e892e7c6aa94c45202a97c677d41284b8d063e199bf`
- Proposal SHA-256: `76fd88c540bd1b6ffe83eb2034cbf565b2ac030454e80511e56a341555edfa15`
- Actual source arrays checked: B02 `c578f0d66d3bbbf0c3f76da302ad27c3f6339573bca6fdff3e3a1f00041859f3`, B03 `ba18ba56cfbacee3a5f27bde8261e7398074b1ff506b1b6100a1e1f9f1ac6ed5`, B08 `fc5e6d5a64bc34054bedfd0a6d6ba9b6689a5d99f43d7b640bc14832970853e8`.
- Criterion: [BIZQ-01 §4.4](../../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md). It requires a concise Reason that identifies the decisive condition and decision and does not paraphrase the correct option or consist of praise. Reusing prompt terms is acceptable when the explanation adds the causal link.

I read each complete source question, including its prompt, options, keyed answer, existing feedback and Details. The source file hashes and each whole-object hash match the fixed manifest; each proposal’s `beforeReason` and intended decision match the actual source. Every item passes independently:

| Question | Verdict | Semantic basis |
| --- | --- | --- |
| `ood-n03-b02-i019` | PASS | Names the two required client directions and the transaction boundary the prompt explicitly supplies; it explains why both traversals are needed. |
| `ood-n03-b02-i020` | PASS | Connects assignment detail to its stored reference and distinguishes shift listing/profile lookup paths, matching the prompt’s client routes. |
| `ood-n03-b02-i021` | PASS | Uses the captured exact revision and existing parent-ID query to explain why only the Edit-rooted model path is needed. |
| `ood-n03-b02-i022` | PASS | Ties character-rooted eligibility to its revision and separates claims/rule screens, supporting the one-way association without invented clients. |
| `ood-n03-b02-i023` | PASS | Identifies clients starting from both ends and the stated reassignment transaction as the consistency boundary. |
| `ood-n03-b02-i024` | PASS | Explains why posting needs Allocation→Account while the durable account-keyed index supplies history lookup. |
| `ood-n03-b02-i025` | PASS | Relates the forfeit traversal to Match→Bracket and the slot-indexed repository to reverse listing. |
| `ood-n03-b02-i026` | PASS | Uses the two named screen starting points and atomic writer to justify paired navigation and consistency. |
| `ood-n03-b02-i027` | PASS | Connects exact input provenance to Snapshot-rooted references and absence of artifact-rooted clients. |
| `ood-n03-b02-i028` | PASS | Separates revision/annotation detail traversals from author search already served by the index. |
| `ood-n03-b02-i029` | PASS | Explains submission-rooted comparison to the exact baseline and why the other lookups do not require reverse navigation. |
| `ood-n03-b02-i030` | PASS | Names both direct client traversals and the single writer that maintains the paired relationship. |
| `ood-n03-b02-i031` | PASS | Identifies Door and BadgeAssignment as required traversal roots and correctly keeps holder lookup with the directory. |
| `ood-n03-b02-i033` | PASS | Connects calendar/detail traversal needs to the atomic move operation; retained canceled history is consistent with the prompt. |
| `ood-n03-b02-i034` | PASS | Explains the exhibit-rooted guard and shared policy registry without adding a policy-to-exhibits client. |
| `ood-n03-b02-i036` | PASS | Names timeline and event-detail traversal directions, their transaction owner, and separate directory lookup. |
| `ood-n03-b03-i019` | PASS | Distinguishes expiry of authorization from retention of the specifically required audit record. |
| `ood-n03-b03-i020` | PASS | Separates closing future decisions from retaining already signed compliance evidence, exactly as the prompt requires. |
| `ood-n03-b03-i021` | PASS | Identifies cancel versus submit as the lifetime boundary and explains why session cleanup cannot affect the copied permanent record. |
| `ood-n03-b03-i023` | PASS | Separates immediate secret invalidation from replay-marker expiry and the explicitly retained account/audit. |
| `ood-n03-b03-i028` | PASS | Distinguishes the temporary hold from a durable confirmed Booking and applies the prompt’s two outcomes. |
| `ood-n03-b03-i030` | PASS | Uses the exact revision retained by completions to explain why retirement affects enrollment but not historical identity. |
| `ood-n03-b03-i032` | PASS | Relates immutable per-event values to preserving history while current assignment changes on the conversation. |
| `ood-n03-b03-i033` | PASS | Uses pinned prior revisions to explain why publishing creates a retained successor and cancellation affects only the draft. |
| `ood-n03-b08-i021` | PASS | Connects continued caller use to the consequence of library disposal and states the borrowed-resource ownership boundary. |

The B02 explanations ground navigation decisions in the stated caller starting points, available query/index paths, and named update boundaries. The B03 explanations separate state/record lifetimes using the explicit expiry, withdrawal, submission, confirmation, retirement, or revision facts. B08-i021 ties the caller’s continued stream use to the disposal consequence and ownership boundary. I found no hidden premise or changed decision in these proposed Reasons.

This accepts semantic quality of the 25 frozen strings only; source integration and its existing proof, consumer, admission, and release checks remain outside this review. Full BIZQ-01 closure, native acceptance, and Premium behavior are not claimed. Item-level source and object hashes are recorded in [`SEMANTIC-QA.json`](SEMANTIC-QA.json).
