# DES-001 — current Figma authority inventory

## Result

The previously recorded `DES-01` blocker was stale. The current Figma file is
inspectable through the connected Figma tools and has concrete node-level
references for the approved layout and component work.

This report records access and inventory evidence only. It does not create or
infer Product Owner approval, close the external `design-authority` release
evidence gate, or mark the whole product `DESIGN READY`.

## Current source

| Field | Evidence |
| --- | --- |
| File key | `kZXD7cNBKUU7x0ceTHPFpR` |
| Page | Page 1 (as recorded by the current local audit) |
| Library root | `118:738` |
| Fresh Light/Dark verification board | `882:14188` |
| Dark board | `882:14189` |
| Light board | `882:14341` |
| Home reference | `55:445` (`02A · Home · Coding · Ready`) |
| Practice setup reference | `55:2172` (`04A · Manage Practice Settings · Coding`) |

The local re-audit records 347 library definitions, 1,346 linked nested
instances, zero detached instances and zero empty component descriptions. Its
fresh verification board records 580/580 linked instances, 45 pattern families,
zero non-scroll clips, zero horizontal overflows and 234/234 interactive
surfaces at least 44 px.

## Live connector checks

The official Figma connector successfully returned:

- metadata for `882:14188`, `55:445` and `55:2172`;
- design context for `55:445` and `55:2172` with the existing variable and
  component references;
- a screenshot for `55:445`;
- variable definitions for `55:445`, including the semantic color, spacing,
  radius and typography values used by the reference;
- the file's connected-library response.

## Implementation boundary

The repository still treats the canonical product contract and checked-in
runtime components as the implementation authority after handoff. The current
Figma references use `Home`, while the reconciled product contract targets
`Today`; this is a terminology/route reconciliation issue, not a reason to
discard the geometry or tokens. Layout work must preserve the canonical runtime
contract and must not copy stale labels or routes from the reference frame.

The next visual slice is therefore a bounded comparison of the existing
Practice setup shell against the node-level reference, followed by a focused
device/large-text verification. No broad visual rewrite is authorized by this
inventory alone.
