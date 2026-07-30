# Representative-content manifest

## Release identity

This manifest is bound to the currently pinned bundled release:

| Field | Value |
| --- | --- |
| Release | `patternly-core-0015` |
| Producer commit | `d780204eba858c05b94fdbce8de38ec4c3900a50` |
| Source content commit | `9e23b08d051ac473436f27544b0dbfefeda496d6` |
| Algorithms content version | `algorithms-core-0008` |
| Algorithms checksum | `2c6749d68c4c2c9f95bc4b9c4d21350df92776603648b2240fd1da39bb8d9adf` |
| GCP ACE content version | `gcp-ace-0014` |
| GCP ACE checksum | `f692d3878c12907cc1df7922a1eb6e5567757989450063dc9e495cebf4bd4042` |

If any value changes, regenerate and review this manifest against the installed
catalog before using it.

## Algorithms participant session

The participant sample is not an editorial selection of preferred questions.
It is the current deterministic runtime result of:

```ts
selectAlgorithmSessionPlan({
  mode: "algorithms-independent-practice",
  sessionLength: 10,
  scope: { interleavedScopeId: "hash-map-and-set-node-v1" },
});
```

The declared scope is presented as **Hash map and set** and its runtime detail
is “Interleave the declared mental units without hints or reinsert.”

Coverage:

- 8 choice, 1 ordering, and 1 complexity interaction;
- 2 primary mental units:
  `complement_lookup` and `expected_complexity_and_hash_assumptions`;
- introductory, intermediate, and advanced items;
- one exact canonical order, with no moderator substitution.

### Ordered item contract

| # | Item ID | Interaction | Primary mental unit | What it is intended to teach | Observable transfer/comprehension signal |
| --- | --- | --- | --- | --- | --- |
| 1 | `alg-hms-complement-all-pairs-payload` | choice | `complement_lookup` | The stored payload follows the output contract; returning all pairs requires one-to-many prior provenance. | Participant distinguishes the complement equation from the required stored payload and explains why all relevant earlier indices must remain available. |
| 2 | `alg-hms-complement-check-before-record` | ordering | `complement_lookup` | Querying prior state before recording the current occurrence preserves the distinct-index invariant. | Participant states the check-before-store rule and explains why it prevents a value from pairing with the same occurrence. |
| 3 | `alg-hms-complement-expected-cost` | complexity | `complement_lookup` | Derive expected `O(n)` time and `O(n)` extra space from one expected-constant lookup/insertion and up to `n` stored entries. | Participant names the hashing assumption, derives both dimensions, and does not present expected cost as an unconditional worst-case guarantee. |
| 4 | `alg-hms-complement-half-target-duplicate` | choice | `complement_lookup` | Equal values can form a valid pair when they are different occurrences. | Participant explains that the second `3` finds the earlier `3`, preserving distinct indices for `[3, 3]`. |
| 5 | `alg-hms-complement-index-payload` | choice | `complement_lookup` | Presence is insufficient when the output requires an earlier index. | Participant distinguishes a set/presence check from a value-to-index map and ties that choice to the requested output. |
| 6 | `alg-hms-complement-rearrange-sum-condition` | choice | `complement_lookup` | Derive a lookup key from the relation rather than memorize a Two Sum phrase. | Participant rearranges `prior + x = T` to `prior = T - x` and describes the derivation. |
| 7 | `alg-hms-complement-set-or-frequency-boundary` | choice | `complement_lookup` | A prior-presence set is sufficient for existence with distinct occurrences when the temporal invariant is preserved; counts serve different contracts. | Participant identifies why prior presence is enough here and gives a boundary where frequency or provenance would become necessary. |
| 8 | `alg-hms-complement-transfer-directed-difference` | choice | `complement_lookup` | Transfer relation-based lookup to the directed equation `current - p = D`. | Participant derives `p = current - D` without relying on wording from item 6 and notes that an absolute-difference contract would require a different boundary analysis. |
| 9 | `alg-hms-complexity-adversarial-guarantee-boundary` | choice | `expected_complexity_and_hash_assumptions` | A threat model and required guarantee determine whether ordinary hashing is sufficient. | Participant asks for or chooses a data structure with a documented worst-case guarantee rather than assuming expected hash behavior satisfies deterministic bounds. |
| 10 | `alg-hms-complexity-expected-versus-worst` | choice | `expected_complexity_and_hash_assumptions` | State the ordinary hash-table complexity model without overclaiming. | Participant distinguishes expected `O(1)` lookup from possible `O(n)` worst case when no stronger guarantee is specified. |
Items 6→8 and 9→10 offer same-session contrast evidence. That evidence may
show whether feedback changes a later decision; it is not delayed transfer,
retention, mastery, or interview-effectiveness evidence.

## GCP ACE internal sanity sample

This sample checks only that the current Certification architecture can resolve
real pinned records and that prompts/feedback can be reviewed for clarity. It is
not participant material in the first Algorithms cohort. The 360-item bank was
reviewed against the current official ACE guide on 2026-07-29 and published as
`gcp-ace-0014`; that work does not turn this Algorithms protocol into a GCP
participant protocol.

The records are the first interleaved block in the current
`gcp-ace-mixed-practice-v1` blueprint:

| Item ID | Domain | Interaction | Internal review focus |
| --- | --- | --- | --- |
| `ace-q-0001` | `setup_environment` | single | Whether project boundaries are explained through IAM, billing, APIs, and quotas rather than product-name recall. |
| `ace-q-0059` | `planning_implementation` | single | Whether explicit vCPU/memory requirements create a clear custom-machine-type decision boundary. |
| `ace-q-0131` | `operations` | single | Whether a time-series CPU investigation cleanly distinguishes Monitoring from unrelated services. |
| `ace-q-0193` | `access_security` | single | Whether least privilege is explained without implying a broader IAM role than deployment requires. |

Before any GCP recruitment, define a separate GCP cohort, participant task,
moderator script, representative sample, claims boundary and current-platform
acceptance gate. Do not reuse this Algorithms protocol or infer a GCP research
GO from an Algorithms result.

## Validation source

Release identity comes from
[`integration/contracts/content-release/release.lock.json`](../../integration/contracts/content-release/release.lock.json).
Runtime records are installed through `validateBundledContent()` and read from
the canonical Algorithms and Certification catalogs. Educational review follows
[`docs/07-content-guidelines.md`](../07-content-guidelines.md).
