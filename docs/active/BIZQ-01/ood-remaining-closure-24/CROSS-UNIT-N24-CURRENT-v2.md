# N24 current cross-unit and identity review v2

**Verdict: PASS for the bounded 324-item cross-unit and identity review.** The current map resolves the three open findings from v1. This does not accept the producer, activate source, approve runtime/admission, or certify the broader BIZQ-01 program.

## Bound inputs

- Registry: `CROSS-UNIT-N24-REVIEW-INPUTS-v2.json` (SHA-256 `8f563c542bd7f17449a9688cf5da59e30e6f23388dbe3b37d38f9be8a108a9ea`). Parent registry is retained as history (`455be762a24faffde08e2ea6cf1db1a18e8b7b80455d0623ca7923de4c970c16`).
- Manifest: `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`; contract: `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`.
- Current frozen set: 18 units / 324 questions. Preserved comparison set: 1,089 questions, fingerprint `5e4e334f5acc89f44925c17926dddde2ebb55b6f11cee792c0dc89803da15377`.
- Whole-object fingerprints use the repository canonical JSON encoding (recursive key sort, compact separators, UTF-8). Each answer was resolved by `answer.optionId`, never by array position. The JSON report contains all 324 before/current IDs, hashes, accepted option IDs/text, prompts, identity actions, unit source paths, and rationales.

## Resolved findings

X1 is resolved with 18 reserved replacements and fresh accepted-option IDs in N08-B09. Before, the accepted choice placed retry/idempotency enforcement inside the object boundary that owns the invariant. Current v5 asks how an operation/request ID is replayed and how a later operation is kept distinct. The primary decision changed, so the replacement IDs are appropriate. The item `i014` remains legitimate reinforcement of an invoice retry facet: its uncertain acknowledgement must be reconciled before a corrected reissue, whereas accepted N02-B06-i036 starts from a known rejection and distinguishes retrying the same issue from creating a linked corrected issue.

X2 is resolved by N09-B07-v6. Its 18 measured-optimization questions use their reserved IDs and fresh accepted-answer IDs. The final v6 acceptance binds the corrected case premises and option-targeted feedback; no zero-warning or key-length threshold is used.

X3 is resolved by N09-B03-i007. Accepted N02-B03-i027 asks Listing.publish to validate price and stock before visibility. N09-B03-i007 now asks where duplicated available-quantity calculation belongs, with publication validation already established; the key assigns the calculation to `Listing.availableToPublish` while callers keep workflow. The question ID remains because responsibility placement is the same unit-level learning lens; the accepted option ID is fresh because the decision text has a distinct meaning.

## Legitimate reinforcement

N08-B01-i017 adds a simultaneous-agent/mixed-assignment deadline trigger absent from N07-B02-i007. N08-B03-i018 adds retrying an already accepted identity after notification failure without changing committed state, unlike N07-B04-i008. These are useful repeated practices with case-specific decisions, not duplicate defects. N08-B09-i014 versus N02-B06-i036 is likewise a distinct uncertain-ack versus known-rejection boundary.

## Identity map result

The per-item map derives `{'RETAIN_QUESTION_ID': 288, 'REPLACE_WITH_RESERVED_QUESTION_ID': 36}` question actions and `{'RETAIN_OPTION_ID': 142, 'FRESH_OPTION_ID_ALREADY_PROPOSED': 145, 'ASSIGN_FRESH_ACCEPTED_OPTION_ID': 36, 'FRESH_ACCEPTED_OPTION_ID_REQUIRED_AND_PROPOSED': 1}` accepted-option actions. These counts describe this map; they are not quotas. 270 unchanged question objects reuse matching accepted unit evidence; the 54 objects in the three corrected units were individually reviewed (37 whole objects changed across snapshots; 17 B03 objects are unchanged) to their final frozen inputs and correction acceptances.

## Evidence reuse and limits

Fifteen unchanged unit reviews are reused only where their canonical whole-object fingerprints still match. The changed units are bound to current correction evidence: N09-B03 v3, N09-B07 v6, and N08-B09 v5 plus its checker-hash erratum and acceptance receipt. The complete bindings and per-item rationales are in `CROSS-UNIT-N24-CURRENT-v2.json`. Similarity diagnostics were used to locate concrete comparisons; they did not impose a uniqueness or overlap quota. No exhaustive manual reading of every candidate/preserved pair is claimed.
