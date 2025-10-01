import React from 'react';
import { Video } from '../lib/types';
import VideoCard from './VideoCard';

interface VideoGridProps {
  videos: Video[];
}

const VideoGrid = React.forwardRef<HTMLDivElement, VideoGridProps>(({ videos }, ref) => {
  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
        />
      ))}
    </div>
  );
});

export default VideoGrid;