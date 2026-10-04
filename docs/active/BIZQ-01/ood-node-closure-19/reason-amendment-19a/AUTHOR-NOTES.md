# Authoring notes — reason amendment 19a

This is an unaccepted proposal for exactly 25 `feedback.reason` strings. It preserves each item’s question/option IDs, answer, prompt, options, Details, diagnostics, scoring, and taxonomy. Each `beforeReason` was copied from the actual source object after checking the fixed packet manifest hash; no production source was edited.

## Source bindings

| Source file | SHA-256 |
|---|---|
| `content/object-oriented-design-interview/relationships_composition_ownership_lifecycle_and_dependencies/OOD-N03-B02.json` | `c578f0d66d3bbbf0c3f76da302ad27c3f6339573bca6fdff3e3a1f00041859f3` |
| `content/object-oriented-design-interview/relationships_composition_ownership_lifecycle_and_dependencies/OOD-N03-B03.json` | `ba18ba56cfbacee3a5f27bde8261e7398074b1ff506b1b6100a1e1f9f1ac6ed5` |
| `content/object-oriented-design-interview/relationships_composition_ownership_lifecycle_and_dependencies/OOD-N03-B08.json` | `fc5e6d5a64bc34054bedfd0a6d6ba9b6689a5d99f43d7b640bc14832970853e8` |

Manifest: `reason-amendment-19a/MANIFEST.json`; fixed scope: 25 items (16 B02, 8 B03, 1 B08).

## Item-level intent

| Question | Existing learning objective | Why the new Reason adds causal support |
|---|---|---|
| `ood-n03-b02-i019` | Expose both traversals only where the session and provider operations each require a direct object path. | Connects the opposite starting points and unavailable index to why the association needs both traversal ends, then grounds coherence in the prompt’s transaction. |
| `ood-n03-b02-i020` | Expose the stored volunteer reference because assignment detail follows it, while keeping profile listing repository-backed. | Uses the detail path and two alternative query paths to explain why only Assignment-rooted traversal is needed. |
| `ood-n03-b02-i021` | Keep edit-to-parent traversal and use the existing query for reverse edit lookup. | Explains that exact captured provenance requires Edit→Revision while reverse lookup is query-backed. |
| `ood-n03-b02-i022` | Let a character read its pinned campaign revision without storing a claims collection on the revision. | Explains that the live eligibility read begins at Character and that the other two clients are not reverse traversals. |
| `ood-n03-b02-i023` | Support both shipment-to-carrier and carrier-to-shipment clients with one coordinated membership update. | Ties each direct end to a named client and the reverse-membership update to the given reassignment transaction. |
| `ood-n03-b02-i024` | Use a durable account-keyed query for history instead of storing a redundant inverse object collection. | Distinguishes a required exact owner reference from a reverse lookup already satisfied by the account-keyed index. |
| `ood-n03-b02-i025` | Expose match-to-bracket for the forfeit handler and leave match listing to its indexed repository. | Explains the forfeit handler’s Match-rooted reference and the renderer’s independent indexed path. |
| `ood-n03-b02-i026` | Provide both required report/item paths and update them atomically because both screens traverse the link. | Identifies both roots that require traversal and the atomic writer as the scenario’s consistency mechanism. |
| `ood-n03-b02-i027` | Expose snapshot-to-input provenance while leaving shared-artifact reverse search to its indexed query. | Connects exact version provenance to the Snapshot-rooted viewer while explaining why shared inputs need no reverse collections. |
| `ood-n03-b02-i028` | Support revision-to-annotations and annotation-to-revision/author while avoiding an unneeded author collection. | Separates the revision and annotation client paths from the author’s indexed query. |
| `ood-n03-b02-i029` | Expose only submission-to-route-revision because revision clients do not enumerate submissions. | Explains submission-rooted baseline comparison and why neither compliance search nor route editing calls for reverse object navigation. |
| `ood-n03-b02-i030` | Keep order and issue traversals because each named client starts at the opposite endpoint. | Ties each direction to its named consumer and identifies the single writer’s link-maintenance responsibility. |
| `ood-n03-b02-i031` | Expose door assignment collection and assignment-to-door while keeping holder lookup directory-backed. | Explains Door-rooted access checking and assignment-rooted detail, while placing holder lookup on its separate directory path. |
| `ood-n03-b02-i033` | Support room calendar and booking detail traversals with one coordinated move operation. | Connects both object roots to real clients and explains how the move transaction preserves current membership without erasing history. |
| `ood-n03-b02-i034` | Expose exhibit-to-policy only because policy consumers do not traverse back to exhibits. | Explains the policy reference needed by the Exhibit-rooted guard and why registry lookup removes a policy-rooted traversal need. |
| `ood-n03-b02-i036` | Support timeline and event detail paths while keeping author search in the staff directory. | Identifies both conversation-event client paths and distinguishes their transaction from separate staff lookup. |
| `ood-n03-b03-i019` | Separate a grant’s authorization expiry from retention of its approval evidence. | Explains the difference between ending authorization and preserving the specific audit record required by the prompt. |
| `ood-n03-b03-i020` | Close a withdrawn request to new decisions while retaining already signed decision records. | Distinguishes closing the active request from retaining its already committed signed decisions. |
| `ood-n03-b03-i021` | Keep cancellable editor drafts session-owned and create the durable inspection as a distinct committed object. | Uses the copy-on-submit boundary to explain why editor cleanup governs drafts but not the permanent submitted object. |
| `ood-n03-b03-i023` | Consume a one-time recovery secret on success while retaining only a replay marker through the fixed expiry. | Separates immediate secret consumption from the longer replay-marker window, without expanding the account/audit lifecycle. |
| `ood-n03-b03-i028` | Expire an unconfirmed temporary hold without creating a booking; confirmation creates the durable booking. | Names confirmation as the durable-object boundary and expiry as removal of only the temporary hold. |
| `ood-n03-b03-i030` | Retire a lesson revision from new enrollment without severing existing completion history. | Explains that completion history depends on the exact old revision identity even after enrollment closes. |
| `ood-n03-b03-i032` | Update current assignment and append an immutable event without rewriting prior escalation history. | Explains why historical event values stay immutable while a new assignment is represented in current state and a new event. |
| `ood-n03-b03-i033` | Discard only an unpublished draft; publish a new retained revision and preserve prior revisions for orders. | Uses pinned order references to explain retained revision identity and separates cancellation of a draft from publication. |
| `ood-n03-b08-i021` | Distinguish borrowed resources from resources the component owns. | Connects post-return caller use to the ownership consequence for disposal, beyond echoing the prompt’s retention premise. |

The wording relies only on facts already visible in each prompt and the existing explanation. It does not change the accepted decision or make new technical guarantees. Independent semantic review is still required before any source change.
