import React, { useState, useEffect } from 'react';
import { Video } from '../types/video';

interface CreatorDashboardPageProps {
  videos: Video[];
  onKeywordSearch: (keyword: string) => void;
  onBack: () => void;
}

interface NicheAnalysis {
  score: {
    overall: number;
    breakdown: {
      competition: number;
      monetization: number;
      trends: number;
      audience: number;
      opportunities: number;
    };
    rating: string;
  };
  monetization: {
    estimatedMonthlyRevenue: { min: number; max: number };
    cpm: number;
    category: string;
  };
  competition: {
    level: string;
    competitorCount: number;
    difficulty: string;
  };
  contentGaps: Array<{
    keyword: string;
    opportunityScore: number;
    difficulty: string;
    estimatedViews: number;
  }>;
}

interface Opportunity {
  niche: string;
  score: number;
  competition: string;
  monetization: string;
  keywords: string[];
  reasons: string[];
  category: string;
}

const CreatorDashboardPage: React.FC<CreatorDashboardPageProps> = ({ 
  videos, 
  onKeywordSearch, 
  onBack 
}) => {
  const [activeTab, setActiveTab] = useState<'monetization' | 'competition' | 'trending' | 'gaps'>('monetization');
  const [nicheAnalysis, setNicheAnalysis] = useState<NicheAnalysis | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (videos.length > 0) {
      analyzeNiche();
      fetchOpportunities();
    }
  }, [videos]);

  const analyzeNiche = async () => {
    setLoading(true);
    try {
      const keywords = extractKeywords(videos);
      const response = await fetch('/api/niche/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, videos })
      });
      
      const data = await response.json();
      if (data.success) {
        setNicheAnalysis(data.data);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      // Fallback with mock data
      setNicheAnalysis(createMockAnalysis());
    } finally {
      setLoading(false);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const response = await fetch('/api/niche/trending-opportunities?minScore=70');
      const data = await response.json();
      if (data.success) {
        setOpportunities(data.data.opportunities);
      }
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
      setOpportunities(createMockOpportunities());
    }
  };

  const extractKeywords = (videos: Video[]): string[] => {
    const keywords = new Set<string>();
    videos.forEach(video => {
      const words = (video.title || '').toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(' ')
        .filter(word => word.length > 3);
      words.forEach(word => keywords.add(word));
    });
    return Array.from(keywords).slice(0, 10);
  };

  const createMockAnalysis = (): NicheAnalysis => ({
    score: {
      overall: Math.floor(Math.random() * 30) + 70,
      breakdown: {
        competition: Math.floor(Math.random() * 40) + 60,
        monetization: Math.floor(Math.random() * 30) + 70,
        trends: Math.floor(Math.random() * 25) + 75,
        audience: Math.floor(Math.random() * 20) + 80,
        opportunities: Math.floor(Math.random() * 35) + 65
      },
      rating: 'Good'
    },
    monetization: {
      estimatedMonthlyRevenue: { min: 800, max: 2500 },
      cpm: 8,
      category: 'technology'
    },
    competition: {
      level: 'medium',
      competitorCount: Math.floor(Math.random() * 500) + 200,
      difficulty: 'medium'
    },
    contentGaps: [
      { keyword: 'beginner tutorial', opportunityScore: 85, difficulty: 'easy', estimatedViews: 50000 },
      { keyword: 'advanced tips', opportunityScore: 78, difficulty: 'medium', estimatedViews: 35000 },
      { keyword: 'complete guide', opportunityScore: 82, difficulty: 'easy', estimatedViews: 45000 }
    ]
  });

  const createMockOpportunities = (): Opportunity[] => [
    {
      niche: 'AI Automation Tools',
      score: 92,
      competition: 'low',
      monetization: 'very high',
      keywords: ['ai automation', 'workflow ai', 'business automation'],
      reasons: ['Explosive AI growth', 'High-paying audience', 'Multiple revenue streams'],
      category: 'technology'
    },
    {
      niche: 'Sustainable Fashion',
      score: 84,
      competition: 'medium',
      monetization: 'high',
      keywords: ['sustainable fashion', 'eco clothing', 'ethical brands'],
      reasons: ['Growing environmental consciousness', 'Brand partnerships', 'Engaged audience'],
      category: 'lifestyle'
    },
    {
      niche: 'Web3 for Beginners',
      score: 89,
      competition: 'medium',
      monetization: 'very high',
      keywords: ['web3 basics', 'blockchain tutorial', 'nft explained'],
      reasons: ['High-value audience', 'Affiliate opportunities', 'Course potential'],
      category: 'finance'
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400 bg-green-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'high': return 'text-red-400 bg-red-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getMonetizationColor = (level: string) => {
    switch (level) {
      case 'very high': return 'text-green-400 bg-green-400/10';
      case 'high': return 'text-blue-400 bg-blue-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  if (videos.length === 0) {
    return (
      <div className="bg-slate-900 text-white min-h-screen font-sans">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-4">
            <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition">
              ← Back to Videos
            </button>
          </div>
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold mb-2">Creator Dashboard</h2>
            <p className="text-slate-400">Load videos first to analyze niche opportunities</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen font-sans">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition mb-4">
            ← Back to Videos
          </button>
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6">
            <h1 className="text-3xl font-bold mb-2">🎯 Creator Dashboard</h1>
            <p className="text-green-100">Analyzing {videos.length} videos for niche opportunities</p>
          </div>
        </div>

        {/* Score Overview */}
        {nicheAnalysis && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(nicheAnalysis.score.overall)}`}>
                  {nicheAnalysis.score.overall}
                </div>
                <div className="text-sm text-slate-400">Overall Score</div>
                <div className="text-xs text-slate-500">{nicheAnalysis.score.rating}</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-400">{nicheAnalysis.score.breakdown.competition}</div>
                <div className="text-sm text-slate-400">Competition</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-400">{nicheAnalysis.score.breakdown.monetization}</div>
                <div className="text-sm text-slate-400">Monetization</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-400">{nicheAnalysis.score.breakdown.trends}</div>
                <div className="text-sm text-slate-400">Trends</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-pink-400">{nicheAnalysis.score.breakdown.audience}</div>
                <div className="text-sm text-slate-400">Audience</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">
                  ${nicheAnalysis.monetization.estimatedMonthlyRevenue.min}-{nicheAnalysis.monetization.estimatedMonthlyRevenue.max}
                </div>
                <div className="text-sm text-slate-400">Est. Revenue/mo</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'monetization', label: '💰 Top Earning Niches', icon: '💰' },
            { id: 'competition', label: '🎯 Low Competition', icon: '🎯' },
            { id: 'trending', label: '📈 Trending Now', icon: '📈' },
            { id: 'gaps', label: '🔍 Content Gaps', icon: '🔍' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <span className="ml-3 text-slate-400">Analyzing opportunities...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Monetization Tab */}
            {activeTab === 'monetization' && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold mb-4">💰 High-Earning Niches</h3>
                <div className="grid gap-4">
                  {opportunities
                    .filter(opp => ['high', 'very high'].includes(opp.monetization))
                    .slice(0, 6)
                    .map((opp, index) => (
                      <div 
                        key={index}
                        className="bg-slate-700/50 p-4 rounded-lg hover:bg-slate-700/70 transition cursor-pointer"
                        onClick={() => onKeywordSearch(opp.keywords[0])}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-white mb-1">{opp.niche}</h4>
                            <div className="flex gap-2 mb-2">
                              <span className={`text-xs px-2 py-1 rounded ${getMonetizationColor(opp.monetization)}`}>
                                {opp.monetization} earning
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${getCompetitionColor(opp.competition)}`}>
                                {opp.competition} competition
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xl font-bold ${getScoreColor(opp.score)}`}>{opp.score}</div>
                            <div className="text-xs text-slate-400">score</div>
                          </div>
                        </div>
                        <div className="text-sm text-slate-300 mb-2">
                          <strong>Keywords:</strong> {opp.keywords.join(', ')}
                        </div>
                        <div className="text-sm text-slate-400">
                          <strong>Why profitable:</strong> {opp.reasons.join(' • ')}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Competition Tab */}
            {activeTab === 'competition' && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold mb-4">🎯 Low Competition Opportunities</h3>
                <div className="grid gap-4">
                  {opportunities
                    .filter(opp => opp.competition === 'low')
                    .slice(0, 6)
                    .map((opp, index) => (
                      <div 
                        key={index}
                        className="bg-slate-700/50 p-4 rounded-lg hover:bg-slate-700/70 transition cursor-pointer"
                        onClick={() => onKeywordSearch(opp.keywords[0])}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-white mb-1">{opp.niche}</h4>
                            <span className="text-xs px-2 py-1 rounded bg-green-400/10 text-green-400">
                              Easy Entry
                            </span>
                          </div>
                          <div className={`text-xl font-bold ${getScoreColor(opp.score)}`}>{opp.score}</div>
                        </div>
                        <div className="text-sm text-slate-400">
                          {opp.reasons.join(' • ')}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Trending Tab */}
            {activeTab === 'trending' && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold mb-4">📈 Trending Niches</h3>
                <div className="grid gap-4">
                  {opportunities
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 8)
                    .map((opp, index) => (
                      <div 
                        key={index}
                        className="bg-slate-700/50 p-4 rounded-lg hover:bg-slate-700/70 transition cursor-pointer"
                        onClick={() => onKeywordSearch(opp.keywords[0])}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-white">{opp.niche}</h4>
                            <div className="text-sm text-slate-400">
                              {opp.category} • {opp.keywords.slice(0, 2).join(', ')}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2 py-1 rounded ${getMonetizationColor(opp.monetization)}`}>
                              {opp.monetization}
                            </span>
                            <div className={`text-xl font-bold ${getScoreColor(opp.score)}`}>{opp.score}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Content Gaps Tab */}
            {activeTab === 'gaps' && nicheAnalysis && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold mb-4">🔍 Content Gap Opportunities</h3>
                <div className="grid gap-4">
                  {nicheAnalysis.contentGaps.map((gap, index) => (
                    <div 
                      key={index}
                      className="bg-slate-700/50 p-4 rounded-lg hover:bg-slate-700/70 transition cursor-pointer"
                      onClick={() => onKeywordSearch(gap.keyword)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-white">{gap.keyword}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            gap.difficulty === 'easy' ? 'bg-green-400/10 text-green-400' :
                            gap.difficulty === 'medium' ? 'bg-yellow-400/10 text-yellow-400' :
                            'bg-red-400/10 text-red-400'
                          }`}>
                            {gap.difficulty}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getScoreColor(gap.opportunityScore)}`}>
                            {gap.opportunityScore}
                          </div>
                          <div className="text-xs text-slate-400">opportunity</div>
                        </div>
                      </div>
                      <div className="text-sm text-slate-400">
                        Est. views: {gap.estimatedViews.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Action Guide */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mt-6">
          <h3 className="text-lg font-bold mb-4">🚀 Quick Action Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-2">1️⃣</div>
              <div className="font-semibold mb-1">Find High Scores</div>
              <div className="text-sm text-slate-400">Look for 80+ overall scores</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">2️⃣</div>
              <div className="font-semibold mb-1">Check Competition</div>
              <div className="text-sm text-slate-400">Prioritize low competition niches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">3️⃣</div>
              <div className="font-semibold mb-1">Start Creating</div>
              <div className="text-sm text-slate-400">Click keywords to research content</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboardPage;