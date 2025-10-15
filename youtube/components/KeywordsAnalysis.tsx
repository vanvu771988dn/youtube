import React, { useState, useEffect } from 'react';
import { analyzeKeywords, KeywordAnalysisResult, KeywordFilters } from '../services/keywordAnalysis.service';

interface Props {
  onBack: () => void;
}

const KeywordsAnalysis: React.FC<Props> = ({ onBack }) => {
  const [filters, setFilters] = useState<KeywordFilters>({
    dateRange: '30d',
    category: 'all',
    region: 'US',
    maxResults: 100,
  });
  
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: '',
  });
  
  const [analysis, setAnalysis] = useState<KeywordAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filtersToUse = filters.dateRange === 'custom' ? {
        ...filters,
        customStartDate: customDateRange.start,
        customEndDate: customDateRange.end,
      } : filters;
      
      const result = await analyzeKeywords(filtersToUse);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze keywords');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: '1', name: 'Film & Animation' },
    { id: '2', name: 'Autos & Vehicles' },
    { id: '10', name: 'Music' },
    { id: '15', name: 'Pets & Animals' },
    { id: '17', name: 'Sports' },
    { id: '19', name: 'Travel & Events' },
    { id: '20', name: 'Gaming' },
    { id: '22', name: 'People & Blogs' },
    { id: '23', name: 'Comedy' },
    { id: '24', name: 'Entertainment' },
    { id: '25', name: 'News & Politics' },
    { id: '26', name: 'Howto & Style' },
    { id: '27', name: 'Education' },
    { id: '28', name: 'Science & Technology' },
  ];

  const regions = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'IN', name: 'India' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'BR', name: 'Brazil' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-6 px-4 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={onBack}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold">🔍 Trending Keywords Analysis</h1>
          </div>
          <p className="text-white/90">Discover hot trending keywords on YouTube</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Filters Section */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4">📊 Analysis Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                className="w-full bg-slate-700 text-white rounded px-3 py-2 focus:ring-2 focus:ring-purple-500"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="6m">Last 6 Months</option>
                <option value="1y">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {filters.dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                    className="w-full bg-slate-700 text-white rounded px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                    className="w-full bg-slate-700 text-white rounded px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </>
            )}

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full bg-slate-700 text-white rounded px-3 py-2 focus:ring-2 focus:ring-purple-500"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium mb-2">Region</label>
              <select
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                className="w-full bg-slate-700 text-white rounded px-3 py-2 focus:ring-2 focus:ring-purple-500"
              >
                {regions.map(reg => (
                  <option key={reg.code} value={reg.code}>{reg.name}</option>
                ))}
              </select>
            </div>

            {/* Max Results */}
            <div>
              <label className="block text-sm font-medium mb-2">Sample Size</label>
              <select
                value={filters.maxResults}
                onChange={(e) => setFilters({ ...filters, maxResults: parseInt(e.target.value) })}
                className="w-full bg-slate-700 text-white rounded px-3 py-2 focus:ring-2 focus:ring-purple-500"
              >
                <option value="50">50 videos</option>
                <option value="100">100 videos</option>
                <option value="150">150 videos</option>
                <option value="200">200 videos</option>
              </select>
            </div>
          </div>

          {/* Analyze Button */}
          <div className="mt-6">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Analyzing...' : '🚀 Analyze Keywords'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-200">❌ {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Analyzing trending keywords...</p>
          </div>
        )}

        {/* Results */}
        {analysis && !loading && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-4 shadow-lg">
                <div className="text-sm text-blue-200">Videos Analyzed</div>
                <div className="text-3xl font-bold">{analysis.totalVideosAnalyzed}</div>
              </div>
              <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-4 shadow-lg">
                <div className="text-sm text-green-200">Unique Keywords</div>
                <div className="text-3xl font-bold">{analysis.topKeywords.length}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-4 shadow-lg">
                <div className="text-sm text-purple-200">Unique Tags</div>
                <div className="text-3xl font-bold">{analysis.topTags.length}</div>
              </div>
              <div className="bg-gradient-to-br from-pink-600 to-pink-800 rounded-lg p-4 shadow-lg">
                <div className="text-sm text-pink-200">Categories</div>
                <div className="text-3xl font-bold">{analysis.topCategories.length}</div>
              </div>
            </div>

            {/* Top Keywords */}
            <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-4">📊 Top Trending Keywords</h2>
              <p className="text-gray-400 mb-4">Most frequently used words in titles and descriptions</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysis.topKeywords.slice(0, 30).map((kw, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-700 rounded-lg p-3 flex items-center justify-between hover:bg-slate-600 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-purple-400">#{idx + 1}</span>
                      <span className="font-medium">{kw.keyword}</span>
                    </div>
                    <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {kw.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Tags */}
            <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-4">🏷️ Top Trending Tags</h2>
              <p className="text-gray-400 mb-4">Most popular video tags</p>
              <div className="flex flex-wrap gap-2">
                {analysis.topTags.slice(0, 50).map((tag, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-pink-700 hover:to-purple-700 transition cursor-pointer"
                  >
                    {tag.tag} <span className="opacity-75">({tag.count})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-4">📂 Top Categories</h2>
              <p className="text-gray-400 mb-4">Content distribution by category</p>
              <div className="space-y-3">
                {analysis.topCategories.map((cat, idx) => (
                  <div key={idx} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{cat.categoryName}</span>
                      <span className="text-sm text-gray-400">
                        {cat.count} videos ({cat.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Options */}
            <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4">💾 Export Results</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(analysis, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `keywords-analysis-${Date.now()}.json`;
                    link.click();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                  📥 Download JSON
                </button>
                <button
                  onClick={() => {
                    const csv = [
                      'Rank,Keyword,Count',
                      ...analysis.topKeywords.map((kw, idx) => `${idx + 1},${kw.keyword},${kw.count}`)
                    ].join('\n');
                    const csvBlob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(csvBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `keywords-analysis-${Date.now()}.csv`;
                    link.click();
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                >
                  📊 Download CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KeywordsAnalysis;
