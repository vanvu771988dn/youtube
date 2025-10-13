# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Development Commands

### Frontend Development (main application in `youtube/`)
```bash
# Navigate to frontend directory
cd youtube

# Install dependencies
npm install

# Start development server (runs on localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Development (API server in `backend/`)
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start backend server (runs on localhost:3000)
node server.cjs
```

### Environment Setup
```bash
# Copy environment example and configure API keys
cp youtube/.env.example youtube/.env.local

# Required environment variables for youtube/.env.local:
# YOUTUBE_API_KEY=your_youtube_api_key_here
# GEMINI_API_KEY=your_gemini_api_key_here (optional)
```

### Running Full Stack Development
```bash
# Terminal 1: Backend API server
cd backend && node server.cjs

# Terminal 2: Frontend development server  
cd youtube && npm run dev
```

### Testing Individual Components
```bash
# Use the built-in YouTube API test component in the UI
# Access via "Test YouTube API" button in the application
```

## Architecture Overview

### Project Structure
This is a **multi-platform video trending aggregator** with a React frontend and Node.js backend:

```
VideoTrending/
├── youtube/          # Main React application (Vite + TypeScript)
├── backend/          # Express API server for Reddit integration
├── shared/           # Shared utilities and hooks (multi-platform)
├── reddit/           # Reddit-specific components and hooks  
├── dailymotion/      # Dailymotion-specific components and hooks
└── docs/             # Various README and setup guides
```

### Core Application Architecture (`youtube/`)

**State Management Pattern:**
- **Filter State**: Centralized filtering system with dual modes (Video/Channel)
- **API State**: Custom hooks for data fetching with caching and pagination
- **UI State**: React component state with lazy loading and error boundaries

**Key Architectural Components:**

1. **Filter System** (`hooks/useFilters.ts`)
   - Dual-mode filtering: Video mode vs Channel mode
   - Centralized filter state with mode-specific sub-filters
   - Filter presets and validation logic

2. **Data Fetching Layer** (`lib/api.ts`, `hooks/useTrends.ts`)
   - Service-oriented architecture with platform-specific services
   - Intelligent caching with TTL (5 minutes default)
   - Paginated data loading with infinite scroll support

3. **Platform Services** (`services/`)
   - `YouTubeService`: Real YouTube Data API v3 integration
   - `RedditService`: Reddit API integration via backend proxy
   - `DailymotionService`: Dailymotion API integration
   - Unified `Video` interface across all platforms

4. **Component Architecture**
   - Lazy-loaded `VideoGrid` component for performance
   - Error boundary wrapper for robust error handling
   - Mobile-first responsive design with sheet modals

### Data Flow

1. **Filter Application**: User modifies filters → `useFilters` hook → `appliedFilters` state
2. **API Request**: `useTrends` hook detects filter changes → calls `fetchTrends()` 
3. **Service Layer**: `api.ts` routes to appropriate service (YouTube/Reddit/etc.)
4. **Data Transformation**: Platform-specific data normalized to unified `Video` interface
5. **Caching**: Response cached with generated cache key including all filter parameters
6. **UI Update**: Transformed data flows to `VideoGrid` component

### Platform Integration Strategy

**YouTube Integration:**
- Direct API calls to YouTube Data API v3
- Requires `YOUTUBE_API_KEY` environment variable
- Falls back to mock data if API unavailable
- Supports advanced filtering (duration, view count, trending status)

**Reddit Integration:**  
- Backend proxy server required (`backend/server.cjs`)
- Reddit API calls routed through Express server to handle CORS
- Uses Reddit's `after` token pagination system

**Multi-Platform Aggregation:**
- Platform-agnostic `Video` interface allows unified display
- Each service transforms native API responses to common format
- Filter system works consistently across all platforms

## Development Patterns

### Adding New Platform Services
1. Create service class in `services/[platform].service.ts`
2. Implement `searchVideos()` method returning normalized `Video[]`
3. Add platform type to `PlatformType` union in `lib/types.ts`
4. Update `fetchTrends()` in `lib/api.ts` to route to new service
5. Add platform option to filter UI components

### Filter System Extension
- Video-specific filters go in `VideoFilters` interface
- Channel-specific filters go in `ChannelFilters` interface  
- Update filter UI in `components/FilterBar.tsx`
- Add filter processing logic in `lib/api.ts`
- Update `useTrends` hook dependency array for cache invalidation

### Error Handling Pattern
- Use `ApiError` class for consistent error messaging
- Implement fallback UI states in components
- Cache errors to prevent repeated failed requests
- Provide user-friendly error messages via `userMessage` property

### Performance Optimization
- Lazy load heavy components with `React.lazy()`
- Use `useMemo()` for expensive filter comparisons
- Implement intelligent caching with TTL expiration
- Debounce rapid filter changes to reduce API calls

## Configuration

### Environment Variables (Frontend)
```bash
# YouTube API Integration
YOUTUBE_API_KEY=your_api_key           # Required for real YouTube data
GEMINI_API_KEY=your_gemini_key        # Optional for AI features

# Development URLs  
VITE_BACKEND_URL=http://localhost:3000 # Backend API base URL
```

### API Configuration (`lib/config.ts`)
- YouTube API timeout: 10 seconds
- Cache timeout: 5 minutes  
- Default page size: 50 videos
- Maximum retry attempts: 3

### Build Configuration
- **Vite** for frontend bundling with React plugin
- **TypeScript** with strict mode enabled
- **Path aliases**: `@/*` maps to project root
- **Proxy setup**: `/api/reddit` proxied to backend server

## Important Implementation Details

### Filter Mode System
The application implements a sophisticated dual-mode filtering system:

- **Video Mode**: Filters individual videos (upload date, views, duration, trending status)
- **Channel Mode**: Filters by channel characteristics (subscriber count, video count, monetization)
- Mode switching preserves common filters (search, platform) but resets mode-specific filters
- Each mode has distinct UI components and API processing logic

### Caching Strategy
Intelligent caching system prevents redundant API calls:
- Cache keys generated from complete filter state
- 5-minute TTL with automatic cleanup
- Cache invalidation on filter changes
- Separate cache entries for different filter combinations

### Mobile-First Design
UI components designed for mobile-first experience:
- Filter controls in slide-up sheet modal on mobile
- Large touch targets and gestures
- Responsive breakpoints for tablet/desktop enhancement
- Lazy loading and performance optimization for mobile networks

### API Integration Patterns
- Service-oriented architecture with platform-specific adapters
- Unified `Video` interface across all data sources
- Graceful fallbacks when APIs unavailable
- Rate limiting and quota management for external APIs

## Development Notes

### Mock Data Usage
When YouTube API key is not configured, the application automatically falls back to realistic mock data for development and testing purposes.

### Backend Dependency  
The backend server is only required for Reddit integration. YouTube and other platforms work directly from the frontend.

### Hot Module Replacement
Vite provides instant hot reloading during development. Changes to components, hooks, and utilities reflect immediately without page refresh.

### TypeScript Integration
Full TypeScript support with strict typing. The `Video` interface ensures type safety across all platform integrations.