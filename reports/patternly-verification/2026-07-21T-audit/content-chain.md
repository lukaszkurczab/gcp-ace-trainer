# Content chain

## Answer

The audited iOS build consumes **Algorithms `algorithms-core-0002`**, release `algorithms-core-0002-b424faa6`, with checksum `fccc4c8564c61b1941d398712a2836ca980ce4fc1df1d1d02a12136112d41f0c` and source commit `b424faa6d8c7209acb51ac23af812d08c31842dc`.

`STATICALLY_VERIFIED`: the generated app reference and the content-repo artifact expose the same track identity, version, taxonomy version, checksum, source commit, activation identity, and 5,964,550-byte artifact payload. `OBSERVED`: the canonical iOS build rendered Algorithms Home, a Guided Practice question, and its authored feedback.

## Canonical path

`manual/source/algorithms` → `inspect-source` / technical evidence → editorial approvals → activation `algorithms-core-0002-activation` → immutable artifact `artifacts/tracks/algorithms/algorithms-core-0002/track-artifact.json` → generated application bundle → `validateBundledContent()` checksum/schema/approval gate → installed Algorithms catalog → `AlgorithmsFamilyRuntime` → Practice, Simulation preparation, persistence and Progress read models.

The release contract rejects a missing/mismatched checksum, version, approval coverage, unsupported interaction, insufficient fixed pool, or unknown mode. The runtime does not load an HTTP endpoint, legacy `tracks/`, test fixture, or default question bank. The content-repo `serve:artifacts` server is development-only and was not run.

## Cloud Certification

`BLOCKED`: no Cloud Certification manual-source JSON and no bundled artifact exist. Runtime validation returns `missing_artifact`, rather than silently substituting Algorithms content.
