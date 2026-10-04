# CH-02 — account API validation

2026-10-04. Accepted delivery. Independent LunaHigh PASS127/127; root final124/124, related regression310/310, typecheck and runtime privacy boundary passed.

Four public client methods now request unknown payloads and parse required fields/keys/types, identity formats and status dependencies at the API boundary. `/me` validates its full user/identity object, UUID/date-time/email and nullables. Deleted acknowledgements bind operation ID; public proof binds requested proof ID; status binds operation ID, accepts allocated proof while pending and requires proof for completed remote stages. Inputs use the existing backend operation/secret/proof formats; wire/routes/auth/deadline unchanged. Existing registration behavior remains deliberately unchanged; its separate envelope validator remains necessary.

Malformed delete success keeps remotePending and the same persisted operation/secret rather than failed/reset/new operation. No automatic status lookup or retry is added. Invalid proof/status cannot authorize cleanup. Existing generation/proof guards and remote/local separation remain. No provider, backend schema, content/runtime learning paths, generated assets or services changed.

Five owned files: client adapter/tests, accountDataService, accountLifecycle tests and profileStartupCoordination tests. LunaHigh worker implementation; independent LunaHigh design minimum.84. [Briefing](BRIEFING.md), [design](DESIGN-REVIEW.md), [preflight](PREFLIGHT.json). Root inspected actual diff and production provider wiring: validated me awaits before selection/sync.

Final backend fidelity probe used the actual installed backend Zod identity validator and found its accepted long-email values had no 64/63 local/label bound. The client's invented length bounds were removed and correct fixtures added; structural email validation remains. Four-suite124/124 rerun passed after this routine correction. No type/dependency or lifecycle change occurred. Prior310/310 account regression/typecheck/privacy-boundary evidence remains applicable to unaffected paths; final targeted/independent runs cover the changed parser.

Node22.22.3 verification: worker focused102/102; root four-suite124/124; related account/client/storage310/310, no skipped/failed; worker and root typecheck exit0; runtime privacy boundary passed. Scoped own diff check passed. Earlier root123/124 run exposed fixture preflight failing before the DELETE path; corrected fixture inserts canonical learning session in the actual fetch callback after preflight has created the marker, and asserts endpoint/identity/progress/cleanup boundaries. Failed run is not PASS evidence. No external network/SDK/provider/native/MMKV runtime acceptance claim; production Node coordinators/services run with controlled fetch and isolated canonical storage repositories.

BIZQ N05 source/catalog/history changes were underway during this package; content sync/admission and full cross-repo content suites stay with that owner. Only own account/client suites were used; hashes pin source/dependencies for applicability. Cudze docs/stashe/processes remain. No deploy/publish/purchases/service config/device operation.

Independent actual criteria coverage and reproducible command: [QA](QA.md). Accepted local CH02 scope; no release/provider readiness claim.
