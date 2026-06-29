---
name: Technical Workspace
colors:
  surface: '#0c1324'
  surface-dim: '#0c1324'
  surface-bright: '#33394c'
  surface-container-lowest: '#070d1f'
  surface-container-low: '#151b2d'
  surface-container: '#191f31'
  surface-container-high: '#23293c'
  surface-container-highest: '#2e3447'
  on-surface: '#dce1fb'
  on-surface-variant: '#c7c4d8'
  inverse-surface: '#dce1fb'
  inverse-on-surface: '#2a3043'
  outline: '#918fa1'
  outline-variant: '#464555'
  surface-tint: '#c3c0ff'
  primary: '#c3c0ff'
  on-primary: '#1d00a5'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#4d44e3'
  secondary: '#d2bbff'
  on-secondary: '#3f008e'
  secondary-container: '#6001d1'
  on-secondary-container: '#c9aeff'
  tertiary: '#89ceff'
  on-tertiary: '#00344d'
  tertiary-container: '#006693'
  on-tertiary-container: '#b8e0ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#0c1324'
  on-background: '#dce1fb'
  surface-variant: '#2e3447'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  code-xs:
    fontFamily: monospace
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 32px
  gutter: 24px
  section-gap: 64px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style

This design system is engineered for a high-performance technical workspace where focus and analytical clarity are paramount. The aesthetic is "Technical Minimalist"—a fusion of deep, immersive dark modes with precise, high-contrast typography. It avoids the playfulness of consumer apps in favor of a sophisticated, tool-oriented environment that prioritizes content density and legibility without sacrificing "breathing space."

The emotional response should be one of quiet confidence and professional rigor. By utilizing a "Dark-First" philosophy, the UI recedes into the background, allowing the user's data and workflows to take center stage. Visual noise is eliminated by replacing heavy illustrations with structural integrity and rhythmic spacing.

## Colors

The palette is anchored in a deep Slate spectrum. The background uses a near-black `#020617` to minimize eye strain during long technical sessions. Surfaces are built using a low-contrast Slate-900 to create subtle hierarchical depth without harsh shifts in luminosity.

The Primary CTA utilizes a restrained gradient from Indigo to Violet, providing a punch of energy that signifies action. Accents are used exclusively as functional markers:
- **Cloud (Sky 500):** Connectivity and infrastructure.
- **Algorithms (Violet 500):** Processing and logic.
- **Review (Amber 500):** Status changes and attention-required items.

## Typography

Hanken Grotesk is the sole typeface for this design system, chosen for its sharp geometry and exceptional clarity at small sizes. The typographic scale is optimized for high information density while maintaining a premium feel through generous line heights.

Text follows a strict hierarchical color logic:
- **TextPrimary (#f8fafc):** Headlines and critical data.
- **TextSecondary (#94a3b8):** Standard body text and labels.
- **TextMuted (#475569):** Metadata, placeholders, and disabled states.
Large displays use a tighter letter spacing to maintain a "technical" and compact visual profile.

## Layout & Spacing

This design system employs a **Fixed Grid** approach for desktop views to ensure technical dashboards remain predictable and balanced. We use a 12-column grid with a 24px gutter. The philosophy focuses on "High Breathing Space"—even in data-dense environments, we maintain a minimum of 32px margins around containers to prevent visual clutter.

On mobile, the layout reflows to a single column with 16px margins. Spacing units follow an 8px base rhythm, ensuring all elements align to a consistent mathematical scale, reinforcing the analytical nature of the product.

## Elevation & Depth

Depth is conveyed through **Tonal Layers** rather than traditional drop shadows. By layering `#0f172a` (Surface) over `#020617` (Background), we create a sense of physical stacking. 

- **Level 0 (Background):** The foundation, static and immersive.
- **Level 1 (Cards/Panels):** Raised using a 1px solid border of `#1e293b`. No shadow.
- **Level 2 (Popovers/Modals):** These utilize a subtle "Ambient Glow"—a low-opacity shadow tinted with the primary violet color (`rgba(79, 70, 229, 0.1)`) to suggest they are floating above the workspace.

Interactions (hovers) should be signaled by a slight brightening of the border color or the background-tint of the element, rather than an increase in shadow.

## Shapes

The shape language is purposefully soft to contrast with the rigid, technical nature of the data. This design system uses a base roundedness of 16px (`rounded-lg`) for standard cards and components, and 24px (`rounded-xl`) for main application containers or large modal windows. 

Smaller elements like buttons or input fields follow the 8px (`rounded-md`) standard. This juxtaposition of soft containers and sharp typography creates a contemporary, premium "workspace" feel.

## Components

### Buttons
- **Primary:** Gradient from `#4f46e5` to `#7c3aed`. White text. High-contrast, vibrant.
- **Secondary:** Transparent background with a `#1e293b` border. Transitions to a subtle slate fill on hover.
- **Actionable:** Small, 8px radius, tight padding for utility-bar usage.

### Input Fields
Inputs use the `#0f172a` surface color with a 1px `#1e293b` border. On focus, the border transitions to the primary indigo, accompanied by a subtle 2px outer glow. Labels sit above the field in `label-sm` with `TextSecondary` color.

### Chips & Markers
- **Technical Markers:** Small, pill-shaped indicators using the Accent colors (Cloud, Algo, Review). 
- These markers use a 10% opacity background of the accent color with 100% opacity text for high legibility within dashboards.

### Cards
Cards are the primary container. They feature a 16px radius, no shadow, and a subtle `#1e293b` border. Content inside cards should follow the `stack-lg` (24px) padding rule to maintain the "high breathing space" requirement.

### Lists
Lists in this system are "Airy." Rows are separated by 1px borders and have a minimum height of 56px to ensure touch-targets are clear and information is not cramped.