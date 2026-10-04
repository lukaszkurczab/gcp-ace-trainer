# Independent semantic review — N05 B06–B09 proposal v1

**Verdict: PASS for these four staged units.** All 68 whole objects present a visible, unit-appropriate decision with a supported key, sufficiently concrete wrong alternatives, and explanations/diagnostics aligned to the keyed decision. The current questions retain their predecessor IDs: each old keyed rule already expressed the corresponding pattern-selection condition, and these proposals supply case facts that let learners apply it. This is not approval of the remaining N05 units, the 153-item cross-unit identity map, source activation, or BIZQ-01 closure.

## Frozen inputs

- B06 `proposals/N05-B06.json`: SHA-256 `e401e6dc966a7abc0535a9b6bad350b562bb8837008d4fd03a957927a029c89d`
- B07 `proposals/N05-B07.json`: SHA-256 `87d1961108c1a24ceaf45385539badf72877aa87c0c5cd11cb956532c54e77ef`
- B08 `proposals/N05-B08.json`: SHA-256 `bf6ae3b52c70f02239d5c957af81bfdb28a840e2331e9cfda12f02b9dec61d18`
- B09 `proposals/N05-B09.json`: SHA-256 `e8b8b17b1b04a5f27e4ccc180564b12e62cf77dd78c24e0f556cb21ee5be944d`
- Fixed N05 manifest: `N05-MANIFEST.json`, SHA-256 `bdef2880a62de54f54e3c06cb9ffc9bd5c900be31c6135d7a0b16c7583ab320a`
- N05 contract: `N05-CONTRACT.json`, SHA-256 `f1252079b899164632accbf4168e5c77c46fb004879a6865f218c8f5707a53f2`
- BIZQ-01 specification: `docs/specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md` (reviewed §§4.1–4.4)
- Canonical N05 clause: `../docs/07-content-guidelines.md`, SHA-256 `5a949d18184d4713642eff447821c7b06aae04304454c72226372c4fd8b268af`

I read all 68 current whole objects and each matching before object from the fixed manifest: prompt, constraints, every option/key, Reason, all five Details fields, all wrong-option feedback, difficulty/type/scoring metadata and source references. The item-level register and exact prior/current keys are in `SEMANTIC-B06-B09-v1.json`.

## Findings by unit

| Unit | Whole-object assessment | Identity disposition |
| --- | --- | --- |
| B06 — Composite structures and uniform traversal | PASS, i001–i017. The positive cases state meaningful group/leaf operations and their composition rules. The negative or mixed cases (i005, i006, i008, i010–i012, i014, i016–i017) correctly limit Composite to the operations that compose, leaving writes, authorization, identity, or transactions with their stated owners. Key, Reason, Details and option-ID feedback agree. | Preserve i001–i017. The predecessor key already taught a uniform tree only when group and leaf semantics match; these items exercise that condition. |
| B07 — Bridge and independently varying dimensions | PASS, i001–i017. Positive cases state the supported cross-product and keep shared behavior stable; i005, i006 and i009 explicitly reject a second axis where it is fixed or coupled. Distractors represent pairwise-subclass growth, policy in transport, caller-owned variation, or moving an invariant to the wrong collaborator. | Preserve i001–i017. The predecessor key already taught separating independently varying dimensions; the proposals make the independence or lack of it decisive. |
| B08 — Flyweight, shared state and resource reuse | PASS, i001–i017. Each prompt distinguishes a versioned immutable definition from entity identity, mutable state, or per-use inputs. The keyed choices preserve those boundaries, and wrong-option feedback names the relevant aliasing, state leakage, identity, or needless-copy error. | Preserve i001–i017. The predecessor key already taught sharing intrinsic immutable state while keeping extrinsic/request state outside the shared object. |
| B09 — Configuration objects, composition roots and dependency assembly | PASS, i001–i017. The scenarios make graph compatibility, configuration boundary, per-operation selection, or lifetime/isolation conditions visible. Choices and diagnostics distinguish startup assembly, explicit request inputs, tenant-scoped dependencies, and runtime lookup/fallback mistakes. | Preserve i001–i017. The predecessor key already taught boundary assembly and explicit configuration validity; these are concrete applications within that objective. |

The repeated rule in each unit is legitimate practice for its named learning objective; I do not impose a unique-concept or distinct-vignette quota. Within B06, i002 and i014 both practice a composable availability read with commit authority kept at the leaf, but one composes windowed capacity sums through a site/depot/charger tree and the other returns nonmerged availability through a district/home/meter tree. That is a close practice pair, not an ambiguity or identity change. B07 also has several independent-axis examples, but their actual dimensions and invariants differ. B08 necessarily revisits the immutable-definition/per-instance-state split across distinct entities and inputs.

I compared the closest accepted control found in the current N01–N04 bank, `ood-n03-b07-i019` (select concrete implementations at the startup composition root), and the nearby request-scope control `ood-n03-b07-i020`. B09 i001 adds joint policy/store compatibility; i003 adds required persist/notify ordering; and i008 asks for a tenant-matched policy/data context under concurrent bookings. These are related transfer practice, not the same decisive choice as the accepted controls. The overlap remains visible for the later complete N05 cross-unit review; this bounded report does not certify all 612 accepted controls against all 153 proposals.

## Source and explanation checks

B06–B08 cite the GoF book, *Design Patterns: Elements of Reusable Object-Oriented Software*; the linked Pearson record identifies that primary work. Their propositions here are the textbook pattern distinctions, while compatibility, state ownership, ordering, and business rules are stated as scenario facts. The scenarios do not claim that a platform or library guarantees those facts.

B09’s .NET-specific lifetime and construction guidance was checked against the official [Microsoft dependency-injection guidelines](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines) and [service-lifetime documentation](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/service-lifetimes). They support the limited claims used here: avoid hidden service-locator/direct-construction choices, use scopes for lifetimes, and prevent shared mutable tenant/request state from leaking across requests. Fictional pair-compatibility and transaction requirements remain prompt premises, not Microsoft guarantees.

I found no decisive fact introduced only in Details, no multiple valid keyed choices under the visible premises, no source claim that exceeds its stated scope, and no wrong-option message attached to a different option meaning. The independent structure receipt `ROOT-STRUCTURE-B06-B09-v1.json` separately reports 68 items and 544 scorer/reversal cases; this semantic verdict is based on reading the objects, not on that structural result.

## Limits

This accepts only the frozen B06–B09 semantic proposal slice. B01/B05 corrections and B02–B04 still require their own current-input reviews; all nine units still require final whole-cohort identity and cross-unit review before source activation. No producer proof, source admission, native/Premium eligibility, or full BIZQ-01 acceptance is established here.
