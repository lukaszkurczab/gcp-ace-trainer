# Review18 current-bindings QA

**Result: PASS for evidence currentness and item binding only.** This report does not recertify the 216 prior semantic judgments, introduce a BIZQ-01 product gate, or establish whole-bank quality.

I independently ran [`reconcile-review18.mjs`](reconcile-review18.mjs) and compared the complete generated object—including every one of its 216 item rows—with [`ROOT-REVIEW18-CURRENT.json`](ROOT-REVIEW18-CURRENT.json). They are identical. The saved summary is therefore current for the evidence inputs the script checks:

- Sample SHA-256: `d2c083f3f3ac02fdaa38de725c717d31c88ad227365c30fb54bd121c16241ad4`.
- Source/content HEAD: `b1d7cc419b475dccd37fba82c948bcd760ab577f`; app HEAD: `291d56bffbcd6c2fa6e621389ad6c22618893130`.
- The script binds both frozen semantic report bytes and hashes, matches each sample row to its prior report fingerprint, hashes the complete sample item, validates each of the nine current source tracks, and confirms current generated artifact questions equal each validated source-derived artifact. The two report hashes are recorded in the reconciliation JSON.
- It reconciles 216 prior sample rows across nine tracks: 212 exact-object matches plus four retired OOD IDs. There are no `CHANGED_OBJECT_REVIEW_REQUIRED` rows.

The exact-object tally is 79 PASS and 133 DEFECT; the four remaining rows are retired IDs and must be handled through replacement evidence. Among the 133 exact current defects, the recorded severity distribution is 59 critical, 1 noncritical, 72 material sample defects, and 1 minor explanation error. The four retired objects were previously marked critical; they are excluded from the 133 current-object defect total. This resolves the apparent difference between the report’s active finding weights and the prior severities attached to all 216 sample rows.

## Retired OOD IDs and replacement acceptance

I checked the four mappings against the immutable migration proofs and packet acceptance reports. All four old IDs are actually present as `beforeQuestionId` in their fixed replacement proof; the corresponding new IDs are present as `questionId`:

| Prior finding | Accepted replacement | Proof and review binding |
| --- | --- | --- |
| `ood-n03-b01-i017` | `ood-n03-b01-i035` | [Fixed closure19 proof](../../../../../patternly-content/evidence/business-quality/bizq-01-ood-node-closure-19.json) and [N03/19 acceptance report](../ood-node-closure-19/REPORT.md). |
| `ood-n03-b02-i018` | `ood-n03-b02-i036` | [Fixed closure19 proof](../../../../../patternly-content/evidence/business-quality/bizq-01-ood-node-closure-19.json) and [N03/19 acceptance report](../ood-node-closure-19/REPORT.md); the subsequent [19a Reason-only report](../ood-node-closure-19/reason-amendment-19a/SEMANTIC-QA.md) separately passes this current replacement object’s Reason. |
| `ood-n03-b05-i007` | `ood-n03-b05-i025` | [Fixed closure19 proof](../../../../../patternly-content/evidence/business-quality/bizq-01-ood-node-closure-19.json) and [N03/19 acceptance report](../ood-node-closure-19/REPORT.md). |
| `ood-n04-b02-i013` | `ood-n04-b02-i031` | [Fixed closure20 proof](../../../../../patternly-content/evidence/business-quality/bizq-01-ood-node-closure-20.json) and [N04/20 whole-cohort report](../ood-node-closure-20/REPORT.md). |

The mapping itself is not the semantic judgment. The evidence is the prior object’s exact binding plus the replacement’s separate review and accepted proof. The 19a amendment changes only Reasons for already-current 19 objects; it is not treated as a replacement mapping.

## Limits and interpretation

The reconciliation’s `EXACT_OBJECT_REUSE` disposition means the full current canonical object fingerprint matches the object previously reviewed. It allows reuse of that bounded finding without rerunning semantic review solely because HEAD or content version advanced. A changed or retired object does not inherit its former PASS or DEFECT as a semantic conclusion. In particular, the checker does not infer that an identity change is a repair; the four retired rows retain an explicit replacement-acceptance disposition and were checked against fixed proof and review records separately.

The output is a currentness and evidence-linkage inventory, not a new semantic review, quality percentage, or full BIZQ-01 acceptance. It does not inspect the 801 remaining OOD questions, native rendering, Premium/provider behavior, or resolve other open BIZQ-01 work.
