# Design System: Variety Momo

## 1. Visual Theme & Atmosphere
An energetic, mouth-watering, mobile-first food-ordering experience that merges Zomato's rich restaurant discovery with Flipkart's product utility and clarity. The atmosphere is warm, hygienic, and appetizing — celebrating the sizzling steam, golden crisp, and spicy chutneys of Mecheda's favourite momo destination.

- **Density**: 6/10 (Balanced, clear card boundaries, finger-friendly touch zones >= 48px)
- **Variance**: 6/10 (Horizontal category pill rail, prominent hero slider, fluid 2-column food grid on mobile)
- **Motion**: 6/10 (Spring-weighted card taps, smooth drawer slides, bounce on cart badge increment)

## 2. Color Palette & Semantic Roles
- **Canvas White / Warm Cream**: `#FAFAF8` — Primary background surface
- **Pure Surface**: `#FFFFFF` — Card, modal, drawer containers
- **Momo Coral-Red (Primary Brand)**: `#E23744` — Primary buttons, brand logo, active states, cart triggers
- **Amber Gold (Spice Accent)**: `#FFA41C` — Ratings, badge highlights, promo tags
- **Tandoor Orange**: `#FF5200` — Secondary gradients and callouts
- **Charcoal Dark Neutral**: `#18181B` / `#27272A` — Primary headings and legible body text
- **Muted Slate**: `#71717A` — Descriptions, quantity notes, sub-labels
- **Whisper Border**: `#F1F5F9` — Clean 1px structural dividing lines
- **Pure Veg Indicator**: `#16A34A` (Green square with green solid dot)
- **Non-Veg Indicator**: `#DC2626` (Brown-red square with red solid triangle/dot)

## 3. Typography Rules
- **Display & Headings**: `Outfit`, sans-serif — modern geometric letterforms with warm humanist touches.
- **Body & Metadata**: `Plus Jakarta Sans` / `system-ui` — high legibility on small phone screens (14px base, 12px secondary).
- **Price & Numeric Monospace**: Bold tabular numbers (`font-semibold` / `font-bold`) with explicit Indian Rupee (`₹`) symbol.

## 4. Component Stylings
- **Food Cards**:
  - Border radius: `1rem` (16px)
  - Diffused subtle elevation: `0 4px 20px -2px rgba(0, 0, 0, 0.06)`
  - Dedicated food photography container with `object-fit: cover` and aspect ratio `4/3` or `1/1`
  - Half / Full variant dropdown or pill toggle
  - Flipkart-style price display: Current price bold, original strikethrough (optional), savings callout
  - Tactile `ADD` button that smoothly transforms into a `[-] Qty [+]` quantity stepper once added to cart
- **Category Slider**:
  - Seamless horizontal overflow with `no-scrollbar`
  - Pill design with category icon and clear bold label
  - Active category highlighted with brand red fill and white text
- **Food Detail Modal**:
  - Full mobile slide-up sheet / modal
  - Hero image with gradient overlay
  - Customization options (Half / Full plate, spice level preference)
  - Sticky bottom action bar with `Add to Cart` and `Buy Now`
- **Bottom Navigation**:
  - Fixed mobile bottom bar with glassmorphism backdrop blur (`bg-white/95 backdrop-blur-md`)
  - Safe-area bottom inset padding
  - Active icon indicator with red dot
  - Floating Cart button or Cart icon with dynamic badge counter

## 5. Anti-Patterns & Constraints
- NO generic bland blue/purple buttons
- NO pure black (`#000000`)
- NO horizontal page scroll outside designated carousels
- NO tiny unclickable buttons on mobile (all touch targets >= 44px)
- NO hardcoded mock payment processing in Step 1
