# Patternly — competitive product gap audit

Status date: 2026-07-31  
Application evidence commit: `4a2c2ab`  
Decision: `CATEGORY BASELINE REVIEWED / PRODUCT COMPLETION NO-GO`

## Purpose

This audit extends the one-time launch inventory with current competitor and
adjacent-product evidence. Its purpose is not to copy feature catalogs. It
identifies category expectations that materially improve Patternly's core loop,
trust or public-launch operability, then explicitly rejects features that would
pull the product away from active technical decision practice.

The comparison uses current official product pages, help centers and store
listings. It is a capability benchmark, not a hands-on visual or usability
audit of each competitor application.

## Products reviewed

| Product | Relevant category role | Current evidenced capability |
| --- | --- | --- |
| LeetCode | direct Algorithms practice competitor | mobile problem library, quick practice, coding, collections, progress breakdown, widgets and notifications |
| NeetCode | direct structured interview-prep competitor | named roadmaps, practice problems, code/test feedback and progress tracking |
| AlgoMonster | direct pattern-based interview-prep competitor | pattern curriculum, company/problem collections, AI explanation and rubric-based mock interview |
| Pocket Prep | direct certification-practice competitor | Question of the Day, Quick 10, timed/custom/missed/weakest-subject modes, mock exams, reminders, history/review and analytics |
| AWS Skill Builder | official certification-prep reference | guided exam-prep plan, domain practice, detailed feedback, recommended resources, official pretests/practice exams, labs and content-error reporting |
| Google Skills | official cloud-learning reference | guided learning paths, mixed resource formats, hands-on labs and credentials |
| Microsoft Learn | adjacent structured cloud-learning reference | plans, paths/modules, practice assessments, progress and credentials |
| Brilliant | adjacent mobile learning-quality reference | short interactive lessons, personalized next steps, immediate feedback, progress continuity, reminders and optional habit mechanics |
| Codecademy | adjacent cross-device practice reference | synchronized progress, personalized spaced practice and explicit weekly target |
| Quizlet | adjacent adaptive-review reference | short adaptive sessions, multiple response formats, active recall, spaced repetition and cross-device sync |

Primary sources:

- [LeetCode mobile app](https://leetcode.com/app/)
- [NeetCode Pro](https://neetcode.io/pro)
- [AlgoMonster dashboard](https://algo.monster/dashboard)
- [Pocket Prep quiz modes](https://help.pocketprep.com/en/articles/14548723-quiz-modes-explained-how-to-study-with-pocket-prep)
- [Pocket Prep quiz history and review](https://help.pocketprep.com/en/articles/12870617-how-do-i-review-previous-quizzes)
- [AWS Skill Builder subscriptions and exam prep](https://skillbuilder.aws/subscriptions)
- [AWS Skill Builder exam-prep FAQ](https://skillbuilder.aws/support/faq/digital-training)
- [Google Cloud training / Google Skills](https://cloud.google.com/learn/training)
- [Microsoft Learn content types](https://learn.microsoft.com/en-us/training/support/learn-content-types)
- [Brilliant product basics](https://brilliant.org/help/using-brilliant/)
- [Codecademy synchronized personalized practice](https://www.codecademy.com/resources/blog/?p=9387)
- [Quizlet Learn](https://quizlet.com/sa/features/learn)

## Category capability comparison

| Capability | Competitor evidence | Patternly current reality | Status / decision |
| --- | --- | --- | --- |
| One obvious next action | LeetCode daily practice, Pocket Prep Quick 10, Brilliant personalized recommendation | Home has one recommendation and immediate start, but visual hierarchy and failure presentation need work | `partial` — keep and polish |
| Structured path | NeetCode roadmap; AWS, Google and Microsoft learning plans/paths | Topic Roadmap and recommendation exist, but no user goal/cadence contract connects them into a visible plan | `partial` — add a bounded goal/cadence decision, not content locking |
| Custom practice | Pocket Prep Build Your Own and topic modes; LeetCode collections | Patternly has scope/topic/configuration surfaces, but the current setup screen clips its title and important alternatives can sit below the first viewport | `blocking` — repair existing canonical path |
| Mistake and spaced review | Pocket Prep Missed/Weakest Subject; Quizlet and Codecademy adaptive review | durable review queue and Mistakes Review exist, but access, empty/populated hierarchy and review history are incomplete | `partial` — complete, do not add a second scheduler |
| Timed/full simulation | Pocket Prep mock exams; AWS official practice assessments | Certification exam and Algorithms interview simulation exist, but result/review and recovery quality is uneven | `blocking` — complete existing runtimes |
| Session history and revisit | Pocket Prep Study Activity and previous-quiz review; LeetCode progress/collections | records exist locally, but there is no explicit launch route for a chronological session list and reliable entry back into past results/reviews | `blocking` — add canonical Study Activity/history surface |
| Explanation and source trust | Pocket Prep detailed explanations with references; AWS feedback with recommended resources | Patternly has authored Reason/Details and internal provenance, but no consistent user-facing content version/source-basis surface | `blocking` — expose truthful content trust information |
| Report a content problem | AWS exposes “Report Content Errors” on each question | no in-question or review-level report action and no operator correction intake are evidenced | `blocking` — required because launch will not use manual item-by-item approval |
| Account continuity | LeetCode, Brilliant, Codecademy and Quizlet synchronize progress | no account/auth/sync implementation; current copy explicitly says no account | `blocking` — owner now requires registration and the complete account/data contract |
| Offline continuity | many competitors depend on network; Brilliant explicitly requires it | Patternly's local-first practice is a useful differentiator | `partial` — preserve it through the account/sync design and expose sync state |
| Goal and study cadence | Microsoft Plans, Codecademy weekly target, AWS exam-prep sequence | daily reminder exists, but no explicit user goal, target horizon or explainable cadence | `planned` — define only if it changes recommendations; no vanity deadline |
| Search/global content library | LeetCode library and filters; broad learning catalogs | Patternly intentionally chooses bounded mental units and recommended practice | `deferred` — roadmap/scope selection is sufficient until observed discovery failure |
| Code execution / hands-on labs | LeetCode/NeetCode code runners; AWS/Google labs | product contract explicitly excludes an online judge; no cloud sandbox exists | `deferred` — strategic non-goal for launch |
| AI tutor/mock interviewer | AlgoMonster and Brilliant offer AI assistance | no model service or safety/privacy contract exists | `deferred` — not required for the core launch loop |
| Streaks, XP, leagues and badges | Brilliant and Codecademy use habit mechanics; official platforms offer credentials | Patternly avoids synthetic mastery and status claims | `deferred` — reminders and evidence-based next actions are enough |
| Community, contests and social proof | LeetCode has events/community; credential platforms support shareable badges | no product evidence that social mechanics improve Patternly's core loop | `deferred` — not a launch requirement |
| Subscription/paywall | several reviewed products monetize advanced modes/content | Patternly has no approved launch monetization decision | `deferred` — free launch is valid; do not invent a paywall during completion |

## Important gaps not previously explicit

### GAP-001 — Study Activity and past-session history

Patternly persists sessions, attempts, results and review references, but the
current navigator has no chronological Study Activity route. Progress shows
aggregates and priority; it does not reliably answer:

- what did I practise recently;
- which sessions were completed or ended early;
- which result belongs to which session/configuration;
- how do I reopen that result or its answers;
- what is still resumable versus terminal.

Add one canonical `StudyActivity` surface backed by the existing repositories.
It must not duplicate Progress analytics. It is a navigable history of durable
events with empty, populated, filtered, unavailable and removed-content states.

### GAP-002 — Content trust and problem reporting

The absence of manual item-by-item pre-launch approval increases the importance
of a real post-launch correction path. A generic support screen is not enough:
the report must carry the stable item ID, content release/version, track, route
and report category without requiring the user to copy internal identifiers.

Required user surfaces:

- `Report a problem` from feedback/details and from answer review;
- report categories such as incorrect answer, unclear explanation, outdated
  source basis, rendering problem and other;
- optional user description with explicit privacy guidance;
- sent, queued/offline, failed and retry states;
- visible content release/version and certification source basis/checked date
  where it is relevant.

Required operational path:

- authenticated or privacy-safe intake;
- deduplication and triage keyed by immutable item/release identity;
- canonical in-place correction and a reproducible content release;
- no hidden runtime filter, weak-content label or second question bank.

### GAP-003 — Goal and cadence without gamification

Competitors commonly ask users to follow a plan or weekly target. Patternly has
a better core primitive — an evidence-based next action — but currently lacks
the minimum user intent needed to decide whether the next action fits an
interview, certification exam or general practice horizon.

Before implementation, decide whether a small `Learning goal` surface changes
recommendation inputs. If it does, support:

- goal type;
- optional target date or weekly cadence;
- reminder alignment;
- editable/clearable state;
- no streak punishment, fake readiness percentage or content lock.

If goal data would not change a product decision, do not add the surface.

### GAP-004 — Cross-device continuity must preserve local-first practice

Accounts make sync a user expectation. A sign-in screen without visible
continuity would compare poorly with LeetCode, Brilliant, Codecademy and
Quizlet, while also weakening Patternly's current offline advantage.

The account contract must therefore define:

- first sync and local-data adoption;
- offline attempts and pending upload;
- conflict resolution;
- sign-out data retention;
- deletion across device and server;
- visible last-synced/pending/error state;
- practice availability when the account or network service is unavailable.

### GAP-005 — Public content freshness

Official cloud-training products expose structured paths, source context and
updates. Patternly already records content release identity and certification
profile source internally, but the user cannot verify the active release or
report an outdated premise.

Add a compact content information surface or section showing:

- active content release/version;
- last reviewed or published date where honestly available;
- exam-guide/profile source and checked date for certification simulations;
- independent/unofficial-product disclaimer;
- change/report path.

Do not expose internal technical-evidence blobs or imply official endorsement.

## What Patternly should deliberately not add for launch

The benchmark does not justify copying:

- a general searchable problem catalog;
- an online code judge;
- cloud labs;
- AI tutor or generated feedback;
- leaderboards, leagues, XP, streak repair or badges;
- public profiles, community feeds or contests;
- official pass/readiness claims;
- a paywall without a separate monetization decision.

These features either conflict with the canonical strategy-first loop, require
unapproved infrastructure/safety contracts or add launch scope without closing
a proven gap.

## Required plan changes

The active launch plan must now include:

1. a real Study Activity/history route and reopen-result/review flow;
2. a content trust surface with visible release/source context;
3. per-item content issue reporting and its operator correction path;
4. a bounded learning-goal/cadence decision;
5. cross-device sync/offline/conflict/account-deletion semantics inside the
   account contract.

These additions are incorporated into
[`launch-surface-inventory.md`](launch-surface-inventory.md) and
[`launch-completion-plan.md`](launch-completion-plan.md). They are execution
scope, not a request for another broad audit.

## Evidence limits

- Competitor capabilities were verified from current public official sources;
  private, paid and account-gated flows were not interactively inspected.
- No claim is made about competitors' full visual quality or accessibility.
- Pricing, catalog size and policies can change and must be rechecked only when
  a later decision depends on their current exact values.
- Patternly comparisons are based on current source, current route inventory
  and the 2026-07-31 screenshot evidence set.
