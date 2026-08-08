# 13 — Risk Register

This register owns current product/architecture risk context. Task status and sequencing belong only to `launch-completion-plan.md`.

| Risk | Severity | Detection | Required mitigation |
| --- | --- | --- | --- |
| Account wall prevents first learning value | Critical | Guest cannot finish bundled free-node journey | Guest-first end-to-end gate; account only at Premium/sync/restore boundary. |
| Guest adoption loses or silently merges learning | Critical | Missing preview/confirmation/convergence evidence | Deterministic plan, explicit destructive choice, restart/failure tests, active-session finish/abandon boundary. |
| Device session becomes remotely owned | Critical | Remote pointer/draft/timer or cross-device resume | Architecture/contract negative tests and deletion of account-wide session paths. |
| Local durability is bypassed by sync | Critical | Remote call before verified journal materialization | Journal-first command tests, idempotent compact outbox and failure injection. |
| Store or SDK becomes entitlement authority | Critical | Package download authorized by local RevenueCat result | Store → RevenueCat → backend projection boundary; protected signed-URL tests. |
| Stale entitlement grants paid access indefinitely | High | Client advances verification time or ignores revoke/refund | Server timestamp, seven-day maximum, known-negative precedence and Free fallback. |
| Free session leaks Premium content | Critical | Filler or review selection crosses `freeNodeId` | Strict package/node filtering and negative pool-exhaustion tests. |
| Mutable or silently substituted package corrupts evidence | Critical | Same identity changes or session resolves newer version | Immutable object/generation/checksum, atomic activation, exact version pin and explicit unavailable history. |
| Identity linking causes takeover | Critical | Auto-link by matching email or unlink last method | Proof through existing method, recent reauth, last-method invariant and revocation tests. |
| Recovery code leaks | Critical | Plaintext persisted/logged/reported | Show once, strong hashes, closed schemas, log/privacy gates and one-time consumption. |
| Account deletion misstates subscription behavior | High | Copy implies cancellation/refund or blocks immediate deletion | Separate Manage subscription, truthful processor disclosure and immediate delete path. |
| Restore resurrects a deleted account | Critical | Snapshot overrides tombstone/proof | Restore runbook, sanitized drill and deletion reconciliation before production PITR acceptance. |
| Analytics/crash collection bypasses consent | Critical | SDK emits before privacy gate or captures forbidden fields | Fail-closed gate, closed vocabulary/schema, sanitized Crashlytics and network-client inventory. |
| Content report exposes learner/account data | High | Automatic response, prompt, email or account attachment | Bounded default context, explicit unchecked link/contact consent and retention tests. |
| Visible family/category leaks implementation model | Medium | UI headings/filters expose family | Track-only surface and density tests across all ten descriptors. |
| Placeholder tracks create false launch scope | High | Empty/Coming soon production registry entry | Shipping admission requires real free vertical and full core loop. |
| Coding Interview implies executable verification | High | Judge/pass wording without code runner | Strategy-first copy, implementation-planning objective and simulation disclaimer tests. |
| Generic or provider-like brand damages trust | High | Clichéd node/cloud/AI mark or provider mimicry | Landscape/anti-reference audit, owner review and selected-finalist similarity screen. |
| Track symbols become sub-brands | Medium | Separate logos/type/component styles | One shared grammar, monochrome proof and subordinate identity rule. |
| Codex self-approves visuals | Critical | `APPROVED` without owner action | Owner-only status enforcement and approval evidence gate. |
| Figma becomes permanent paid dependency | High | Build/CI/docs require live Figma | Verified handoff, repository sources/exports and `CODE_CANONICAL` gate. |
| Storybook drifts or enters release bundle | High | Parallel components/business access/release import | Production-component stories, typed fixtures, dependency boundary and static release exclusion proof. |
| Token or local style bypass fragments UI | Medium | Unapproved literals/overrides/local motion | Repository token authority and lint/architecture checks. |
| Motion/haptics harm accessibility or imply false durability | High | No reduced-motion path or success before commit | Semantic adapter, persistence-aware events, reduced-motion and physical-device checks. |
| Public/store visuals diverge from product | High | Different mark/copy/states across surfaces | One source package and whole-product/public/store consistency audit. |
| Platform claims exceed evidence | High | iPad claim, wrong API target or simulator-only proof | Exact release matrix, phone-only signed smoke and 200%/screen-reader evidence. |
| Low perceived quality survives functional QA | High | Flicker, unstable layout or weak operational states | Measured performance budgets, canonical state inventory, visual comparison and release-quality audit. |

## Recovery rule

Do not mitigate a risk with a hidden fallback, compatibility alias, placeholder, second authority or fake success. If obsolete pre-production behavior cannot move into the canonical ownership model without preserving the risk, delete it in the responsible implementation task and prove removal.
