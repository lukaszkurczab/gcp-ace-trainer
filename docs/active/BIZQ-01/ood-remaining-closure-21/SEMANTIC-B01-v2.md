# Independent semantic review — N05-B01 proposal v2

**Verdict: PASS for these 17 B01 objects and their proposed identity actions.** The revised questions now make the factory or compatible-family trigger visible; each key follows from the stated facts, and the wrong-option feedback addresses its stable target. All 17 keep their existing question IDs, which preserves the old factory/object-family objective while replacing the weak options and explanations.

## Frozen inputs and review scope

- Proposal `review-inputs/N05-B01-v2.json`: SHA-256 `ef632970851fd14d8e468c858c32ba9b0a4b96ae35cf3159c0a67b0f4047f174`
- `N05-MANIFEST.json`: SHA-256 `bdef2880a62de54f54e3c06cb9ffc9bd5c900be31c6135d7a0b16c7583ab320a`
- `N05-CONTRACT.json`: SHA-256 `f1252079b899164632accbf4168e5c77c46fb004879a6865f218c8f5707a53f2`
- BIZQ-01 spec: SHA-256 `67aba008969eb570c86e1fbefc5b88a5e65f422d160fc7dcfd38084b59ff67d5`
- Canonical `docs/07-content-guidelines.md`: SHA-256 `5a949d18184d4713642eff447821c7b06aae04304454c72226372c4fd8b268af`

I independently read all 17 current whole questions against their corresponding frozen before objects: prompt and constraints, every option and key, Reason, all five Details fields, every wrong-option message, and cited pattern sources where relevant. Whole-object fingerprints in this review use compact insertion-order JSON (`json.dumps(..., ensure_ascii=False, separators=(',', ':'))`), not the producer's canonical serializer. This review covers B01 proposal semantics and identity only; the later cross-unit review remains necessary.

## Findings

The actual old keyed answer already taught the decision to centralize construction when one product varies or a coherent family is required. The revised prompts now supply those missing decision facts. Cases i002–i004 explicitly vary one product behind a stable contract; cases i001 and i005–i017 state which outputs or collaborators must be selected together and why their compatibility matters. That repairs answerability without changing the primary decision, so preserving i001–i017 is the correct identity action. The author notes align with the before objects and this item-by-item review.

The 17 cases provide distinct concrete reasons to select or avoid a single-product creator or family: jurisdiction, vendor/device protocol, output mode, shared anchors or precision, profile compatibility, and stable domain identity. Paired-family practice recurs, but the matching facts and nearest alternatives vary enough to exercise transfer. I found no repeated answer that makes another case's decision obvious, and no item-level reason to require a new question identity solely for thematic overlap.

In the whole-object review, each single-product case gives a shared contract and states that no second product varies; each family case names the pair and the incompatibility caused by independent selection. The keyed option follows that distinction. Wrong choices are concrete alternatives—independent selection, duplicated caller branches, an unnecessary family, leaking foreign representation into a domain record, or inferring an explicit mode from missing fields—and each message diagnoses its own target. Reason and Details connect the visible condition to the construction decision and explain the nearest failure and boundary. The scenarios' operational guarantees are scenario facts, not claims that a library or platform universally provides them.

The cited GoF factory/object-family material and Fowler's pattern-writing/plugin references support the general construction and configured-selection mechanisms. No current item depends on a technical guarantee beyond the facts stated in its prompt.

## Identity disposition

Every proposed question ID equals its corresponding frozen before ID; all 17 decisions remain within the existing factory/object-family objective. Keep each old question ID. The new per-item option IDs are appropriate for the changed option meanings and must remain unique. Reserved IDs i018–i034 remain unused; they are not a replacement quota.

| Before / proposed ID | Current keyed decision | Identity |
| --- | --- | --- |
| i001 | Resolve renderer and calculator from one jurisdiction family | Keep i001 |
| i002 | Let a creator choose one varying Credential implementation | Keep i002 |
| i003 | Return one varying LabelDocument through its common contract | Keep i003 |
| i004 | Configure one provider-specific Booking creator | Keep i004 |
| i005 | Resolve compatible projector adapter and decoder together | Keep i005 |
| i006 | Create renderer and navigation index from one edition | Keep i006 |
| i007 | Select a format writer and matching manifest checker | Keep i007 |
| i008 | Select a channel formatter and matching receipt parser | Keep i008 |
| i009 | Load validator and formatter from one country configuration | Keep i009 |
| i010 | Resolve shipment translators from one account vendor | Keep i010 |
| i011 | Create reservation and availability calendar from one category | Keep i011 |
| i012 | Resolve benefits and invoice copy from one package choice | Keep i012 |
| i013 | Configure controller and telemetry decoder for one manufacturer | Keep i013 |
| i014 | Select writer and verifier for one output mode | Keep i014 |
| i015 | Resolve scanner reader and calibration decoder from one profile | Keep i015 |
| i016 | Resolve request and response mappers from one directory | Keep i016 |
| i017 | Resolve credential encoder and verifier from one site vendor | Keep i017 |

Items i010 and i016 involve external translators, but their keyed decision is coordinated creation of paired products from one vendor or directory choice. That is consistent with B01's family-selection objective; any further overlap with N04 belongs to the required full-cohort cross-unit review, not a standalone identity change here.

## Acceptance boundary

This is a semantic PASS for the frozen B01 proposal only. It does not establish the final 153-item cross-unit review, source integration, producer proof, app admission, mode eligibility, native/Premium acceptance, or full BIZQ-01 completion.
