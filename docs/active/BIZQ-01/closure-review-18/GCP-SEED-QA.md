# Independent QA — GCPACE-N01-B02 complete-unit review

**Verdict: PASS for the fidelity and scope of `GCP-SEED-REVIEW`; it accurately reports 18 current-item defects with two technically material answer-contract findings.** This validates the review delivery, not the source content or any source/admission/runtime/native change.

I read all 18 whole source objects and the 18 item entries in the review report. The report is bound to content commit `90a1d83859c2be83c5266ffe981f487d3c29aeeb`; current source bytes match the recorded SHA-256 `25e13430f685b05846f7e83fc30f98ef3eca5102b5b5732c286596be0d1e2ad4`. All 18 unique IDs and canonical item fingerprints match the current objects. The machine-readable report SHA-256 is `3479371600d18a78028d3c6879435c60acad8898c27b08af139bd2556b90bc99`.

The report is right to distinguish the general hierarchy answers from the two material exceptions. Official Google Cloud documentation says an existing Workspace or Cloud Identity customer may receive an organization resource when creating a project or billing account; a new Free Trial customer can also receive a standalone organization. The hierarchy documentation also allows top-level projects for free-trial/free-tier users. These details support treating Q001 as an existing-domain organization-resource setup question and Q004 as a possible top-level project classification, while keeping the alternatives and learner-facing clue findings.

| Question | Independent finding |
|---|---|
| 001 | Correct answer can mean provisioning the organization resource through the existing managed domain. The shared constraint conflicts with that identity/domain basis, and alternatives/feedback do not teach the distinction. Moderate defect is accurate. |
| 002 | Home-organization default is correct for a managed user, but the common constraint and unrelated alternatives weaken the item. Moderate defect is accurate. |
| 003 | An organization is the direct hierarchy prerequisite for folders; the report correctly identifies the unrelated alternatives and generic explanation. |
| 004 | A top-level project is allowed for a free-trial user; an automatically created standalone organization does not make every project require that organization as parent. The report’s answer-contract conclusion is supportable; its alternatives remain weak. |
| 005 | Organization is a valid folder parent. The billing/zone alternatives are distant distractors, as reported. |
| 006 | Organization → parent folder → department folder is valid. Project-as-folder-parent is relevant; billing and zone options are not comparable. |
| 007 | A Workspace account/domain maps to one organization resource. The shared “do not substitute identity” constraint conflicts with the key’s managed-domain premise. |
| 008 | The key combines a supported organization-parent continuity point with an unsupported claim that the creator principal changes automatically. Google documents that the organization retains projects when employees leave; it does not establish an automatic creator-principal reassignment. High finding is justified. |
| 009 | The organization is the common governance ancestor. Only the department-project option is a somewhat relevant alternative; the remaining options are poor. |
| 010 | A valid standalone project can remain top-level; the report’s key conclusion is supportable. The distractors and generic feedback remain weak. |
| 011 | Migration is the correct hierarchy operation for retaining a standalone project under a new organization. The report appropriately treats the weak choices/explanation as the defect rather than claiming the key is false. |
| 012 | The department folder is the correct project parent. The other parent choices are mostly category errors, matching the report’s finding. |
| 013 | High ambiguity is correct. Official setup guidance says creating a new billing account can trigger organization-resource provisioning for an existing customer when none exists. The prompt’s claim may describe that trigger, while the key rejects it as though billing and organization setup were wholly separate. It needs to distinguish a provisioning event from billing-account parentage. |
| 014 | An organization with folders supports centralized administration; the explanation repeats the conclusion and the alternatives are mostly implausible. |
| 015 | Managed Workspace context supports the organization answer, but the shared constraint expressly warns against the identity boundary the item tests. |
| 016 | The creator is a principal and the organization is a hierarchy ancestor. The common constraint contradicts the distinction, and the alternatives are weak absolutes. |
| 017 | A department folder under the organization is valid; the report accurately flags poor alternatives and non-diagnostic feedback. |
| 018 | Reassessing inherited governance after a hierarchy move is correct. Details should explain inherited policy rather than only restate the outcome; the report captures this gap. |

For the remaining 16 items, I found no additional answer-key contradiction comparable to Q008/Q013. That does not make them sound learning items: the shared constraint often reveals the answer category or conflicts with it, alternatives frequently include unrelated resource types, and the repeated feedback does not explain a plausible nearest misconception. Those are sufficient existing BIZQ-01 quality defects for the report’s moderate classifications. The 18-question scope is one complete mental unit; it is not evidence about the rest of the GCP track.

Primary references checked:

- [Set up a Google Cloud organization resource](https://docs.cloud.google.com/resource-manager/docs/creating-managing-organization) — organization provisioning for managed domains and new Free Trial customers.
- [Set up standalone organizations](https://docs.cloud.google.com/resource-manager/docs/standalone-organization-overview) — standalone organization behavior for Free Trial accounts.
- [About the resource hierarchy](https://docs.cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy) — project ancestry, standalone/top-level cases, and organization ownership.
- [Migrate projects between organization resources](https://docs.cloud.google.com/resource-manager/docs/project-migration) — migration changes hierarchy location.

No source, review report, or runtime artifact was changed in this QA.
