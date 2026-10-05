# N09-B07 v4 correction record

This v4 input is the frozen v3 proposal (`N09-B07-v3.json`, SHA-256
`428676e548e3da6ef68e3bfa4530c36818b7650e5c5dd2f5ea9e9c577e872a8a`). The
correction replaces the 72 learner-visible wrong-option messages with
case-specific explanations and repairs three alternatives that could still
satisfy the frozen facts. The earlier message-only v4 draft was superseded
before review; its output hash was `66758ffd96bf56270d17eab710fa1dc747503dbbbb52e1e4f1e8af92446bdd77`.

The three alternative changes preserve each keyed query-plan decision and
question ID while making the competing choice concretely violate a visible
case contract:

| Item | Prior wrong alternative | v4 alternative | Why it fails |
| --- | --- | --- | --- |
| i021 | Remove dimension validation | Return the original uploaded image instead of a preview | The service's stated operation is to create previews; returning the source image changes that output rather than reducing measured resize work. |
| i026 | Load IDs and count them in the application | Count only the first page of active-reservation IDs | The response asks for the number of all active reservations; a first-page count omits later matches. |
| i029 | Copy account history into every invoice line | Reuse an earlier invoice's copied account snapshot for later requests | The prompt scopes the fixed snapshot to one invoice request; an earlier request's snapshot can be stale for a later one. |

The corresponding wrong-option IDs and message targets were changed together:

- i021 `n09b07_i021_contract_shortcut` → `n09b07_i021_full_image_not_preview`
- i026 `n09b07_i026_broad_rewrite` → `n09b07_i026_first_page_only`
- i029 `n09b07_i029_broad_rewrite` → `n09b07_i029_stale_snapshot_reuse`

The keyed choices, question IDs, prompts, constraints, `Reason`, and all five
`Details` fields are unchanged. The other 69 wrong-option choices are unchanged.
No measured threshold or implementation guarantee was added.

The reproducible correction script reads the frozen v3 bytes, updates each
message by its actual stored option ID, validates every item with the existing
question validator, checks the accepted option and every distractor with the
existing scorer, and repeats scoring with reversed option order. It also
compares the serialized output against the baseline while normalizing only the
81 authorized leaves (72 message texts, three option texts, three option IDs,
and three message target IDs).

The recorded run passed all 18 validations, 18 keyed scores, 72 incorrect
distractor scores, and 18 reversed-order keyed scores. See
`AUTHOR-N09-B07-v4-CHECKS.json` for the exact input/output hashes and per-item
receipts. This is an author correction record, not an independent semantic
acceptance.
