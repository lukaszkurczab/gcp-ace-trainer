# GOV-06 — exact-SHA CI baseline revalidation

Date: 2026-08-21

## Read-only external verification

GitHub CLI was authenticated as `lukaszkurczab`. The two baseline workflow runs
were re-read from GitHub without mutation:

| Repository | Workflow | Run | SHA | Result |
| --- | --- | --- | --- | --- |
| `lukaszkurczab/gcp-ace-trainer` | `QA` | [32394452819](https://github.com/lukaszkurczab/gcp-ace-trainer/actions/runs/32394452819) | `19b6601e19e1888ffce1449dd5e54ca5df4f8996` | completed / success |
| `lukaszkurczab/patternly-content` | `Content publishing architecture` | [32388398769](https://github.com/lukaszkurczab/patternly-content/actions/runs/32388398769) | `12b99c78e03ec6c58964d7f83d11d1b50af08467` | completed / success |

Run metadata was returned by `gh run view` on 2026-08-21. The app run was
created at `2026-08-20T16:52:37Z`; the content run at
`2026-08-20T15:49:12Z`.

## Interpretation

These runs prove the pushed baseline commits, not the current local worktrees.
The application checkout now contains local GOV/QA changes and the content
checkout contains the local GOV-01 approval-integrity change. GOV-05 therefore
keeps the launch gate closed until the relevant clean canonical commits have
their own exact-SHA CI results. No CI result was relabeled as evidence for a
different commit.

## Limits

This report does not authorize a commit or push and does not establish eight-
track package admission, provider/store/signing, Figma approval/parity,
physical-device evidence, or Product Owner GO.
