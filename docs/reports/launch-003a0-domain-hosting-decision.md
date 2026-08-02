# Launch 3A-0 — local-only Firebase Hosting policy

**Date:** 2026-08-01

**Status:** complete; third independent QA `pass` after two focused repairs

**Authority:** `PO-025` and the final 3A-0 packet in
`docs/launch-completion-plan.md`

## Decision

No public host/provider is active or selected for the market. Before explicit
market promotion, Patternly publishes neither a live release nor a preview
channel. Real Task 3 pages will use the Firebase Hosting Emulator bound exactly
to IPv4 loopback `127.0.0.1`. Gate 11A later selects one professional market
host and owned domain using current cost and operational evidence.

The reserved site names are:

- `patternly-app-sandbox`, whose generated Firebase URL is
  `https://patternly-app-sandbox.web.app`;
- `patternly-app-production`, whose generated Firebase URL is
  `https://patternly-app-production.web.app`.

Read-only Firebase CLI evidence previously proved that both default sites are
reserved. That metadata did not enumerate custom-domain mappings or Hosting
release content. This decision therefore does not call either generated URL
private, active or empty based on URL semantics. It requires no publication,
and this implementation made no Firebase query or external mutation.

## Repository facts after implementation

| Fact | Evidence |
|---|---|
| No real Task 3 web artifact exists yet. | No canonical public directory or action/privacy/deletion page exists. No empty or placeholder directory was added. |
| `firebase.json` has no `hosting` key or Hosting emulator configuration. | It still contains only the existing Firestore rules target. |
| `.firebaserc` has no Hosting target mapping. | It still contains only the `sandbox` and `production` project aliases. |
| Canonical Expo development entry is workstation-only. | `npm start` is exactly `expo start --localhost`; `npm run web` is exactly `expo start --web --localhost`. Native `android` and `ios` scripts remain unchanged. |
| No package, repository script or workflow can publish Hosting. | Focused guard inspection covers package scripts plus the repository `scripts/` and `.github/workflows` trees; no forbidden Firebase Hosting command or deploy action is present. |
| The policy remains enforceable before an artifact exists. | `tests/firebaseHostingPreMarketPolicy.test.ts` accepts the current absence and exercises positive and negative future configurations. |

No Hosting config, public directory, preview/deploy script, network tunnel,
public provider path or client-side access gate was added.

## Guard contract

The focused repository test enforces both the current and later coherent states:

1. While no real Task 3 Hosting artifact exists, the absence of a `hosting`
   block is valid. Later, exactly one Hosting object is allowed; every array,
   including a one-entry array, fails so a second artifact cannot be layered in.
   That one object must name one non-empty relative `public` path; a missing or
   blank value, absolute path and any `..` traversal segment fail, so `{}` cannot
   serve as placeholder configuration.
2. The one later object is valid before promotion only when
   `emulators.hosting.host` is exactly `127.0.0.1`. `localhost`, `::1`,
   `0.0.0.0`, a LAN address and a missing explicit host are rejected.
3. Canonical Expo `start` and `web` scripts are byte-exact localhost commands.
   Default, `--lan`, `--tunnel`, conflicting and executable-script Expo starts
   fail while native `expo run:android` / `expo run:ios` remain usable.
4. A Hosting `site`/`target`, `.firebaserc` Hosting target, alternate
   `--config`, CLI `--host`, live deploy, preview deploy/clone/open, official
   `hosting:clone`, legacy `firebase serve` and
   `FirebaseExtended/action-hosting-deploy` workflow all fail.
5. `firebase emulators:start --only hosting` remains the allowed local Firebase
   command because its host comes only from the guarded canonical config.
6. Bounded alternative exposure paths fail: Firebase App Hosting rollout/backend
   commands, Netlify publication, every Vercel CLI invocation (including its
   default preview), Cloudflare Pages, `cloudflared` tunnels, ngrok tunnel/start,
   localtunnel/`lt`, EAS Hosting and their common provider CI actions. This is
   not a generic `deploy` ban: `gcloud run deploy patternly-api` remains allowed
   for the separately authorized API path.

This is non-vacuous without placeholder architecture: fixture cases prove that
the guard accepts the one allowed future local configuration and rejects the
forbidden public targets, commands and bind addresses.

## Why preview is not an access-control substitute

Firebase documents that the Hosting emulator responds only to localhost by
default and shows `host: "0.0.0.0"` when other devices on the local network
must connect. Patternly fixes the value more narrowly to `127.0.0.1` so the
repository policy is explicit and deterministic.

Firebase also documents that preview-channel URLs are public even though they
are difficult to guess. A preview channel therefore fails the owner's
workstation-only requirement. Obscurity, a JavaScript password or a public
tunnel would not repair that boundary and remain prohibited.

## Task and release boundary

Task 3 may author the real action, privacy and account-deletion pages and prove
their local/emulator behavior. It may prove token replay, expiry, rate limits,
non-enumeration and local application link intake. It may not claim:

- a public callback;
- public privacy or account-deletion availability;
- live App Links or Universal Links;
- a signed association; or
- market/store readiness.

After Task 11 fixes the store records and identities, gate 11A must complete
before Tasks 12–13 freeze signed artifacts. Gate 11A requires:

- selection of exactly one professional market host/provider using current
  cost, operational and ownership evidence; Firebase Hosting with a custom
  domain may be evaluated then but is not locked by `PO-025`;
- one owner-controlled market domain and durable DNS access;
- explicit public deployment of the same locally validated static artifact
  through one canonical market adapter;
- live `/auth/action`, `/privacy` and `/account-deletion` responses;
- verified transactional-email sender domain;
- exact AASA and `assetlinks.json` responses without redirect; and
- association documents whose contents exactly match the frozen final
  package/bundle/team and available certificate identities.

Installed signed Android App Link and iOS Universal Link drills are not a gate
11A output because Tasks 12–13 create those installed artifacts. Each drill is
an acceptance requirement of its matching signing task, and both results feed
Task 14.

Default Firebase hostnames and local/emulator evidence cannot satisfy gate 11A
or Tasks 12–14. The market choice must not create a second static artifact or a
parallel public deployment adapter.

## Scope and non-goals of this implementation

### In scope

- canonical contract/schema/test reconciliation;
- focused durable pre-market Hosting policy guard;
- plan, report and owner-decision register reconciliation;
- retirement of the active domain shortlist and public-default-host activation
  paths;
- downstream gate/order correction.

### Non-goals

- Firebase, DNS, billing, Authentication or IAM mutation;
- domain selection, lookup, checkout, purchase or price approval;
- Hosting config, public content, placeholder pages or deployment;
- preview channel, public tunnel, proxy, preselected market provider or second
  host;
- sender-domain configuration or signed build work.

## Acceptance status

| Criterion | Status |
|---|---|
| Firebase Hosting Emulator is the sole pre-market serving path and no public provider is preselected | **Met in contract and plan.** |
| Both generated Firebase URLs remain outside pre-market implementation/evidence | **Met; no target, config or script activates them.** |
| Current absence of a real artifact is accepted without placeholder scaffolding | **Met by the focused guard.** |
| A later real artifact must bind exactly to `127.0.0.1` | **Met by positive and negative guard fixtures.** |
| Public deploy/preview/clone/legacy serve, deploy workflows, config/host overrides, target mappings and non-loopback hosts are rejected | **Met by focused guard fixtures.** |
| Expo development entry cannot use default LAN, `--lan` or `--tunnel` | **Met by exact scripts and negative fixtures.** |
| Hosting arrays and multiple artifacts are rejected | **Met; only zero artifacts or one object are accepted.** |
| Empty Hosting objects and unsafe `public` paths are rejected | **Met; missing, blank, absolute and parent-traversal fixtures fail without creating a directory.** |
| Alternative public web hosts, provider actions and tunnels are rejected | **Met by bounded Firebase App Hosting, Netlify, Vercel, Cloudflare, ngrok, localtunnel and EAS fixtures.** |
| Cloud Run API deployment is not caught by a generic deploy ban | **Met by the positive `gcloud run deploy patternly-api` fixture.** |
| Domain, public deploy, sender-domain and association identity/content proof precede signing; installed signed drills stay inside Tasks 12–13 | **Met through gate 11A and downstream inputs.** |
| External state remains unchanged | **Met; no external command or mutation was executed.** |
| Third independent QA returns `pass` | **Pass; exact independent verdict received after the second focused repair.** |

## Remaining owner blockers

The domain is no longer an immediate Task 3 blocker. The current Task 3 owner
inputs are:

1. approval of zero-day live-data retention and maximum 30-day encrypted
   backup/minimal deletion-proof retention; and
2. approved account designs or authorization to derive them from the completed
   Task 2 shell.

The professional market host/domain, DNS, public deployment, sender-domain
verification and signing/team access are intentionally deferred together to
gate 11A.

## Sources

- [Firebase Hosting Emulator — local host behavior](https://firebase.google.com/docs/emulator-suite/use_hosting)
- [Firebase Hosting — test, preview and live deployment](https://firebase.google.com/docs/hosting/test-preview-deploy)
- [Firebase Hosting — connect a custom domain](https://firebase.google.com/docs/hosting/custom-domain)
- [Android — configure Digital Asset Links](https://developer.android.com/training/app-links/configure-assetlinks)
- [Apple — support Universal Links](https://developer.apple.com/library/archive/documentation/General/Conceptual/AppSearch/UniversalLinks.html)
