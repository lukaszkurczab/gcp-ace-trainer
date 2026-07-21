# Feature map

| Surface | Current evidence | Status |
| --- | --- | --- |
| Home / Algorithms | Current track, continue-learning CTA and recommendation rendered on iPhone 17 | OBSERVED |
| Practice Hub | Topic, Start session, Default Practice, Weak Area Review and Mixed Practice rendered | OBSERVED |
| Guided Practice immediate feedback | Question 1/20, timer, four choices, correct/incorrect states, Reason and Details control rendered | OBSERVED |
| Leave / relaunch / resume | Active-session card appears after relaunch; same incorrect choice and feedback state resume | OBSERVED |
| Summary | No full session completed | BLOCKED_SCOPE |
| Progress mutation | No completed/due session reached | BLOCKED_SCOPE |
| Interview Simulation | Artifact declares fixed-40 pool; device flow not executed | STATICALLY_VERIFIED / BLOCKED_SCOPE |
| Cloud Certification | Runtime has no artifact or source ingress | BLOCKED |

The existing `audit/algorithms-ui` package is a state-projection harness with immutable fixture projections and no storage writes. It is useful visual support but not accepted as user-flow evidence for this report.
