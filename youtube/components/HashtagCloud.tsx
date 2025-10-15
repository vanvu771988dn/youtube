import React from 'react';
import { HashtagStats } from '../utils/hashtagAnalytics';
import { formatCount } from '../utils/formatters';

interface HashtagCloudProps {
  hashtags: HashtagStats[];
  onHashtagClick?: (hashtag: string) => void;
  maxDisplay?: number;
  showTrendingOnly?: boolean;
}

const HashtagCloud: React.FC<HashtagCloudProps> = ({
  hashtags,
  onHashtagClick,
  maxDisplay = 20,
  showTrendingOnly = false,
}) => {
  const displayHashtags = showTrendingOnly
    ? hashtags.filter(h => h.trending).slice(0, maxDisplay)
    : hashtags.slice(0, maxDisplay);

  if (displayHashtags.length === 0) {
    return (
      <div className="text-center text-slate-400 text-sm py-4">
        No hashtags found
      </div>
    );
  }

  // Calculate size based on count (min 12px, max 24px)
  const getSize = (count: number, maxCount: number) => {
    const ratio = count / maxCount;
    return 12 + ratio * 12; // 12px to 24px
  };

  const maxCount = Math.max(...displayHashtags.map(h => h.count));

  return (
    <div className="flex flex-wrap gap-2">
      {displayHashtags.map((hashtag, index) => {
        const fontSize = getSize(hashtag.count, maxCount);
        const isTrending = hashtag.trending;

        return (
          <button
            key={index}
            type="button"
            onClick={() => onHashtagClick?.(hashtag.tag)}
            className={`
              px-3 py-1.5 rounded-full transition-all duration-200
              ${isTrending 
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white animate-pulse' 
                : 'bg-slate-700 text-cyan-400 hover:bg-slate-600'
              }
              hover:scale-110 hover:shadow-lg
            `}
            style={{ fontSize: `${fontSize}px` }}
            title={`${hashtag.count} videos • ${formatCount(hashtag.avgViews)} avg views`}
          >
            <span className="font-semibold">#{hashtag.tag}</span>
            {isTrending && <span className="ml-1">🔥</span>}
            <span className="ml-1 text-xs opacity-75">({hashtag.count})</span>
          </button>
        );
      })}
    </div>
  );
};

export default HashtagCloud;
