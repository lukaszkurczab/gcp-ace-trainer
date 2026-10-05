# Independent semantic review: N08-B03 v2

**Verdict: REVISE.** The v2 items retain their question and accepted-option identities and improve the case-specific alternatives. One visible retry requirement in i002 is not guaranteed by the keyed operation.

## Bound inputs and verification

- Proposal: [N08-B03-v2.json](proposals/N08-B03-v2.json), SHA-256 `0cb7df8cfb1c70ba4bfe488e3a657e5bd308602ec928a75df7757ac793e3788b`.
- Before source: `content/object-oriented-design-interview/concurrency_thread_safety_resources_and_failure_handling/OOD-N08-B03.json`, SHA-256 `f5d4bddc1bff1672949c81722bb919e15ed204a923a86726e9aae1a4b0969d41`; manifest binding `f5d4bddc1bff1672949c81722bb919e15ed204a923a86726e9aae1a4b0969d41`.
- Manifest SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`; contract SHA-256 `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`.
- Prior v1 review SHA-256 `0249082360d4bd9e93c760c19200e51ef37928123247c35b6f726e8a130be4cd`. I independently reviewed the whole v2 objects rather than carrying forward the prior verdict.
- I read each prompt, constraints, options, answer, Reason, all five Details fields, and every option-targeted message. Fingerprints use repository `canonicalJson(question)` followed by SHA-256.

The actual validator accepts all 18 questions. The actual scorer accepts all 18 keyed responses, rejects all 54 wrong-option responses, and accepts all 18 keyed responses after reversing the options; all 18 feedback-target sets match the distractor IDs. These mechanical results establish schema, scoring, and feedback wiring, not semantic uniqueness.

## Blocking finding

### N08-B03-01 — Retry may create another approval (i002)

The prompt says a retry can arrive after the first approval has committed and must not create a second approval. The keyed choice commits the approval with its exception and control evidence, but does not explain how the retry recognizes the committed request or returns the existing approval. The prompt gives no uniqueness rule, stable request identity, or lookup behavior that would make a second approval impossible. The distractors being weaker does not make this key meet the additional visible condition.

Keep the stated retry requirement and make the keyed operation cover the request identity and retry outcome—for example, a retry returns the approval already committed for that request. This asks for the condition already present in the stem; it does not imply exactly-once transport or notification behavior.

The other 17 objects pass this bounded semantic review. All 18 are SAME_ID: they retain the same atomicity decision, and the accepted option ID `owner_preserves_contract` keeps its meaning. The prior concern about global locking as an automatically wrong option is resolved in v2: current alternatives target partial or stale state, not a categorical efficiency rule. Repeated generic transfer wording is a nonblocking quality observation only; case-specific Reasons, application/error correction, and option diagnostics carry the decisions.

This report covers only N08-B03 v2 content and identity. It does not accept the broader cohort, producer/history, activation/runtime, native/Premium, or full BIZQ-01.
