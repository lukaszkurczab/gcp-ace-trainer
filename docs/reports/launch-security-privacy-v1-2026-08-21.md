# Launch security and privacy v1 — 2026-08-21

## Status

`prepared`, not release-verified.

This is the v1 handoff for the security-and-privacy gate. It records the
canonical product boundary and the evidence still required for a verified
release envelope. It does not claim provider, store, signing, or owner
approval.

## Canonical boundary

The normative sources are:

- `docs/canonical-product-contract.yaml`
- `docs/09-security-and-privacy.md`
- `docs/reports/launch-003b5-keyless-policy.md`
- `scripts/validateRuntimePrivacyBoundary.mjs`
- `tests/` security, recovery, privacy, package-integrity, and release-gate suites

The v1 boundary is:

| Area | Launch rule | Evidence required before release verification |
| --- | --- | --- |
| Data minimization | Only account, learning sync, entitlement, package, report, deletion, and bounded consented telemetry data may leave the client. | Current code/test result and sanitized production-log inspection |
| Identity and recovery | One Patternly account identity; no automatic email merge; reauthentication, revocation, recovery-code hashing/single use, and non-enumerating outcomes. | Current-head security test result and provider Auth readback |
| Consent and telemetry | Analytics and crash collection remain disabled until explicit consent; forbidden identifiers/content never enter events or reports. | Current-head privacy-boundary result and consented SDK configuration readback |
| Network and storage | Backend mediates remote data; direct Firestore access is denied; endpoints and environment values fail closed. | Runtime boundary result, deployed API conformance, and IAM/rules readback |
| Package integrity | Immutable package identity, checksum, schema, version, and entitlement authorization are verified before activation. | Eight-track technical evidence plus publishing/runtime admission |
| Deletion and recovery | Deletion is distinct from subscription cancellation; tombstones prevent PITR or stale-device resurrection. | Authorized sandbox restore/deletion drill with sanitized readback |
| Secrets and logs | No credentials in source, bundles, screenshots, reports, or fixtures; logs use an allow-list and exclude tokens, email, content, signed URLs, and account data. | Secret scan, sanitized log inspection, and provider IAM/secret readback |
| Platform declarations | Privacy disclosures and platform manifests match actual collection and capabilities. | Store packet and owner review |

## Current verification boundary

The repository already contains the canonical contract and fail-closed runtime
privacy boundary. The current application checkout is intentionally dirty
while launch-hardening work is in progress, so no exact release SHA is claimed
by this v1 report. The external release gate remains `not_evidenced` until an
authorized verifier binds a clean application commit to a complete evidence
packet.

The following are intentionally not asserted here:

- provider Auth/App Check/Firestore/Cloud Run conformance;
- PITR restore or no-resurrection proof;
- production log inspection;
- store privacy declarations;
- human owner approval.

## Owner follow-up

1. Review and amend this v1 against the final provider and store configuration.
2. Run the authorized sandbox restore/deletion drill and attach only sanitized
   resource names, revisions, timestamps, checksums, and outcomes.
3. Re-run the current-head security/privacy matrix after the provider contract
   is deployed.
4. Create the release evidence envelope only after all references are real,
   immutable, and hashed against the exact application commit.

No secret or credential value is stored in this report.
