# .stitch/SITE.md - Variety Momo Constitution

## 1. Core Identity
- **Project Name**: Variety Momo
- **Location**: Mecheda, West Bengal, India
- **Contact Phone**: +91 7827423777
- **Mission**: Provide hot, fresh, hygienic, and authentic artisanal momos (steam, fried, crunchy, afghani, achari, and special recipes like Gondhoraj & Kabul Malai) with seamless mobile-first browsing and ordering.
- **Target Audience**: Momo lovers, students, families, and fast food enthusiasts in Mecheda and surrounding West Bengal regions.
- **Voice**: Energetic, appetizing, warm, friendly, modern Indian culinary flair.

## 2. Visual Language
- **Aesthetic Vibe**: Vibrant Foodie Warmth, Tactile Flipkart-style Product Utility, Zomato-grade Dining Discovery.
- **Color Codes**:
  - Primary Red-Orange Brand: `#E23744` (Fiery Momo Red / Zomato vibrancy)
  - Secondary Amber Accent: `#F97316` / `#FFA41C` (Warm tandoor crust & spice gold)
  - Pure Veg Badge: `#16A34A`
  - Non-Veg Badge: `#DC2626`
  - Surface Background: `#FAFAF8` (Clean warm light canvas)
  - Dark Neutral Charcoal: `#1C1917` (Deep stone-900 typography)
- **Typography**: `Outfit` / `Plus Jakarta Sans` for titles and clean system sans for responsive numbers and specs.

## 3. Architecture & File Structure
- `src/data/`: Isolated data schemas for menu, categories, restaurant metadata, offers, and reviews (decoupled for future Supabase sync).
- `src/context/`: `CartContext.jsx` for reactive cart state, quantities, variant price calculations, and dine-in vs. delivery switch.
- `src/components/`: Modular mobile-first UI components (Header, Hero, FoodCard, FoodSlider, DetailModal, CartDrawer, BottomNav, DineInDeliveryChoice, RestaurantInfo, Gallery, Reviews, SearchModal).

## 4. Live Sitemap
- `[x]` Home / Main Browsing (`/`)
- `[x]` Category Exploration & Food Cards (`#menu`)
- `[x]` Customer Favourites & Special Sliders
- `[x]` Food Detail Modal (`/dish/:id`)
- `[x]` Interactive Cart Drawer (`/cart`)
- `[x]` Dine-in vs. Delivery Selection Modal/Widget
- `[x]` Restaurant Info & Directions (`#about`)
- `[x]` Gallery Section (`#gallery`)
- `[x]` Reviews Section (`#reviews`)

## 5. Roadmap Backlog
- **Step 1 (Current)**: High-fidelity mobile-first frontend UI/UX, responsive layouts, interactive cart, menu catalog with half/full variants, search, and PWA scaffolding.
- **Step 2 (Future)**: Supabase integration for dynamic menu & orders, Firebase FCM web push notifications, PhonePe QR advance payment for home delivery (30%) & counter pay for dine-in.
