# KreAIte.xyz

**"CREATE. PUBLISH. EARN."**

**Powered by KremersX**

## Overview

KreAIte.xyz is an ultra-premium AI-powered creator platform offering six professional studios for content creation: Book, Video, Music, Course, Image, and Doctrine Engine. Its purpose is to empower creators to produce, publish, and monetize their content across various formats, including a marketplace (KreAItorverse) that offers an 85/15 revenue split for creators. The platform integrates advanced AI for content generation, editing, and analysis, aiming to simplify the creative workflow from concept to publication. Key capabilities include unified media editing, AI-driven content generation, a robust marketplace for templates and finished works, and comprehensive tools for publishing and earning.

## User Preferences

Preferred communication style: Simple, everyday language.
Design mandate: Pure black (#000000) background, orange (#FF6B35) accent
Icons: lucide-react only (no emoji)

## System Architecture

### Frontend Architecture
- **Framework & Build System**: React 18 with TypeScript, Vite for fast HMR, Wouter for routing, TailwindCSS for styling.
- **UI Component System**: Shadcn/ui built on Radix UI, pure black background (#000000), vibrant orange accent (#FF6B35), Inter and Space Grotesk fonts.
- **State Management**: TanStack Query for server state, custom hooks for authentication and shared logic.
- **Key Design Decisions**: Dark theme default, mobile-first responsive design, accessibility-first approach.

### Backend Architecture
- **Server Framework**: Express.js with TypeScript.
- **Authentication & Session Management**: Replit Auth (OpenID Connect) via Passport.js, PostgreSQL session store, session-based authentication with HTTP-only cookies, token refresh.
- **API Design**: RESTful patterns, consistent error handling, JSON format, CORS configured for Replit.
- **Key Architectural Decisions**: Session storage in DB, webhook routes registered before express.json(), environment-aware configuration.

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless driver.
- **ORM**: Drizzle ORM for type-safe queries and schema management.
- **Schema Design**: Users, roles, media projects, assets, sessions, conversationSessions, assetRegistry, studioPipelines, creditWallets, creditLedger, usageEvents.
- **Migration Strategy**: Drizzle Kit for database migrations.

### Global Platform Services
- **Credit System**: Wallet management, deduction logic, API for balance, transactions, usage.
- **Geolocation & Localization**: IP-based location, 50+ countries/currencies, 20-language translation system (i18n).
- **Background Job Processing**: EventEmitter-based queue, max 5 concurrent jobs, SSE streaming.
- **Analytics**: Per-studio usage tracking, daily token consumption, feature usage breakdown.

### UI/UX Decisions
- Consistent dark theme and accent color across all studios and components.
- Intuitive interfaces for professional tools like the TipTap book editor, MediaStudio (Photoshop-like layers for images, CapCut-style timeline for video), and Cover Designer.
- Emphasis on responsive design to ensure functionality across devices.

### Feature Specifications
- **The 6 Studios**: Book, Video, Music, Course, Image, Doctrine Engine, each with specialized tools and AI integration.
- **Creator Production Engine**: Content vaults, SERP research hub, batch production, music sandbox, script studio, life story engine, and a unified production dashboard.
- **Marketplace (KreAItorverse)**: For selling books, courses, music, videos, and templates with an 85% creator revenue share.
- **Creator Dashboard (/dashboard)**: Unified command center with 5 tabs:
  - *Overview*: Credit Balance, Projects Count, Credits Used, Total Earnings
  - *Studios*: Quick access to all 6 studios plus additional tools
  - *Earnings*: All users track revenue (Total, Pending, Paid Out, Sales, Revenue Split visualization)
  - *Referrals*: Affiliate system with shareable links, stats, reward breakdown (500 credits referrer/250 friend/10% commission)
  - *Admin* (admin only): Platform revenue + Subscription Analytics (Active, New, Churned, By Tier)
- **Affiliate/Referral System**: APIs at `/api/affiliate/*` for unique referral codes, tracking conversions, commission payouts. Schema: referralCodes, referralConversions tables.
- **AI Integration**: Google Gemini and OpenAI for text, Lyria for music, specialized models for images/video, AI Consultant for content monetization.
- **Quick Create**: One-click magic tools for instant content generation.
- **Doc Hub**: Document import/parsing, merging, snippet vault, manuscript builder.
- **Book Projects**: Autosave, chapter management, full workflow persistence.
- **Manuscript Analysis**: AI-powered structure detection, publication readiness scoring.

## External Dependencies

1.  **Replit Auth (OpenID Connect)**: User authentication and identity.
2.  **Stripe**: Payment processing, subscriptions, customer portal.
3.  **Google Gemini AI (via Replit AI Integrations)**: AI-powered content generation and analysis.
4.  **OpenAI (via Replit AI Integrations)**: Advanced AI writing and analysis.
5.  **Remove.bg API**: Background removal for images.
6.  **Neon Database**: Serverless PostgreSQL.
7.  **Radix UI**: Accessible UI primitives.
8.  **Lucide React / React Icons**: Iconography.
9.  **date-fns**: Date formatting.
10. **TipTap**: Rich text editing.
11. **Tone.js**: Audio/music processing.
12. **@neondatabase/serverless**: PostgreSQL driver.
13. **Drizzle ORM / Drizzle Kit**: Type-safe database queries and migrations.
14. **mammoth / pdf-parse**: Document parsing.
15. **SERP API**: Trending topics, keyword research (integrated into SERP Research Hub).