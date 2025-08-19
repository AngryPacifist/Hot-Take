# Overview

Hot Take is a social prediction platform built as a TikTok-style Mini App where users can stake points on predictions and hot takes. The application features an infinite scroll feed of predictions, allowing users to engage by voting with points rather than just liking or commenting. Users build reputation through accurate predictions and compete on leaderboards across various categories like tech, sports, crypto, memes, and food.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for development and build tooling
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI patterns
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Real-time Updates**: WebSocket implementation for live vote updates and real-time features
- **Mobile-First Design**: Responsive design optimized for mobile devices with bottom navigation and touch-friendly interfaces

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful API endpoints with standardized error handling
- **Real-time Communication**: WebSocket server integration for live updates
- **Middleware**: Request logging, JSON parsing, and CORS handling
- **Session Management**: Express sessions with PostgreSQL storage

## Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Relational database with tables for users, categories, predictions, votes, and sessions
- **Key Relationships**:
  - Users have many predictions and votes
  - Predictions belong to categories and have many votes
  - Votes link users to predictions with stance and points staked
- **Data Integrity**: Foreign key constraints and proper indexing for performance

## Authentication System
- **Provider**: Custom username/password authentication with bcrypt hashing
- **Session Storage**: PostgreSQL-backed session store with configurable TTL
- **User Management**: Free account creation with username, optional email/name fields
- **Security**: HTTP-only cookies, secure session handling, and password hashing
- **Default Points**: New users start with 1,000 points for immediate prediction participation

## Real-time Features
- **WebSocket Implementation**: Native WebSocket server for live updates
- **Event Types**: Vote updates, prediction changes, and user activity broadcasts
- **Client Management**: Connection handling with automatic reconnection logic
- **Message Broadcasting**: Targeted updates to relevant connected clients

## Development Workflow
- **Hot Reload**: Vite development server with HMR for fast iteration
- **Type Safety**: Shared TypeScript types between client and server
- **Build Process**: Vite for client bundling, esbuild for server compilation
- **Database Migrations**: Drizzle Kit for schema management and deployments

# External Dependencies

## Database Services
- **PostgreSQL**: Primary database using connection pooling via @neondatabase/serverless
- **Neon Database**: Cloud PostgreSQL provider with WebSocket support for serverless environments

## Authentication Provider
- **Replit Auth**: OAuth 2.0/OpenID Connect integration for user authentication and identity management

## UI Component Libraries
- **Radix UI**: Headless component primitives for accessible UI components
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library built on Radix UI with Tailwind CSS

## Development Tools
- **Vite**: Build tool and development server with hot module replacement
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **TypeScript**: Type safety across the entire application stack

## Runtime Libraries
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form handling with validation using Zod schemas
- **date-fns**: Date manipulation and formatting utilities
- **WebSocket (ws)**: Server-side WebSocket implementation for real-time features