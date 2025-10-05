# Load More Functionality for Video Trending App

## Overview

The load more functionality has been completely rewritten to provide proper pagination, deduplication, and platform-specific handling for YouTube, DailyMotion, and Reddit platforms.

## Key Features

### ✅ **Proper Pagination**
- **YouTube**: Uses `pageToken` for token-based pagination
- **DailyMotion**: Uses `page` for page-based pagination  
- **Reddit**: Uses `after` for cursor-based pagination
- **All platforms**: Correctly maintains pagination state between requests

### ✅ **Deduplication**
- Removes duplicate videos based on unique identifiers
- Supports platform-specific ID formats
- Fallback deduplication using URLs and content signatures
- Prevents the same video from appearing multiple times in the list

### ✅ **Loading States**
- Prevents multiple simultaneous requests
- Proper loading indicators
- Error handling with user-friendly messages

### ✅ **Platform-Specific Handling**
- Each platform has optimized pagination logic
- Respects platform-specific API limitations
- Proper error handling for each service

## Implementation

### Files Structure

```
VideoTrending/
├── shared/hooks/
│   └── useVideos.ts               # Unified hook for all platforms
├── youtube/hooks/
│   └── useVideos.ts               # YouTube-specific hook
├── dailymotion/hooks/
│   └── useVideos.ts               # DailyMotion-specific hook  
├── reddit/hooks/
│   └── useVideos.ts               # Reddit-specific hook
├── youtube/utils/
│   └── deduplication.ts           # Deduplication utilities
└── youtube/lib/
    └── api.ts                     # Updated API layer with pagination support
```

### Key Components

#### 1. **Deduplication Utilities** (`youtube/utils/deduplication.ts`)

```typescript
// Create unique identifier for any video
const uniqueId = createVideoUniqueId(video);

// Remove duplicates from video array
const uniqueVideos = deduplicateVideos(videos);

// Merge new videos with existing ones without duplicates
const merged = mergeVideosWithoutDuplicates(existingVideos, newVideos);
```

#### 2. **Unified Hook** (`shared/hooks/useVideos.ts`)

```typescript
import { useVideos } from '../shared/hooks/useVideos';

function VideoList({ filters }) {
  const { videos, loading, hasMore, loadMore, error, refresh } = useVideos(filters);
  
  return (
    <div>
      {videos.map(video => <VideoCard key={video.id} video={video} />)}
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
      {error && <ErrorMessage error={error} />}
    </div>
  );
}
```

#### 3. **Platform-Specific Hooks**

Each platform has its own optimized hook:

```typescript
// For YouTube-specific features
import { useVideos } from '../youtube/hooks/useVideos';

// For DailyMotion-specific features  
import { useVideos } from '../dailymotion/hooks/useVideos';

// For Reddit-specific features
import { useVideos } from '../reddit/hooks/useVideos';
```

## Usage

### Basic Usage

```typescript
import { useVideos } from './shared/hooks/useVideos';

function VideoApp() {
  const [filters, setFilters] = useState({
    platform: 'youtube', // or 'dailymotion', 'reddit', 'all'
    keywords: '',
    sortBy: 'trending',
    // ... other filter options
  });

  const { videos, loading, hasMore, loadMore, error, refresh } = useVideos(filters);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadMore();
    }
  };

  return (
    <div>
      {/* Video list */}
      {videos.map(video => (
        <VideoCard key={createVideoUniqueId(video)} video={video} />
      ))}
      
      {/* Load more button */}
      {hasMore && (
        <button 
          onClick={handleLoadMore} 
          disabled={loading}
          className="load-more-btn"
        >
          {loading ? 'Loading more videos...' : 'Load More Videos'}
        </button>
      )}
      
      {/* Error handling */}
      {error && (
        <div className="error-message">
          <p>{error.userMessage || 'Failed to load videos'}</p>
          <button onClick={refresh}>Try Again</button>
        </div>
      )}
      
      {/* No more content */}
      {!hasMore && videos.length > 0 && (
        <p className="end-message">No more videos to load</p>
      )}
    </div>
  );
}
```

### Advanced Usage with Platform Switching

```typescript
function AdvancedVideoApp() {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const filters = useMemo(() => ({
    platform: selectedPlatform,
    keywords: searchQuery,
    sortBy: 'trending',
    uploadDate: 'all',
    // ... other filters
  }), [selectedPlatform, searchQuery]);

  const { videos, loading, hasMore, loadMore, error, refresh } = useVideos(filters);

  const handlePlatformChange = (platform) => {
    setSelectedPlatform(platform);
    // The hook will automatically reset and load new data
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // The hook will automatically reset and search with new query
  };

  return (
    <div>
      {/* Platform selector */}
      <div className="platform-selector">
        {['all', 'youtube', 'dailymotion', 'reddit'].map(platform => (
          <button
            key={platform}
            onClick={() => handlePlatformChange(platform)}
            className={selectedPlatform === platform ? 'active' : ''}
          >
            {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search videos..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
      />

      {/* Results */}
      <div className="video-grid">
        {videos.map(video => (
          <VideoCard key={createVideoUniqueId(video)} video={video} />
        ))}
      </div>

      {/* Load more with infinite scroll */}
      <InfiniteScroll
        hasMore={hasMore}
        loadMore={loadMore}
        loading={loading}
      >
        <div className="loading-indicator">
          {loading && <Spinner />}
        </div>
      </InfiniteScroll>
    </div>
  );
}
```

## API Changes

### Updated Response Format

```typescript
interface ApiResponse {
  success: boolean;
  data: Video[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    fetchedAt: string;
    cacheHit: boolean;
    nextPageState?: {
      pageToken?: string;  // YouTube
      after?: string;      // Reddit  
      page?: number;       // DailyMotion
    };
  };
}
```

### Platform-Specific Pagination

```typescript
// YouTube - Token-based
const youtubeParams = {
  platform: 'youtube',
  pageToken: 'CAoQAA',  // from previous response
  limit: 20
};

// DailyMotion - Page-based
const dailymotionParams = {
  platform: 'dailymotion', 
  page: 2,  // increment for next page
  limit: 20
};

// Reddit - Cursor-based
const redditParams = {
  platform: 'reddit',
  after: 't3_abc123',  // from previous response
  limit: 20
};
```

## Error Handling

The system includes comprehensive error handling:

```typescript
// Network errors
catch (error) {
  if (error instanceof ApiError) {
    // API-specific error with user message
    setError(error);
  } else {
    // Generic network/unexpected error
    setError(new ApiError(
      error.message,
      undefined,
      'Failed to load videos. Please try again.'
    ));
  }
}
```

## Performance Optimizations

1. **Caching**: API responses are cached to avoid duplicate requests
2. **Deduplication**: Efficient deduplication prevents memory bloat
3. **Request Deduplication**: Prevents multiple simultaneous requests
4. **Pagination State Management**: Uses refs to avoid stale closures
5. **Stable Dependencies**: JSON.stringify for stable filter comparison

## Testing

### Test Load More Functionality

```typescript
// Test basic load more
const { result } = renderHook(() => useVideos(mockFilters));

// Wait for initial load
await waitFor(() => {
  expect(result.current.videos.length).toBeGreaterThan(0);
});

// Test load more
act(() => {
  result.current.loadMore();
});

await waitFor(() => {
  expect(result.current.videos.length).toBeGreaterThan(20);
});

// Verify no duplicates
const uniqueIds = new Set(result.current.videos.map(createVideoUniqueId));
expect(uniqueIds.size).toBe(result.current.videos.length);
```

## Migration Guide

If you're migrating from the old useVideos hook:

1. **Replace import**:
   ```typescript
   // Old
   import { useVideos } from './hooks/useVideos';
   
   // New
   import { useVideos } from './shared/hooks/useVideos';
   ```

2. **Update LoadMore button**:
   ```typescript
   // Old - check loading state manually
   <button onClick={loadMore} disabled={loading}>
   
   // New - built-in check
   <button onClick={loadMore} disabled={loading || !hasMore}>
   ```

3. **Handle platform changes**:
   ```typescript
   // The new hook automatically handles platform changes
   // No manual reset needed when filters change
   ```

## Troubleshooting

### Common Issues

1. **Duplicates appearing**: Ensure you're using `createVideoUniqueId` for React keys
2. **Load more not working**: Check `hasMore` state and console logs for API errors
3. **Memory issues**: The hook automatically deduplicates to prevent memory bloat
4. **Stale data**: The hook uses refs to prevent stale closures in pagination state

### Debug Logging

The hooks include comprehensive console logging:

```typescript
// Enable debug logging
localStorage.setItem('debug', 'true');

// Check console for:
// [Unified useVideos] Starting fetch: {...}
// [Unified useVideos] Received 20 videos for platform: youtube
// [Unified useVideos] Merged videos: 20 + 20 = 35 (5 duplicates removed)
```

## Conclusion

The new load more functionality provides:
- ✅ Proper pagination for all platforms
- ✅ Automatic deduplication
- ✅ Improved error handling  
- ✅ Better performance
- ✅ Platform-specific optimizations
- ✅ Easy integration

The system is now robust, efficient, and ready for production use across YouTube, DailyMotion, and Reddit platforms.