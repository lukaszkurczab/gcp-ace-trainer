# CH-03 — persisted enum validation

Outcome: reject missing, null or unknown persisted legal/security enums before projection, mutation or other effects; preserve every canonical value, wire contract, revision semantics and audit/domain behavior.

Ownership: backend legal-requests/contracts.ts and store.ts, security-incidents/contracts.ts and store.ts, their focused contract/store tests. Controller owns only CH-03 evidence and its plan/state entries in app. No content, generated bank, version, candidate/readiness/admission, app release lock, demo provenance or learning runtime changes.

Acceptance: legal kind/status and all five incident parent enums runtime validated; nested subject delivery status is a directly consumed projection/aggregation dependency. All selected rows validated before any batch audit/reminder. Fresh transactional reads validated before writes, including finalization. Invalid records yield safe explicit errors and no transition, SMTP, noncanonical export, audit or reminder caused by the rejected operation. Existing valid values and action/revision semantics remain. No migration, generic validation framework or SMTP recovery redesign.

Independence: backend clean019e48e; BIZQ N05 owns source21→candidate→app sync/admission, exact content identities/history/tools and generated consumers. BIZQ02..05 depend on ARCH/PERSIST runtime/progress/planner/review/storage; this task uses separate operational backend collections, no learning contract. BIZQ confirms no backend stores or Firestore18081 use. Shared app documentation/index must preserve foreign body/appendix and stage only own receipt. Existing Firestore reused with isolated demo-patternly-ch03 project; actual Admin SDK create/read/delete probe proved own marker absent at same shared-project path. No shared clear, Auth mutation, emulator restart/config change or iPhone test.

Checks: table valid/missing/null/unknown for each enum; actual isolated Firestore store/product read/action paths and mixed batch corruption proving no side effects; related contracts/parity, typecheck, lint, build, OpenAPI and generated client checks. Independent Luna High acceptance after source freeze. Synthetic sender seams prove call ordering, not real SMTP delivery or release readiness.

Routing: existing worker gpt-6-luna high handles multi-module effect ordering; existing independent design and QA gpt-6-luna high. One source writer. Preserve others, no subagent spawning.

Approach scores fit .95 / simplicity .86 / risk .84 / maintainability .87; minimum .84. Canonical enum schemas plus narrow local guards avoid parallel owners. Design ordering conditions incorporated; actual implementation/runtime still unaccepted.

Live coordination refinement: BIZQ admission testing copies the backend repository as well as content. CH-03 therefore shares a snapshot/HEAD tooling resource despite separate product contracts. The backend delta is bounded and no wire artifact changes. BIZQ was notified to wait for the accepted backend commit if a clean snapshot is required; no guard/buffer relaxation requested. App now has BIZQ local consumer checkpoint99f4f58, contentfafc1b1, web demo WIP owned by BIZQ. Do not push app before BIZQ authorizes publication of its checkpoint; source acceptance remains independent.
