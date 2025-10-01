import React from 'react';
import { Video } from '../lib/types';
import VideoCard from './VideoCard';

interface VideoGridProps {
  videos: Video[];
  // FIX: Added lastItemRef prop to support infinite scrolling by observing the last element.
  lastItemRef?: (node: HTMLDivElement | null) => void;
}

// FIX: Changed component to a standard functional component and implemented logic to attach the lastItemRef.
const VideoGrid: React.FC<VideoGridProps> = ({ videos, lastItemRef }) => {
  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {videos.map((video, index) => {
        if (videos.length === index + 1 && lastItemRef) {
          return (
            <div key={video.id} ref={lastItemRef}>
              <VideoCard video={video} rank={index + 1} />
            </div>
          );
        }
        return <VideoCard key={video.id} video={video} rank={index + 1} />;
      })}
    </div>
  );
};

export default VideoGrid;
