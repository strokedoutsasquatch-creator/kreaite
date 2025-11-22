# Stroke Recovery Platform Design Guidelines
## "If The Sasquatch Can Do It, So Can You!" - Nick Kremers' Recovery Revolution

---

## Design Approach

**Selected Approach:** Reference-Based with Bold Personal Branding

**Primary References:**
- **Peloton/Nike Training Club:** Premium fitness aesthetic with motivational energy
- **MasterClass:** High-quality educational content presentation
- **Linear:** Clean progress tracking and dashboard interfaces
- **Strava:** Community achievement celebration

**Key Design Principle:** Bold, defiant, empowering aesthetic that embodies Nick's "Arkansas tough" attitude and refuses to accept limitations. This platform should feel like a battle cry, not a medical textbook.

---

## Typography System

### Font Families
- **Primary (Headings):** 'Inter' or 'Manrope' - Bold, confident, clean sans-serif
- **Secondary (Body):** 'Inter' or 'Open Sans' - Highly readable for long-form content
- **Accent (Quotes/Testimonials):** 'Playfair Display' or 'Merriweather' - Italic for emphasis

### Type Scale & Hierarchy
- **Hero Headlines:** text-5xl to text-7xl, font-black (900 weight), uppercase for battle-cry statements
- **Section Headers:** text-3xl to text-4xl, font-bold (700)
- **Card Titles:** text-xl to text-2xl, font-semibold (600)
- **Body Text:** text-base to text-lg, font-normal (400), leading-relaxed
- **Labels/Metadata:** text-sm, font-medium (500), uppercase tracking-wide
- **Stats/Numbers:** text-4xl to text-6xl, font-extrabold (800) for impact metrics like "0% to 90% Recovery"

---

## Layout System

**Spacing Primitives:** Tailwind units of 4, 6, 8, 12, 16, 20, 24, 32
- **Micro spacing (elements):** space-y-4, gap-4
- **Component spacing:** p-6, p-8
- **Section spacing:** py-16, py-20, py-24
- **Container max-widths:** max-w-7xl for main content, max-w-4xl for reading content

**Grid Systems:**
- **Hero/Landing:** Full-width with max-w-7xl centered container
- **Exercise Cards:** grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- **Dashboard Widgets:** grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8
- **Book Library:** grid-cols-1 md:grid-cols-3 gap-8
- **Equipment Reviews:** grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6

---

## Component Library

### Navigation
- **Top Navigation Bar:** Sticky header with logo, main navigation links, CTA button ("Start Your Recovery"), user profile/auth
- **Side Navigation (Dashboard):** Vertical navigation for authenticated recovery tracking area
- **Mobile:** Hamburger menu with full-screen overlay navigation

### Hero Section
- **Layout:** Full-width hero (min-h-screen or 85vh) with compelling background image showing Nick's transformation or motivational imagery
- **Content Structure:** 
  - Large headline: "IF THE SASQUATCH CAN DO IT, SO CAN YOU!"
  - Subheadline: "0% to 90% Recovery - Proven Methods from Someone Who Actually Lived It"
  - Dual CTAs: Primary "Access Recovery Guides" + Secondary "Watch Nick's Story"
  - Trust indicators: "50,000+ Survivors", "6 Years Proven", "90% Function Restored"
- **Image Treatment:** Large hero image with gradient overlay (dark at bottom) for text legibility, blurred glass-morphism buttons

### Content Cards

**Exercise Protocol Cards:**
- Card with image/icon at top showing exercise
- Exercise name (bold, prominent)
- Difficulty indicator (Beginner/Intermediate/Advanced badge)
- Body area tags (Arm, Leg, Balance, Hand)
- Brief description (2-3 lines)
- "View Protocol" button

**Book Cards:**
- Prominent book cover mockup image
- Book title and subtitle
- Page count and chapter overview
- "Read Now" or "Download" CTA
- Preview snippet or key takeaways

**Progress Milestone Cards:**
- Large icon or illustration
- Achievement title
- Date achieved
- Celebratory micro-interaction on hover

### Data Displays

**Progress Dashboard:**
- **Stats Overview:** Large number displays with labels (Days in Recovery, Exercises Completed, Milestones Achieved)
- **Progress Charts:** Line charts showing function improvement over time, bar charts for exercise frequency
- **Streak Tracker:** Visual calendar showing daily consistency
- **Current Goals:** Card-based goal display with progress bars

**Exercise Protocol View:**
- **Hero Section:** Exercise name, difficulty, equipment needed
- **Step-by-Step Instructions:** Numbered list with clear, bold text
- **Video Placeholder:** Embedded video demonstration area
- **Progression Pathway:** Visual flow showing beginner → intermediate → advanced variations
- **Equipment List:** Visual cards with equipment images and purchase links

### Forms & Interactive Elements

**Daily Routine Builder:**
- Drag-and-drop interface for scheduling exercises
- Time blocks with exercise cards
- Save/edit functionality
- Print-friendly schedule output

**Progress Tracking Input:**
- Quick-log buttons for completed exercises
- Slider inputs for pain/difficulty ratings
- Notes textarea for observations
- Photo upload for progress documentation

### Overlays & Modals

**Book Reader Modal:**
- Full-screen overlay with reading interface
- Table of contents sidebar
- Progress indicator
- Bookmark/highlight functionality

**Exercise Video Modal:**
- Large video player
- Exercise details sidebar
- Related exercises section

---

## Section Layouts

### Landing Page Structure (8-10 Sections):

1. **Hero Section:** Full-screen impact with Nick's transformation story
2. **Social Proof Bar:** Scrolling testimonials or stat highlights
3. **About Nick:** Two-column layout (image + story) - "From Wheelchair to Warrior"
4. **The Three Books:** Grid showcasing digital library access
5. **Featured Exercise Protocols:** 3-column grid of most popular techniques (Baseball Bat Therapy, Mirror Therapy, Drop Foot Protocol)
6. **Transformation Timeline:** Visual journey from Day 1 to Year 6
7. **Equipment Guide Preview:** Carousel of recommended recovery tools
8. **Community Success Stories:** 2-3 column testimonial cards with before/after images
9. **Pricing/Access Section:** Clear CTA for platform access
10. **FAQ Section:** Accordion-style common questions
11. **Footer:** Comprehensive with newsletter signup, social links, quick navigation, contact info, disclaimer

### Dashboard Layout:
- **Left Sidebar:** Navigation (Dashboard, Exercises, Books, Progress, Equipment, Community, Settings)
- **Main Content Area:** Dynamic based on selected view
- **Right Sidebar (optional):** Daily tips, upcoming exercises, community highlights

### Exercise Library:
- **Filter Sidebar:** Body area, difficulty, equipment needed, duration
- **Search Bar:** Prominent top placement
- **Grid View:** Exercise cards in responsive grid
- **List View Toggle:** Alternative compact view option

---

## Images Strategy

**Include Images Decisively:**

1. **Hero Section:** Large, impactful image of Nick in recovery pose or transformation comparison
2. **About Section:** Professional photo of Nick with authentic, motivational expression
3. **Exercise Cards:** Demonstration photos or illustrations for each protocol
4. **Book Covers:** Professional mockups of the three comprehensive guides
5. **Equipment Guide:** Clear product photography for each recommended tool
6. **Success Stories:** Before/after transformation photos from community members
7. **Timeline Section:** Visual progression imagery showing recovery journey
8. **Background Elements:** Subtle textures or patterns for section variety (concrete, athletic tape, etc.)

**Image Treatment:** High-contrast, slightly desaturated for professional medical aesthetic while maintaining motivational energy

---

## Unique Visual Identity

**"Sasquatch Branding" Elements:**
- Sasquatch icon/logo as memorable brand mark
- Bold, defiant messaging throughout ("NEVER SURRENDER", "PROVE THE IMPOSSIBLE")
- Arkansas heritage touches (subtle state outline, references to roots)
- Transformation imagery emphasizing before/after dramatic improvements
- Victory/achievement iconography (trophy, checkmark bursts, breakthrough visuals)
- Gritty texture overlays on hero sections for authentic, raw feel

**Motivational Micro-Copy:**
- Replace generic labels with empowering alternatives
- "Your Impossible Starts Now" instead of "Get Started"
- "Join The Revolution" instead of "Sign Up"
- "Prove Them Wrong" instead of "Learn More"
- "Arsenal" instead of "Library"

---

## Component Enrichment

**Never Sparse Sections - Always Feature-Rich:**

- **Headers:** Logo + full navigation + user profile + "Start Recovery" CTA + progress indicator for logged-in users
- **Footers:** Newsletter signup ("Join 50,000+ Warriors") + social proof + quick nav + resources + legal + contact + trust badges
- **Exercise Cards:** Icon + title + difficulty badge + body area tags + description + estimated time + equipment icons + "Start Now" CTA
- **Dashboard Widgets:** Header with icon + metric + comparison to previous period + sparkline chart + drill-down link
- **Book Access:** Cover + title + author + page count + chapter count + reading time + preview snippet + multiple CTAs (Read, Download, Share)

---

## Accessibility & Performance

- Maintain WCAG AA contrast ratios throughout
- Keyboard navigation support for all interactive elements
- Alt text for all exercise demonstration images
- Aria labels for dashboard metrics and charts
- Responsive images with proper sizing for performance
- Loading states for progress tracking data

---

This design creates a bold, empowering platform that matches Nick's defiant attitude while providing comprehensive recovery resources in an accessible, motivating environment. Every element reinforces the core message: "If The Sasquatch Can Do It, So Can You!"