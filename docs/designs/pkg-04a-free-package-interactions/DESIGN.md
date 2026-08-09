# PKG-04A — Free package interaction references

## Authority

- Design reference: `pkg-04a-free-package-interactions`, version `1`.
- Approval: `APPROVED` by `product-owner` on 2026-08-10 (`PO-060`).
- Figma source: TalkToFigma channel `wtk4hp8i`, board root `10:2` —
  `PKG-04A • Free package interaction references v1 • PO APPROVED`.
- Owner approval annotation: `10:2`, category `Interaction`.

This is a compact interaction reference for the Free-package cutover. It is
not a new visual system. Existing repository tokens, components, typography,
and accessibility behavior remain the implementation authority after handoff.

## Approved frames and product truth

| Figma node | Reference state | Approved interaction truth |
| --- | --- | --- |
| `10:7` | Practice Hub — Coding Interview Free | Learn Approach is the primary immediate 10-question entry. Guided supports 10/20/40. Custom is available through its existing setup. Weak Area Review is visible but unavailable until eligible, node-local Free evidence exists. Recognize, Contrast, Independent and Simulation are not Free choices. |
| `10:5` | Practice Hub — GCP ACE Free | Focus Practice is the primary immediate 10-question entry and supports 10/20/40. Weak Area Review and Quick Review are evidence-conditioned. Diagnostic, Scenario, Mixed and Exam are not Free choices. |
| `10:6` | Practice Setup — Coding Custom Free | Custom uses the existing Guided Practice flow: a node-local mental unit, exactly 10 questions, and either `afterEachAnswer` or `atSessionEnd` feedback. It does not create a runner, scoring rule, persistence path, or lifecycle. |
| `10:8` | Unavailable mode — truthful Free state | A mode outside the profile, or an empty review queue, is explicitly unavailable. The product offers a return to available formats and never silently substitutes ordinary practice, Premium, sibling-node, or global content. |

## Scope of the approved implementation

The mapped UI is limited to package preparation, Practice Hub and Setup, active
practice feedback/summary surfaces, and answer/exam review surfaces that must
carry the exact package boundary. The package pinning itself is implementation
logic; its visible consequence is only the approved profile, default, and
truthful unavailable state above.

No approval is implied for a new product direction, full-track Free access,
new mode label/ID, remote package delivery, Premium entitlement, account UI,
or other screens outside the paths mapped in the canonical product contract.
