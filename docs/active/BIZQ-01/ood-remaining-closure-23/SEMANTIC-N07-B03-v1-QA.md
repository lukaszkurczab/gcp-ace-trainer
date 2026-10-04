# N07 B03 v1 semantic review

**Verdict: REVISE.** Frozen input review-inputs/N07-B03-v1.json SHA-256 97cdc4698077a34576da5762805782c17edd34bcb08345d363df779c8b849865; source patternly-content/content/object-oriented-design-interview/persistence_repositories_serialization_and_domain_boundaries/OOD-N07-B03.json SHA-256 375090ab835f289e5edd2574dffff666c107e6193748af12b15496cbdfde2409.

### Scope and basis

Independently reviewed all 18 whole objects against their exact manifest before objects: prompt and constraints, the accepted option resolved by `answer.optionId`, every distractor and its keyed diagnostic, Reason, all five Details fields, source references, and question/option identity. The root mechanical check covers 18 objects and 90 original/reversed option-scoring cases; it establishes structure and scoring, not semantic acceptance.

The only blocking finding is **i006**. Its prompt specifies a UTC revocation timestamp and a separate door-policy code, then says the domain uses a revoked/unrevoked value and an instant. It never says the separate door-policy code encodes that status or identifies a domain value for the code. Yet the keyed answer requires translating both code and timestamp into domain values. The answer therefore relies on an unstated mapping premise, contrary to BIZQ-01 §4.1’s requirement that visible facts select exactly one option. Smallest correction: state what domain value the door-policy code represents, or remove that unexplained conversion from the key and align its diagnostics.

### Identity and whole-unit assessment

The prior accepted key is the general ORM-mapping decision: translate storage shape outside domain behavior when storage and domain rules change for different reasons. The current questions make that same decision concrete: map persisted primitive/layout into a domain value or relationship, preserve the case’s identity/history/null/order facts, and leave the stated policy or external effect to the responsible operation. The QIDs and `owner_preserves_contract` answer ID are justified for all 18; this is an instantiated version of the same mapping boundary, not a new primary mechanism solely because the example is specific.

For the remaining 17 items, the decisive data and boundary are stated visibly. Examples include exact immutable dataset/code revisions (i002), notification address outside comment persistence (i003), preserving null as distinct from zero before publication (i013), committed event sequence for export (i011), and the injected clock remaining with expiry behavior (i017). Keyed diagnostics match the specific misconception; Reason and Details generally explain why the storage representation must be translated and what the mapper does not decide. Distractors cover credible errors such as exposing raw rows/keys, replacing selected or stable references, losing history/null distinctions, and performing policy or side effects while loading. Some alternatives are deliberately extreme, but realistic competing boundary errors remain; I do not apply a numerical plausibility or option-length threshold.

### Item dispositions

| Item | Decision tested | Identity | Verdict |
|---|---|---|---|
| ood-n07-b03-i001 | integer classification code becomes named domain classification; refund policy stays downstream. | Retain QID and accepted option ID | PASS |
| ood-n07-b03-i002 | separate stored dataset/code keys are assembled into the exact immutable revision references. | Retain QID and accepted option ID | PASS |
| ood-n07-b03-i003 | comment author/revision keys become domain references; notification address lookup/effect stays separate. | Retain QID and accepted option ID | PASS |
| ood-n07-b03-i004 | compact status/encrypted storage representation becomes retryable/complete domain state; retry scheduling stays outside mapping. | Retain QID and accepted option ID | PASS |
| ood-n07-b03-i005 | header/line rows and reissue lineage become an invoice model; double-charge policy remains in billing behavior. | Retain QID and accepted option ID | PASS |
| ood-n07-b03-i006 | UTC revocation time and a purported door-policy code become badge domain values; the prompt does not identify the domain value represented by that policy code. | Retain QID and accepted option ID | REVISE |
| ood-n07-b03-i007 | versioned JSON fields become named address fields while retaining the operator-selected approved revision. | Retain QID and accepted option ID | PASS |
| ood-n07-b03-i008 | stored wall time plus resolved offset becomes the interval and room reference without resolving DST again. | Retain QID and accepted option ID | PASS |
| ood-n07-b03-i009 | integer maintenance mode and permission flags become named command inputs; movement guard stays with command behavior. | Retain QID and accepted option ID | PASS |
| ood-n07-b03-i010 | legacy lesson aliases become one stable lesson reference without migration or retirement-policy decisions on load. | Retain QID and accepted option ID | PASS |
| ood-n07-b03-i011 | event-code/payload rows become named events in committed sequence order; exporter consumes domain history. | Retain QID and accepted option ID | PASS |
| ood-n07-b03-i012 | UTC ticks and staff key become an instant and staff reference; activity-feed creation remains an operation. | Retain QID and accepted option ID | PASS |
| ood-n07-b03-i013 | minor units/currency become money and null stock stays distinct from zero; publication validates separately. | Retain QID and accepted option ID | PASS |
| ood-n07-b03-i014 | request/shipment rows become a parent-linked request with a shared delivery promise. | Retain QID and accepted option ID | PASS |
| ood-n07-b03-i015 | plot/reviewer codes become references while transfer preserves plot identity and approval history. | Retain QID and accepted option ID | PASS |
| ood-n07-b03-i016 | component IDs and fixed adjustment become references/money; quote calculation stays outside loading. | Retain QID and accepted option ID | PASS |
| ood-n07-b03-i017 | timestamps and charger key become interval/reference; expiry uses the reservation operation’s injected clock. | Retain QID and accepted option ID | PASS |
| ood-n07-b03-i018 | repeated tag rows become one asset’s tag set, rights code becomes a domain value, and asset identity remains stable. | Retain QID and accepted option ID | PASS |

### Limits

This is a B03 unit review, not final N07 cross-unit acceptance. It makes no producer, source activation, runtime, consumer, admission, native, Premium, or full-BIZQ-01 claim.
