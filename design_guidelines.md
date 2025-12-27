# KreAIte.xyz - Design Guidelines
**Professional AI-Powered Book Publishing Platform**

---

## Design Approach

**Selected Approach:** Design System-Based with Premium Professional Aesthetic

**Primary Reference:** Material Design meets Notion's clarity
- Sharp hierarchy and contrast from Material Design
- Clean workspace organization from Notion
- Premium creator tools aesthetic from Figma/Linear

**Key Principle:** A professional publishing platform where clarity meets sophistication. Every element prioritizes readability and workflow efficiency with premium polish.

---

## Core Design Elements

### Color System (High Contrast Professional)

**Backgrounds:**
- Primary: Pure black (#000000)
- Elevated surfaces: #0A0A0A, #141414
- Modal/panel backgrounds: #1A1A1A

**Text (HIGH CONTRAST ONLY):**
- On dark backgrounds: White (#FFFFFF) for all primary text
- On dark backgrounds: #E5E5E5 for secondary text (never lower than this)
- On light/white backgrounds: Black (#000000) for primary text
- On light/white backgrounds: #404040 for secondary text

**Accent:**
- Primary orange: #FF6B35 for CTAs, active states, highlights
- Hover orange: #FF8555
- Success: #10B981
- Warning: #F59E0B

**UI Elements:**
- Borders: #333333 (visible against black)
- Dividers: #262626
- Input backgrounds: #1A1A1A with #333333 borders

### Typography

**Font Families:**
- Primary: 'Inter' for all UI, body text, headings
- Display: 'Clash Display' or 'Cal Sans' for major headlines

**Type Scale:**
- Hero: text-6xl/text-7xl, font-bold, tracking-tight, text-white
- Section Headers: text-4xl/text-5xl, font-bold, text-white
- Panel Titles: text-2xl, font-semibold, text-white
- Body: text-base/text-lg, font-normal, text-white or text-gray-100
- Labels: text-sm, font-medium, uppercase, tracking-wide, text-gray-100
- Metadata: text-sm, font-normal, text-gray-300

### Layout System

**Spacing Primitives:** Tailwind units of 4, 6, 8, 12, 16, 24

**Container Widths:**
- Full sections: max-w-7xl
- Content blocks: max-w-6xl
- Text content: max-w-4xl

---

## Component Library

### Navigation
Sticky header (bg-black border-b border-gray-800), logo left, main nav links (DASHBOARD, LIBRARY, MARKETPLACE, TOOLS) in white text, orange "CREATE BOOK" CTA right, user profile

### Hero Section (Full-Screen)
- Background: Professional book publishing workspace image - elegant desk with open manuscript, warm desk lamp, coffee, bookshelf backdrop with natural light
- Dark gradient overlay (black from bottom 70% opacity to transparent top)
- Content centered with backdrop-blur on button containers:
  - Platform name in display font (text-6xl, text-white)
  - Headline: "PROFESSIONAL AI-POWERED BOOK PUBLISHING" (text-5xl, font-bold, text-white)
  - Subheadline: Clear value proposition (text-xl, text-gray-100)
  - Primary CTA: "START PUBLISHING" (bg-orange-500 with blur container)
  - Secondary CTA: "VIEW DEMO" (border-white/30 with blur container)
  - Trust indicators: "10,000+ Published Authors | 50,000+ Books Created" (text-gray-100)

### Professional Tool Panels
Dark elevated cards (bg-gray-900/90 border border-gray-700):
- Panel header with icon and title (text-white, text-xl)
- Clean content sections with white text on dark
- Action buttons in orange
- Clear visual separators (#333333 dividers)
- Hover state: subtle border color shift to orange

### Publishing Dashboard Cards
Three-column grid showcasing key features:
- Icon in orange (32px Lucide icons)
- Feature title (text-2xl, font-semibold, text-white)
- Description (text-base, text-gray-100)
- Subtle card backgrounds (bg-gray-900 border border-gray-700)

### Book Library Grid
Four-column responsive grid:
- Book cover thumbnails with dark overlay on hover
- Book title (text-lg, font-semibold, text-white)
- Author and status (text-sm, text-gray-100)
- Action menu (orange icons)
- Published/Draft badges with high contrast

---

## Landing Page Structure (8 Sections)

1. **Hero:** Full-screen publishing workspace image with gradient overlay, centered headline, dual CTAs with blur, trust metrics

2. **Publishing Tools:** Three-column feature grid - AI Writing Assistant, Professional Formatting, Cover Design Studio (white icons turn orange on hover, white text)

3. **Workflow Showcase:** Two-column (50/50) - Left: "Write → Format → Publish" process visualization, Right: Dashboard interface screenshot on dark background

4. **Book Gallery:** Four-column grid of published book covers with author names and download stats (all text in white/gray-100)

5. **Professional Features:** Four-column grid - ISBN Assignment, Distribution, Analytics, Marketing Tools (icon + title + description, all high contrast)

6. **Author Testimonials:** Two-column layout with author photos, quotes in white text, orange quote marks, author credentials

7. **Pricing Tiers:** Three-card layout (Starter, Professional, Enterprise) - dark cards with white text, orange "START FREE" on recommended tier, all features listed in white

8. **CTA + Footer:** Newsletter signup (orange button), four-column footer (Publishing, Resources, Company, Support) all in white text on black, social links, legal

---

## Images Strategy

**Hero Background:** Wide shot of professional book publishing workspace - manuscript pages, elegant desk lamp casting warm light, bookshelf with classic volumes, window with natural daylight, coffee cup, professional stationery. Dark gradient overlay ensures perfect text contrast.

**Dashboard Screenshots:** Clean interface mockups showing publishing tools, manuscript editor, book management panels - all on dark backgrounds with high contrast UI elements

**Book Covers:** Professional book cover designs in gallery showcasing platform capabilities

**Author Photos:** Professional headshots for testimonials, circular crops with subtle border

**All images:** Professionally lit, high quality, supporting the premium publishing platform aesthetic

---

## Visual Identity

**Professional Characteristics:**
- Uncompromising text contrast for maximum readability
- Clean geometric layouts with consistent spacing
- Orange accent used strategically for CTAs and active states
- Sharp hierarchy through size and weight, not color opacity
- Professional tool aesthetics - think Linear, Figma, Notion
- Lucide icons throughout for consistency

**Interaction States:**
- Buttons: Orange background with 10% darker on hover
- Cards: Subtle scale (1.01) with orange border glow on hover
- Links: White with orange underline, orange on hover
- Inputs: Focus state shows orange border

**Platform Language:**
- "PUBLISH" not "Create"
- "MANUSCRIPT" not "Document"  
- "LIBRARY" not "Collection"
- "PROFESSIONAL TOOLS" not "Features"

This creates a premium, highly readable professional platform suitable for serious authors and publishers.