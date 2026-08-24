# 00 — Overview

## Product boundary

Patternly is a commercial, guest-first and local-first mobile product for deliberate technical practice. A learner can choose a track, set a goal, complete the bundled free node and receive authored feedback without creating an account. An account becomes required at the real identity boundary: Premium purchase, synchronization, restore and cross-device continuity.

Local-first does not mean local-only. Learning mutations become durable on the device before any compact account operation is queued. The synchronized product adds Firebase Authentication, a Patternly API on Cloud Run, Firestore account projections, RevenueCat entitlement normalization and immutable Premium node packages in Cloud Storage. Network or provider failure must not silently replace verified local learning evidence.

Permanent Free access is part of the product. Premium is one account-bound entitlement covering all Premium content in every track, supplied through fixed 30-day access, fixed 90-day access, and discounted recurring access. Storefront products and prices remain release inputs; there are no active-track slots, track-count tiers, release/cooldown rules or guest purchases.

Patternly is a decision-practice and remediation product, not a question bank. Its value is the loop from recognition to a technical decision, mechanism and explained alternatives, varied practice, repeated-mistake remediation, revisit, and transfer. Content count is operational evidence, not the learner-facing product claim.

## Tracks and internal families

The learner sees tracks, never implementation families or family categories. A family is an internal contract for learning, scoring, evidence, review and simulation semantics.

The target uses three internal families:

- `certification`;
- `coding_interview`;
- `design_interview`.

The launch catalogue contains exactly eight learner-visible tracks:

1. Coding Interview: DSA & Problem Solving;
2. Backend System Design Interview;
3. Object-Oriented Design Interview;
4. Frontend System Design Interview;
5. Google Cloud Associate Cloud Engineer;
6. AWS Certified Solutions Architect – Associate;
7. Microsoft Azure Administrator Associate (AZ-104);
8. Microsoft Azure AI Fundamentals (AI-901);

HashiCorp Terraform Associate (004) and Kubernetes and Cloud Native Associate (KCNA) are post-launch briefs only. They are not launch dependencies, production registry entries, cards, or store claims.

A target descriptor or design-density fixture is not a production admission. A track enters the shipping registry only with a complete free vertical, valid modes, goals, Progress and Activity behavior, verified packages/content, and a complete user-visible core loop. No placeholder, unavailable or “Coming soon” production card is permitted.

## Product surfaces and loop

Primary tabs are `Today`, `Practice`, `Progress` and `Settings`. `Activity` is a required nested route under Progress, not a fifth tab.

```txt
choose track and goal
→ start a bounded local session
→ make a technical decision
→ commit the outcome durably
→ receive authored Reason and Details
→ update review, Progress and Activity
→ receive one explained executable next action
```

Today owns the most useful next action. Practice is the manual learning workspace. Progress explains how learning evidence is changing. Activity answers what the learner actually did. Manual choice wins when starting a new supported session.

An active session is owned by its device. Each device may have at most one active session across all tracks. Its pointer, draft, position, timer and mutation journal never synchronize and cannot resume on another device. Terminal learning facts synchronize only after local durability.

## Content, access and language

Every production-visible track has one canonical `freeNodeId`, bundled completely with the application. Premium content is delivered as immutable, compressed whole-node packages. Every prepared session pins exact content/package versions; an update affects only later sessions.

The launch application and launch content are English-only. There is no one-option Language route. Future localization reuses stable item, option and scoring identities so presentation language cannot create a second evidence bank.

Patternly does not claim official certification outcomes, executable-code verification, guaranteed interview readiness or provider affiliation. Coding Interview remains strategy-first and includes implementation planning without pretending to be an online judge.

## Brand and quality

Patternly is one brand. Tracks may use subordinate accent colours, compact symbols and bounded motifs built from one shared grammar, but they do not receive separate logos, wordmarks, typography, component systems or provider-like treatment.

The target is focused flagship quality sustainable by one developer: complete Light, Dark and System appearance, accessible typography up to 200%, restrained motion with reduced-motion equivalents, sparse semantic haptics, diagrammatic illustration, truthful operational states, and coherent public/store presentation.

Figma is temporary visual authority during the one-time active design phase. Only the Product Owner may mark actual visual work `APPROVED`. After verified handoff through `CODE_CANONICAL`, repository-owned tokens, assets, production components, Storybook, tests and checked-in baselines become operational design authority; normal development and CI no longer depend on Figma or a paid Figma plan.

## Documentation authority

Authority is ordered as follows:

1. `canonical-product-contract.yaml` — normative product behavior and cross-cutting policy;
2. `product-owner-decision-register.md` — direct owner decisions, rationale and supersession history;
3. documents `00`–`13` and `15`–`17` — narrative owners that elaborate the contract without overriding it;
4. ADRs — technical history or current technical decisions, never product or execution authority;
5. `launch-completion-plan.md` — the sole active implementation-order and repository-status authority;
6. reports, audits, designs and screenshots — evidence only.

Existing code and retained reports describe current implementation evidence. They do not turn an obsolete behavior into the target contract.
