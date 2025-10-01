import React from 'react';
import { Video } from '../lib/types';
import { formatCount, formatDuration, timeAgo } from '../lib/utils';
import YouTubeIcon from './icons/YouTubeIcon';
import TikTokIcon from './icons/TikTokIcon';

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const isYouTube = video.platform === 'youtube';

  const platformIcon = isYouTube ? (
    <YouTubeIcon className="h-5 w-5 text-brand-youtube" />
  ) : (
    <div className="h-5 w-5 relative">
       <TikTokIcon className="h-5 w-5 absolute top-0 left-0" />
    </div>
  );
  
  const platformBorderStyle = isYouTube ? 'border-brand-youtube' : 'border-brand-tiktok';

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 animate-fade-in group">
      <a href={video.url} target="_blank" rel="noopener noreferrer" aria-label={`Watch ${video.title}`}>
        <div className="relative">
          <img className="w-full h-48 object-cover" src={video.thumbnail} alt={video.title} loading="lazy" />
          <div className={`absolute top-2 right-2 p-1.5 bg-slate-900/80 rounded-full border ${platformBorderStyle}`}>
            {platformIcon}
          </div>
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/80" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-base mb-2 h-12 overflow-hidden text-ellipsis leading-tight">{video.title}</h3>
          <p className="text-sm text-slate-400 mb-3 truncate">{video.creatorName}</p>
          <div className="flex justify-between items-center text-xs text-slate-300">
            <div className="flex items-center space-x-3">
              <span title="Views">👁️ {formatCount(video.viewCount)}</span>
              <span title="Likes">❤️ {formatCount(video.likeCount)}</span>
            </div>
            <span className="font-medium">{timeAgo(video.uploadDate)}</span>
          </div>
        </div>
      </a>
    </div>
  );
};

export default VideoCard;