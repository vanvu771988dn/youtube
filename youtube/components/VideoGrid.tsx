import React, { useRef, useEffect } from 'react';
import { Video, ApiError } from '../lib/types';
import VideoCard from './VideoCard';
import LoadingSpinner from './LoadingSpinner';
import NoResults from './errors/NoResults';
import NetworkError from './errors/NetworkError';
import QuotaExceeded from './errors/QuotaExceeded';
import LoadingError from './errors/LoadingError';

interface VideoGridProps {
  videos: Video[];
  loading: boolean;
  error: ApiError | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

const VideoGrid: React.FC<VideoGridProps> = ({ videos, loading, error, hasMore, loadMore, refresh }) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef(loadMore);

  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  useEffect(() => {
    if (loading || !hasMore) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadMoreRef.current();
      }
    });

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [loading, hasMore]);
  
  // Display error message if there's an error on initial load
  if (error && videos.length === 0) {
    const ErrorComponent = () => {
        // Network errors are often indicated by a lack of a specific HTTP status
        if (!error.status) { 
            return <NetworkError onRetry={refresh} />;
        }
        switch (error.status) {
            case 403:
            case 429:
                return <QuotaExceeded onRetry={refresh} />;
            default:
                return <LoadingError onRetry={refresh} message={error.userMessage} />;
        }
    };
    return (
        <div className="py-16 flex justify-center">
            <div className="w-full max-w-lg">
                <ErrorComponent />
            </div>
        </div>
    );
  }

  // Display message if there are no videos and it's finished the initial load
  if (videos.length === 0 && !loading) {
    return <NoResults />;
  }

  // Show a loading spinner for the initial load
  if (loading && videos.length === 0) {
      return (
          <div className="py-16">
              <LoadingSpinner />
          </div>
      );
  }

  console.log('[VideoGrid] videos prop:', videos);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {videos.map((video, index) => (
          <VideoCard key={`${video.platform}-${video.id}-${index}`} video={video} />
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef}></div>
      
      {/* Loading spinner for loading more items */}
      {hasMore && (
        <div className="py-8">
            <LoadingSpinner />
        </div>
      )}

      {/* Message when all videos are loaded */}
      {!hasMore && videos.length > 0 && (
        <div className="text-center py-8 text-slate-500">
          <p>You've reached the end!</p>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;