import React, { useState } from 'react';
import { Video } from '../lib/types';
import { formatCount, formatDuration, timeAgo } from '../utils/formatters';
import YouTubeIcon from './icons/YouTubeIcon';
import TikTokIcon from './icons/TikTokIcon';

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const PlatformIcon = video.platform === 'youtube' ? YouTubeIcon : TikTokIcon;
  const [isImageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-1 transition-transform duration-300 ease-in-out flex flex-col">
      <a href={video.url} target="_blank" rel="noopener noreferrer" className="block relative h-48">
        {/* Placeholder element */}
        <div className={`w-full h-full bg-slate-700 absolute transition-opacity duration-300 ${isImageLoaded ? 'opacity-0' : 'opacity-100'}`}></div>
        <img 
            src={video.thumbnail} 
            alt={video.title} 
            className={`w-full h-full object-cover absolute transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy" // Native browser lazy loading defers image download
            onLoad={() => setImageLoaded(true)} // Track when the image has loaded
        />
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {formatDuration(video.duration)}
        </div>
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 p-1.5 rounded-full">
            <PlatformIcon className="h-5 w-5 text-white" />
        </div>
      </a>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-md font-semibold text-white mb-2 leading-tight h-12 overflow-hidden" title={video.title}>
          {video.title}
        </h3>

        <div className="flex items-center mt-2 mb-3">
            <img src={video.creatorAvatar} alt={video.creatorName} className="w-8 h-8 rounded-full mr-3" />
            <div>
                <p className="text-sm font-medium text-slate-300">{video.creatorName}</p>
                <p className="text-xs text-slate-400">{formatCount(video.subscriberCount)} subscribers</p>
            </div>
        </div>

        <div className="mt-auto pt-3 border-t border-slate-700 text-xs text-slate-400 grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
              <span>{formatCount(video.viewCount)} views</span>
            </div>
             <div className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
              <span>{formatCount(video.likeCount)} likes</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                <span>{timeAgo(video.uploadDate)}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
