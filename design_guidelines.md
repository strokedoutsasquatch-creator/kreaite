# Stroke Recovery OS - Design Guidelines
**"Rebuild Your Body, Brain, and Belief System — One Rep at a Time"**

---

## Design Approach

**Selected Approach:** Reference-Based with Dark Premium Aesthetic

**Primary References:**
- **Linear:** Dark UI mastery, clean typography, purposeful spacing
- **Stripe:** Professional dark theme with bold accent colors
- **Peloton:** Premium fitness motivation and progress tracking
- **Apple Fitness+:** Polished dark interface with vibrant accents

**Key Principle:** Bold, defiant dark theme that embodies military-grade precision and unstoppable determination. This is a command center for recovery, not a passive medical guide.

---

## Core Design Elements

### Color System (Dark Theme)
- **Background:** Pure black (#000000) for main surfaces
- **Surface/Cards:** Dark gray (#1A1A1A, #2A2A2A) with subtle elevation
- **Primary Accent:** Vibrant orange (#FF6B35) for CTAs, highlights, progress indicators
- **Text Primary:** White (#FFFFFF) for headlines and important content
- **Text Secondary:** Light gray (#A0A0A0, #808080) for body text and metadata
- **Text Tertiary:** Medium gray (#606060) for labels and subtle elements
- **Success:** Green (#10B981) for achievements
- **Warning:** Amber (#F59E0B) for alerts

### Typography System

**Font Families:**
- **Primary:** 'Inter' - Bold, modern sans-serif for entire interface
- **Accent (Stats/Impact):** 'Space Grotesk' or 'Archivo Black' - For large numerical displays and battle-cry headlines

**Type Scale:**
- **Hero Headlines:** text-6xl to text-8xl, font-black (900), uppercase, tracking-tight, text-white
- **Section Headers:** text-4xl to text-5xl, font-bold (700), text-white
- **Card Titles:** text-xl to text-2xl, font-semibold (600), text-white
- **Body Text:** text-base to text-lg, font-normal (400), text-gray-300, leading-relaxed
- **Labels:** text-sm, font-medium (500), uppercase, tracking-wide, text-gray-400
- **Impact Numbers:** text-5xl to text-7xl, font-black (800), text-orange-500

### Layout System

**Spacing Primitives:** Tailwind units of 4, 6, 8, 12, 16, 20, 24, 32

**Grid Patterns:**
- **Hero:** Full-width with max-w-7xl centered
- **Academy/Exercise Grid:** grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8
- **Builder Tools:** grid-cols-1 lg:grid-cols-2 gap-12
- **Marketplace Products:** grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- **Survival Grid:** Masonry-style grid with varying card heights

---

## Component Library

### Navigation
- **Top Nav:** Sticky black (bg-black) header with logo, main links (HOME, ACADEMY, BUILDER, COMMUNITY, MARKETPLACE, SURVIVAL GRID, ABOUT), orange "START RECOVERY" CTA, user avatar
- **Mobile:** Slide-in dark panel with full navigation, orange accent on active state

### Hero Section (HOME)
- **Layout:** Full-screen (min-h-screen) with powerful transformation image showing recovery journey
- **Image Treatment:** Dark gradient overlay (black to transparent top-to-bottom) ensuring text legibility
- **Content Structure:**
  - Logo: "STROKE RECOVERY OS" with "Sasquatch Survival System" tagline
  - Massive headline: "REBUILD YOUR BODY, BRAIN, AND BELIEF SYSTEM — ONE REP AT A TIME"
  - Subhead: "From 0% to 90% Function - Combat-Tested Recovery Protocols"
  - Dual CTAs: Orange "ACCESS THE ARSENAL" (solid bg-orange-500, blurred backdrop) + Ghost "WATCH THE JOURNEY" (border-white/20, blurred backdrop)
  - Trust bar: "50,000+ Warriors | 6 Years Proven | 90% Recovery Rate"

### Content Cards (Dark Theme)

**Academy Protocol Cards:**
- Dark gray background (bg-gray-900)
- Subtle border (border-gray-800)
- Image/icon at top with orange accent overlay on hover
- White title, gray description
- Orange difficulty badge
- Body area tags (border-gray-700)
- Orange "START PROTOCOL" button

**Builder Tool Cards:**
- Elevated dark surface (bg-gray-900 with shadow-2xl)
- Icon with orange accent
- Drag-handle indicator (gray-600)
- Tool name and description
- Time estimate with orange clock icon

**Marketplace Product Cards:**
- Product image with dark vignette
- Star rating in orange
- Price in large white text
- "BUY NOW" orange button
- Equipment tags

### Data Displays (Dark UI)

**Progress Dashboard:**
- **Stat Cards:** Black backgrounds with orange accent borders, massive white numbers, gray labels
- **Charts:** Dark grid lines (gray-800), orange line/bars, white axis labels
- **Streak Calendar:** Gray inactive days, orange active days, white current day
- **Goal Progress:** Horizontal bars with orange fill on dark gray track

### Buttons & CTAs

**Primary (Orange):**
- bg-orange-500, text-white, px-8 py-4, rounded-lg, font-semibold
- On hero/images: Add backdrop-blur-md bg-orange-500/90

**Secondary (Ghost):**
- border-2 border-white/20, text-white, px-8 py-4, rounded-lg, font-semibold
- On hero/images: Add backdrop-blur-md bg-white/5

**Tertiary (Text):**
- text-orange-500, font-semibold, underline decoration-orange-500/30

---

## Landing Page Structure (HOME - 10 Sections)

1. **Hero:** Full-screen with transformation image, massive headline, dual CTAs, trust indicators
2. **Impact Metrics Bar:** Scrolling stats with orange numbers on black
3. **About Nick/Sasquatch:** Two-column (image left, story right) - "From Wheelchair to Warrior" with orange accent line
4. **The Arsenal:** 3-column grid showcasing Academy, Builder, Marketplace with icons and descriptions
5. **Survival Grid Preview:** 4-column masonry grid of featured recovery techniques
6. **Recovery Timeline:** Horizontal timeline visualization showing Day 1 → Year 6 progression with orange milestones
7. **Community Transformations:** 3-column testimonials with before/after images on dark cards
8. **Technology Overview:** Two-column split showcasing platform features with device mockups
9. **Pricing/Access:** Centered pricing cards with orange "DEPLOY NOW" CTAs
10. **FAQ:** Accordion with orange active states
11. **Footer:** Comprehensive dark footer with newsletter (orange subscribe button), navigation columns, social links, trust badges, legal

### Dashboard Layout
- **Left Sidebar:** Vertical nav on black with orange active indicators
- **Main Area:** Dynamic content on dark gray background
- **Right Panel:** Daily missions, streak tracker, community feed

---

## Images Strategy

**Critical Image Placements:**

1. **Hero:** Large, dramatic transformation image (Nick in recovery pose or before/after split) with dark gradient overlay
2. **About Section:** Professional portrait of Nick with determined expression
3. **Academy Cards:** Exercise demonstration photos with orange accent overlays
4. **Marketplace:** Product photography on dark backgrounds
5. **Timeline:** Progression imagery showing recovery milestones
6. **Testimonials:** Community before/after photos in dark-bordered frames
7. **Background Textures:** Subtle concrete or carbon fiber patterns on section backgrounds for depth

**Treatment:** High contrast, slightly desaturated except for orange accents, dark vignettes on all images

---

## Unique Visual Identity

**"Sasquatch Command Center" Elements:**
- Sasquatch icon in orange as power symbol
- Military-grade UI with precision spacing
- Orange "ALERT" style badges for achievements
- Bold "MISSION COMPLETE" celebration states
- Dark brutalist aesthetic with orange energy bursts
- Gritty texture overlays on hero sections

**Battle-Ready Micro-Copy:**
- "DEPLOY YOUR RECOVERY" not "Get Started"  
- "ARSENAL" not "Library"
- "MISSION BUILDER" not "Routine Planner"
- "WARRIORS" not "Members"
- "SURVIVAL GRID" not "Exercise Library"

---

## Component Enrichment

**Full-Featured Sections:**
- **Headers:** Logo + full nav + progress ring (for logged users) + notification bell + orange CTA + user avatar
- **Footers:** Newsletter ("Join The Regiment") + 4-column quick nav + social proof numbers + resources + legal + orange accent dividers
- **Cards:** Icon/image + title + metadata badges + description + time estimate + difficulty indicator + equipment icons + dual CTAs

This dark theme creates an unstoppable, premium platform matching the intensity of stroke recovery while maintaining professional credibility for healthcare providers.