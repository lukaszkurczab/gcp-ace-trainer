# Launch 003A-2 — account lifecycle design candidate

## Status

`account-lifecycle-001` has canonical status `APPROVED`. The focused transition
was implemented only after candidate controller inspection and independent QA
returned `pass`. Controller inspection and repeated independent QA of this
finalization remain pending; this report does not claim their verdict.

## Repository facts and authority

- `PO-009` selects Quiet Layered and
  `docs/designs/product-direction-options/option-3.png` is its visual target.
- Task 2 completed the shared shell and primitives under
  `focus-lab-core-shell-001`; that reference does not own account lifecycle.
- `accountData.surfaces` declares exactly 13 account surfaces and 99 states.
- The design registry supports canonical `PENDING`, and the readiness resolver
  already rejects every reference not explicitly `APPROVED`.
- No `src/features/account/` source or account UI ownership path exists.
- `PO-027` authorizes one derivation and only a conditional later transition to
  `APPROVED` after all acceptance criteria, controller inspection and
  independent QA `pass`.

## Scope and non-goals

The slice creates one design authority, one representative composite raster,
one `PENDING` registry entry, exact readiness evidence and the decision/report
trail. It covers entry, identity, recovery, reauthentication, profile, data
adoption, sync/conflict, sign-out, authenticated deletion and public deletion.

It does not implement application source, backend, routes, provider behavior,
legal terms, consent, a new identity method or lifecycle state, a second shell,
style alternatives, fake success, a fallback, future account source mapping or
public/cloud mutation.

## Design artifacts

- Authority and complete matrix:
  `docs/designs/account_lifecycle/DESIGN.md`
- Composite visual reference:
  `docs/designs/account_lifecycle/account-lifecycle-reference.png`
- Visual source:
  `docs/designs/product-direction-options/option-3.png`

The document is authoritative for copy and all states. The raster is
authoritative only for representative hierarchy and archetype treatment.

## Coverage evidence

A direct YAML-to-design check confirms exactly 13 of 13 canonical surfaces and
99 of 99 canonical states are present in the design authority. Their ordering
matches `accountData.surfaces`.

The seven required archetypes are defined and mapped: `entry`, `form`,
`action-link`, `operation`, `conflict`, `destructive` and `result`. Each state
has stable English operational copy and at most one dominant action. Pending
destructive work exposes no action and cannot report terminal success.

## Primitive reuse and architecture

The design reuses Task 2 ownership rather than replacing it:

- `Screen` owns safe area and page scrolling;
- `AppShellHeader` owns the Patternly mark and explicit back action;
- `Card`, `Button`, `InfoBlock`, `LoadingState`, `Icon` and semantic theme
  tokens retain their existing roles;
- `BottomTabBar` is absent until verified account bootstrap and required data
  adoption complete.

No `uiOwnership` entry was added for the nonexistent
`src/features/account/`. `focus-lab-core-shell-001` was not relabelled. Task 3
must add account ownership atomically with its first real account UI source.

## Disclosure and truthful-result evidence

- `forgotPassword.acceptedNonEnumerating` and
  `publicDeleteRequest.acceptedNonEnumerating` use the same accepted response
  whether or not an account exists.
- `register.duplicateIdentity` explicitly discloses the existing identity and
  offers sign-in/recovery.
- `signIn.unverifiedIdentity` is available only after valid credentials;
  invalid credentials use the separate generic credential error.
- Token errors describe link validity, not address existence.
- Account deletion describes the canonical remote scope. Completion copy is
  reserved for the verified terminal state; operational failures remain visible
  and retryable.

## Form and accessibility evidence

One field anatomy owns persistent label, semantic container, secure/reveal and
autofill behavior, helper, inline field validation, focus ring and accessibility
relationships. Remote/form-wide failures render once in a restrained banner
above the fields and never assign an error to Email or Password. The design
specifies first-error focus, error announcement, keyboard avoidance,
scroll-to-focus, password-manager compatibility, minimum 48-by-48 targets and
padded text-link hit areas.

Small-phone, large-text, dark/light, contrast, reduced-motion and modal-focus
rules are explicit. Copy cannot clamp, destructive scope cannot truncate and
color is never the sole state signal.

## Fitaly interaction comparison

Static, read-only comparison used the local sibling sources
`AuthScreenLayout.tsx`, `LoginScreen.tsx`, shared `TextInput.tsx`,
`FormScreenShell.tsx`, `DeleteAccountScreen.tsx` and their theme spacing/type
definitions under `../../Fitaly/fitaly/src/`. No runtime was launched because
the source resolves the interaction patterns and CoreSimulatorService is
unavailable in this sandbox.

Patternly adopts persistent labels, helper plus inline field validation, a
44-or-larger reveal target (48 in this design), autofill/content types,
keyboard-aware scrolling/compact behavior, safe-area action placement, a
form-level remote-login error and explicit destructive `InfoBlock`. It rejects
Fitaly's brand, olive/terracotta palette, ornament, username/Terms fields,
account-revealing reset behavior, exact copy and backend behavior. No Fitaly
dependency, token, source or copy entered Patternly.

## Semantic-completeness evidence

| Canonical owner | Implementable design evidence |
| --- | --- |
| `accountProfile.ready` | One Account screen shows verified email, human-readable sync status/evidence, security rows, and explicit Sign out/Delete account entries. |
| `adoption.cases` | `DESIGN.md` maps all seven case/result pairs, both local/cloud summaries and confirmation. `divergentActiveSessions` requires explicit selection plus separate confirmed abandonment with no default winner. |
| `sync.visibleEvidence` | `lastSuccessfulSyncAt`, `pendingMutationCount`, `blockingConflictCode` and `lastFailureCode` each have a human-readable rendering rule; internal codes never render raw. |
| `signOut.exportRequired` | Verified file handoff and integrity precede a separately offered and separately confirmed discard; cancellation/failure preserves binding and data. |
| `publicDeleteRequest.verifyPossession` | The possession-verified path repeats the same identity/session/profile/learning/sync scope and explicit `DELETE` confirmation as authenticated deletion. |
| Form ownership | Single-field validation stays inline; invalid credential and remote/form-wide failures use one banner above the field group. |

## ImageGen source and prompt

Built-in ImageGen generated one raster using `option-3.png` as a strict
style/layout reference. Earlier controller inspection corrected the credential
copy. This owner-requested repair then used exactly one targeted edit to move
that unchanged generic message from Password ownership to a form-level banner.
No Python, SVG, HTML, alternate visual direction or second variant was used.
The final prompt set is recorded below; the generation spec is normalized to
the final accepted placement.

```text
Use case: ui-mockup
Asset type: one composite production design reference board for Patternly mobile account lifecycle
Input images: Image 1 is the strict style, palette, typography, spacing, card, button, logo, and atmosphere reference only; do not copy its practice content or bottom navigation.
Primary request: Create one high-fidelity landscape dark-mode design board with exactly four separate portrait mobile phone screens, evenly spaced and fully visible, showing representative account lifecycle archetypes. Match Patternly Quiet Layered: near-black navy background, restrained translucent layered cards, thin cool-gray borders, generous spacing, crisp off-white typography, subtle violet glow, purple primary buttons, minimal line icons, one dominant action per screen.
Composition/framing: four complete uncropped phone screens side-by-side on a plain dark presentation canvas, consistent device size, readable hierarchy, no annotations outside phones, no decorative objects.
Screen 1 exact text only: "Patternly"; "Your practice starts with an account."; "Continue"; "Already have an account?"; "Sign in". Continue is the one dominant purple button; Sign in is a secondary text link.
Screen 2 exact text only: "Sign in"; "Email or password is incorrect."; "Email"; "you@example.com"; "Password"; "Sign in"; "Forgot password?". Show the generic error in a compact form-level banner between the heading and Email label; show one reusable form-field anatomy with visible labels, secure password field, violet focus ring on Password, and Sign in as the one dominant button.
Screen 3 exact text only: "Sync needs attention"; "Changes on this device and cloud data do not match."; "Review conflict"; "Try again". Use an amber restrained attention card and small sync icon; Review conflict is the one dominant purple button and Try again is a secondary text link.
Screen 4 exact text only: "Delete account"; "Deletes your identity, sessions, profile, learning data, and sync operations."; "Type DELETE to confirm"; "DELETE"; "Delete account"; "Cancel". Use a restrained destructive red treatment inside the Quiet Layered system; Delete account is the one dominant destructive button, Cancel is a secondary text link.
Constraints: exact English text only; no extra words; no legal terms, consent checkbox, marketing copy, fake success, social login, avatars, photos, illustrations, lorem ipsum, status bar clutter, desktop UI, or bottom navigation. All text must be legible and correctly spelled. Preserve strong mobile-safe padding and clear touch targets.
```

Owner-requested targeted placement prompt:

```text
Use case: precise-object-edit
Asset type: Patternly account lifecycle composite UI reference board
Input images: Image 1 is the edit target.
Primary request: Edit only the second phone, the Sign in screen. Remove the red text line "Email or password is incorrect." from below the Password field. Place the exact same text "Email or password is incorrect." in a compact, restrained form-level error banner between the "Sign in" heading and the "Email" label. The banner must be a subtle dark-red translucent Quiet Layered surface with a thin muted red border, modest corner radius, small red text, and no icon. It belongs to the whole form, not to either field.
Composition: fit the compact banner into the existing vertical space below the heading with only the minimum necessary spacing adjustment on the second phone. Keep the Email and Password fields visually neutral except for the existing violet focus ring on Password. Preserve the Sign in button and Forgot password? link.
Constraints: change only the error placement and its compact banner treatment on the second phone. Preserve all four complete phone frames, canvas, crop, dimensions, Patternly marks, every other text string, every field value, icon, button, link, color, spacing, hierarchy, first/third/fourth screens, and the absence of bottom navigation. The exact error text must be fully legible and correctly spelled on one line. No new words, no removed words besides relocating the same line, no layout drift outside the minimum second-screen spacing, no watermark.
```

## Visual inspection

The final output is a 1536-by-1024 PNG with four complete, uncropped phone
frames. Side-by-side reinspection of the source and edited candidate confirms
the sign-in line reads exactly “Email or password is incorrect.” in a compact
form-level banner between the heading and Email label. It is absent below
Password; the fields are neutral apart from the existing violet focus ring.
Every other screen, text, color, crop and hierarchy remains visibly unchanged,
with only the minimum vertical re-spacing inside the second phone. The board
follows Quiet Layered and entry has no bottom navigation. Conflict retains
restrained amber attention. Deletion retains exact scope and one dominant
destructive action. No legal copy, social login, fake success or additional
style option is present.

## Approval trail

1. Owner authorized derivation and a conditional approval path in `PO-027`.
2. This slice created the complete artifact and registered
   `account-lifecycle-001` as `PENDING`.
3. Candidate controller inspection confirmed every acceptance criterion and
   independent QA returned `pass`.
4. Before finalization, the raster SHA-256 was
   `5914595ac35a76b208555fded011ab0c8d914b01c754ef5bb51e453cf1cf880e`.
5. The focused finalization changed only this same registry reference and its
   exact readiness expectation from `PENDING` to `APPROVED`; design content,
   raster and ownership remained unchanged.
6. Controller inspection repeated the readiness, scope and checksum checks;
   repeated independent QA returned exact `pass` before Task 3 could start.

## Worker verification

- Exact contract-to-design coverage: 13/13 surfaces and 99/99 states.
- Focused canonical contract suite: 21/21 tests passed.
- TypeScript typecheck: passed.
- Contract-change gate against `HEAD`: passed; 42 changed paths inspected.
- Tracked whitespace check: passed.
- Generated PNG: present in the workspace, 1536 by 1024, visually inspected.
- Runtime/source check: no application, backend or route file changed by this
  slice; no account `uiOwnership` or competing design path was added.

## Approval-finalization verification — repeated QA `pass`

Before the focused transition, the allowed-file working diff contained three
tracked files with 1,012 insertions and 2 deletions in the complete accumulated
diff, plus the untracked design authority, report and launch plan. The PNG was
1,656,669 bytes with SHA-256
`5914595ac35a76b208555fded011ab0c8d914b01c754ef5bb51e453cf1cf880e`.

The finalization changed the same `account-lifecycle-001` entry to `APPROVED`.
The focused test now resolves a `ready` task to the exact approved object. The
obsolete expect-throw for this specific reference is absent; the independent
negative fixture still proves the general rule that `PENDING` cannot satisfy
readiness.

- Focused canonical contract suite: 21/21 tests passed.
- TypeScript typecheck: passed.
- Contract-change gate against `HEAD`: passed; 42 paths inspected.
- Tracked whitespace check: passed; no-index whitespace checks for the three
  untracked documents produced no whitespace error.
- Dead-code/scope check: one registry occurrence, no specific stale rejection,
  no account `uiOwnership`, placeholder source or second reference.
- Post-transition PNG: 1,656,669 bytes; SHA-256 remains exactly
  `5914595ac35a76b208555fded011ab0c8d914b01c754ef5bb51e453cf1cf880e`.

Controller inspection repeated the exact-reference resolver, checksum, scope,
dead-code and focused validation checks. Independent QA then confirmed one
approved reference, the unchanged 13/13-surface and 99/99-state authority, the
general `PENDING` rejection fixture, zero account ownership/runtime drift and
all passing checks. Its exact verdict was `pass`; 3A-2 is complete.

## Limitations and remaining risk

The composite raster intentionally demonstrates four representative
archetypes, not 99 separate screenshots. The full state matrix and exact copy
therefore depend on implementation conformance to `DESIGN.md`. Light mode,
small-phone, large-text, keyboard, screen-reader and two-platform behavior are
specified here but cannot be runtime-verified before Task 3 creates real UI.

The reference is now `APPROVED` and its focused finalization is closed. The
remaining limitations are Task 3 runtime-verification work, not design-approval
debt.
