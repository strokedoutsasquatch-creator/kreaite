# KreAIte.xyz

**"CREATE. PUBLISH. EARN."**

**Powered by KremersX**

## Overview

KreAIte.xyz is an ultra-premium AI-powered creator platform with 6 professional studios for content creation. Features marketplace with streaming, integrated publishing, and creator earnings (85/15 split).

**Website:** https://kreaite.xyz
**Contact:** hello@kreaite.xyz
**Parent Company:** KremersX

### The 6 Studios:
- **Book Studio** - Professional TipTap editor with tables, images, AI ghostwriting, KDP/Lulu publishing
- **Video Studio** - CapCut-style timeline editor with AI video generation, multi-track editing
- **Music Studio** - AI music composition with Tone.js, loop libraries, mixing/mastering
- **Course Builder** - Create courses from books/content, video lessons, quizzes, certificates
- **Image Studio** - Photoshop-like editor with layers, filters, AI generation, Remove.bg integration
- **Doctrine Engine** - Knowledge base builder for structured content systems

### Key Features:
- **MediaStudio** - Unified image/video editor with dual modes (Photoshop-like layers for images, CapCut-style timeline for video)
- **Cover Designer** - 8 templates, AI generation, Canva-style editing, KDP-ready exports
- **Professional Editor** - TipTap WYSIWYG with tables, images, formatting, find/replace, zoom
- **AI Integration** - Google Gemini and OpenAI for text, Lyria for music, specialized models for images/video
- **Marketplace (KreAItorverse)** - Sell books, courses, music, videos with 85% creator revenue share
- **Template Marketplace** - Buy/sell creator templates with real Stripe checkout, 85/15 revenue split
- **Doc Hub** - Document import/parsing (Word, PDF, code), merge documents, snippet vault, manuscript builder
- **Stripe Integration** - Payments, subscriptions, customer portal
- **Quick Create** - 1-click magic tools: instant covers, hum-to-song, instant course, AI ghostwriter, blog-to-book
- **AI Consultant** - Train AI on your content, monetize with chat subscriptions, embed on external sites
- **Conversation System** - Cross-studio AI chat with session history and action support
- **Manuscript-to-Soundtrack** - Analyze book emotional arc and generate companion soundtrack
- **Viral Features** - Affiliate system, success stories, creator leaderboard, watermarks
- **Book Projects** - Save/resume book projects with autosave, chapter management, and full workflow persistence
- **Book Preview** - Real-time paginated preview with spread view, thumbnails, zoom controls
- **Manuscript Analysis** - AI-powered structure detection, chapter extraction, publication readiness scoring (0-100)
- **Image Placement** - Auto/manual/hybrid modes for positioning images within manuscripts
- **Author Storefronts** - KDP Author Central-style profiles with public storefront, social links, achievements

### Platform Model:
- **Centralized at KreAIte.xyz** - Single platform with creator tools
- **Creator Earnings** - 85/15 revenue split (creators keep 85%)
- **Multi-Format Publishing** - PDF, EPUB, print-on-demand via Lulu, streaming

## User Preferences

Preferred communication style: Simple, everyday language.
Design mandate: Pure black (#000000) background, orange (#FF6B35) accent
Icons: lucide-react only (no emoji)

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for client-side routing (lightweight alternative to React Router)
- TailwindCSS for utility-first styling with custom dark theme configuration

**UI Component System:**
- Shadcn/ui component library built on Radix UI primitives for accessible, composable components
- Custom design system: Pure black background (#000000) and vibrant orange accent (#FF6B35)
- Inter font family as primary typeface with Space Grotesk for impact numbers
- Component aliases configured for clean imports (@/components, @/lib, @/hooks)

**State Management:**
- TanStack Query (React Query) for server state management, caching, and data synchronization
- Custom hooks pattern for authentication (useAuth) and other shared logic
- No global state management library - leveraging React Query's built-in state

**Key Design Decisions:**
- Dark theme by default (pure black #000000)
- Mobile-first responsive design with breakpoint at 768px
- Accessibility-first approach using Radix UI primitives for keyboard navigation and screen readers

### Backend Architecture

**Server Framework:**
- Express.js for HTTP server and middleware
- TypeScript throughout with ES modules
- Separate entry points for development (index-dev.ts with Vite integration) and production (index-prod.ts serving static files)

**Authentication & Session Management:**
- Replit Auth integration using OpenID Connect (OIDC) passport strategy
- PostgreSQL session store using connect-pg-simple
- Session-based authentication with HTTP-only cookies
- Token refresh mechanism for maintaining long-lived sessions
- Protected route pattern on client enforces authentication state

**API Design:**
- RESTful API patterns with route handlers in server/routes.ts
- Consistent error handling with HTTP status codes
- JSON request/response format
- CORS configured for Replit domains

**Key Architectural Decisions:**
- Session storage in database rather than memory for scalability and persistence across deployments
- Webhook routes registered BEFORE express.json() middleware to preserve raw Buffer payloads for signature verification
- Environment-aware configuration (development vs production) for different behaviors

### Data Storage Solutions

**Primary Database:**
- PostgreSQL via Neon serverless driver for scalable, edge-compatible database access
- Drizzle ORM for type-safe database queries and schema management
- WebSocket-based connection pooling for serverless environments

**Schema Design:**
- Users table with Replit Auth integration (email, name, profile image)
- User roles system (member, admin) for access control
- Media projects and assets for creator content storage
- Sessions table for authentication persistence

**Migration Strategy:**
- Drizzle Kit for database migrations with SQL generation
- Schema versioned in migrations/meta directory
- Migration history tracked in _journal.json

**Why Drizzle over Prisma:**
- Better TypeScript inference without code generation
- More control over SQL queries
- Smaller bundle size and better performance for serverless
- Native PostgreSQL support without middleware layer

### External Dependencies

**Third-Party Services:**

1. **Replit Auth (OpenID Connect)**
   - Purpose: User authentication and identity management
   - Integration: Passport.js strategy with token refresh
   - Provides: User email, name, profile image from Replit accounts

2. **Stripe Integration**
   - Purpose: Payment processing and subscription management
   - Integration: stripe-replit-sync for automated webhook handling and data syncing
   - Features: Customer management, checkout sessions, customer portal, webhook processing
   - Managed webhooks with UUID-based routing for reliability

3. **Google Gemini AI (via Replit AI Integrations)**
   - Purpose: AI-powered content generation
   - Integration: @google/genai SDK with custom API endpoints via Replit connectors
   - Features: Book writing, content generation, analysis

4. **OpenAI (via Replit AI Integrations)**
   - Purpose: Advanced AI writing and analysis
   - Integration: openai SDK

5. **Remove.bg API**
   - Purpose: Background removal for images
   - Integration: POST /api/image/remove-background endpoint
   - Secret: REMOVE_BG_API_KEY

6. **Neon Database**
   - Purpose: Serverless PostgreSQL database
   - Integration: @neondatabase/serverless driver with WebSocket support
   - Configuration: Environment variable DATABASE_URL required

**UI Libraries:**
- Radix UI primitives for 20+ accessible component patterns (Dialog, Dropdown, Toast, etc.)
- Lucide React for consistent iconography
- React Icons for social media icons
- date-fns for date formatting and manipulation
- TipTap for rich text editing (Book Studio)
- Tone.js for audio/music (Music Studio)

**Development Tools:**
- Replit-specific plugins for development banner and error overlay
- ESBuild for production server bundling
- PostCSS with Autoprefixer for CSS processing
- Drizzle Kit for database schema management

**Asset Management:**
- attached_assets directory for images, videos, documents
- Generated images for exercises and UI elements

**Key Integration Patterns:**
- Webhook signature verification using raw Buffer payloads before JSON parsing
- Environment-based configuration for development vs production Stripe keys
- Managed webhook system with UUID routing for reliable event processing

## Wave 1 Global Platform Services (NEW)

### Credit System
- `server/creditService.ts` - Credit wallet management, deduction logic (bonus credits first)
- `client/src/lib/hooks/useCredits.ts` - React hooks for credit balance, transactions, usage
- API endpoints: GET /api/credits/balance, GET /api/credits/transactions, GET /api/credits/usage, POST /api/credits/check

### Geolocation & Localization
- `server/geolocationService.ts` - IP-based location detection, 50+ countries/currencies
- `server/i18nService.ts` - 20 language translation system (EN/ES/FR/DE/JA/ZH/KO/AR/HI/TH/VI and more)
- `client/src/lib/hooks/useLocale.ts` - LocaleProvider context, translation helpers, currency/date formatting
- API endpoints: GET /api/geolocation, GET /api/i18n/locales, GET /api/i18n/translations/:locale

### Background Job Processing
- `server/jobQueueService.ts` - EventEmitter-based queue, max 5 concurrent, auto-cleanup 24h
- `client/src/lib/hooks/useJobs.ts` - Job management with SSE streaming via useJobStream
- API endpoints: POST /api/jobs, GET /api/jobs, GET /api/jobs/:id, DELETE /api/jobs/:id, GET /api/jobs/:id/stream (SSE)

### Analytics
- API endpoints: GET /api/analytics/credits, GET /api/analytics/usage
- Per-studio usage tracking, daily token consumption, feature usage breakdown

## Important Files

- `client/src/components/ProfessionalEditor.tsx` - TipTap book editor
- `client/src/components/CoverDesigner.tsx` - Book cover designer
- `client/src/components/MediaStudio.tsx` - Unified image/video editor
- `client/src/components/ConversationPanel.tsx` - Cross-studio AI chat
- `client/src/components/CreatorHeader.tsx` - Header with user dropdown and credits
- `client/src/pages/BookStudio.tsx` - Book Studio page
- `client/src/pages/MediaStudioPage.tsx` - MediaStudio page
- `client/src/pages/QuickCreate.tsx` - 1-click magic tools
- `client/src/pages/AIConsultant.tsx` - AI Consultant training/monetization
- `client/src/pages/DocHubPage.tsx` - Doc Hub page wrapper
- `client/src/features/doc-hub/DocHub.tsx` - Doc Hub component (sources, merge, snippets, manuscripts)
- `client/src/features/template-marketplace/TemplateMarketplace.tsx` - Template marketplace with real Stripe checkout
- `server/documentService.ts` - Document parsing service (mammoth for Word, pdf-parse for PDFs)
- `server/routes.ts` - API routes (10000+ lines)
- `server/creditService.ts` - Credit wallet and transaction management
- `server/geolocationService.ts` - IP geolocation and locale detection
- `server/i18nService.ts` - Internationalization with 20 languages
- `server/jobQueueService.ts` - Background job processing with SSE
- `shared/schema.ts` - Database schema (includes conversationSessions, assetRegistry, studioPipelines, creditWallets, creditLedger, usageEvents)
- `client/index.html` - SEO/AEO meta tags and structured data

## Technical Notes

- **TipTap imports**: Use named imports: `import { Table } from '@tiptap/extension-table'`
- **SelectItem**: Use value="all" with mapping instead of empty string value=""
- **MediaStudio**: One engine, two UIs (Image/Video modes), shared asset manager
- KDP specs: Trim sizes (6x9, 8.5x11), proper margins, 300 DPI, bleed requirements
