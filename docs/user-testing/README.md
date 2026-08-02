# Patternly moderated user-research packet

> This packet is an independent internal product-research workflow. It is not
> the public-launch plan and its manual acceptance rows do not block store
> release. Current launch status lives in
> [`../release-candidate-closure.md`](../release-candidate-closure.md).

This packet is the canonical protocol for the first moderated Algorithms
cohort. It tests whether people understand and can use the current product; it
does not claim that Patternly improves interview performance, retention, or
transfer.

## Study setting

- Cohort: 6–8 adults preparing for technical interviews who can solve basic
  programming tasks but struggle with pattern recognition, trade-offs, or
  boundary conditions.
- Product language: English shell and English learning content.
- Moderation language: Polish or English, recorded per participant.
- Research session length: 45–60 minutes.
- Research track: Algorithms only.
- Research roles: the product owner is also the research owner, moderator,
  note-taker, and synthesis owner for the first cohort.
- GCP ACE: outside this first Algorithms cohort. Its reviewed pinned bank does
  not authorize reusing the Algorithms protocol for Certification research.
- Commercial scope: no paywall, price, subscription, or purchase proposition.
  Ask about the outcome a participant might pay for without suggesting a price.

The language, cohort, and notes-only operating model implement the owner's
confirmed choices in
[PO-006, PO-007, and PO-013](../product-owner-decision-register.md). Recruitment
still requires the concrete operational inputs listed below.

## Packet

1. [Participant screener and consent/data note](participant-screener-and-consent.md)
2. [Moderator guide](moderator-guide.md)
3. [Observation form](observation-form.md)
4. [Representative-content manifest](representative-content-manifest.md)
5. [Synthesis and GO/NO-GO guide](synthesis-and-go-no-go.md)
6. [Pre-recruitment acceptance record](pre-recruitment-acceptance.md)

## Required preflight

Do not start recruitment until all of the following are true:

- PO-006 A, PO-007 A, and PO-013 A remain the confirmed cohort contract;
- the confirmed solo research owner has recorded a participant contact,
  approved data location, compensation, privacy notice, and applicable deletion
  dates;
- the exact build and platform have passed the automated, publication,
  device and visual subgates recorded in
  [current product status](../release-candidate-closure.md);
- participant-build identity remains schema 1 / 279 inputs / SHA-256
  `6c113edc3bbbfdd716d48385b5356a35eb1b22932084287b3a2e896a863bf646`,
  unchanged by notes or acceptance-record edits;
- the manual VoiceOver and TalkBack records in the pre-recruitment acceptance
  record are complete and pass;
- a person uninvolved in implementation has completed a dry-run of this packet
  as the test participant; the product owner may moderate that dry-run, and
  the result is recorded in the pre-recruitment acceptance record;
- the path `Algorithms → Independent Practice → Hash map and set` produces
  the exact ordered 10-item session in the representative-content manifest;
- `.maestro/user-testing/algorithms-independent-practice-preflight.yaml`
  passes on the exact participant platform and build;
- `.maestro/user-testing/algorithms-core-journey.yaml` passes twice
  consecutively on each final participant platform and build;
- the selected mode remains labelled `Independent Practice` through scope
  selection; a `Mixed Practice` title on that path is a build blocker;
- all participant-facing links, compensation details, contact details, and
  consent wording have been supplied by the research owner;
- no screen, audio or video recording is requested or made; the first cohort
  uses only pseudonymous written notes under PO-013 A;
- no GCP participant is recruited.

If the content IDs, order, interaction types, or scope do not match the
manifest, stop. Do not substitute convenient questions during moderation.
