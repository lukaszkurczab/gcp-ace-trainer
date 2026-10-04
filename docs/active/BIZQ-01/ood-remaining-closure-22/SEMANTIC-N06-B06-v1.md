# Independent semantic review — N06-B06 v1

**Verdict: REVISE**

This review binds to `review-inputs/N06-B06-v1.json` (SHA-256 `9614602a58acfb90adf38b7ef76831f5c8732795161dd87885dbac419b2c0002`) and the fixed N06 manifest (SHA-256 `be9cb40617caaaa8e18a41d06039c5bab3bc56eeb911b273bf21c7523569c5c3`). I read all 18 complete proposed objects alongside their before objects, including prompt, options, answer, Reason, all Details fields, every target-ID diagnostic, and source references. Root’s 18-object/90-case receipt covers schema/scoring/reversal only, not this semantic verdict.

The accepted mental objective is ordered handlers/Chain of Responsibility. The current answer keys generally fit the visible pass/accept/deny facts, and the same question IDs remain within that archetype. The batch is not acceptable as written because the explanation and alternatives repeatedly fail existing requirements:

- Every item’s `scenarioApplication` repeats a meta-authoring sentence: “The added handler facts preserve that operation while making its local qualification and ordering observable.” It restates the prompt and does not explain which current handler qualifies, what its pass means, or when processing stops. This is an authored-quality defect under §4.4, not a request for more prose.
- Identical wrong choices appear under distinct IDs in `i004` (three copies), `i006`, `i007`, `i008`, `i009`, `i010`, `i011`, `i013`, `i014`, `i015`, `i016`, `i017`, and `i018`. `i013` and `i017` give four indistinguishable wrong answers. That leaves no distinct misconception to diagnose for those choices and conflicts with §4.3’s realistic competing alternatives.
- Many `Details.errorCorrection` fields are from different scenarios and contradict or fail to explain the current options. Examples: `i002` explains an importer/header/decoder; `i006` discusses invoice validation rather than a terminal access denial; `i010` discusses providers and stream timing rather than preserving a stable lesson identity; `i012` describes parser types and field counts instead of escalation deadlines; `i016` explains repository lookup instead of regional bundle pricing. The per-item list identifies the full affected set.
- `i014` is a partial chain: a vendor may accept some quantity and pass only the remainder. Its `mechanismOrProperty` and wrong-choice feedback describe a terminal one-decision chain, while `errorCorrection` is about duplicate notification channels. Explain continued processing, the remaining quantity, and preservation of the request identity/promise. The keyed choice can remain an ordered-chain answer if that contract is taught accurately.

| Item | Independent finding |
| --- | --- |
| `ood-n06-b06-i001` | scenarioApplication is the repeated “added handler facts” meta-template; it does not apply pass/terminal behavior to seal condition then recall. The errorCorrection otherwise aligns. |
| `ood-n06-b06-i002` | errorCorrection references a file header, importer, and decoders absent from the snapshot-backend prompt; scenarioApplication is meta-template. |
| `ood-n06-b06-i003` | errorCorrection references severity queues, tickets, and queue coverage absent from the notification scenario; scenarioApplication is meta-template. |
| `ood-n06-b06-i004` | Duplicate wrong choices and stale access-control Details make the presented alternatives/diagnoses unusable for offline submission. |
| `ood-n06-b06-i005` | scenarioApplication is meta-template; the surrounding fields mostly fit invoice reissue and retry identity, but must state what an eligible reissue handler does and when later handlers receive the invoice. |
| `ood-n06-b06-i006` | Duplicate wrong choices; errorCorrection talks about invoice checks instead of terminal revocation before schedule access. |
| `ood-n06-b06-i007` | Duplicate wrong choices; errorCorrection’s exporter/client sentence does not explain the selected wrong alternative; details remain generic for label formatting. |
| `ood-n06-b06-i008` | Duplicate caller choices; the account-type line in errorCorrection is unsupported and irrelevant to ordered room selection. |
| `ood-n06-b06-i009` | Duplicate concurrent choices; errorCorrection’s gateway/plugin/representation claims are not established by the safety-handler scenario. |
| `ood-n06-b06-i010` | Duplicate concurrent choices; errorCorrection’s provider capability, stream owner and timing claims are not about the stable progress identity. |
| `ood-n06-b06-i011` | Three duplicate choices; errorCorrection’s reviewer regional authority is unrelated to exporting one stable board snapshot. |
| `ood-n06-b06-i012` | errorCorrection is about parsing headers, typed parser results and field counts; none is visible in support escalation. |
| `ood-n06-b06-i013` | Four indistinguishable distractors; errorCorrection is about fee-first evaluation/majority voting, not the listing’s category owner and validation. |
| `ood-n06-b06-i014` | Partial consumption requires a remainder-continuation explanation, but mechanism and wrong feedback assert terminal acceptance; Details instead describe duplicate notification channels. |
| `ood-n06-b06-i015` | Duplicate concurrent choices; specific-first/code/jurisdiction claims are not the garden’s stated decision facts. |
| `ood-n06-b06-i016` | Three duplicate choices; errorCorrection describes repository lookup and endpoint changes, not bundle pricing from component inputs. |
| `ood-n06-b06-i017` | Four indistinguishable distractors; errorCorrection discusses formatter support and request formats rather than station capacity/expiry. |
| `ood-n06-b06-i018` | Duplicate rollback/events choices; otherwise the errorCorrection is directionally relevant, but scenarioApplication remains meta-template. |

For identity, all 18 old prompts explicitly name the ordered-handler/Chain objective, and their accepted key means “use ordered handlers when the request may be handled by one of several policies with a clear stop rule.” The current proposals retain that primary decision and taxonomy. I therefore recommend retaining question IDs; the operation vignettes change, but not the Chain archetype. `i014` adds partial-consumption continuation; when the correction is authored, retain its option ID only if the core accepted meaning remains “ordered handlers with a defined stop condition,” and assign a fresh option ID if the answer’s meaning changes materially. No replacement quota is implied.

These findings are tied to existing BIZQ-01 §§4.1, 4.3, and 4.4. I did not add a word-count or similarity gate. The issue is that distinct option IDs currently render identical options and that explanations are stale or meta-text. Review of the remaining N06 units and cross-unit identity is still pending; this is not source or runtime acceptance.
