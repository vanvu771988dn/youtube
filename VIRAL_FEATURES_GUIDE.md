# 🔥 Viral Content Features Guide

## Overview
TrendHub now includes powerful viral analytics features to help content creators identify trending content, analyze hashtags, discover title patterns, and find content opportunities.

## New Features

### 1. 🚀 Viral Badges & Indicators
Videos are automatically analyzed and tagged with viral status badges:

- **🔥 Viral** - Extremely high virality score (80+) with rapid view growth (10K+/hr)
- **🚀 Trending Fast** - High virality (65+) with strong growth (5K+/hr)
- **📈 Rising** - Good virality (50+) with steady growth
- **📊 Steady** - Moderate virality (30+)

**Location**: Displayed on video thumbnails and in video cards

**How it works**: 
- Calculates virality score (0-100) based on:
  - Views per hour (growth rate)
  - Engagement rate (likes + comments / views)
  - Recency boost (newer videos get higher scores)

### 2. 📊 Growth Velocity Indicators
Real-time view growth tracking with visual indicators:

- **💥 Explosive** - 50K+ views/hour
- **🚀 Rapid** - 20K+ views/hour  
- **⚡ Fast** - 10K+ views/hour
- **📈 Growing** - 5K+ views/hour
- **➡️ Moderate** - 1K+ views/hour
- **📊 Steady** - <1K views/hour

**Location**: Video cards show compact velocity indicators

### 3. 🔥 Viral Insights Dashboard
Comprehensive analytics panel with 4 tabs:

#### 📊 Overview Tab
- Total videos analyzed
- Average virality score
- Count of viral & trending videos
- Average growth rate across all videos
- Top 5 performers by virality
- Hashtag statistics

#### #️⃣ Hashtags Tab
- **Trending Hashtags** - Active hashtags with high view counts and recent uploads
- **Top Hashtags** - Most frequently used hashtags with size-based visualization
- **Hashtag Performance Table** - Detailed stats (count, avg views, status)
- **Click-to-Filter** - Click any hashtag to search for related content

#### 📝 Title Patterns Tab
Identifies common patterns in viral video titles:
- "How I/to..."
- "X Things/Ways/Tips"
- "Why I/You..."
- "[Brackets] or (Parens)"
- "Ultimate Guide"
- Time-based titles
- Multiple punctuation (!!!, ???)
- "VS/Comparison"
- "I Tried/Tested"
- "DIY"

Shows:
- Pattern name
- Example title
- Video count using pattern
- Average views for pattern

#### 🎯 Content Gaps Tab
Identifies low-competition opportunities:
- **Opportunity Score** (0-100) - Higher = better chance to stand out
- **Search Volume** - Number of videos on the topic
- **Average Competition** - Avg views of competing videos
- Visual progress bars showing opportunity level

Pre-analyzed keywords:
- tutorial, review, unboxing, vlog, challenge, how to, tips, guide

**Color coding**:
- 🟢 Green (70+) - High opportunity
- 🟡 Yellow (50-69) - Medium opportunity  
- 🟠 Orange (<50) - Lower opportunity

### 4. Enhanced Video Cards
Video cards now display:
- Viral badge on thumbnail (top-left)
- Compact velocity indicator with growth rate
- Enhanced hashtag display

## How to Use

### Accessing Viral Insights
1. Load videos using filters or search
2. Click the **"🔥 Show Viral Insights"** button (top-right)
3. Explore the 4 tabs: Overview, Hashtags, Patterns, Gaps

### Finding Viral Content
1. Look for videos with 🔥 (Viral) or 🚀 (Trending Fast) badges
2. Sort by views or use the Overview tab's "Top Performers" list
3. Check growth velocity - videos with "Explosive" or "Rapid" indicators

### Hashtag Strategy
1. Go to Viral Insights → Hashtags tab
2. Click on trending hashtags (marked with 🔥) to filter videos
3. Use the Performance Table to see which hashtags get the most views
4. Copy successful hashtags for your content

### Title Optimization
1. Go to Viral Insights → Title Patterns tab
2. Review patterns with high video counts and avg views
3. Use these patterns as templates for your titles
4. Adapt the pattern to your niche

### Finding Opportunities
1. Go to Viral Insights → Content Gaps tab
2. Look for topics with high opportunity scores (70+)
3. Focus on green-highlighted topics = best opportunities
4. Create content in these less-saturated niches

## Technical Details

### Viral Metrics Calculation

**Virality Score Formula**:
```
Score = ViewScore + EngagementScore + RecencyBoost
- ViewScore (0-50): log₁₀(viewsPerHour + 1) × 10
- EngagementScore (0-30): engagementRate × 3
- RecencyBoost (0-20): Decays over 120 hours
Total: 0-100
```

**Engagement Rate**:
```
EngagementRate = (likes + comments) / views × 100
```

**Growth Rate**:
```
GrowthRate = totalViews / hoursSinceUpload
```

### Files Added
- `utils/viralityAnalytics.ts` - Viral metrics calculation
- `utils/hashtagAnalytics.ts` - Hashtag extraction and analysis
- `components/ViralBadge.tsx` - Viral status badges
- `components/TrendVelocity.tsx` - Growth velocity indicators
- `components/HashtagCloud.tsx` - Interactive hashtag cloud
- `components/ViralInsights.tsx` - Main analytics dashboard
- Updates to `VideoCard.tsx` - Added viral features
- Updates to `App.tsx` - Integrated insights panel

### Data Types
Extended `Video` interface with:
```typescript
viralityScore?: number;
growthRate?: number;
engagementRate?: number;
trendingBadge?: 'viral' | 'trending-fast' | 'rising' | 'steady' | null;
viralityTier?: 'mega' | 'high' | 'medium' | 'low';
```

## Best Practices

### For Content Creators
1. **Monitor trending hashtags daily** - Trending topics change quickly
2. **Use title patterns with high avg views** - Proven formulas work
3. **Target content gaps** - Less competition = better visibility
4. **Track velocity over time** - Catch trends early
5. **Analyze top performers** - Learn from what's working

### For Researchers
1. **Export data from Overview tab** - Save top performers
2. **Track hashtag trends over time** - Note seasonal patterns
3. **Compare title patterns across niches** - Find universal patterns
4. **Monitor opportunity scores** - Identify emerging markets

### Performance Tips
- Viral metrics are calculated client-side (no API overhead)
- Calculations use memoization for efficiency
- Works with any number of videos (scales well)
- Insights update automatically when videos change

## Future Enhancements
Potential additions (not yet implemented):
- Historical trend tracking
- Cross-platform comparison (YouTube vs TikTok)
- Sound/music trend tracking
- Thumbnail pattern analysis
- Export insights to CSV/PDF
- Save custom content gap keywords
- Real-time notifications for trending topics
- AI-powered title suggestions

## Troubleshooting

**Insights panel shows "Load videos to see insights"**
- Solution: Apply filters or search to load videos first

**No viral badges showing**
- Videos may not meet virality thresholds (score < 30)
- Try filtering for recent videos (last 24-48 hours)

**Hashtags tab empty**
- Videos may not have tags/hashtags
- Try different platforms (YouTube has more tags)

**Content gaps show 0 opportunity**
- No videos match the analyzed keywords
- This indicates completely untapped niches (extreme opportunity!)

## Credits
Viral analytics system designed to help content creators identify trends and opportunities based on real-time video performance data.

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Feature Status**: ✅ Production Ready
