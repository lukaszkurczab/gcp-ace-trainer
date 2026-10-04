# Independent semantic review — N05-B01 proposal v1

**Verdict: REVISE the identity actions before acceptance.** The 17 proposed questions have concrete, keyed factory/family decisions, visible trigger facts, and item-specific diagnostics. However, the proposal assigns all 17 reserved new question IDs even though the existing accepted decision is still the same factory/object-family rule. This creates avoidable identity churn under the fixed contract.

## Frozen inputs and scope

- Proposal `proposals/N05-B01.json`: SHA-256 `042c9538e4770b2ae38dd5f9a22754b3c4a09e9659d3d1ac71bca3dc30d6add2`
- `N05-MANIFEST.json`: SHA-256 `bdef2880a62de54f54e3c06cb9ffc9bd5c900be31c6135d7a0b16c7583ab320a`
- `N05-CONTRACT.json`: SHA-256 `f1252079b899164632accbf4168e5c77c46fb004879a6865f218c8f5707a53f2`
- Canonical `docs/07-content-guidelines.md`: SHA-256 `5a949d18184d4713642eff447821c7b06aae04304454c72226372c4fd8b268af`

I compared all 17 complete before objects from the fixed manifest with all 17 proposal objects, including prompt/constraints, every option and keyed answer, Reason, the five Details fields, wrong-option messages and source references. This is a bounded B01 review, not acceptance of N05 or the 153-item cross-unit cohort.

## Identity finding

The manifest’s reserved IDs are not a replacement quota. Its rule and the appended canonical clause retain an item ID when the primary decision and accepted meaning remain. The old B01 keyed option explicitly says: **“Centralize construction only when construction varies or must select a coherent object family.”** Its associated Reason repeats that same factory/family condition. The manifest’s own per-item findings say the facts fail to trigger that mechanism; they do not identify a different accepted learning objective.

The new prompts supply the missing construction triggers and make the distractors and diagnosis concrete. In most cases the answer applies the same old condition: one varying product is selected behind a creator, or a compatible product family is selected together. For example, old i002’s factory-method decision becomes new i019’s “only one product varies” creator choice; old i005’s family decision becomes new i022’s paired projector collaborators. Those are repairs that make the existing objective answerable, not demonstrated primary-semantic changes. The author-note rationale that the old key was merely “generic invariant ownership” omits the explicit factory criterion in the actual old keyed text.

| Before ID | Proposed ID | Current decision | Identity disposition |
| --- | --- | --- | --- |
| i001 | i018 | Match renderer/calculator from one jurisdiction family | Retain i001; same object-family decision |
| i002 | i019 | Hide one varying Credential implementation behind its creator | Retain i002; same single-product factory decision |
| i003 | i020 | Return one varying LabelDocument behind its contract | Retain i003; same single-product factory decision |
| i004 | i021 | Select one provider-specific Booking creator | Retain i004; same single-product factory decision |
| i005 | i022 | Select compatible projector command/status products together | Retain i005; same family decision |
| i006 | i023 | Select edition renderer and index from one edition | Retain i006; same family decision |
| i007 | i024 | Select writer and checker for one output format | Retain i007; same family decision |
| i008 | i025 | Select formatter and receipt parser for one channel | Retain i008; same family decision |
| i009 | i026 | Select validator and formatter under one country rule | Retain i009; same family decision |
| i010 | i027 | Select freight request/response adapters by vendor | Retain i010 if this remains a paired-product factory decision |
| i011 | i028 | Create reservation and calendar from one plot category | Retain i011; same family decision |
| i012 | i029 | Resolve benefits and invoice copy from one package | Retain i012; same family decision |
| i013 | i030 | Configure controller and telemetry decoder together | Retain i013; same family decision |
| i014 | i031 | Select writer/verifier contracts by export mode | Retain i014; same family decision |
| i015 | i032 | Resolve scanner reader/calibration pair from profile | Retain i015; same family decision |
| i016 | i033 | Select request/response mappers for one directory | Retain i016 if this remains a paired-product factory decision |
| i017 | i034 | Resolve credential encoder/verifier from site vendor | Retain i017; same family decision |

The pair-selection cases share an important lesson, but their scenario constraints and failed alternatives differ: output formats, collaborator compatibility, identity ownership, or separate caller branches. I do not treat that transfer practice as a separate blocking defect or impose a distinct-concept quota. Items i010/i016 use integration translators, so the final cross-unit review should ensure their keyed decision is still coordinated factory selection rather than standalone Adapter translation; that is a scope check, not a new ID requirement by itself.

## Item quality and explanations

The proposed prompts repair the old missing-trigger problem. Proposed IDs i018 and i022–i034 state which collaborators vary or must be compatible; i019–i021 state a single product variation and a shared contract. The keyed choice follows those facts. The nearest wrong choices represent concrete failure modes (independent selectors, caller branches, mismatched product pairs, or domain-model leakage), and wrong-option feedback targets the current stable option IDs. The five Details fields generally follow the causal chain from mechanism to case to failed alternative and boundary.

I found no answer/diagnostic target mismatch in the 17 current B01 objects. The pattern claims are compatible with the cited factory/configuration references: Fowler’s [Making Stubs](https://martinfowler.com/bliki/MakingStubs.html) demonstrates an abstract factory supplying implementations, and [Plugin](https://martinfowler.com/eaaCatalog/plugin.html) describes configuration-time implementation selection. The scenarios’ business constraints are authored case facts rather than claims of universal library behavior.

## Required correction and limit

Before accepting B01, revise its per-item identity map: preserve i001–i017 unless a specific final item truly changes its primary decision/archetype; do not use i018–i034 simply because the original prompt lacked a trigger or used generic distractors. Changed option meanings may use new option IDs while the question ID remains stable. Recheck exact source/proposal hashes after the author updates the mapping.

This finding concerns question identity/history under the existing N05 contract. It does not authorize source activation, producer-proof design, app admission, mode-pool changes, or full BIZQ-01 acceptance.
