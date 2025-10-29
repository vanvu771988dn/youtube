import React, { useState, useMemo } from 'react';
import { Video } from '../lib/types';
import { formatCount, formatDuration, timeAgo } from '../utils/formatters';
import { getCategoryName, getCategoryIcon, getCategoryColor } from '../utils/categoryUtils';
import { calculateViralMetrics } from '../utils/viralityAnalytics';
import ViralBadge from './ViralBadge';
import TrendVelocity from './TrendVelocity';
import YouTubeIcon from './icons/YouTubeIcon';
import DailymotionIcon from './icons/DailymotionIcon';
import RedditIcon from './icons/RedditIcon';
import BookmarkIcon from './icons/BookmarkIcon';
import { isBookmarked, toggleBookmark } from '../lib/bookmarks';
import { isChannelTracked, toggleTrackChannel } from '../lib/trackedChannels';
import { getCountryFlag, getCountryName } from '../utils/countryUtils';

interface VideoCardProps {
  video: Video;
  mode: 'video' | 'channel';
  onSimilarChannel?: (name: string) => void;
}

const getPlatformIcon = (platform: Video['platform']) => {
  switch (platform) {
    case 'youtube': return YouTubeIcon;
    case 'dailymotion': return DailymotionIcon;
    case 'reddit': return RedditIcon;
    default: return YouTubeIcon;
  }
};

const BookmarkButtonOverlay: React.FC<{ video: Video }> = ({ video }) => {
  const [bookmarked, setBookmarked] = useState<boolean>(() => isBookmarked(video.id, video.platform));
  const onToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleBookmark({
      id: video.id,
      platform: video.platform,
      title: video.title,
      thumbnail: video.thumbnail,
      url: video.url,
      creatorName: video.creatorName,
      creatorAvatar: video.creatorAvatar,
      uploadDate: video.uploadDate,
    });
    setBookmarked(next);
  };
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      className={`absolute top-2 right-2 rounded-full p-1.5 transition ${bookmarked ? 'bg-yellow-400 text-black' : 'bg-black bg-opacity-75 text-white hover:bg-opacity-90'}`}
    >
      <BookmarkIcon filled={bookmarked} className="h-5 w-5" />
    </button>
  );
};

const TrackChannelButton: React.FC<{ video: Video }> = ({ video }) => {
  const [tracked, setTracked] = useState<boolean>(() => isChannelTracked(video.channelId, video.creatorName));
  const onToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleTrackChannel({
      channelId: video.channelId,
      creatorName: video.creatorName,
      creatorAvatar: video.creatorAvatar,
      channelThumbnail: video.channelThumbnail,
      channelCreatedAt: video.channelCreatedAt,
    });
    setTracked(next);
  };
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`text-xs px-2 py-1 rounded ${tracked ? 'bg-green-500 text-black' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
      title={tracked ? 'Untrack channel' : 'Track channel'}
    >
      {tracked ? 'Tracked' : 'Track'}
    </button>
  );
};

const VideoCard: React.FC<VideoCardProps> = ({ video, mode, onSimilarChannel }) => {
  const PlatformIcon = getPlatformIcon(video.platform);
  const [isImageLoaded, setImageLoaded] = useState(false);
  const isChannelModeCard = mode === 'channel';
  
  // Calculate viral metrics
  const viralMetrics = useMemo(() => calculateViralMetrics(video), [video]);

  if (isChannelModeCard) {
    const channelUrl = video.channelId ? `https://www.youtube.com/channel/${video.channelId}` : '#';
    return (
      <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 ease-in-out flex flex-col border border-slate-700 hover:border-cyan-500">
        {/* Channel Banner/Thumbnail */}
        <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="block relative h-48 group">
          <div className={`w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 absolute transition-opacity duration-300 ${isImageLoaded ? 'opacity-0' : 'opacity-100'}`}></div>
          <img 
              src={video.channelThumbnail || video.creatorAvatar} 
              alt={video.creatorName} 
              className={`w-full h-full object-cover absolute transition-all duration-500 ${isImageLoaded ? 'opacity-100 group-hover:scale-110' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
          />
          {/* Channel badge overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute bottom-3 left-3 right-3 transform translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <span className="inline-block bg-cyan-500 text-black text-xs font-bold px-2 py-1 rounded">
              👤 Channel
            </span>
          </div>
          {/* Platform icon */}
          <div className="absolute top-2 left-2 bg-black bg-opacity-75 p-1.5 rounded-full">
            <PlatformIcon className="h-5 w-5 text-white" />
          </div>
        </a>
        
        {/* Channel Info Section */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Channel Name */}
          <a 
            href={channelUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-lg font-bold text-white mb-2 leading-tight hover:text-cyan-400 transition-colors line-clamp-2" 
            title={video.creatorName}
          >
            {video.creatorName}
          </a>
          
          {/* Action Buttons */}
          <div className="flex gap-2 mb-3">
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-3 py-2 rounded text-center transition"
            >
              Visit Channel →
            </a>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onSimilarChannel && onSimilarChannel(video.creatorName); }}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded transition"
              title="Search similar channels"
            >
              Similar
            </button>
            <TrackChannelButton video={video} />
          </div>
          
          {/* Channel Description */}
          {video.channelDescription && (
            <div className="mb-3 p-3 bg-slate-900/50 rounded border border-slate-700">
              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{video.channelDescription}</p>
            </div>
          )}
          
          {/* Channel Statistics */}
          <div className="mt-auto pt-3 border-t border-slate-700">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-slate-900/50 p-2 rounded">
                <div className="text-xs text-slate-400 mb-1">👥 Subscribers</div>
                <div className="text-sm font-bold text-white">{formatCount(video.subscriberCount || 0)}</div>
              </div>
              <div className="bg-slate-900/50 p-2 rounded">
                <div className="text-xs text-slate-400 mb-1">📹 Videos</div>
                <div className="text-sm font-bold text-white">{formatCount(video.videoCount || 0)}</div>
              </div>
              <div className="bg-slate-900/50 p-2 rounded">
                <div className="text-xs text-slate-400 mb-1">👁️ Total Views</div>
                <div className="text-sm font-bold text-cyan-400">{formatCount(video.channelViewCount || 0)}</div>
              </div>
              <div className="bg-slate-900/50 p-2 rounded">
                <div className="text-xs text-slate-400 mb-1">⏱️ Avg Length</div>
                <div className="text-sm font-bold text-white">{video.avgVideoLength ? formatDuration(video.avgVideoLength) : '—'}</div>
              </div>
              {video.country && (
                <div className="bg-slate-900/50 p-2 rounded col-span-2">
                  <div className="text-xs text-slate-400 mb-1">🌍 Country</div>
                  <div className="text-sm font-bold text-white flex items-center gap-1">
                    <span>{getCountryFlag(video.country)}</span>
                    <span>{getCountryName(video.country)}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Last Updated */}
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/30 px-3 py-2 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>
                <span className="text-slate-500">Last updated:</span> 
                <span className="text-slate-300 font-medium ml-1">
                  {video.lastUpdatedAt ? timeAgo(video.lastUpdatedAt) : (video.uploadDate ? timeAgo(video.uploadDate) : '—')}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Video mode card
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
        {/* Viral Badge */}
        {viralMetrics.trendingBadge && (
          <div className="absolute top-2 left-14">
            <ViralBadge metrics={viralMetrics} size="sm" />
          </div>
        )}
        {/* Bookmark button */}
        <BookmarkButtonOverlay video={video} />
      </a>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-md font-semibold text-white mb-2 leading-tight h-12 overflow-hidden" title={video.title}>
          {video.title}
        </h3>
        
        {/* Category Badge */}
        {video.category && (
          <div className="mb-2">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getCategoryColor(video.category)} text-white`}>
              <span>{getCategoryIcon(video.category)}</span>
              <span>{getCategoryName(video.category)}</span>
            </span>
          </div>
        )}
        
        {/* Hashtags */}
        {video.tags && video.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {video.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index} 
                className="text-xs px-2 py-0.5 rounded bg-slate-700 text-cyan-400 hover:bg-slate-600 cursor-pointer transition"
                title={tag}
              >
                #{tag.length > 15 ? tag.substring(0, 15) + '...' : tag}
              </span>
            ))}
            {video.tags.length > 3 && (
              <span className="text-xs px-2 py-0.5 text-slate-400" title={video.tags.slice(3).join(', ')}>
                +{video.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Viral Metrics */}
        {viralMetrics.trendingBadge && (
          <div className="mb-3 p-3 bg-slate-900/50 rounded border border-slate-700">
            <TrendVelocity metrics={viralMetrics} compact={true} />
          </div>
        )}

        <div className="flex items-center mt-2 mb-3">
            <img 
                src={video.creatorAvatar || 'https://via.placeholder.com/40'} 
                alt={video.creatorName} 
                className="w-8 h-8 rounded-full mr-3"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/40';
                }}
            />
            <div>
                <p className="text-sm font-medium text-slate-300">{video.creatorName}</p>
                <p className="text-xs text-slate-400">{formatCount(video.subscriberCount || 0)} subscribers</p>
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
            <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                <span>{timeAgo(video.uploadDate)}</span>
            </div>
            {video.country && (
              <div className="flex items-center gap-1.5">
                <span className="text-base leading-none">{getCountryFlag(video.country)}</span>
                <span>{getCountryName(video.country)}</span>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
