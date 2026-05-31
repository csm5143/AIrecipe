---
name: Liquid Minimalism
colors:
  surface: '#f9f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f9f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f5'
  surface-container: '#edeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e4'
  on-surface: '#1a1c1d'
  on-surface-variant: '#46464a'
  inverse-surface: '#2f3132'
  inverse-on-surface: '#f0f0f2'
  outline: '#77767b'
  outline-variant: '#c7c6ca'
  surface-tint: '#5f5e60'
  primary: '#010102'
  on-primary: '#ffffff'
  primary-container: '#1c1c1e'
  on-primary-container: '#858486'
  inverse-primary: '#c8c6c8'
  secondary: '#5e5e63'
  on-secondary: '#ffffff'
  secondary-container: '#e0dfe4'
  on-secondary-container: '#626267'
  tertiary: '#040000'
  on-tertiary: '#ffffff'
  tertiary-container: '#3a0c00'
  on-tertiary-container: '#e25722'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e4e2e4'
  primary-fixed-dim: '#c8c6c8'
  on-primary-fixed: '#1b1b1d'
  on-primary-fixed-variant: '#474649'
  secondary-fixed: '#e3e2e7'
  secondary-fixed-dim: '#c7c6cb'
  on-secondary-fixed: '#1a1b1f'
  on-secondary-fixed-variant: '#46464b'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59d'
  on-tertiary-fixed: '#390c00'
  on-tertiary-fixed-variant: '#832600'
  background: '#f9f9fb'
  on-background: '#1a1c1d'
  surface-variant: '#e2e2e4'
  glass-surface: rgba(255, 255, 255, 0.72)
  glass-stroke: rgba(0, 0, 0, 0.04)
  glass-refraction: rgba(255, 255, 255, 0.60)
  subtle-divider: '#E5E5EA'
  placeholder-grey: '#AEAEB2'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 41px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 13px
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  page-margin: 1rem
  section-gap: 1.5rem
  card-padding: 1rem
  element-gap-tight: 0.5rem
  element-gap-comfortable: 0.75rem
  gutter: 1rem
---

## Brand & Style

The design system is built on the philosophy of **"The UI as a White Plate."** By utilizing a high-end, cold-toned minimalist aesthetic, the interface recedes into the background, allowing food photography—the "content"—to take center stage with natural warmth and vibrance. 

The visual narrative is driven by **Liquid Minimalism**: a fusion of Apple-inspired precision and the tactile depth of "Liquid Glass." This style leverages heavy background blurs and light refraction to create a sense of physical weight and premium quality. The emotional response should be one of professional reliability, culinary inspiration, and effortless sophistication.

**Key Stylistic Pillars:**
- **Content-Forward:** Heavy use of whitespace to ensure the UI never competes with food imagery.
- **Atmospheric Depth:** Using glassmorphism not just as a decoration, but as a functional layer that separates navigation and auxiliary tools from the main content stream.
- **High-End Cold Tones:** A clinical but clean backdrop that makes the organic colors of ingredients "pop."

## Colors

The palette is strictly controlled to maintain a "cold" atmosphere, with a singular warm exception for critical interactions.

- **Primary (#1C1C1E):** A deep, "Apple-style" black used for high-contrast typography and primary iconography.
- **Secondary (#6E6E73):** A muted neutral grey for descriptions, metadata, and secondary labels.
- **Tertiary/Accent (#FF6B35):** A vibrant Coral Orange. This is the only warm tone in the UI, reserved strictly for critical CTAs (e.g., "Add to Basket," "Favorite," or "Send").
- **Neutral (#F8F8FA):** The foundation. A cold, crisp white with a microscopic blue tint to prevent the screen from feeling "yellow" or "warm."

**Glass Logic:**
The "Liquid Glass" effect uses `glass-surface` (72% opacity white) as the fill. It must always be accompanied by the `glass-stroke` for edge definition and `glass-refraction` as an inner shadow/top-border to simulate light hitting the edge of a glass pane.

## Typography

This system uses **Inter** (as the closest accessible equivalent to SF Pro) to achieve a clean, systematic, and modern look. 

**Hierarchical Rules:**
- **Headlines:** Use Bold (700) or Semi-Bold (600) weights with slightly negative letter spacing to create a compact, premium "editorial" feel.
- **Body Text:** Standardized at 17px for readability, mirroring mobile system defaults.
- **Numeric Data:** Use tabular figures where possible for cooking times and ingredient measurements to ensure vertical alignment.
- **Generous Leading:** Line heights are set slightly wider than standard (1.4x to 1.5x) to support the "breathable" and "airy" minimalist narrative.

## Layout & Spacing

The layout follows a **fluid grid** model with a "content-first" mentality. On mobile, the system utilizes a standard 16px (`page-margin`) safety buffer.

**Layout Philosophy:**
- **Vertical Rhythm:** Sections are separated by a consistent 24px (`section-gap`) to maintain the "white plate" breathable feel.
- **Floating Architecture:** The core navigation is a floating pill-shaped bar. This requires a bottom "safe area" padding of at least 80px on all scrollable views to ensure content isn't obscured by the persistent glass navigation.
- **Grid:** Use a 2-column masonry (staggered) grid for recipe discovery feeds, allowing images of different aspect ratios to sit naturally without forced cropping.
- **Mobile-First Reflow:** On larger screens (tablets), the 2-column grid expands to 3 or 4 columns, while maintaining the fixed 16px gutter to preserve the density of information.

## Elevation & Depth

Depth in this system is achieved through **Liquid Glass** and **Ambient Tonal Layering** rather than traditional high-contrast shadows.

- **Layer 0 (Base):** Cold White (#F8F8FA).
- **Layer 1 (Cards):** Pure White (#FFFFFF) with a very soft, diffused shadow: `0px 4px 24px rgba(0, 0, 0, 0.04)`.
- **Layer 2 (Liquid Glass):** Floating elements (Nav bars, AI chat bubbles, Modals). 
    - **Backdrop Blur:** 24px (Sigma).
    - **Surface:** `rgba(255, 255, 255, 0.72)`.
    - **Refraction:** A 1px top-aligned inner shadow `rgba(255, 255, 255, 0.6)` creates the "glass edge" highlight.
- **Layer 3 (Overlays):** For AI mode, a dark-tinted blur is used to recede the entire background, bringing focus to the floating chat cards.

## Shapes

The design uses a generous, "organic-geometric" shape language. Large radii are essential to soften the cold color palette and make the UI feel approachable.

- **Pill (Nav Bars / Buttons):** Full radius (22px+) used for the global navigation bar and main floating buttons.
- **Card (16px):** Standard container for recipes and posts.
- **Interactive (14px):** Standard for input fields and action buttons.
- **Avatar:** Circular (pill) for users, but 12px rounded-square for ingredient thumbnails to maximize visibility.

## Components

**Pill Navigation Bar (Core)**
- **Structure:** A floating pill-shaped container.
- **Visuals:** Liquid Glass (24px blur) with a 1px subtle stroke.
- **Interaction:** Icons use Tonal Shift (Primary black for active, Secondary grey for inactive).

**Liquid Glass Buttons**
- **Primary Action:** Solid Primary Black (#1C1C1E) with white text. 14px roundedness.
- **Critical CTA:** Solid Coral Orange (#FF6B35). Only for "Add to Basket" or "Start Cooking."
- **Secondary Action:** Liquid Glass background with Primary Black text/icon.

**Recipe Cards**
- **Style:** Pure white base, 16px rounded corners.
- **Image:** Top-weighted, 4:3 or 1:1 aspect ratio.
- **Info:** Title in Headline-MD, metadata (time/difficulty) in Label-SM using Secondary Grey.

**AI Chat Bubbles**
- **User:** Primary Black bubble with white text.
- **AI:** Liquid Glass bubble with Primary Black text.
- **Input Field:** 14px rounded, #F0F0F5 background, internal 12px padding.

**Notification Panel**
- **Behavior:** Slides down from the bell icon as a glass pane.
- **Content:** List items with 12px gap, utilizing the subtle-divider (#E5E5EA) for separation.