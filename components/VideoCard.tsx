import React, { useState } from 'react';
import { Video } from '../lib/types';
import { formatCount, formatDuration, timeAgo } from '../lib/utils';
import YouTubeIcon from './icons/YouTubeIcon';
import TikTokIcon from './icons/TikTokIcon';

// --- SKELETON COMPONENT ---
export const VideoCardSkeleton: React.FC = () => (
  <div className="bg-slate-800 rounded-lg overflow-hidden animate-pulse">
    <div className="w-full h-48 bg-slate-700"></div>
    <div className="p-4">
      <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-700 rounded w-1/2"></div>
          <div className="h-3 bg-slate-700 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
interface VideoCardProps {
  video: Video;
  rank?: number;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, rank }) => {
  const [imageError, setImageError] = useState(false);
  const isYouTube = video.platform === 'youtube';

  const platformIcon = isYouTube ? (
    <YouTubeIcon className="h-5 w-5" />
  ) : (
    <div className="h-5 w-5 relative"><TikTokIcon className="h-5 w-5 absolute top-0 left-0" /></div>
  );

  const platformColor = isYouTube ? 'text-brand-youtube' : 'text-brand-tiktok';
  const platformBorder = isYouTube ? 'border-brand-youtube' : 'border-brand-tiktok';
  const platformRing = isYouTube ? 'ring-brand-youtube' : 'ring-brand-tiktok';

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 group">
      <a href={video.url} target="_blank" rel="noopener noreferrer" aria-label={`Watch ${video.title}`}>
        {/* Thumbnail Section */}
        <div className="relative">
          {imageError ? (
            <div className="w-full h-48 bg-slate-700 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          ) : (
            <img className="w-full h-48 object-cover" src={video.thumbnail} alt={video.title} loading="lazy" onError={handleImageError} />
          )}

          <div className={`absolute top-2 right-2 p-1.5 bg-slate-900/80 rounded-full ${platformColor}`}>{platformIcon}</div>
          
          {rank && rank <= 10 && (
             <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ring-1 ring-slate-600">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
               #{rank}
             </div>
          )}

          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">{formatDuration(video.duration)}</div>
          
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/80" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          <h3 className="font-bold text-base mb-3 h-12 overflow-hidden line-clamp-2 leading-tight">{video.title}</h3>

          {/* Creator Info */}
          <div className="flex items-center space-x-3 mb-4">
            <img className={`w-10 h-10 rounded-full object-cover ring-2 ring-offset-2 ring-offset-slate-800 ${platformRing}`} src={video.creatorAvatar} alt={`${video.creatorName}'s avatar`} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-200 truncate">{video.creatorName}</p>
              {video.platform === 'youtube' && <p className="text-xs text-slate-400">{formatCount(video.subscriberCount)} subscribers</p>}
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex justify-between items-center text-xs text-slate-300 border-t border-slate-700/50 pt-3">
            <div className="flex items-center space-x-3">
              <span title="Views">👁️ {formatCount(video.viewCount)}</span>
              <span title="Likes">❤️ {formatCount(video.likeCount)}</span>
              {video.commentCount && <span title="Comments">💬 {formatCount(video.commentCount)}</span>}
            </div>
            <span className="font-medium text-slate-400">{timeAgo(video.uploadDate)}</span>
          </div>
        </div>
      </a>
    </div>
  );
};

export default VideoCard;
