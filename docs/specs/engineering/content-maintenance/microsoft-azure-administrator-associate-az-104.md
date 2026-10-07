# FCA — microsoft-azure-administrator-associate-az-104

Status i kolejność: [plan główny](../../../PATTERNLY-WORKING-PLAN.md). Wspólne AC i procedura: [utrzymanie banków](../content-maintenance.md). Zakres przeliczono z całych zachowanych review records, nie ze starego summary. Każdy poniższy problem nadal dotyczy dokładnie tego samego question object i taksonomii w źródle07.10.

## FCA-EDIT-333fa2694f — microsoft-azure-administrator-associate-az-104/azure_app_service_and_container_compute/AZ104-N06-B01

Plik: `content/microsoft-azure-administrator-associate-az-104/azure_app_service_and_container_compute/AZ104-N06-B01.json`. Badana wersja: `microsoft-azure-administrator-associate-az-104-authoring-v2026.08.15`.
Aktualny SHA-256 pliku: `b941ba9a192b88c76762adbd25430944413cbd93bd031b2defe0e77dc20c3d05`.
Kategorie: `APP_SERVICE_MOVE_PREREQUISITES_INCOMPLETE`, `GENERIC_TRANSFER`, `UNSUPPORTED_TIER_REQUIREMENT`.

Wymagane korekty: Generalize that scale-in should trail scale-out by a meaningful threshold gap and evaluation/cooldown windows should allow the previous action to stabilize. Generalize the sequence: validate target-scope metric, capacity bounds, separated scale-in/out thresholds and stabilization windows using representative load and history. Include the same resource group, region, OS, and webspace eligibility check; disable VNet integration before move; then validate app configuration and dependencies after the move. State that vertical scaling changes capacity/features per worker while horizontal scaling changes worker count; choose based on workload and required capabilities. State that when a rule remains true but capacity plateaus, inspect the active profile maximum and actual current instance count before changing triggers or actions. State the minimum production feature/capacity requirement (for example, dedicated compute or scale-out) and compare compatible paid plan sharing against separate plans; remove the DNS clause or make it relevant. State the reusable slot boundary: separate live endpoint shares plan capacity, suits staging/swap validation when the tier supports slots, and does not isolate resources. State the reusable trigger rule: use App Service automatic scaling for HTTP-traffic behavior without custom rules; use Azure Monitor autoscale for metric or scheduled policies. State when to use metric-based autoscale (CPU/memory/queue signals), with durations, cooldowns and complementary scale-in behavior tuned to the workload.

- `az104-AZ104-N06-B01-001`: The prompt does not establish that a paid Basic plan is required, so the keyed plan cannot be shown to minimize compute cost over Free.
- `az104-AZ104-N06-B01-005`: Transfer repeats a generic autoscale checklist instead of a reusable rule for this sustained CPU scaling problem.
- `az104-AZ104-N06-B01-006`: Transfer restates the distinction without a useful criterion for selecting each scaling model.
- `az104-AZ104-N06-B01-008`: Transfer guidance is copied from a general plan co-location/move item and does not explain release slots.
- `az104-AZ104-N06-B01-009`: Transfer largely repeats a prompt constraint and omits other generalizable autoscale safety practices.
- `az104-AZ104-N06-B01-011`: The keyed procedure omits mandatory current App Service plan-move preconditions, so it is not a complete safe sequence.
- `az104-AZ104-N06-B01-012`: Transfer does not preserve the diagnostic lesson about an effective capacity ceiling.
- `az104-AZ104-N06-B01-013`: Transfer omits the hysteresis and stabilization lesson for the diagnosed flapping condition.
- `az104-AZ104-N06-B01-016`: Transfer discusses tier selection and cost impact instead of the item’s tested scale-up versus scale-out distinction.

Fakty do sprawdzenia: Check every material provider claim in current official documentation; record URL, checked date, exact capability/limitation and sourceRefs. Existing source URLs are starting points, not automatic approval.
Źródła: https://learn.microsoft.com/en-us/azure/app-service/app-service-plan-manage, https://learn.microsoft.com/en-us/azure/app-service/deploy-best-practices, https://learn.microsoft.com/en-us/azure/app-service/manage-automatic-scaling, https://learn.microsoft.com/en-us/azure/app-service/manage-scale-up, https://learn.microsoft.com/en-us/azure/app-service/overview-hosting-plans, https://learn.microsoft.com/en-us/azure/azure-monitor/autoscale/autoscale-get-started

## FCA-EDIT-5a1ff9d400 — microsoft-azure-administrator-associate-az-104/azure_app_service_and_container_compute/AZ104-N06-B02

Plik: `content/microsoft-azure-administrator-associate-az-104/azure_app_service_and_container_compute/AZ104-N06-B02.json`. Badana wersja: `microsoft-azure-administrator-associate-az-104-authoring-v2026.08.15`.
Aktualny SHA-256 pliku: `55ad2fe38ffd743e0942db241bf10933eadaf6bc3cdbc123d053606b7fd272b6`.
Kategorie: `WEAK_APP_SERVICE_DISTRACTORS`.

Wymagane korekty: Replace the scale-out and app-rename foils with plausible configuration-binding mistakes while retaining the key/provider-precedence decision. Replace weak foils with realistic App Service alternatives that distinguish the same operational boundary; for setting precedence, distinguish a portal-injected value from an application that never reads the corresponding key.

- `az104-AZ104-N06-B02-001`: C: Rename the staging database to match production. — Does not inject an environment-specific endpoint into the app.; D: Use a DNS override on each developer workstation. — Does not configure managed App Service workers.
- `az104-AZ104-N06-B02-004`: A: Inspect DNS records because every request reaches the app and returns 500. — Given requests reach the app, DNS is an implausible first cause.
- `az104-AZ104-N06-B02-007`: A: Use a path that performs an expensive write on every probe. — Contrary to a safe and lightweight health endpoint; low diagnostic value as a foil.
- `az104-AZ104-N06-B02-008`: A: Use access restrictions to allow the app to read its own missing setting. — Network allow/deny rules cannot supply a runtime configuration value.
- `az104-AZ104-N06-B02-010`: A: Add another system-assigned identity and expect the Reader role to include writes. — A duplicate identity changes no role permission and is not a normal fix.; B: Assign Contributor on the App Service plan. — Wrong scope and management plane for Blob writes.
- `az104-AZ104-N06-B02-011`: The scale-out and resource-rename foils are implausible explanations for a setting-key mismatch; the change-value-without-fixing-the-name foil remains a valid misconception.
- `az104-AZ104-N06-B02-013`: C: Run `az appservice plan update --settings KEY=VALUE`. — Plan config is not the web app appsettings collection.; D: Run `az webapp deployment source config --settings KEY=VALUE`. — Source-control/deployment configuration is distinct from runtime app settings.

Fakty do sprawdzenia: Check every material provider claim in current official documentation; record URL, checked date, exact capability/limitation and sourceRefs. Existing source URLs are starting points, not automatic approval.
Źródła: https://learn.microsoft.com/en-us/azure/app-service/configure-common, https://learn.microsoft.com/en-us/azure/app-service/monitor-instances-health-check, https://learn.microsoft.com/en-us/azure/app-service/troubleshoot-diagnostic-logs, https://learn.microsoft.com/en-us/azure/role-based-access-control/role-assignments, https://learn.microsoft.com/en-us/azure/storage/blobs/assign-azure-role-data-access?view=azure-devops-2022, https://learn.microsoft.com/en-us/cli/azure/webapp/config/appsettings?view=azure-cli-latest

## FCA-EDIT-18b1436784 — microsoft-azure-administrator-associate-az-104/azure_app_service_and_container_compute/AZ104-N06-B03

Plik: `content/microsoft-azure-administrator-associate-az-104/azure_app_service_and_container_compute/AZ104-N06-B03.json`. Badana wersja: `microsoft-azure-administrator-associate-az-104-authoring-v2026.08.15`.
Aktualny SHA-256 pliku: `875d4559b12bbb94626fc46890fdf2d04d4d9150a0fc29af8d91876596836204`.
Kategorie: `DOMAIN_VERIFICATION_TXT_REQUIREDNESS_OVERSTATED`, `WEAK_TLS_CUSTOM_DOMAIN_DISTRACTORS`.

Wymagane korekty: Replace implausible distractors with realistic DNS, certificate, binding, validation and renewal mistakes that distinguish this item’s decision. Say the verification TXT is strongly recommended for security (and normally publish it); obtain its exact value from the App Service validation flow before publishing DNS.

- `az104-AZ104-N06-B03-001`: The constraints describe the asuid TXT verification record as required. Microsoft Learn says it is not absolutely required for every custom domain but is highly recommended to reduce subdomain-takeover risk. In item 005, the sequence also omits that the portal first supplies the unique validation ID.
- `az104-AZ104-N06-B03-003`: B: Paste the PFX password into the DNS TXT record. — DNS verification records must never contain a private certificate password.
- `az104-AZ104-N06-B03-004`: D: Change the CNAME target to the certificate thumbprint. — DNS target is a hostname/IP, not a certificate thumbprint.
- `az104-AZ104-N06-B03-005`: B: Upload the CNAME first, then delete it before adding the hostname. — Deleting the traffic CNAME interrupts resolution/validation.
- `az104-AZ104-N06-B03-012`: A: Export only the root CA with its private key. — A root CA private key is neither required nor safe to export for a site binding.; C: Rename the CER extension to PFX and upload it again. — Changing extension does not change encoded certificate contents or add a private key.; D: Create a new DNS TXT record containing the public certificate. — DNS validation data cannot provide server key material.
- `az104-AZ104-N06-B03-013`: C: Run `az network dns record-set cname set-record --thumbprint ...`. — DNS record commands do not create TLS bindings.; D: Run `az webapp config hostname add --certificate-thumbprint ...`. — Adding hostname is distinct from binding an uploaded certificate; command option is invalid.
- `az104-AZ104-N06-B03-014`: A: A TLS binding makes recursive DNS resolvers find the app. — A TLS binding does not publish DNS records.; B: DNS ownership validation automatically issues and renews every third-party certificate. — Ownership proof does not issue/renew third-party certs.; C: An A or CNAME record encrypts HTTP traffic before App Service receives it. — A/CNAME records route names and do not encrypt traffic.

Fakty do sprawdzenia: Check every material provider claim in current official documentation; record URL, checked date, exact capability/limitation and sourceRefs. Existing source URLs are starting points, not automatic approval.
Źródła: https://learn.microsoft.com/en-us/azure/app-service/app-service-web-tutorial-custom-domain, https://learn.microsoft.com/en-us/azure/app-service/configure-ssl-bindings, https://learn.microsoft.com/en-us/azure/app-service/configure-ssl-certificate, https://learn.microsoft.com/en-us/cli/azure/webapp/config/ssl?view=azure-cli-latest

## FCA-EDIT-fecfe5663b — microsoft-azure-administrator-associate-az-104/azure_app_service_and_container_compute/AZ104-N06-B04

Plik: `content/microsoft-azure-administrator-associate-az-104/azure_app_service_and_container_compute/AZ104-N06-B04.json`. Badana wersja: `microsoft-azure-administrator-associate-az-104-authoring-v2026.08.15`.
Aktualny SHA-256 pliku: `201b015f085fe43c46b3f1c970e6706f6efb38acb202a49e81291e15449d295a`.
Kategorie: `WEAK_MANAGED_WORKER_PUBLIC_IP_DISTRACTOR`.

Wymagane korekty: Replace D with a realistic egress alternative such as a NAT gateway/public egress allowlisting that still does not provide the required private database route.

- `az104-AZ104-N06-B04-001`: Option D asks the learner to assign a public IP directly to each managed App Service worker. Customers do not manage these worker NICs, making this foil markedly less plausible than the inbound/outbound control confusions in B and C.

Fakty do sprawdzenia: Check every material provider claim in current official documentation; record URL, checked date, exact capability/limitation and sourceRefs. Existing source URLs are starting points, not automatic approval.
Źródła: https://learn.microsoft.com/en-us/azure/app-service/overview-vnet-integration

## FCA-EDIT-44e25b4ddf — microsoft-azure-administrator-associate-az-104/azure_app_service_and_container_compute/AZ104-N06-B05

Plik: `content/microsoft-azure-administrator-associate-az-104/azure_app_service_and_container_compute/AZ104-N06-B05.json`. Badana wersja: `microsoft-azure-administrator-associate-az-104-authoring-v2026.08.15`.
Aktualny SHA-256 pliku: `6efe20e2b9f27d9d82c3972e5bf3bc1d6f4c926ffb95e787b0b559814882bd8a`.
Kategorie: `HEALTH_CHECK_SWAP_BEHAVIOR_OMITTED`.

Wymagane korekty: Explain that the effective Health check path/configuration may change during swap, compare both the path and dependencies under destination settings, and retain the immediate reverse-swap option if production impact warrants rollback.

- `az104-AZ104-N06-B05-014`: The item asks what to examine when production fails Health check immediately after a slot swap, but the explanation does not state that Health check configuration is not slot-specific and can change on the destination after swap. This can cause a pre-swap healthy staging result to differ from production behavior.

Fakty do sprawdzenia: Check every material provider claim in current official documentation; record URL, checked date, exact capability/limitation and sourceRefs. Existing source URLs are starting points, not automatic approval.
Źródła: https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots, https://learn.microsoft.com/en-us/azure/app-service/monitor-instances-health-check

## FCA-EDIT-9c2f576168 — microsoft-azure-administrator-associate-az-104/azure_app_service_and_container_compute/AZ104-N06-B07

Plik: `content/microsoft-azure-administrator-associate-az-104/azure_app_service_and_container_compute/AZ104-N06-B07.json`. Badana wersja: `microsoft-azure-administrator-associate-az-104-authoring-v2026.08.15`.
Aktualny SHA-256 pliku: `f110a84a7ca9c0e53d05cfc4e52ad790d32874b4a915de13de793142b4836faa`.
Kategorie: `AZURE_FILES_SMB_CASE_SENSITIVITY_INCORRECT`, `LABEL_ROUTE_NOT_WEIGHTED_CANARY`.

Wymagane korekty: Remove the case-sensitive claim. Check share/key/mount path and that the mount obscures the image path; use a case-sensitive-filesystem warning only if the item specifies a compatible case-sensitive storage protocol. Use the 10% traffic-weight option only for the stated requirement; mention label URLs separately as an opt-in test path, not as the alternative way to send 10% of production requests.

- `az104-AZ104-N06-B07-006`: The correct option offers a 10% traffic weight or a label route as if either one meets the prompt. Container Apps labels independently route requests that use the label URL to one revision; they do not allocate 10% of production app-URL traffic.
- `az104-AZ104-N06-B07-016`: The Details claim Azure Files mounted for Linux is case-sensitive. ACI Azure Files mounts use SMB, and Azure Files SMB directory/file names are case-preserving and case-insensitive. Case mismatch is not the supported explanation for a missing file under this storage protocol.

Fakty do sprawdzenia: Check every material provider claim in current official documentation; record URL, checked date, exact capability/limitation and sourceRefs. Existing source URLs are starting points, not automatic approval.
Źródła: https://learn.microsoft.com/en-us/azure/container-apps/revisions, https://learn.microsoft.com/en-us/azure/container-instances/container-instances-volume-azure-files, https://learn.microsoft.com/en-us/rest/api/storageservices/naming-and-referencing-shares--directories--files--and-metadata

## FCA-EDIT-bc7d5bbb84 — microsoft-azure-administrator-associate-az-104/azure_app_service_and_container_compute/AZ104-N06-B08

Plik: `content/microsoft-azure-administrator-associate-az-104/azure_app_service_and_container_compute/AZ104-N06-B08.json`. Badana wersja: `microsoft-azure-administrator-associate-az-104-authoring-v2026.08.15`.
Aktualny SHA-256 pliku: `297bba8e83d88f43ad86c6715b544a769c0fef38ebd6de5c8109a89693ce1829`.
Kategorie: `CLI_CONFIGURATION_FOILS_TOO_OBVIOUS`, `COMPUTE_SEQUENCE_TESTWISE_CUEING`, `PRIVATE_LINK_ONLY_PUBLIC_RESTRICTION_AMBIGUOUS`, `SLOT_SWAP_NOT_GUARANTEED_INSTANT`.

Wymagane korekty: Ground the sequence in a short concrete workload with one or two competing constraints, and make each alternative a credible but incomplete decision process of comparable length. Replace “instant” with “platform-supported low-downtime swap/rollback between warmed environments,” without promising a fixed duration or zero downtime. Say disable public network access, or explicitly configure the public endpoint to deny every source while retaining Private Link and private DNS. Use plausible near-miss commands within `az webapp config` (for example site config only, appsettings only, or a slot-scoped command) and ask for the exact configuration domains needed.

- `az104-AZ104-N06-B08-005`: “Instant platform-supported swap” overstates the deployment-slot contract. Microsoft documents warming and swap operations but does not guarantee an instantaneous operation; warm-up, initialization, and worker recycle can take time.
- `az104-AZ104-N06-B08-007`: The keyed option says public access may be “restricted” but does not specify a deny-all policy. A public allowlist can remain reachable through the public endpoint and would not satisfy “only through Private Link.”
- `az104-AZ104-N06-B08-009`: The prompt supplies no concrete workload and asks a generic sequence. The keyed option is much longer and more complete than three cartoonishly weak foils, so response length/quality reveals the key and limits meaningful assessment.
- `az104-AZ104-N06-B08-015`: The wrong options use publishing-profile, DNS, and plan commands for an app-configuration task. They are plainly unrelated command families, so they do not test the intended distinction between platform config and app settings.

Fakty do sprawdzenia: Check every material provider claim in current official documentation; record URL, checked date, exact capability/limitation and sourceRefs. Existing source URLs are starting points, not automatic approval.
Źródła: https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots, https://learn.microsoft.com/en-us/azure/app-service/networking/private-endpoint, https://learn.microsoft.com/en-us/azure/architecture/guide/technology-choices/compute-decision-tree, https://learn.microsoft.com/en-us/cli/azure/webapp/config/appsettings?view=azure-cli-latest

## FCA-EDIT-4de5723022 — microsoft-azure-administrator-associate-az-104/azure_monitor_backup_and_site_recovery_operations/AZ104-N09-B01

Plik: `content/microsoft-azure-administrator-associate-az-104/azure_monitor_backup_and_site_recovery_operations/AZ104-N09-B01.json`. Badana wersja: `microsoft-azure-administrator-associate-az-104-authoring-v2026.08.15`.
Aktualny SHA-256 pliku: `df66456df910d9bf641053d93b2480a5c641e70bf3953b618835bc3c22d300f0`.
Kategorie: `ACTIVITY_LOG_EXPORT_FOILS_IMPLAUSIBLE`, `ALERT_STATE_SCOPE_OVERGENERALIZED`, `CHANGE_ANALYSIS_IS_SEPARATE_FROM_ACTIVITY_LOG`, `KEY_VAULT_SEQUENCE_FOILS_IMPLAUSIBLE`, `METRICS_CLI_FOILS_UNREALISTIC`, `MONITORING_ROLLOUT_FOILS_IMPLAUSIBLE_AND_OVERLAP`, `TELEMETRY_SEQUENCE_FOILS_IMPLAUSIBLE_AND_OVERLAP`.

Wymagane korekty: Ask which additional evidence source should be consulted alongside the Activity Log, or ask where to inspect property-level before/after values. Ground the prompt in a distinct operational scenario, make alternatives similarly credible, and differentiate this sequence from B01-011 (for example focus on one metric-vs-log requirement rather than generic end-to-end rollout). Qualify the example as a stateful metric/log alert or state that alert evaluation and state behavior depend on alert type/configuration; retain the Workbook-versus-alerting distinction. Use closer alternatives such as an incorrect Activity Log category, destination workspace, time range, or workspace/table query scope. Use credible near-misses such as selecting the wrong destination, enabling metrics but not AuditEvent, or querying before data ingestion. Use real nearby CLI commands, such as `az monitor metrics list-definitions`, Activity Log list, or diagnostic settings list, with realistic but mismatched flags. Use realistic failure-prone rollout alternatives (e.g. alerting before validating ingestion, or collecting without ownership/retention), and make this item focus on baselines and actionable response rather than repeat the generic setup sequence.

- `az104-AZ104-N09-B01-007`: The prompt asks what evidence should be “added to the Activity Log,” while the key selects Resource Graph Change Analysis/resource change records, which are a distinct change-evidence source rather than data added into Activity Log.
- `az104-AZ104-N09-B01-009`: All three foils name features unrelated to Key Vault resource logging: a guest AMA heartbeat, notification action group, and backup policy. They do not challenge the distinction between diagnostic routing, category selection, and query validation.
- `az104-AZ104-N09-B01-010`: The keyed workflow is much longer and more complete than foils about chart color, action group, and retention alone. It also substantially repeats B01-011’s collection/validation/monitoring rollout sequence.
- `az104-AZ104-N09-B01-011`: The keyed end-to-end monitoring workflow is much more specific and longer than foils about email-only, Site Recovery, or severity-0 alerts. It repeats B01-010’s generic telemetry setup sequence with added baseline/alert steps.
- `az104-AZ104-N09-B01-014`: The keyed diagnostic-setting diagnosis is much more relevant than foils about a VM dependency agent, metric namespace, and vault redundancy; those do not test the boundary between Activity Log UI visibility and workspace export.
- `az104-AZ104-N09-B01-015`: The choices contain obviously fabricated or unrelated commands (`--metric-value` on diagnostic settings, backup job `--metric CPU`, Activity Log `--aggregation`). These do not discriminate CLI knowledge of metrics list vs metric definition/diagnostic commands.
- `az104-AZ104-N09-B01-018`: Option D states generically that an alert rule creates stateful alert instances. Azure Monitor supports stateful and stateless alerts, and Activity Log alerts are stateless; the stateful property is not universal to every alert rule.

Fakty do sprawdzenia: Check every material provider claim in current official documentation; record URL, checked date, exact capability/limitation and sourceRefs. Existing source URLs are starting points, not automatic approval.
Źródła: https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-overview, https://learn.microsoft.com/en-us/azure/azure-monitor/fundamentals/data-sources, https://learn.microsoft.com/en-us/azure/azure-monitor/fundamentals/overview, https://learn.microsoft.com/en-us/azure/azure-monitor/platform/activity-log, https://learn.microsoft.com/en-us/azure/governance/resource-graph/how-to/get-resource-changes, https://learn.microsoft.com/en-us/azure/key-vault/general/howto-logging, https://learn.microsoft.com/en-us/cli/azure/monitor/metrics?view=azure-cli-latest

## FCA-EDIT-3dee56fc21 — microsoft-azure-administrator-associate-az-104/azure_monitor_backup_and_site_recovery_operations/AZ104-N09-B02

Plik: `content/microsoft-azure-administrator-associate-az-104/azure_monitor_backup_and_site_recovery_operations/AZ104-N09-B02.json`. Badana wersja: `microsoft-azure-administrator-associate-az-104-authoring-v2026.08.15`.
Aktualny SHA-256 pliku: `4c96a6b1bed91906a85b60c8f7e69341f5205003b74076166ebb6c3dd46fe573`.
Kategorie: `WEAK_IMPLAUSIBLE_AZURE_MONITOR_DISTRACTORS`.

Wymagane korekty: Replace at least two unrelated foils with realistic near-misses within the same configuration boundary (for example wrong category/group, destination/scope, DCR association, or validation step) while preserving exactly one supported choice.

- `az104-AZ104-N09-B02-001`: B/C/D are three feature-family errors with no credible destination near-miss, so the correct Storage choice is conspicuous.
- `az104-AZ104-N09-B02-002`: All wrong options are unrelated products or a destination-less object; the item scarcely distinguishes Event Hubs from credible streaming alternatives.
- `az104-AZ104-N09-B02-003`: Action Group and “cross-workspace impossible” are obvious category errors; only per-VM topology is superficially plausible, leaving weak separation among governance designs.
- `az104-AZ104-N09-B02-004`: All wrong choices are visualization, platform diagnostics, or Activity Log concepts rather than plausible alternate guest collection configurations.
- `az104-AZ104-N09-B02-005`: The three foils reverse setup order or substitute unrelated services; none tests realistic category/destination/table validation errors.
- `az104-AZ104-N09-B02-006`: B/C are unrelated, although empty-DCR auto-discovery is a useful near-miss; the option set has only one credible misconception.
- `az104-AZ104-N09-B02-007`: Every foil is unrelated or destructive; none is a realistic but subtly unsafe transform rollout.
- `az104-AZ104-N09-B02-008`: Alert windows, saved queries and metric grain are plainly not retention settings, so all wrong answers are low-discrimination foils.
- `az104-AZ104-N09-B02-010`: Wrong scopes/mechanisms are identifiable, but B/C are not credible near-miss sequences and A is plainly a VM-scope mismatch.
- `az104-AZ104-N09-B02-011`: Resize, ASR and retention are poor competing hypotheses for absent custom rows with AMA healthy; only one option addresses the collection state.
- `az104-AZ104-N09-B02-012`: Backup restore, VM reboot, and metric alert are unrelated to platform category selection; all distractors are implausible.
- `az104-AZ104-N09-B02-014`: Retention, authentication removal, and backup reports are unrelated to transform volume; the keyed evidence comparison is obvious.
- `az104-AZ104-N09-B02-015`: The wrong CLI groups/flags are fabricated or unrelated rather than documented neighboring command families, making syntax recognition trivial.
- `az104-AZ104-N09-B02-016`: Three options are visibly invented or incompatible command forms, rather than realistic CLI alternatives around DCR lifecycle.
- `az104-AZ104-N09-B02-018`: All alternatives state extreme category errors (Workbook persistence, workspace e-mail, both install agents), so boundary recognition is too easy.

Fakty do sprawdzenia: Check every material provider claim in current official documentation; record URL, checked date, exact capability/limitation and sourceRefs. Existing source URLs are starting points, not automatic approval.
Źródła: https://learn.microsoft.com/en-us/azure/azure-monitor/agents/azure-monitor-agent-overview, https://learn.microsoft.com/en-us/azure/azure-monitor/data-collection/data-collection-monitor, https://learn.microsoft.com/en-us/azure/azure-monitor/data-collection/data-collection-rule-overview, https://learn.microsoft.com/en-us/azure/azure-monitor/data-collection/data-collection-transformations-create, https://learn.microsoft.com/en-us/azure/azure-monitor/logs/api/cross-workspace-queries, https://learn.microsoft.com/en-us/azure/azure-monitor/logs/log-analytics-workspace-overview, https://learn.microsoft.com/en-us/azure/azure-monitor/logs/workspace-design, https://learn.microsoft.com/en-us/azure/azure-monitor/platform/diagnostic-settings, https://learn.microsoft.com/en-us/cli/azure/monitor/data-collection/rule?view=azure-cli-latest, https://learn.microsoft.com/en-us/cli/azure/monitor/diagnostic-settings?view=azure-cli-latest

## FCA-EDIT-47ad55de63 — microsoft-azure-administrator-associate-az-104/azure_monitor_backup_and_site_recovery_operations/AZ104-N09-B03

Plik: `content/microsoft-azure-administrator-associate-az-104/azure_monitor_backup_and_site_recovery_operations/AZ104-N09-B03.json`. Badana wersja: `microsoft-azure-administrator-associate-az-104-authoring-v2026.08.15`.
Aktualny SHA-256 pliku: `64f4660f506b51b1ffe069cffe2705fc6fa339bfb97c16c6f0f88501d4673e2a`.
Kategorie: `DEPRECATED_VM_INSIGHTS_DEPENDENCY_MAP_FOR_NEW_DEPLOYMENT`, `WEAK_IMPLAUSIBLE_METRICS_DISTRACTORS`.

Wymagane korekty: Qualify the scenario as troubleshooting an existing enabled deployment and state the retirement caveat, or revise the requested capability to a currently recommended supported alternative; do not present map onboarding as an unqualified new-deployment recommendation. Replace unrelated foils with plausible same-domain alternatives (such as Average versus Maximum, filter versus split, unsupported metric dimension, incomplete DCR/association, or workspace permission/scope error) while keeping one supported answer.

- `az104-AZ104-N09-B03-001`: The item’s wrong answers (B, C, D) mostly use unrelated Backup, Activity Log, or control-plane concepts instead of credible alternatives within the stated Metrics/VM Insights/Workbook decision.
- `az104-AZ104-N09-B03-002`: The item’s wrong answers (A, B, C) mostly use unrelated Backup, Activity Log, or control-plane concepts instead of credible alternatives within the stated Metrics/VM Insights/Workbook decision.
- `az104-AZ104-N09-B03-003`: The answer recommends onboarding dependency-map collection without distinguishing existing-map troubleshooting from a new deployment, although current Microsoft guidance says the Map/Dependency Agent is deprecated, retires 30 June 2028, and should not be enabled for new deployments.
- `az104-AZ104-N09-B03-004`: The item’s wrong answers (A, C, D) mostly use unrelated Backup, Activity Log, or control-plane concepts instead of credible alternatives within the stated Metrics/VM Insights/Workbook decision.
- `az104-AZ104-N09-B03-005`: The item’s wrong answers (B, C, D) mostly use unrelated Backup, Activity Log, or control-plane concepts instead of credible alternatives within the stated Metrics/VM Insights/Workbook decision.
- `az104-AZ104-N09-B03-006`: The item’s wrong answers (A, B, C) mostly use unrelated Backup, Activity Log, or control-plane concepts instead of credible alternatives within the stated Metrics/VM Insights/Workbook decision.
- `az104-AZ104-N09-B03-008`: The item’s wrong answers (A, C, D) mostly use unrelated Backup, Activity Log, or control-plane concepts instead of credible alternatives within the stated Metrics/VM Insights/Workbook decision.
- `az104-AZ104-N09-B03-009`: The item’s wrong answers (B, C, D) mostly use unrelated Backup, Activity Log, or control-plane concepts instead of credible alternatives within the stated Metrics/VM Insights/Workbook decision.
- `az104-AZ104-N09-B03-010`: The item’s wrong answers (A, B, C) mostly use unrelated Backup, Activity Log, or control-plane concepts instead of credible alternatives within the stated Metrics/VM Insights/Workbook decision.
- `az104-AZ104-N09-B03-011`: The item’s wrong answers (A, B, D) mostly use unrelated Backup, Activity Log, or control-plane concepts instead of credible alternatives within the stated Metrics/VM Insights/Workbook decision.
- `az104-AZ104-N09-B03-012`: The item’s wrong answers (A, C, D) mostly use unrelated Backup, Activity Log, or control-plane concepts instead of credible alternatives within the stated Metrics/VM Insights/Workbook decision.
- `az104-AZ104-N09-B03-013`: The item’s wrong answers (B, C, D) mostly use unrelated Backup, Activity Log, or control-plane concepts instead of credible alternatives within the stated Metrics/VM Insights/Workbook decision.
- `az104-AZ104-N09-B03-014`: The item’s wrong answers (A, B, C) mostly use unrelated Backup, Activity Log, or control-plane concepts instead of credible alternatives within the stated Metrics/VM Insights/Workbook decision.
- `az104-AZ104-N09-B03-015`: The item’s wrong answers (A, B, D) mostly use unrelated Backup, Activity Log, or control-plane concepts instead of credible alternatives within the stated Metrics/VM Insights/Workbook decision.
- `az104-AZ104-N09-B03-016`: The item’s wrong answers (A, C, D) mostly use unrelated Backup, Activity Log, or control-plane concepts instead of credible alternatives within the stated Metrics/VM Insights/Workbook decision.
- `az104-AZ104-N09-B03-017`: The item’s wrong answers (B, C, D) mostly use unrelated Backup, Activity Log, or control-plane concepts instead of credible alternatives within the stated Metrics/VM Insights/Workbook decision.
- `az104-AZ104-N09-B03-018`: The item’s wrong answers (A, B, C) mostly use unrelated Backup, Activity Log, or control-plane concepts instead of credible alternatives within the stated Metrics/VM Insights/Workbook decision.

Fakty do sprawdzenia: Check every material provider claim in current official documentation; record URL, checked date, exact capability/limitation and sourceRefs. Existing source URLs are starting points, not automatic approval.
Źródła: https://learn.microsoft.com/en-us/azure/azure-monitor/essentials/metrics-charts, https://learn.microsoft.com/en-us/azure/azure-monitor/metrics/metrics-aggregation-explained, https://learn.microsoft.com/en-us/azure/azure-monitor/platform/diagnostic-settings, https://learn.microsoft.com/en-us/azure/azure-monitor/vm/vminsights-maps, https://learn.microsoft.com/en-us/azure/azure-monitor/vm/vminsights-overview, https://learn.microsoft.com/en-us/azure/storage/common/storage-insights-overview, https://learn.microsoft.com/en-us/cli/azure/monitor/metrics?view=azure-cli-latest

## FCA-EDIT-e37f925e53 — microsoft-azure-administrator-associate-az-104/azure_monitor_backup_and_site_recovery_operations/AZ104-N09-B04

Plik: `content/microsoft-azure-administrator-associate-az-104/azure_monitor_backup_and_site_recovery_operations/AZ104-N09-B04.json`. Badana wersja: `microsoft-azure-administrator-associate-az-104-authoring-v2026.08.15`.
Aktualny SHA-256 pliku: `4058c0a01991e2ddbfea1b247755ddade381b31309680e574641fb2954284047`.
Kategorie: `LOW_DISCRIMINATION_KQL_OPERATOR_FOILS`.

Wymagane korekty: Replace the most implausible alternatives with valid nearby operator/query forms that could arise from a realistic misconception (for example wrong grouping key/join flavor, filter-versus-split, early-versus-late predicate, or valid but semantically unsuitable expression).

- `az104-AZ104-N09-B04-001`: The false foils summarize before filter and render first are conspicuously wrong operator classes; only the unkeyed self-join is a plausible but inefficient shape.
- `az104-AZ104-N09-B04-002`: Project/extend/fullouter-join are neighboring operators, but none is a realistic substitute for grouped counting after failure filtering; option forms make them easy to reject.
- `az104-AZ104-N09-B04-003`: take/render/where-table are not credible correlation workflows and make join the only relevant relational operator.
- `az104-AZ104-N09-B04-004`: All alternatives are unrelated metric, Activity Log or alert-receiver features, rather than plausible cross-workspace KQL approaches.
- `az104-AZ104-N09-B04-005`: The chart-color, join-everything and save-before-validation choices are deliberately implausible and do not test realistic query-construction mistakes.
- `az104-AZ104-N09-B04-006`: The chart-input alternative is an obvious category error; random keys and hiding unmatched rows are more useful but still leave one weak foil.
- `az104-AZ104-N09-B04-007`: The options about project/retention/mean-timestamp do not plausibly calculate an event rate and are easy to reject.
- `az104-AZ104-N09-B04-008`: Screenshot, alert receiver and removing all time filters are not plausible validation sequences; the keyed checklist is conspicuous.
- `az104-AZ104-N09-B04-010`: Render, workspace size and repeated Activity Log export do not compete as explanations for row multiplication from KQL join keys.
- `az104-AZ104-N09-B04-011`: Join and alert severity are unrelated to local/UTC bin boundaries, making the key too obvious.
- `az104-AZ104-N09-B04-012`: Backup, render and metric aggregation are unrelated to a vanished KQL column; weak competing explanations.
- `az104-AZ104-N09-B04-014`: All three alternatives are malformed/non-aggregating operator uses, so summarize is obvious by name and intent.
- `az104-AZ104-N09-B04-015`: Render, take and extend do not resemble relational joins; command selection is trivial.
- `az104-AZ104-N09-B04-018`: The other render-like options use invalid `where timechart` / `join kind=timechart` forms or delete the timestamp, so they are very weak foils.
- `az104-AZ104-N09-B04-020`: Ingestion and a join with no right input are unrelated; only the summarized-row claim is a useful misconception.

Fakty do sprawdzenia: Check every material provider claim in current official documentation; record URL, checked date, exact capability/limitation and sourceRefs. Existing source URLs are starting points, not automatic approval.
Źródła: https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-log, https://learn.microsoft.com/en-us/azure/azure-monitor/logs/cross-workspace-query, https://learn.microsoft.com/en-us/azure/azure-monitor/logs/log-analytics-tutorial, https://learn.microsoft.com/en-us/kusto/query/best-practices, https://learn.microsoft.com/en-us/kusto/query/join-operator?view=microsoft-fabric, https://learn.microsoft.com/en-us/kusto/query/project-operator?view=microsoft-fabric, https://learn.microsoft.com/en-us/kusto/query/render-operator?view=microsoft-fabric, https://learn.microsoft.com/en-us/kusto/query/summarize-operator?view=microsoft-fabric, https://learn.microsoft.com/en-us/kusto/query/where-operator?view=microsoft-fabric

## FCA-EDIT-347fe6a79a — microsoft-azure-administrator-associate-az-104/azure_monitor_backup_and_site_recovery_operations/AZ104-N09-B05

Plik: `content/microsoft-azure-administrator-associate-az-104/azure_monitor_backup_and_site_recovery_operations/AZ104-N09-B05.json`. Badana wersja: `microsoft-azure-administrator-associate-az-104-authoring-v2026.08.15`.
Aktualny SHA-256 pliku: `e94e487eb150e5c0a6a21b0b5dfcb4b8288fe3c7e25af992e572eec55d7654b3`.
Kategorie: `LOW_DISCRIMINATION_ALERTING_DISTRACTORS`.

Wymagane korekty: Replace unrelated choices with plausible same-domain alternatives (for example wrong threshold/window, alert-processing scope, action-group test/schema setting, or log-alert versus metric-alert evaluation) while preserving one best fit.

- `az104-AZ104-N09-B05-001`: Sum, Activity Log alert and permanent action suppression are not credible alternatives for the stated independent per-VM CPU threshold.
- `az104-AZ104-N09-B05-002`: UsedCapacity, bare action group and Workbook chart do not offer a plausible competing alert-evaluation design.
- `az104-AZ104-N09-B05-003`: All three alternatives are unrelated concepts (workspace, metric dimensions, KQL) rather than receiver-routing choices.
- `az104-AZ104-N09-B05-005`: ServiceHealth and Backup retention are unrelated, and yesterday’s static value is an obvious weak foil for strong daily seasonality.
- `az104-AZ104-N09-B05-006`: Metric names, severity and Backup are unrelated to webhook schema; no plausible payload/configuration near-miss is offered.
- `az104-AZ104-N09-B05-007`: Restore/SMS/auto-resolution foils do not compete with a metric-alert setup workflow.
- `az104-AZ104-N09-B05-008`: Metric namespace, unbounded history and action-group-first are weak substitutes for an alert query validation workflow.
- `az104-AZ104-N09-B05-009`: Secret-in-name and Workbook-impersonates-SMS are implausible, while bind-before-test is the only realistic misconception.
- `az104-AZ104-N09-B05-010`: Stopping ingestion/deleting receivers and broad disablement are unsafe extremes rather than credible scheduled-mute alternatives.
- `az104-AZ104-N09-B05-011`: Severity, deletion of history and blanket suppression are plainly poor alternatives to evidence-driven tuning.
- `az104-AZ104-N09-B05-012`: Backup policy and log table are unrelated; combining response codes is a plausible but broad aggregation mistake.
- `az104-AZ104-N09-B05-013`: Metric absence, workspace retention and ASR are weak explanations when an alert instance already fired but actions are missing.
- `az104-AZ104-N09-B05-014`: Receivers, metric frequency and vault redundancy are unrelated to a query broken by a table schema change.
- `az104-AZ104-N09-B05-015`: Agent uninstall/Backup load/metric retention do not plausibly explain a weekly action-only schedule.
- `az104-AZ104-N09-B05-016`: ASR, SMS and log retention are unrelated to dynamic metric threshold history and make the keyed diagnosis obvious.
- `az104-AZ104-N09-B05-017`: Metrics query, action-group receiver and Backup command groups are obviously not alert-rule creation alternatives.
- `az104-AZ104-N09-B05-018`: Processing-rule create email, Log Analytics SMS, and ASR webhook forms are invented/unrelated alternatives to receiver testing.
- `az104-AZ104-N09-B05-020`: Log collection, metric aggregation and storing webhook secrets as samples are conspicuously unrelated alternatives to alert-rule/action-group boundaries.

Fakty do sprawdzenia: Check every material provider claim in current official documentation; record URL, checked date, exact capability/limitation and sourceRefs. Existing source URLs are starting points, not automatic approval.
Źródła: https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/action-groups, https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-common-schema, https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-create-log-alert-rule, https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-create-new-alert-rule, https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-metric-multiple-time-series-single-rule, https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-overview, https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-processing-rules, https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-troubleshoot-metric, https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-types, https://learn.microsoft.com/en-us/cli/azure/monitor/action-group/test-notifications?view=azure-cli-latest, https://learn.microsoft.com/en-us/cli/azure/monitor/metrics/alert?view=azure-cli-latest

## FCA-EDIT-809e88c9d5 — microsoft-azure-administrator-associate-az-104/azure_monitor_backup_and_site_recovery_operations/AZ104-N09-B06

Plik: `content/microsoft-azure-administrator-associate-az-104/azure_monitor_backup_and_site_recovery_operations/AZ104-N09-B06.json`. Badana wersja: `microsoft-azure-administrator-associate-az-104-authoring-v2026.08.15`.
Aktualny SHA-256 pliku: `71380d2044fa8fe811121cee702727a407afe904c3ca14d696fd7ff63068d7b5`.
Kategorie: `ENDPOINT_CHANGE_HISTORICAL_COMPARISON_SCOPE`, `LOW_DISCRIMINATION_NETWORK_WATCHER_DISTRACTORS`.

Wymagane korekty: Replace unrelated or disproportionate foils with plausible neighboring Network Watcher choices (for example one-time IP flow/connection troubleshoot versus Connection Monitor, next-hop versus effective routes, or packet capture versus VM Insights), retaining a single best answer. State that the endpoint identity and test tuple should be recorded and that pre/post results are directly comparable only when the measured pair and configuration remain equivalent.

- `az104-AZ104-N09-B06-001`: The backup-report choice does not address the explicit need for recurring connectivity and latency measurement.
- `az104-AZ104-N09-B06-002`: Recreating the monitoring workspace or starting ASR failover is unrelated and disproportionate to correcting a stale endpoint; these do not model plausible endpoint-update alternatives. | The response says to compare the new result with the previous reference result after replacing an endpoint, but it does not warn that changed endpoint identity can make historical results non-comparable.
- `az104-AZ104-N09-B06-003`: Activity Log counts and backup prechecks do not reveal a VM destination’s selected network next hop.
- `az104-AZ104-N09-B06-004`: ASR failover and a subscription-wide logging change do not provide packet-level TCP-reset evidence for one VM.
- `az104-AZ104-N09-B06-005`: Deleting NSGs is a disproportionate and unsafe action, not a credible test-deployment alternative.
- `az104-AZ104-N09-B06-006`: A backup recovery point is not packet data and does not diagnose a DNS exchange.
- `az104-AZ104-N09-B06-007`: DNS changes do not help a literal IP route test, and ASR reprotection does not diagnose the VM route path.
- `az104-AZ104-N09-B06-008`: Deleting test history and changing backup frequency do not reconcile the configured connectivity tuple with a manual port test.
- `az104-AZ104-N09-B06-009`: Assuming a server responded or restoring the VM immediately ignores the evidence that only the NSG policy tuple was checked.
- `az104-AZ104-N09-B06-010`: Alert receivers, packet-capture duration, and backup soft delete are unrelated to a VNetLocal route outcome.
- `az104-AZ104-N09-B06-011`: Metric aggregation, Site Recovery failover and an unsupported assumption of Azure deleting packets do not troubleshoot capture scope or timing.
- `az104-AZ104-N09-B06-012`: Restoring every endpoint and disabling all thresholds do not isolate one Connection Monitor group’s latency path.
- `az104-AZ104-N09-B06-013`: The `--continuous` test-ip-flow flag, metric-alert endpoint flag and backup latency list are not the documented Connection Monitor lifecycle commands.
- `az104-AZ104-N09-B06-014`: Creating duplicate captures or reading Site Recovery state does not pair the tuple policy check with route selection; a configured route-table listing alone also omits the VM effective outcome.
- `az104-AZ104-N09-B06-015`: Site Recovery does not restore network diagnostics or distinguish policy checks from continuous path monitoring.
- `az104-AZ104-N09-B06-016`: A packet capture is not a UDR listing and next hop does not reveal TCP payloads.

Fakty do sprawdzenia: Check every material provider claim in current official documentation; record URL, checked date, exact capability/limitation and sourceRefs. Existing source URLs are starting points, not automatic approval.
Źródła: https://learn.microsoft.com/en-us/azure/network-watcher/connection-monitor-overview, https://learn.microsoft.com/en-us/azure/network-watcher/ip-flow-verify-overview, https://learn.microsoft.com/en-us/azure/network-watcher/next-hop-overview, https://learn.microsoft.com/en-us/azure/network-watcher/packet-capture-overview, https://learn.microsoft.com/en-us/azure/virtual-network/diagnose-network-routing-problem, https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-udr-overview, https://learn.microsoft.com/en-us/cli/azure/network/watcher/connection-monitor?view=azure-cli-latest, https://learn.microsoft.com/en-us/cli/azure/network/watcher?view=azure-cli-latest

## FCA-EDIT-1d1330f9dc — microsoft-azure-administrator-associate-az-104/azure_monitor_backup_and_site_recovery_operations/AZ104-N09-B07

Plik: `content/microsoft-azure-administrator-associate-az-104/azure_monitor_backup_and_site_recovery_operations/AZ104-N09-B07.json`. Badana wersja: `microsoft-azure-administrator-associate-az-104-authoring-v2026.08.15`.
Aktualny SHA-256 pliku: `a210a3dea7f71a1a054718f48905b9cdae0d62c0b11063191d27cbe47f94fcdf`.
Kategorie: `LOW_DISCRIMINATION_BACKUP_DISTRACTORS`, `PRIVATE_ENDPOINT_WORKLOAD_SCOPE`.

Wymagane korekty: Name a workload and required operations in the stem (for example SQL Server in an Azure VM plus restore), then specify the supported vault private endpoint/DNS and remaining service dependencies; otherwise ask which support matrix to consult rather than imply universal private routing. Replace unrelated service-family foils with plausible backup alternatives, such as the neighboring vault type, policy frequency versus retention, VM-level versus workload-level protection, or soft-delete/MUA/immutability controls.

- `az104-AZ104-N09-B07-001`: Workspace telemetry and Event Hubs streaming cannot create Azure VM recovery points.
- `az104-AZ104-N09-B07-002`: Storage Insights is telemetry, not managed-disk backup; it does not create recovery points.
- `az104-AZ104-N09-B07-003`: Metric retention, disk cache and alert rules do not define VM backup schedules or recovery-point retention.
- `az104-AZ104-N09-B07-004`: Packet capture and platform CPU metrics do not coordinate guest application consistency.
- `az104-AZ104-N09-B07-005`: Disabling security alerts and placing credentials in policy names do not protect recovery points from deletion.
- `az104-AZ104-N09-B07-007`: A workbook parameter is presentation/query state and cannot route vault backup traffic through a private endpoint. | The required private-connectivity design depends on which datasource is protected, but the stem does not identify it. Microsoft limits Recovery Services private-endpoint use to supported workload paths; for Azure VM backup it documents supported file recovery rather than a universal backup-traffic path.
- `az104-AZ104-N09-B07-009`: Reports without evidence and deleting unmanaged snapshots do not enable protected VM backup.
- `az104-AZ104-N09-B07-011`: Alert windows and disk size do not change vault retention, and deleting/recreating the vault is destructive and unnecessary.
- `az104-AZ104-N09-B07-012`: ASR recovery plans and monitoring settings do not determine Azure Backup datasource eligibility.
- `az104-AZ104-N09-B07-013`: Action-group receivers and Network Watcher route selection do not resolve guest backup consistency; only a separate evidenced network fault could make route diagnostics relevant.
- `az104-AZ104-N09-B07-014`: Metrics, workbook permissions and Connection Monitor cannot authorize changes to vault protection state.
- `az104-AZ104-N09-B07-015`: A Log Analytics workspace stores telemetry and is not the Recovery Services vault resource.
- `az104-AZ104-N09-B07-016`: A universal claim that one vault protects every Azure service is false; a Recovery Services vault is not an Azure Monitor log store.
- `az104-AZ104-N09-B07-017`: Azure Monitor metrics do not implement backup or snapshot recovery-point lifecycle.
- `az104-AZ104-N09-B07-018`: Alerting does not describe the recovery/replication boundary between Azure Backup and Site Recovery.

Fakty do sprawdzenia: Check every material provider claim in current official documentation; record URL, checked date, exact capability/limitation and sourceRefs. Existing source URLs are starting points, not automatic approval.
Źródła: https://learn.microsoft.com/en-us/azure/backup/backup-azure-backup-faq, https://learn.microsoft.com/en-us/azure/backup/backup-azure-vms-automation, https://learn.microsoft.com/en-us/azure/backup/backup-azure-vms-introduction, https://learn.microsoft.com/en-us/azure/backup/backup-overview, https://learn.microsoft.com/en-us/azure/backup/backup-support-matrix, https://learn.microsoft.com/en-us/azure/backup/backup-support-matrix-iaas, https://learn.microsoft.com/en-us/azure/backup/disk-backup-overview, https://learn.microsoft.com/en-us/azure/backup/multi-user-authorization-concept, https://learn.microsoft.com/en-us/azure/backup/secure-backup, https://learn.microsoft.com/en-us/azure/site-recovery/site-recovery-overview, https://learn.microsoft.com/en-us/cli/azure/backup/vault?view=azure-cli-latest

## FCA-EDIT-aef71a85a1 — microsoft-azure-administrator-associate-az-104/azure_monitor_backup_and_site_recovery_operations/AZ104-N09-B08

Plik: `content/microsoft-azure-administrator-associate-az-104/azure_monitor_backup_and_site_recovery_operations/AZ104-N09-B08.json`. Badana wersja: `microsoft-azure-administrator-associate-az-104-authoring-v2026.08.15`.
Aktualny SHA-256 pliku: `904007b029d0b246608b4072e2bfcc3c08acb6cd590de843fc2293c8acd81cbd`.
Kategorie: `LOW_DISCRIMINATION_BACKUP_RESTORE_DISTRACTORS`.

Wymagane korekty: Replace unrelated or fabricated foils with plausible neighboring restore or monitoring decisions, such as selective file recovery versus disk restore, create-new versus replace-existing, alert generation versus receiver routing, or diagnostics versus backup reports.

- `az104-AZ104-N09-B08-001`: Backup metrics cannot return disk contents; the other two choices are related recovery modes that still preserve production poorly or solve a different DR need.
- `az104-AZ104-N09-B08-002`: Activity Log records management events and Connection Monitor tests network connectivity; neither recovers file bytes.
- `az104-AZ104-N09-B08-003`: A workbook clone is not a recovered VM or data restore.
- `az104-AZ104-N09-B08-004`: Packet captures and CPU alerts do not identify Azure Backup job state.
- `az104-AZ104-N09-B08-005`: Storage Insights and ASR recovery-plan views are different products; opening every vault manually does not provide centralized historical fleet trends.
- `az104-AZ104-N09-B08-006`: DNS cutover, deleting the source VM and disabling alerts do not implement a safe validation restore sequence.
- `az104-AZ104-N09-B08-007`: Changing vault redundancy during file copy is not part of mounting/copying selected files.
- `az104-AZ104-N09-B08-008`: Deleting the vault for an individual job error is destructive and bypasses job-specific troubleshooting.
- `az104-AZ104-N09-B08-009`: An AMA guest agent and a DCR are not required to route vault resource diagnostics; expecting a workbook before data arrives is also an invalid report setup.
- `az104-AZ104-N09-B08-010`: Tags and KQL rendering do not route Azure Monitor Backup notifications; disabling soft delete weakens protection.
- `az104-AZ104-N09-B08-011`: Disabling the vault is unrelated to safe disk replacement and removes protection.
- `az104-AZ104-N09-B08-012`: Metric time grain does not control a Log Analytics/workbook report’s data scope.
- `az104-AZ104-N09-B08-013`: Changing notification receivers or capturing packets cannot classify a recovery point retention tier.
- `az104-AZ104-N09-B08-014`: Retention settings, workbooks and ASR failover do not resolve generated script/client compatibility.
- `az104-AZ104-N09-B08-015`: Disabling RBAC globally is not a safe way to diagnose report scope or access.
- `az104-AZ104-N09-B08-016`: Deleting alert history removes evidence and cannot fix notification routing.
- `az104-AZ104-N09-B08-017`: The job command with a fabricated --files flag, VM list with a fabricated recovery-point flag, and metrics with fabricated backup flag do not list vault recovery points.
- `az104-AZ104-N09-B08-018`: Showing a point with a fabricated restore flag, making an unmanaged disk from `latest`, and ASR failover are not the documented Azure Backup disk-restore operation.
- `az104-AZ104-N09-B08-019`: A monitoring query is not file recovery or VM reconstruction.

Fakty do sprawdzenia: Check every material provider claim in current official documentation; record URL, checked date, exact capability/limitation and sourceRefs. Existing source URLs are starting points, not automatic approval.
Źródła: https://learn.microsoft.com/en-us/azure/backup/about-azure-vm-restore, https://learn.microsoft.com/en-us/azure/backup/backup-azure-arm-restore-vms, https://learn.microsoft.com/en-us/azure/backup/backup-azure-monitor-alerts-notification, https://learn.microsoft.com/en-us/azure/backup/backup-azure-monitoring-built-in-monitor, https://learn.microsoft.com/en-us/azure/backup/backup-azure-restore-files-from-vm, https://learn.microsoft.com/en-us/azure/backup/backup-azure-vms-introduction, https://learn.microsoft.com/en-us/azure/backup/configure-reports, https://learn.microsoft.com/en-us/azure/backup/monitoring-and-alerts-overview, https://learn.microsoft.com/en-us/cli/azure/backup/recoverypoint?view=azure-cli-latest, https://learn.microsoft.com/en-us/cli/azure/backup/restore?view=azure-cli-latest

## FCA-EDIT-e140df5740 — microsoft-azure-administrator-associate-az-104/azure_monitor_backup_and_site_recovery_operations/AZ104-N09-B09

Plik: `content/microsoft-azure-administrator-associate-az-104/azure_monitor_backup_and_site_recovery_operations/AZ104-N09-B09.json`. Badana wersja: `microsoft-azure-administrator-associate-az-104-authoring-v2026.08.15`.
Aktualny SHA-256 pliku: `0f65fd55395f2e70309f39c27999a5fdabd82d0f0c375ef584a7a24dee349a08`.
Kategorie: `LOW_DISCRIMINATION_SITE_RECOVERY_DISTRACTORS`.

Wymagane korekty: Replace unrelated service-family foils with plausible ASR alternatives, such as test versus production failover, latest versus app-consistent recovery point, failover commit versus reprotect, or source versus target network settings.

- `az104-AZ104-N09-B09-001`: Traffic Manager and Activity Log export cannot provide VM disk replication or orchestrated recovery.
- `az104-AZ104-N09-B09-004`: DNS TTL does not order VM startup by application dependency.
- `az104-AZ104-N09-B09-005`: Daily backup frequency does not reverse or restore ASR replication direction.
- `az104-AZ104-N09-B09-006`: Metric dimensions and action-group receivers do not configure target-region VM network mappings; a source-region subnet ID cannot be reused as a target resource.
- `az104-AZ104-N09-B09-009`: Deleting a vault and running Backup Reports do not execute a Site Recovery failover.
- `az104-AZ104-N09-B09-012`: Action-group receiver settings cannot enable replication for a new source disk.
- `az104-AZ104-N09-B09-013`: Workbook retention and IP flow verify do not address an incomplete Site Recovery initial synchronization.
- `az104-AZ104-N09-B09-014`: Changing ASR recovery-point retention does not repair dependency reachability in an already-running test network.
- `az104-AZ104-N09-B09-015`: CPU aggregation, alert schema and severity are unrelated to selected ASR recovery-point consistency or timestamp.
- `az104-AZ104-N09-B09-016`: Central cache deletion is not a coherent way to update client endpoint routing after recovery.
- `az104-AZ104-N09-B09-017`: Creating a metric alert or restoring unrelated backup does not enable ASR reverse replication.
- `az104-AZ104-N09-B09-018`: Workbook parameters and muting replication alerts cannot reduce actual replication lag.
- `az104-AZ104-N09-B09-019`: Disabling test failovers hides the plan defect and extending backup retention cannot address a runbook timeout.
- `az104-AZ104-N09-B09-020`: Activity Log alerting, Azure Backup restore and VM start are not the Site Recovery protected-item unplanned-failover operation.
- `az104-AZ104-N09-B09-021`: Backup protection resume and Network Watcher monitoring do not reverse Site Recovery replication.
- `az104-AZ104-N09-B09-023`: Both phases are distinct ASR lifecycle states; the backup-policy option is unrelated to their actual difference.
- `az104-AZ104-N09-B09-024`: Reprotect does not redirect client DNS; it establishes reverse replication.

Fakty do sprawdzenia: Check every material provider claim in current official documentation; record URL, checked date, exact capability/limitation and sourceRefs. Existing source URLs are starting points, not automatic approval.
Źródła: https://learn.microsoft.com/en-us/azure/site-recovery/azure-to-azure-architecture, https://learn.microsoft.com/en-us/azure/site-recovery/azure-to-azure-customize-networking, https://learn.microsoft.com/en-us/azure/site-recovery/azure-to-azure-enable-replication-added-disk, https://learn.microsoft.com/en-us/azure/site-recovery/azure-to-azure-troubleshoot-replication, https://learn.microsoft.com/en-us/azure/site-recovery/azure-to-azure-tutorial-failback, https://learn.microsoft.com/en-us/azure/site-recovery/azure-to-azure-tutorial-failover-failback, https://learn.microsoft.com/en-us/azure/site-recovery/recovery-plan-overview, https://learn.microsoft.com/en-us/cli/azure/site-recovery/protected-item?view=azure-cli-latest

## FCA-EDIT-418d5caaa6 — microsoft-azure-administrator-associate-az-104/azure_network_security_private_access_and_load_balancing/AZ104-N08-B01

Plik: `content/microsoft-azure-administrator-associate-az-104/azure_network_security_private_access_and_load_balancing/AZ104-N08-B01.json`. Badana wersja: `microsoft-azure-administrator-associate-az-104-authoring-v2026.08.15`.
Aktualny SHA-256 pliku: `5daa7d99aeeca928bd373cb6a60d7b55844ea5d72e8015837fbe5ddcc076e940`.
Kategorie: `SSH_SOURCE_SCOPE_UNSTATED`.

Wymagane korekty: Specify “reject direct SSH from the Internet” or state that SSH from all sources, including VirtualNetwork peers, must be denied and add a matching deny rule to the keyed design.

- `az104-AZ104-N08-B01-001`: The stem states that direct SSH must be rejected without limiting that requirement to Internet-originated SSH; Azure default AllowVNetInBound still permits matching SSH from the virtual network, so option A does not reject every direct SSH flow.

Fakty do sprawdzenia: Check every material provider claim in current official documentation; record URL, checked date, exact capability/limitation and sourceRefs. Existing source URLs are starting points, not automatic approval.
Źródła: https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview

## FCA-EDIT-e469664c37 — microsoft-azure-administrator-associate-az-104/azure_network_security_private_access_and_load_balancing/AZ104-N08-B02

Plik: `content/microsoft-azure-administrator-associate-az-104/azure_network_security_private_access_and_load_balancing/AZ104-N08-B02.json`. Badana wersja: `microsoft-azure-administrator-associate-az-104-authoring-v2026.08.15`.
Aktualny SHA-256 pliku: `f9a095669fb8a8ea4c92521daab5c6d3bcea1a308bba55a60a64d6c61bdc1405`.
Kategorie: `NSG_DENY_DIRECTION_IMPLICIT`.

Wymagane korekty: State that the NIC NSG has a matching inbound (or outbound, as applicable) deny for the same flow direction.

- `az104-AZ104-N08-B02-009`: The NIC-level deny lacks an explicit direction, so the stem does not establish that it matches the direction of the database flow.

Fakty do sprawdzenia: Check every material provider claim in current official documentation; record URL, checked date, exact capability/limitation and sourceRefs. Existing source URLs are starting points, not automatic approval.
Źródła: https://learn.microsoft.com/en-us/azure/virtual-network/diagnose-network-traffic-filter-problem, https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview
