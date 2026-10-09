# BIZQ-03 APP → backend contract probe

Run from the Patternly APP repository after installing its dependencies:

```sh
node --import tsx scripts/qa/goalPlanAppBackendContractProbe.mjs
```

The probe imports the sibling `patternly-backend` checkout by default. Set
`PATTERNLY_BACKEND_ROOT` to use another local backend checkout. It exercises
the APP's canonical in-memory goal/plan acceptance and account snapshot against
the backend's real parsers and merge-preview functions. It does not contact a
server, emulator, or production account; this is source-contract evidence, not
an HTTP or deployed-sync check.

# Native Goal/Plan recovery readback

This read-only probe compares a private snapshot captured at the controlled
goal/plan interruption with the exact pair after ordinary app recovery. It
does not accept a plan, arm an interruption, restart the app, change a profile,
or call a backend. Run it only from the existing Patternly APP checkout while
the already installed iPhone 17 dev/smoke app is connected to its local Metro
on port 8081 and signed into the same verified sandbox account as the manifest.

Keep the interruption snapshot and manifest in a private directory owned by
the current user with mode `0700`; each JSON file must be owned by that user
with mode `0600`. The manifest path is relative to the private directory. The
expected snapshot must be the captured `accept_goal_plan` interruption for the
same track, proposal, account, and verified goal revision. Set `PRIVATE_ROOT` to that existing private directory; use its current verified manifest basename. Example:

```sh
node scripts/qa/nativeGoalPlanPairReadback.mjs \
  --private-root "$PRIVATE_ROOT" \
  --manifest controlled-actor-manifest.json \
  --track coding-interview-dsa-problem-solving \
  --expected coding-pair-interrupted.json \
  --output accepted-coding-pair-recovered.json
```

The probe requires the single local `com.lkurczab.patternly (iPhone 17)`
Hermes target, a current profile lease, the verified account binding and
matching private manifest actor hash. It writes a full private readback only
inside the selected directory; stdout contains status booleans, never record
contents, IDs, credentials, or digests. With `--expected`, success requires a
strict interrupted receipt, the durable intent with both before-values absent,
the exact Goal readback and blocked pair readers, followed by a clear journal,
null interruption receipt, readable Goal/Plan records, and exact matching
record/revision values after recovery. Every timeout and rejected owner read is
reported as a bounded safe category.

For a new authorized interruption exercise, create a fresh proposal through
the normal UI, verify its visible local proposal identity, arm the existing
development command with a fresh nonce and that proposal/track identity,
dismiss the native “Goal and plan interruption armed” alert, and tap Accept
once. Confirm the interrupted receipt and capture its private snapshot before
an owner-checked ordinary restart. Then run the readback command above with
that snapshot as `--expected`. Do not repeat acceptance or restart when a
prior operation's outcome is uncertain; inspect the current canonical owners
first. This procedure demonstrates journaled interruption and ordinary
recovery, not literal power-loss testing or offline HTTP sync.

# Native learning and clock readback

Use the same read-only CLI with `--include-learning` when a native audit needs
the selected track's canonical session history, committed attempts, review
queue, and current application clock alongside its Goal/Plan pair. This mode
writes a private schema-v2 snapshot; the default pair-only schema-v1 output and
its strict `--expected` recovery check are unchanged. Learning mode cannot be
combined with `--expected`.

Run it under the same private directory, manifest, installed iPhone 17 app,
Metro connection, and verified sandbox account described above. The selected
track is explicit; session, attempt, and review records are included only when
their canonical `trackId` matches it. Sessions retain their persisted item and
option order. The canonical learning-input owner rejects a pending mutation
journal or a changed profile-storage scope instead of returning partial
history. The captured clock comes from the installed application lifecycle.
The full snapshot remains in the private `0600` output file; stdout reports
only bounded status fields.

```sh
node scripts/qa/nativeGoalPlanPairReadback.mjs \
  --private-root "$PRIVATE_ROOT" \
  --manifest controlled-actor-manifest.json \
  --track coding-interview-dsa-problem-solving \
  --include-learning \
  --output learning-clock-readback.json
```

This command reads local canonical owners only. It does not change the clock,
accept a plan, write learning records, synchronize an account, or call a
backend. It is a point-in-time readback, not proof of a clock-advance or
cross-system sync effect.

# Goal/Plan second-client producer and native transport

These versioned tools reproduce a controlled two-record sync from a fresh,
complete account GET. The producer composes a competing Goal/Plan pair using
the real APP owners in an isolated in-memory profile, verifies the exact two
outbox mutations, and writes a private request plus provenance receipt. It
does not contact a server. The transport tool has no default mode: `validate`
performs fresh GET and local binding/lease/manifest/request checks only;
`post` explicitly sends the preserved two-mutation request once, writes a
durable private intent first, and requires an exact response and follow-up GET.
Never retry a failed or uncertain `post`; inspect its private intent and the
canonical remote state first. The earlier A21 run proved a confirmed GET effect
through the authorized transport. A later `validate` run is read-only evidence
and does not repeat or independently prove that earlier HTTP effect.

Prerequisites: run from this APP checkout with Node 22, dependencies installed,
the existing iPhone 17 dev/smoke app connected to Metro on `8081`, the local
backend on `8080`, and a fresh complete producer-input GET plus the current
verified sandbox manifest in one user-owned private directory. The directory
must be mode `0700`; every input/manifest and generated file must be mode
`0600`. Do not put credentials or these records in the repository. The
producer's private output root may be this same private directory; it emits
unique request/receipt basenames so previous evidence is never overwritten.

The producer input must be the exact complete remote GET used as the baseline
(including account revision, generation, all records, and `nextPageToken: null`).
The transport's `--local-before` must be a contemporaneous read-only snapshot
from canonical APP owners containing the selected account/profile, verified
binding and current lease, null journal, and exact Goal/Plan envelopes. The
manifest, GET, and local snapshot must identify the same sandbox account and
baseline; do not hand-edit or synthesize these witnesses.

Example shell setup (replace the private input and manifest filenames with the
current controlled artifacts; no credentials belong on the command line):

```sh
PRIVATE_ROOT="/private/tmp/patternly-second-client-run"
OUTPUT_ROOT="$PRIVATE_ROOT"
mkdir -m 700 "$PRIVATE_ROOT"
chmod 600 "$PRIVATE_ROOT/producer-input.json" "$PRIVATE_ROOT/manifest.json"

node scripts/qa/goalPlanSecondClientProducer.mjs \
  --private-root "$PRIVATE_ROOT" \
  --input producer-input.json \
  --output-root "$OUTPUT_ROOT"
```

Use the emitted request and receipt basenames for the explicitly read-only
native validation. `--manifest` is relative to the private root; all other
JSON arguments are single basenames in that root. `--output` must be a new
basename. The private transport output is a full readback, while stdout only
reports safe stage/status fields.

```sh
node scripts/qa/nativeGoalPlanSecondClientTransport.mjs \
  --mode validate \
  --private-root "$PRIVATE_ROOT" \
  --manifest manifest.json \
  --track coding-interview-dsa-problem-solving \
  --output validate-readback.json \
  --request REQUEST_BASENAME.json \
  --local-before LOCAL_BEFORE_BASENAME.json \
  --producer-receipt RECEIPT_BASENAME.json \
  --producer-input producer-input.json
```

`--mode post` is a separately authorized external effect, not part of normal
validation. It writes an exclusive `0600` intent and fsyncs the file and private
directory before the request. It never retries, chooses a default POST, or
changes local Goal/Plan state. Keep the manifest, witness, producer artifacts,
intent, and readback private for the controlled audit; do not check them in.
