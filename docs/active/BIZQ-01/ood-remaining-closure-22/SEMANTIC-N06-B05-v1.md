# Independent semantic review — N06-B05 v1

**Verdict: REVISE one explanation in this frozen unit.** Proposal SHA-256 b001d717c6c9541f058ae5e6b376a2ecdc9a05cf9e5a0c2f7c78a177fddffef5; author notes SHA-256 68c5c04fdc15aebb778af45f3ec9a2150458d04665a3026367793dd62ae0c1f8. I reviewed all 18 before/current objects, resolving accepted keys from answer.optionId, and checked prompt facts, options, Reason, five Details fields, and keyed feedback.

The unit coherently teaches the Mediator decision: centralize a real peer-collaboration protocol while each participant keeps its own domain rules. The current scenarios present distinct multi-owner workflows, and their keys and diagnostics generally reflect the stated coordination boundary. Predecessor and current accepted keys both make this Mediator decision; preserve all 18 question IDs.

**B05 i001:** The prompt says peers call one another in differing orders, so a mediator can make the protocol consistent. But Details.scenarioApplication says that sequencing the registry, door policy, and audit makes access not race the recorded change. The prompt does not state that the coordinator serializes access decisions or that door-policy enforcement gates access until revocation completes. The boundary field correctly says the scenario does not promise distributed atomicity, which makes the stronger scenario-application claim internally unsupported. Narrow the claim to consistent call sequencing, or add the needed door-policy gate/serialization fact to the scenario. This does not require distributed transactions or rollback.

The console flags sole-longest keys in 16 items. That is a qualitative §4.3 advisory: keys often name several protocol steps while distractors are shorter. It is not an automatic failure or length-count threshold; judge whether each distractor presents a credible competing collaboration model and why its boundary fails.

**Limits:** this is a proposal-level unit review only, not source integration, migration, N06-wide acceptance, app admission, native execution, or full BIZQ-01.

| Item | Disposition |
|---|---|
| i001 | REVISE: narrow unsupported access-race claim or make its gate visible. |
| i002–i018 | PASS; same Mediator decision and accepted question identity. |

Per-item before/current fingerprints and accepted meanings are in the paired JSON.
