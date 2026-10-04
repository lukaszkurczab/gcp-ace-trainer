# Independent semantic review: OOD-N04-B07 v3

**Verdict: PASS for this frozen unit proposal.** This review is bound to proposal `review-inputs/v3/OOD-N04-B07.json` (SHA-256 `dcb09dd65116aede41d068a293ffa25408547df9dd39bb2721112efea61e20df`) and notes `review-inputs/v3/OOD-N04-B07-notes.json` (SHA-256 `1af93b1fd561cef24c98f89741aad9592f709af955280d533e8e23f45f40ac7f`). The preservation record identifies i022, i026 and i029 as the only changed whole objects and the other 15 as byte-identical. I read all 18 current prompts, constraints, choices, keys, Reasons, five-part Details and keyed wrong-option messages. The separate source-claims report for this exact proposal supports its C# claims; it is technical-source evidence, not this semantic verdict.

Each item gives a determinate answer from the visible type positions, stated subtype/member facts, and caller requirement. The key expresses the required relationship or constraint; the Reason explains the decisive condition and decision. Details apply that condition to the scenario, correct the nearest tempting alternatives, and state the boundary. The wrong-option messages address the actual keyed distractors. I found no changed answer meaning or unsupported decisive premise in v3.

| Item | Finding |
|---|---|
| i019 | PASS — output-only getter plus reference-type widening supports `out`; the invariant, input-only and call-site-cast alternatives each conflict with a stated part of the contract. |
| i020 | PASS — `Read` and `Replace` put T in both directions, so invariance prevents the unsafe base-typed replacement. |
| i021 | PASS — the comparer consumes values; the existing base-type comparer can safely compare the stated subtype. |
| i022 | PASS — the visible `Convert(TInput) -> TOutput` signature supports input contravariance and output covariance; the specific meter/report subtype facts align with both positions. |
| i023 | PASS — the receiver needs enumeration only, so the covariant enumerable view works while `List<T>` stays invariant; copying would lose the explicitly required view semantics. |
| i024 | PASS — all admitted candidates implement the exact capability read by the helper; the interface bound is sufficient and less restrictive than the concrete class. |
| i025 | PASS — the scenario states a struct and a missing-versus-present value; `struct` gives the nullable value-type contract. |
| i026 | PASS — v3 explicitly separates `notnull` nullable-analysis diagnostics from the independent runtime null guard and does not claim an unconditional compile error. |
| i027 | PASS — the body calls `new T()` and the prompt requires a public parameterless constructor; `new()` expresses that requirement. |
| i028 | PASS — the named descriptor interface supplies both members actually read; the other constraints do not. |
| i029 | PASS — v3 states the supported struct implements only `IComparable<AwardScore>` and requires compile-time checking, resolving the earlier alternative ambiguity. |
| i030 | PASS — it distinguishes a legal output-only variant declaration from the absence of a variance conversion for value-type arguments. |
| i031 | PASS — the source must remain live and read-only; `IReadOnlyList<out T>` supplies the covariant view, whereas copying would produce the excluded snapshot. |
| i032 | PASS — `Action<T>` consumes the event, so the handler for the broader base type can handle the stated derived event. |
| i033 | PASS — the mutable property both returns and accepts T, making the class invariant; neither variance direction is legal for this class contract. |
| i034 | PASS — the shared interface exposes `Format` for two unrelated accepted types; the class-only and runtime-dispatch alternatives contradict the stated contract. |
| i035 | PASS — both result parameters are output-only reference types; the “error” label does not change their positions. |
| i036 | PASS — the two generic parameters occupy separate input and output positions, so `in` for TBase and `out` for TSpecific matches the stated contract. |

There is deliberate reinforcement: i023 and i031 both test a safe covariant read view, while distinguishing enumeration from a live read-only indexed view and copying from live observation. Likewise i024 and i034 both use an interface constraint, but i024 asks for the minimum member capability among candidate implementations and i034 asks for a common capability across unrelated class hierarchies. These overlaps are visible; the scenarios change the decisive type relationship or tradeoff, so I treat them as valid practice within this unit rather than duplicate decisions. The repeated variance principle across examples is the unit's learning objective, not evidence that every item needs a unique concept.

I found no materially misleading answer-length cue in the item set. Some correct choices name the exact C# declaration and are naturally more specific than short distractors, while several distractors are comparably concrete and require distinguishing type positions. This is a qualitative finding, not a word-count test.

The verdict is limited to semantic acceptance of this frozen B07 proposal. It does not establish cross-unit uniqueness across all 162 items, implementation/source admission, runtime behavior, native eligibility or closure of BIZQ-01.
