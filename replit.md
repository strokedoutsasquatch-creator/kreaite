# Stroke Recovery Academy

**"REBUILD. REWIRE. RISE."**

## Overview

Stroke Recovery Academy (strokerecoveryacademy.com) is a comprehensive web platform designed to support stroke survivors, caregivers, and professionals in their recovery journey. Built by Nick "The Stroked Out Sasquatch" Kremers, a stroke survivor who achieved 90% recovery, the platform combines personal recovery expertise with modern neuroscience.

### Key Features:
- **Academy** - Digital courses from 3 recovery books (The Stroked Out Sasquatch, Ultimate Stroke Recovery Bible, Wheeled Out)
- **Stroke Lyfe Publishing** - AI-powered book writing studio with Gemini ghostwriting and course builder
- **AI Sasquatch Coach** - Interactive chat for motivation and guidance
- **Community Forum** - Support network for survivors to share stories
- **Survival Grid** - 16 battle-tested exercise protocols (Upper Body, Lower Body, Cognitive, Daily Living)
- **Recovery Builder** - 4-step assessment wizard for personalized recovery plans
- **Marketplace** - Premium books, coaching, and courses with Amazon affiliate integration

### Platform Model:
- **Centralized at StrokeRecoveryAcademy.com** - Single community with curated creator program
- **Curated Creators** - Vetted experts can publish through Stroke Lyfe Publishing
- **Quality Control** - All content reviewed before publishing to ensure safety

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for client-side routing (lightweight alternative to React Router)
- TailwindCSS for utility-first styling with custom dark theme configuration

**UI Component System:**
- Shadcn/ui component library built on Radix UI primitives for accessible, composable components
- Custom design system following "Dark Premium Aesthetic" with pure black background (#000000) and vibrant orange accent (#FF6B35)
- Inter font family as primary typeface with Space Grotesk for impact numbers
- Component aliases configured for clean imports (@/components, @/lib, @/hooks)

**State Management:**
- TanStack Query (React Query) for server state management, caching, and data synchronization
- Custom hooks pattern for authentication (useAuth) and other shared logic
- No global state management library - leveraging React Query's built-in state

**Key Design Decisions:**
- Dark theme by default to reduce eye strain and create a "command center" aesthetic
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
- Forum system with categories, threads, posts, and reactions for community features
- User profiles for stroke-specific data (stroke date, type, affected side, goals)
- AI chat sessions and messages for persistent coaching conversations
- Achievements and gamification system for recovery milestones
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
   - Purpose: AI-powered recovery coaching chatbot
   - Integration: @google/genai SDK with custom API endpoints via Replit connectors
   - Features: Contextual responses, motivational quotes, recovery guidance
   - System prompts define "Sasquatch" personality (tough love + compassion)

4. **Neon Database**
   - Purpose: Serverless PostgreSQL database
   - Integration: @neondatabase/serverless driver with WebSocket support
   - Configuration: Environment variable DATABASE_URL required

**UI Libraries:**
- Radix UI primitives for 20+ accessible component patterns (Dialog, Dropdown, Toast, etc.)
- Lucide React for consistent iconography
- React Icons for social media icons
- date-fns for date formatting and manipulation

**Development Tools:**
- Replit-specific plugins for development banner and error overlay
- ESBuild for production server bundling
- PostCSS with Autoprefixer for CSS processing
- Drizzle Kit for database schema management

**Asset Management:**
- attached_assets directory for images, videos, documents
- Recovery book PDFs and markdown content
- Branding JSON files for theme configuration
- Generated images for exercises and UI elements

**Key Integration Patterns:**
- Webhook signature verification using raw Buffer payloads before JSON parsing
- Environment-based configuration for development vs production Stripe keys
- Managed webhook system with UUID routing for reliable event processing
- AI chat history maintained in database for context-aware responses