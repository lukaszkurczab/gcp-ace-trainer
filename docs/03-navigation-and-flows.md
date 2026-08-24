# 03 — Navigation and Flows

This document owns navigation and user-flow context. Normative behavior remains in `canonical-product-contract.yaml`.

## Primary navigation

Primary tabs are:

1. `Today`;
2. `Practice`;
3. `Progress`;
4. `Settings`.

`Activity` is a first-class nested route under Progress, not a fifth tab. Track/goal selection, roadmap/node, setup, runner, summary, exact result/review, account, Premium, package, recovery and destructive flows are nested routes.

Routes carry required stable identifiers. Missing or unknown track, node, mode, package, session or result identity produces an explicit unavailable/error state; navigation never chooses a substitute silently.

## Guest-first entry

```txt
first launch
→ concise Patternly value
→ choose track and valid goal
→ open bundled free node
→ start as local guest
→ commit a real response
→ read authored Reason and Details
→ receive explained next action
```

Registration and paywall do not block this flow. The app introduces account or Premium only at a real purchase, synchronization, restore, cross-device or paid-package boundary.

## Account and guest adoption

Register/sign-in supports email/password, Apple and Google; recovery codes provide a separate recovery route. Ordinary verification/recovery results include valid, expired, already-used, malformed, rate-limited and remote-failure states without account enumeration.

When a guest attaches an account:

```txt
verify identity
→ inspect local guest and account data
→ show deterministic adoption preview
→ finish or abandon active guest session
→ obtain explicit confirmation
→ apply/reconcile canonical facts
→ verify convergence
→ bind installation to account
```

No silent merge or discard is permitted. Cancellation or failure preserves the last verified datasets. An active session never transfers to the account or another device.

## Today, Practice, Progress and Activity

Today contains current track/fast switch, active local session if present, one executable recommendation, weekly goal state, due review when higher priority, compact previous-session context, at most one evidence-backed insight and actionable sync/entitlement warnings. It is not a mode catalogue.

Practice contains manual roadmap/node and mode selection, setup, active local session, review modes, simulation where supported, package/download state and explicit Free/Premium availability. The setup UI exposes only the session lengths resolved by the selected versioned track/package/Free profile; a family capability envelope is not a promise that every profile supports every length. It does not duplicate Today.

Progress contains node evidence, weak areas, recurring errors, trend, goal adherence, due review, recent Activity and entry to full Activity.

Activity contains paginated terminal summaries for completed sessions, ended-early sessions with committed attempts, completed reviews and simulations. It excludes setup-only, active, transient-recovery and abandoned-without-attempt activity. Exact details load on demand; unavailable historical content is reported explicitly rather than substituted.

## Session preparation and ownership

Before start, preparation validates the selected track/node/mode, Free/Premium eligibility, exact package/content version, family configuration, required item pool and any simulation profile. Free preparation filters strictly to `freeNodeId`. Premium preparation requires backend-authoritative entitlement or valid bounded offline grace and a verified local package.

The complete session plan is persisted and verified before the first item appears. At most one session is active per device across all tracks. Another device may have a different active session; no cross-device resume or account-wide conflict flow exists.

A learner may resume the local session or explicitly abandon/end it according to the runtime contract. Terminal facts enter Activity and the compact sync outbox only after local durability. A Premium session already started while entitled can finish on that device after downgrade.

## Premium and package flows

Guests encountering Premium first receive an account boundary, never a guest purchase. Purchase and restore use store → RevenueCat → backend verification. Transaction/account conflict is explicit and never attaches one transaction silently to multiple Patternly accounts.

Package flow is:

```txt
authorize identity + backend entitlement
→ obtain short-lived signed URL
→ download temporary package
→ verify checksum, schema and semantics
→ persist version
→ atomically activate
→ prepare session pinned to that version
```

Offline states distinguish verified cached entitlement/package availability from expired or unavailable access. After the seven-day entitlement-verification window, the app remains Free until network verification succeeds.

## Account deletion and subscription

Deletion shows active entitlement truthfully, links to Manage subscription and preserves an immediate `Delete now` path. Store cancellation/refund is not implied. End-of-paid-period scheduling appears only where technically supported and never prevents immediate deletion.

Deletion removes the Patternly account, Patternly data and account-entitlement association under the security contract. It does not automatically cancel the store subscription. Previously bound devices use authenticated deletion evidence and durable local cleanup; restore must never resurrect a deleted account.

## Language and design states

Launch routes and content are English-only. There is no Language route until a real second locale exists.

Every significant new or rewritten user-facing state follows the active design lifecycle: complete state inventory, Figma work, owner approval, implementation, Storybook production-component states, accessibility/interaction proof, visual comparison and iOS/Android device verification. Nonvisual work need not wait for brand exploration; significant presentation cannot bypass applicable approval.
