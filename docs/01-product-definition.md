# 01 — Product Definition

## Product promise

Patternly turns a technical mistake into a concrete next practice action. It trains retrieval, diagnosis, comparison, strategy selection and deliberate practice rather than supplying an answer feed, a code judge or an official exam result.

## Entry, Free, Premium and account value

First value is guest-first:

```txt
concise value
→ choose a track and valid goal
→ start its bundled free node
→ make a real decision
→ receive authored Reason and Details
→ see an explained next action
```

A guest has a local installation identity and local dataset. The guest may switch tracks, set per-track goals, practise each track's free node, review eligible free evidence, inspect Activity and Progress, and work offline. Guest mode is not Firebase Anonymous Authentication.

An account is required for Premium purchase, synchronization, restore and cross-device continuity. Account creation must not discard guest progress. After verification the product shows an adoption preview, obtains explicit confirmation, applies a deterministic local-versus-account plan and verifies convergence. A new empty account recommends preserving guest data; discard is an explicit destructive choice. An active guest session must be finished or abandoned before adoption and is never migrated.

Free is permanent. Every visible production track includes one complete bundled `freeNodeId`. Free sessions filter strictly to that node and never use Premium filler to reach a requested length.

Premium is one account-bound entitlement for all Premium content in all tracks, available as one monthly and one annual product. It has no track slots or track-count tiers. Store transactions are authoritative at Apple or Google, RevenueCat normalizes them, the Patternly backend owns the account entitlement projection, and the device keeps only a bounded offline cache. A guest cannot purchase Premium or download Premium packages.

After downgrade, historical learning, Activity, Progress, feedback and review remain readable. A Premium session started while entitled can finish on the same device. No new Premium session starts without valid entitlement, and the main recommendation always offers an executable Free alternative.

## Identity and recovery

Launch methods are email/password, Sign in with Apple, Sign in with Google and eight one-time recovery codes. Linked methods resolve to one Firebase UID and one Patternly account. Email equality alone never merges accounts; provider linking requires proof through an existing usable method, and the last usable method cannot be unlinked.

Account security includes recent reauthentication for password/email changes, new-email verification, sign out on this device, sign out on all devices with revocation enforcement, recovery-code regeneration and truthful account deletion. Terms acceptance is versioned and separate from optional analytics consent.

Ordinary Firebase verification and password-recovery action codes use provider-controlled expiry and single-use behavior. Only the custom public-deletion possession token has an exact 30-minute single-use lifetime.

## Surface ownership

- `Today` answers “what should I do now?” with one primary executable recommendation, current track, active local session, goal/review context, compact previous result and only actionable warnings.
- `Practice` is the manual workspace for roadmap/node selection, supported modes, setup, packages/downloads, simulations and explicit Free/Premium state.
- `Progress` answers “how is my learning changing?” through node evidence, weak areas, recurring errors, trend, goal adherence, due review and recent Activity.
- `Activity`, nested under Progress, answers “what did I actually do?” with paginated terminal session summaries and on-demand exact details.
- `Settings` owns application, account, security, consent, support and subscription management settings that exist end to end.

Today does not duplicate the full mode catalogue or Progress dashboard. Activity is neither a streak/heatmap nor an analytics feed.

## Goals

Goals are stored per track. A track exposes only templates appropriate to its purpose: certification preparation, interview preparation, foundations, maintenance or self-paced learning where valid.

Goals may influence recommendation priority, weekly planning, reminders, suggested cadence and session length. They never change entitlement, content locks, scoring, mastery/readiness claims, streaks or punitive messaging.

## Track and family model

A track is a user-visible learning product. A family is an internal runtime contract. Families are not headings, filters, categories or marketing sections.

The three target families are `certification`, `coding_interview` and `design_interview`. Coding and design interview remain separate because their payloads, evaluation details, evidence, review and simulation semantics differ materially. All families reuse one kernel, lifecycle, persistence path, entitlement/package boundary, Activity/Goal/Progress shell and session shell.

The exact ten-track catalogue is owned at overview level in `00-overview.md`. Representative proofs precede broad copying: GCP ACE for Certification, Coding Interview for its migrated family, Backend System Design for Design Interview, then a second Certification and second Design Interview proof.

## Learning and recommendation boundaries

Evidence volume, learning-stage evidence and performance signals remain distinct. Recommendations are deterministic, track-scoped and explained. Priority is active local session, overdue review, missing weekly-plan session, high-signal remediation, current node, then next roadmap node. A learner's explicit supported choice wins for a new session.

Every active item provides concise `Reason` and complete, collapsed `Details`. Persistent review resolves only through the canonical after-due evidence rule. Patternly does not collect confidence or publish synthetic readiness, retention or mastery percentages.

## Language and platform

Launch UI and content are English-only; the Language setting is absent until a real second language exists. Future locale variants preserve stable evidence identity.

The release target is iOS 16.4+ on iPhone only and Android 9/API 28+ targeting API 36, portrait, with Light/Dark/System appearances and 200% text scaling. Patternly makes no iPad support claim.
