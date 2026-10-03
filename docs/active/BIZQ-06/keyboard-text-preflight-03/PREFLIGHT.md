# BIZQ-06 — keyboard / large-text source preflight03

Read-only LunaMedium inspection after bounded access-state02. No runtime check yet, no implementation proposal accepted, no production change. This report is evidence, not a second status queue.

Existing native radio inputs are clipped1px controls in web styles.css:154 with adjacent-label focus-visible styling at156 and global outline at77. Component uses native radios/buttons/radiogroup/aria-live. `useReveal.jsx` suppresses interactivity with inert until intersection, immediately revealing under reduced-motion/noIntersectionObserver. Existing mounted and built-site tests use check/click and assert roles/state; neither proves actual Tab/arrow/Space navigation or visible keyboard focus.

Text largely uses fixedpx sizes; index.html declares dark color scheme. Targeted search did not find prefers-color-scheme/forced-colors/text-size-adjust. This does not establish a rendering defect or a requirement to implement unsupported themes. Existing viewport proof1440/390 is not a large-text test.

Next exact missing fact: whether sequential keyboard navigation reaches and operates the demo after the real reveal owner enables it, showing visible focus and preserving selected-ID feedback/reset. Small real Chrome probe can use actual built page, Tab/arrow/Space and observe focus/computed outline; no new framework or VoiceOver/device test. For large text first probe a real browser zoom/font-adjustment mechanism; do not label CSS injection, device scale, page-scale or narrow viewport as a text-size setting without establishing what it actually changes. Record proven browser reflow/zoom separately from untested text-only behavior.

No mobile-device/VoiceOver, other-device installation, theme/forced-colors or broad accessibility-readiness claim. No service/runtime/configuration changes, no new publication gate. Existing BIZQ06 row owns the next action.
