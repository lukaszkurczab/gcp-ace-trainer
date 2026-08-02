# Launch 003B-1 — Firebase/GCP project shells

Date: 2026-08-01

Controller decision: `pass`

## Objective and authorization

`PO-021` authorized creation of exactly two empty Firebase/GCP projects:

- `patternly-app-sandbox` — `Patternly Sandbox`;
- `patternly-app-production` — `Patternly Production`.

The authorization excluded worker-initiated billing/Blaze, Firestore,
Authentication, Cloud Run, IAM, Secret Manager, service-account key, Firebase
application-registration, repository-configuration and existing-project
operations. It allowed the automatic Firebase baseline intrinsic to
`firebase projects:create`; that baseline is documented below and is not a
separate product decision.

## Pre-creation fact and execution history

Before 3B-1, a read-only Firebase project list contained two active projects
belonging to other products and neither exact Patternly project ID. The worker
then ran only these two mutating commands, in order:

1. `firebase projects:create patternly-app-sandbox --display-name "Patternly Sandbox" --json` — exit `0`;
2. `firebase projects:create patternly-app-production --display-name "Patternly Production" --json` — exit `0`.

No alternate ID, suffix, retry, rollback or existing-project mutation was used.

## Result

| Environment | Project ID | Project number | Display name | State | Billing enabled |
| --- | --- | ---: | --- | --- | --- |
| Sandbox | `patternly-app-sandbox` | `958691314582` | `Patternly Sandbox` | `ACTIVE` | `false` |
| Production | `patternly-app-production` | `635996115672` | `Patternly Production` | `ACTIVE` | `false` |

Both `firebase projects:create` operations returned exit `0`. A fresh
`firebase projects:list --json` independently returned both exact projects as
Firebase-enabled and `ACTIVE`.

## Empty-state verification

- `firebase apps:list --project <project> --json` returned an empty array for
  both projects.
- `firebase firestore:databases:list --project <project> --json` returned the
  expected `403` for both projects because the Cloud Firestore API has never
  been used and is disabled. No Firestore location or database exists yet.
- A read-only Cloud Billing API check through the authenticated Firebase CLI
  session returned `billingEnabled: false` for both projects. No billing
  account was linked and neither project was upgraded to Blaze.
- `.firebaserc` and `firebase.json` do not exist in the repository. The worker
  made no repository write; the pre-existing dirty worktree remains outside
  this slice.

## Automatic Firebase Hosting reservation

`firebase projects:create` automatically registered one default Firebase
Hosting site and live channel per project, using the project ID. This was not a
separate worker command or a product-hosting decision.

- `https://patternly-app-sandbox.web.app/` returned HTTP `404`;
- `https://patternly-app-production.web.app/` returned HTTP `404`.

No content or application was deployed. `PO-020` therefore continues to leave
the public host and owned domain unresolved. These automatically reserved
sites must remain unused unless a later owner decision explicitly selects
Firebase Hosting.

## Verification boundary

This slice proves only the two isolated project shells, disabled billing, no
registered Firebase apps and no Firestore database. It does not prove the
remaining prerequisite 3B configuration: Warsaw Firestore, email/password
Authentication, deny-all rules, Cloud Run service identity, IAM, Secret
Manager, quotas, budget alerts or environment values. Authentication, Cloud
Run, IAM and Secret Manager were not inspected with service-specific read-only
checks, so this report does not claim that those resources are absent. The only
verified automatically created service surface is the empty default Firebase
Hosting reservation described above; it remains unselected for product use.

Official Firebase documentation states that `projects:create` creates a Google
Cloud project and adds Firebase resources, while linking a Cloud Billing
account is the operation that upgrades a Spark project to Blaze:

- https://firebase.google.com/docs/cli
- https://firebase.google.com/docs/projects/billing/firebase-pricing-plans

## Independent QA

Independent QA returned `pass` after one documentation-only repair. The repair
removed stale active claims that the projects did not exist, narrowed the
worker-action boundary around Firebase's automatic baseline and added `PO-021`
to the decision-register summary. QA found no remaining scope drift,
unsupported zero-service claim, billing expansion or implicit Firebase Hosting
selection.
