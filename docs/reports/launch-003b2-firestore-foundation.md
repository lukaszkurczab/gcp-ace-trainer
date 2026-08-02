# Launch 003B-2 — no-billing Firestore security foundation

Date: 2026-08-01

Controller decision: `pass`

## Objective and authorization

`PO-022` authorized exactly one Firestore Standard `(default)` database in
each Patternly project, permanently located in `europe-central2` (Warsaw), with
deletion protection enabled, PITR disabled and identical deny-all client
rules. Billing/Blaze and every other product service remained outside scope.

## Repository guardrail

The worker created exactly four files before any cloud mutation:

- `.firebaserc` — explicit `sandbox` and `production` aliases, with no
  `default` alias;
- `firebase.json` — Firestore rules deployment only;
- `firestore.rules` — recursive denial of every client read and write;
- `tests/firebaseFirestoreConfiguration.test.ts` — exact JSON-shape and
  byte-exact rules assertions.

Focused verification passed 1/1 and independent pre-mutation QA returned
`pass`. No Firebase dry-run or cloud mutation occurred during this phase.

## Execution boundary

The cloud worker correctly stopped before mutation when its subagent approval
context could not trust the owner's direct authorization. The controller then
executed only the operations authorized by `PO-022` from the task context that
contained the direct approval.

The first two sandbox create calls returned `403` before database creation:
the first because Firestore API was disabled and the second while API
enablement was still propagating. A direct Service Usage read then returned
`ENABLED`, and a Firestore database list returned an empty array before the
successful create. No deletion, substitute ID/location, billing action or
production mutation occurred during those failed calls.

## Database result

| Environment | Database | UID | Created (UTC) | Edition | Location | Delete protection | PITR | Free tier |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sandbox | `(default)` | `61f303fa-1397-4099-8624-26fb8eea9161` | `2026-08-01T08:10:49.657670Z` | `STANDARD` | `europe-central2` | `ENABLED` | `DISABLED` | `true` |
| Production | `(default)` | `be15ac0b-7ce7-42bc-a938-00a39d650816` | `2026-08-01T08:13:10.175486Z` | `STANDARD` | `europe-central2` | `ENABLED` | `DISABLED` | `true` |

Fresh `firestore:databases:list` calls returned exactly one database per
project. Both are Firestore Native databases with App Engine integration
disabled. Standard-edition realtime updates and one-hour version retention are
provider baseline fields; PITR remains explicitly disabled.

## Rules and billing result

Only `firestore:rules` was deployed, once to each explicit project alias. A
read-only Firebase Rules API check resolved each active `cloud.firestore`
release, fetched its ruleset and compared it byte-for-byte with
`firestore.rules`.

| Environment | Active ruleset | SHA-256 | Local/remote match | Billing enabled |
| --- | --- | --- | --- | --- |
| Sandbox | `b4cf85a7-10ba-4aba-b17d-827c9a047337` | `cd5089e4e5116dbb994013dc5fd5e7e411ec348935b8d06d13acd00173cca15b` | `true` | `false` |
| Production | `9e61dc4a-8e66-44a8-9e25-f56d6b14f365` | `cd5089e4e5116dbb994013dc5fd5e7e411ec348935b8d06d13acd00173cca15b` | `true` | `false` |

No data was written. The automatic Firestore API and provider service-agent
baseline is the only additional expected cloud side effect observed by this
slice. No worker/controller operation configured Authentication, Cloud Run,
Hosting deployment, Firebase apps, indexes, TTL, backups, IAM grants, Secret
Manager or service-account keys. This statement describes initiated
operations; absence of every provider-created resource is not claimed without
service-specific inspection.

## Verification

- `node --import tsx --test tests/firebaseFirestoreConfiguration.test.ts` —
  pass, 1/1;
- `npm test` — pass, 426/426;
- `npm run typecheck` — pass;
- `npm run gate:contract-change -- HEAD` — pass;
- `git diff --check` — pass.

Final independent QA returned `pass` after one documentation-only repair. The
repair reconciled current facts and remaining scope with the implemented cloud
state and added this complete verification ledger. QA found no remaining
configuration, cost-boundary, security, fallback or evidence gap.

## Remaining boundary

This slice does not provide the server API or account runtime. With deny-all
client rules, only a later Admin/server boundary can access Firestore. The next
prerequisite remains standard email/password Authentication without Identity
Platform, followed by a separately authorized billing/Cloud Run and keyless
IAM/Secret Manager boundary.
