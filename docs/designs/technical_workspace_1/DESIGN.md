---
name: Technical Workspace
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#712ae2'
  on-secondary: '#ffffff'
  secondary-container: '#8a4cfc'
  on-secondary-container: '#fffbff'
  tertiary: '#005d73'
  on-tertiary: '#ffffff'
  tertiary-container: '#007793'
  on-tertiary-container: '#dcf4ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#b7eaff'
  tertiary-fixed-dim: '#6cd3f7'
  on-tertiary-fixed: '#001f28'
  on-tertiary-fixed-variant: '#004e61'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  screen-title:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  section-title:
    fontFamily: Hanken Grotesk
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  card-title:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  code-snippet:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 1rem
  stack-gap-sm: 0.5rem
  stack-gap-md: 1rem
  stack-gap-lg: 1.5rem
  section-padding: 2rem
  card-padding: 1.25rem
---

## Brand & Style
The design system is engineered for high-focus technical training, emphasizing mental clarity and structural order. It draws from a **Modern Minimalist** aesthetic with a **Corporate Technical** edge, prioritizing the information hierarchy over decorative elements. 

The emotional response is one of calm competence—avoiding the "gamified" anxiety of traditional learning apps in favor of a sophisticated, tool-like experience reminiscent of high-end developer environments.

**Design Principles:**
- **Analytical Clarity:** Information is partitioned into distinct logical units.
- **Minimalist Friction:** Interface elements remain invisible until needed.
- **Premium Utility:** A focus on high-quality typography and precise spacing to convey authority and reliability.

## Colors
The palette is rooted in a neutral foundation of cool slates and whites to reduce cognitive load. 

- **Functional Grays:** Used to establish the "workspace" feel. Surface colors separate the canvas (background) from interactive objects (cards).
- **Semantic Accents:** Color is reserved for state (success/error) or categorization (Cloud vs. Algorithms).
- **Subtle Borders:** Contrast is primarily achieved through `#E2E8F0` borders rather than heavy shadows, maintaining a flat, architectural feel.

## Typography
Typography is the primary vehicle for the brand's personality. 

- **Hanken Grotesk** is used for headings to provide a sharp, contemporary technical feel.
- **Inter** handles the heavy lifting of body copy, chosen for its exceptional legibility in dense instructional text.
- **JetBrains Mono** is utilized for code blocks and technical metadata (e.g., complexity scores, durations), signaling a transition from instructional prose to technical data.

## Layout & Spacing
This design system utilizes a **Fluid Grid** model optimized for mobile-first consumption.

- **The 4px Base Unit:** All spacing must be a multiple of 4px to ensure visual rhythm.
- **Generous Guttering:** To maintain a "calm" atmosphere, utilize `stack-gap-lg` (24px) between major sections to prevent information density from becoming overwhelming.
- **Alignment:** Content should predominantly be left-aligned to mimic the reading flow of documentation and code.

## Elevation & Depth
In line with the minimal, premium aesthetic, depth is communicated through **Tonal Layers** and **Subtle Outlines** rather than physical shadows.

- **Level 0 (Background):** `#F8FAFC` – The base canvas.
- **Level 1 (Cards/Surfaces):** `#FFFFFF` – Primary interactive units. Must feature a 1px border of `#E2E8F0`.
- **Level 2 (In-set elements):** `#F1F5F9` – Used for code blocks or nested "muted" sections within a card.
- **Shadows:** Avoid drop shadows for standard UI elements. Use a very soft, high-blur shadow (0px 4px 20px rgba(15, 23, 42, 0.05)) only for floating action buttons or transient modals.

## Shapes
The shape language is professional and approachable. 

- **Standard Radius:** 0.5rem (8px) for buttons and inputs.
- **Container Radius:** 1rem (16px) for cards to provide a softer, more distinct container for complex information.
- **Badges:** Use a full pill-shape (999px) for status indicators and category tags to differentiate them from square-ish interactive buttons.

## Components

### Buttons
- **Primary:** Solid `#2563EB` with white text. No gradients.
- **Secondary:** White background with `#E2E8F0` border and `#0F172A` text.
- **Ghost:** Transparent background with `#475569` text, used for secondary navigation actions.

### Cards
- **Base Card:** White background, 16px radius, 1px `#E2E8F0` border. 
- **Active State:** Change border to `#CBD5E1` or add a 2px left-border accent using the category color (Cloud/Algorithms).

### Progress Indicators
- Use a slim (4px height) linear bar. 
- Background: `#F1F5F9`.
- Fill: Use primary or category-specific accent color.

### Code Snippets
- Wrapped in a `#F1F5F9` container with a 1px `#E2E8F0` border.
- Use `JetBrains Mono` with syntax highlighting based on the semantic color palette (e.g., `#7C3AED` for functions).

### Inputs
- **Text Fields:** White background, `#E2E8F0` border. On focus, the border shifts to primary `#2563EB` with a 2px subtle outer ring of `primary-muted`.
- **Labels:** Use `body-sm` in `text-secondary` above the input.