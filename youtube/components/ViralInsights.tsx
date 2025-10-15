import React, { useMemo, useState } from 'react';
import { Video } from '../lib/types';
import { analyzeTrends, formatGrowthRate } from '../utils/viralityAnalytics';
import { analyzeHashtags, analyzeTitlePatterns, identifyContentGaps } from '../utils/hashtagAnalytics';
import HashtagCloud from './HashtagCloud';
import { formatCount } from '../utils/formatters';

interface ViralInsightsProps {
  videos: Video[];
  onHashtagClick?: (hashtag: string) => void;
}

const ViralInsights: React.FC<ViralInsightsProps> = ({ videos, onHashtagClick }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hashtags' | 'patterns' | 'gaps'>('overview');

  // Calculate analytics
  const trendAnalysis = useMemo(() => analyzeTrends(videos), [videos]);
  const hashtagAnalysis = useMemo(() => analyzeHashtags(videos), [videos]);
  const titlePatterns = useMemo(() => analyzeTitlePatterns(videos), [videos]);
  
  // Sample keywords for content gap analysis
  const contentGaps = useMemo(() => {
    const keywords = ['tutorial', 'review', 'unboxing', 'vlog', 'challenge', 'how to', 'tips', 'guide'];
    return identifyContentGaps(videos, keywords);
  }, [videos]);

  if (videos.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 text-center text-slate-400">
        <p>Load videos to see viral insights</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🔥</span>
          <span>Viral Insights Dashboard</span>
        </h2>
        <p className="text-purple-100 text-sm mt-1">
          Analyze trends, hashtags, and opportunities
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 bg-slate-900">
        {[
          { id: 'overview', label: 'Overview', emoji: '📊' },
          { id: 'hashtags', label: 'Hashtags', emoji: '#️⃣' },
          { id: 'patterns', label: 'Title Patterns', emoji: '📝' },
          { id: 'gaps', label: 'Content Gaps', emoji: '🎯' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="mr-2">{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <div className="text-slate-400 text-xs mb-1">Total Videos</div>
                <div className="text-2xl font-bold text-white">{trendAnalysis.totalVideos}</div>
              </div>
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <div className="text-slate-400 text-xs mb-1">Avg Virality</div>
                <div className="text-2xl font-bold text-cyan-400">{trendAnalysis.avgViralityScore}/100</div>
              </div>
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <div className="text-slate-400 text-xs mb-1">🔥 Viral</div>
                <div className="text-2xl font-bold text-orange-400">{trendAnalysis.viralCount}</div>
              </div>
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <div className="text-slate-400 text-xs mb-1">🚀 Trending Fast</div>
                <div className="text-2xl font-bold text-yellow-400">{trendAnalysis.trendingFastCount}</div>
              </div>
            </div>

            {/* Growth Rate */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-2">Average Growth Rate</h3>
              <div className="text-3xl font-bold text-green-400">
                {formatGrowthRate(trendAnalysis.avgGrowthRate)}
              </div>
              <p className="text-xs text-slate-400 mt-1">Views per hour across all videos</p>
            </div>

            {/* Top Performers */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span>🏆</span>
                <span>Top Performers (by virality)</span>
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {trendAnalysis.topPerformers.slice(0, 5).map((video, index) => (
                  <div key={video.id} className="flex items-start gap-3 p-2 bg-slate-800 rounded hover:bg-slate-750">
                    <div className="text-lg font-bold text-slate-600 min-w-[24px]">#{index + 1}</div>
                    <img src={video.thumbnail} alt="" className="w-16 h-10 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{video.title}</p>
                      <p className="text-xs text-slate-400">{formatCount(video.viewCount)} views</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Unique Hashtags */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-2">Hashtag Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-slate-400 text-xs">Unique Hashtags</div>
                  <div className="text-2xl font-bold text-purple-400">{hashtagAnalysis.totalUniqueHashtags}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Avg per Video</div>
                  <div className="text-2xl font-bold text-pink-400">{hashtagAnalysis.avgHashtagsPerVideo.toFixed(1)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hashtags Tab */}
        {activeTab === 'hashtags' && (
          <div className="space-y-6">
            {/* Trending Hashtags */}
            {hashtagAnalysis.trendingHashtags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <span>🔥</span>
                  <span>Trending Hashtags</span>
                </h3>
                <HashtagCloud
                  hashtags={hashtagAnalysis.trendingHashtags}
                  onHashtagClick={onHashtagClick}
                  showTrendingOnly={true}
                />
              </div>
            )}

            {/* All Top Hashtags */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span>📌</span>
                <span>Top Hashtags</span>
              </h3>
              <HashtagCloud
                hashtags={hashtagAnalysis.topHashtags}
                onHashtagClick={onHashtagClick}
                maxDisplay={30}
              />
            </div>

            {/* Hashtag Performance Table */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-3">Hashtag Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="text-left pb-2">Hashtag</th>
                      <th className="text-right pb-2">Count</th>
                      <th className="text-right pb-2">Avg Views</th>
                      <th className="text-center pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    {hashtagAnalysis.topHashtags.slice(0, 10).map((hashtag, index) => (
                      <tr key={index} className="border-b border-slate-800">
                        <td className="py-2 text-cyan-400 font-medium">#{hashtag.tag}</td>
                        <td className="text-right">{hashtag.count}</td>
                        <td className="text-right">{formatCount(hashtag.avgViews)}</td>
                        <td className="text-center">
                          {hashtag.trending && <span className="text-orange-400">🔥</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Title Patterns Tab */}
        {activeTab === 'patterns' && (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">
              Common title patterns found in viral videos. Use these insights to craft compelling titles.
            </p>
            
            {titlePatterns.length > 0 ? (
              <div className="space-y-3">
                {titlePatterns.map((pattern, index) => (
                  <div key={index} className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{pattern.pattern}</h4>
                        <p className="text-xs text-slate-400 mt-1 italic">"{pattern.example}"</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-cyan-400 font-bold">{pattern.count}</div>
                        <div className="text-xs text-slate-400">videos</div>
                      </div>
                    </div>
                    <div className="text-sm text-green-400">
                      Avg: {formatCount(pattern.avgViews)} views
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">
                No title patterns detected
              </div>
            )}
          </div>
        )}

        {/* Content Gaps Tab */}
        {activeTab === 'gaps' && (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">
              Content opportunities with lower competition. Higher opportunity score = better chance to stand out.
            </p>
            
            <div className="space-y-3">
              {contentGaps.filter(gap => gap.searchVolume > 0).map((gap, index) => (
                <div key={index} className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-semibold capitalize">{gap.topic}</h4>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-slate-400">Opportunity</div>
                      <div className={`text-lg font-bold ${
                        gap.opportunity >= 70 ? 'text-green-400' :
                        gap.opportunity >= 50 ? 'text-yellow-400' :
                        'text-orange-400'
                      }`}>
                        {gap.opportunity}/100
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-slate-400">Search Volume</div>
                      <div className="text-cyan-400 font-medium">{gap.searchVolume} videos</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Avg Competition</div>
                      <div className="text-purple-400 font-medium">{formatCount(gap.competition)} views</div>
                    </div>
                  </div>

                  {/* Opportunity Bar */}
                  <div className="mt-3 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        gap.opportunity >= 70 ? 'bg-green-500' :
                        gap.opportunity >= 50 ? 'bg-yellow-500' :
                        'bg-orange-500'
                      }`}
                      style={{ width: `${gap.opportunity}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViralInsights;
