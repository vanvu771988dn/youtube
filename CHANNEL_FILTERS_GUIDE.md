# Channel Filters Guide

## Overview

The Channel Filters tab allows you to discover and filter YouTube channels based on their characteristics, rather than individual videos. This is perfect for finding:

- 🎯 **Emerging creators** - New channels with high growth potential
- 📊 **Established channels** - Large channels with consistent content
- 💰 **Monetized channels** - Channels earning revenue
- 📹 **Prolific creators** - Channels with lots of content

---

## How to Use

### Accessing Channel Filters

1. Open the **FilterBar** in your app
2. Look for the **mode toggle tabs** below the common filters
3. Click the **"👤 Channel Filters"** button

You'll see the interface switch from video-specific filters to channel-specific filters.

---

## Channel Filter Options

### 1. **Subscriber Count** 📊

**Range Slider**: 0 - 50,000,000 subscribers

- **What it does**: Filter channels by their subscriber base
- **Step size**: 10,000 subscribers
- **Common ranges**:
  - **0 - 1K**: Brand new channels
  - **1K - 10K**: Nano influencers
  - **10K - 100K**: Micro influencers
  - **100K - 1M**: Mid-tier creators
  - **1M - 10M**: Macro influencers
  - **10M+**: Mega channels

**Example Use Cases**:
```typescript
// Find micro-influencers
subscriberCount: { min: 10_000, max: 100_000 }

// Find established channels
subscriberCount: { min: 100_000, max: 10_000_000 }
```

---

### 2. **Number of Videos** 📹

**Range Slider**: 0 - 1,000,000 videos

- **What it does**: Filter by total videos uploaded
- **Step size**: 10 videos
- **Insights**:
  - **< 50**: New or infrequent creators
  - **50 - 200**: Regular uploaders
  - **200 - 1000**: Very active channels
  - **1000+**: Archives or daily uploaders

**Example Use Cases**:
```typescript
// Find new creators with some content
videoCount: { min: 10, max: 50 }

// Find prolific creators
videoCount: { min: 200, max: 1_000_000 }
```

---

### 3. **Channel Age** 🗓️

**Dropdown**: Select minimum age

- **Options**:
  - All (no restriction)
  - 6+ months
  - 1+ years
  - 2+ years
  - 5+ years
  - 10+ years

- **What it does**: Filter channels by how long they've existed
- **Use for**:
  - Finding established channels (5+ years)
  - Discovering new creators (6 months)
  - Avoiding abandoned channels (combine with upload date)

**Example**:
```typescript
// Find channels active for at least 2 years
channelAge: '2y'
```

---

### 4. **Monetization Status** 💰

**Dropdown**: Filter by monetization

- **Options**:
  - All Channels (default)
  - Monetized Only
  - Non-Monetized Only

- **What it does**: Show only channels that have (or haven't) enabled monetization
- **Note**: This data may not always be available

**Why use this**:
- **Monetized Only**: Professional creators, higher quality
- **Non-Monetized**: Hobbyists, passion projects, new creators

---

### 5. **Monetization Age** ⏱️

**Dropdown**: How long they've been monetized

- **Options**:
  - Any (no restriction)
  - 6+ months monetized
  - 1+ years monetized
  - 2+ years monetized
  - 5+ years monetized
  - 10+ years monetized

- **What it does**: Filter by time since monetization started
- **Use for**: Finding creators with sustained revenue streams

---

### 6. **Avg. Video Length** ⏲️

**Range Slider**: 0 - 7200 seconds (0 - 2 hours)

- **What it does**: Filter by average video duration across all uploads
- **Step size**: 60 seconds (1 minute)
- **Content types**:
  - **< 5 min**: Shorts, quick tips, reactions
  - **5-15 min**: Standard YouTube format
  - **15-30 min**: In-depth content, vlogs
  - **30+ min**: Long-form, podcasts, streams

**Example Use Cases**:
```typescript
// Find shorts creators
avgVideoLength: { min: 0, max: 300 } // 0-5 minutes

// Find podcast/long-form creators
avgVideoLength: { min: 1800, max: 7200 } // 30min-2hr
```

---

### 7. **Channel Created** 📅

**Date Range Picker**: From - To

- **What it does**: Filter channels by creation date
- **Format**: Date inputs (YYYY-MM-DD)
- **Use for**:
  - Finding channels created in a specific period
  - Discovering new channels (created in last 6 months)
  - Comparing channel growth over time

**Example Use Cases**:
```typescript
// Channels created in 2023
createdDate: { start: '2023-01-01', end: '2023-12-31' }

// Channels created in last 3 months
createdDate: { start: '2024-10-01', end: null }
```

---

## Complete Example Scenarios

### 🎯 Scenario 1: Find Rising Gaming Channels

**Goal**: Discover small but growing gaming channels

**Filters**:
```typescript
{
  mode: 'channel',
  platform: 'youtube',
  category: '20', // Gaming
  channelFilters: {
    subscriberCount: { min: 1_000, max: 50_000 },
    videoCount: { min: 20, max: 200 },
    channelAge: '1y', // At least 1 year old
    avgVideoLength: { min: 600, max: 1800 }, // 10-30 min videos
  }
}
```

---

### 📚 Scenario 2: Find Educational Long-Form Creators

**Goal**: Discover established education channels with deep content

**Filters**:
```typescript
{
  mode: 'channel',
  platform: 'youtube',
  category: '27', // Education
  channelFilters: {
    subscriberCount: { min: 10_000, max: 1_000_000 },
    videoCount: { min: 50, max: 1_000_000 },
    channelAge: '2y',
    avgVideoLength: { min: 900, max: 3600 }, // 15-60 min
    monetizationEnabled: 'yes',
  }
}
```

---

### 🎬 Scenario 3: Find New Content Creators

**Goal**: Discover brand new channels with potential

**Filters**:
```typescript
{
  mode: 'channel',
  platform: 'youtube',
  channelFilters: {
    subscriberCount: { min: 100, max: 10_000 },
    videoCount: { min: 5, max: 50 },
    channelAge: '6m', // Max 6 months old
    createdDate: {
      start: '2024-06-01', // Created after June 2024
      end: null
    }
  }
}
```

---

### 💰 Scenario 4: Find Established Monetized Channels

**Goal**: Discover professional creators with revenue

**Filters**:
```typescript
{
  mode: 'channel',
  platform: 'youtube',
  channelFilters: {
    subscriberCount: { min: 100_000, max: 50_000_000 },
    videoCount: { min: 100, max: 1_000_000 },
    channelAge: '5y', // At least 5 years old
    monetizationEnabled: 'yes',
    monetizationAge: '2y', // Monetized for 2+ years
  }
}
```

---

### 🎥 Scenario 5: Find Shorts-Focused Channels

**Goal**: Discover channels focused on short-form content

**Filters**:
```typescript
{
  mode: 'channel',
  platform: 'youtube',
  channelFilters: {
    subscriberCount: { min: 1_000, max: 1_000_000 },
    videoCount: { min: 30, max: 1_000_000 },
    avgVideoLength: { min: 0, max: 180 }, // Average < 3 min
  }
}
```

---

## How Channel Filtering Works

### Backend Process

1. **Fetch Videos**: System fetches videos from YouTube API
2. **Group by Channel**: Videos are grouped by `channelId` or `creatorName`
3. **Calculate Metrics**: For each channel:
   - Count total videos in result set
   - Calculate average video length
   - Identify latest upload (`lastUpdatedAt`)
   - Aggregate view counts
4. **Apply Channel Filters**: Results are filtered by:
   - Subscriber count
   - Video count
   - Channel age
   - Avg video length
   - Creation date
   - Monetization status
5. **Return Channels**: One result per channel (best video as representative)

### Representative Video

When in channel mode, each result shows:
- The **most viewed video** from that channel
- Channel **metadata** (subscribers, total videos, etc.)
- Aggregated **statistics** (avg length, last updated)

---

## Tips & Best Practices

### 🔍 Discovery Tips

1. **Start Broad**: Begin with wide ranges, then narrow down
2. **Combine Filters**: Use multiple filters for precise targeting
3. **Check Last Updated**: Combine with upload date to find active channels
4. **Use Presets**: Try built-in presets like "micro-influencers"

### ⚡ Performance Tips

1. **More Filters = More Pages**: Channel filters require fetching more videos
2. **Be Patient**: Aggregation takes longer than video mode
3. **Use Smart Ranges**: Avoid extreme min/max values
4. **Check Console Logs**: Monitor "efficiency" percentage

### 🎯 Search Strategies

**For Emerging Creators**:
- Low subscribers (< 50K)
- Recent creation date (< 2 years)
- Active posting (> 20 videos)
- Consistent length (narrow avg length range)

**For Established Creators**:
- High subscribers (> 100K)
- Old channel age (> 5 years)
- Monetized for years
- Lots of content (> 200 videos)

**For Niche Content**:
- Specific category
- Narrow avg length range
- Moderate subscriber count
- Recent activity

---

## Common Issues

### Issue 1: No Results

**Symptoms**: Filter returns empty results

**Solutions**:
- **Widen ranges**: Increase min/max values
- **Remove some filters**: Too many restrictions
- **Check category**: Some categories have few channels
- **Verify dates**: Ensure date ranges are valid

### Issue 2: Slow Loading

**Symptoms**: Takes long to load results

**Expected**: Channel mode requires more API calls

**Solutions**:
- **Use fewer filters**: Reduces pages needed
- **Check console**: Monitor API call count
- **Increase page size**: System auto-adjusts
- **Be patient**: Aggregation takes time

### Issue 3: Duplicate Channels

**Symptoms**: Same channel appears multiple times

**Root Cause**: De-duplication issue

**Solutions**:
- This should NOT happen (report if it does)
- System uses `channelId` for grouping
- Check console for "De-duplication" logs

---

## API Reference

### FilterState (Channel Mode)

```typescript
{
  mode: 'channel',
  channelFilters: {
    subscriberCount: { min: 0, max: 50_000_000 },
    videoCount: { min: 0, max: 1_000_000 },
    channelAge: 'all' | '6m' | '1y' | '2y' | '5y' | '10y',
    monetizationEnabled: 'all' | 'yes' | 'no',
    monetizationAge: 'all' | '6m' | '1y' | '2y' | '5y' | '10y',
    avgVideoLength: { min: 0, max: 7200 },
    createdDate?: { start: string | null, end: string | null }
  }
}
```

### Video Object (Channel Mode)

When mode is 'channel', each video includes:

```typescript
{
  // Standard video fields
  id: string,
  title: string,
  viewCount: number,
  // ... other fields
  
  // Channel-specific (aggregated)
  avgVideoLength: number,      // Average across all videos
  lastUpdatedAt: string,        // Latest upload date
  videoCount: number,           // Total videos uploaded
  channelViewCount: number,     // Total channel views
  channelCreatedAt: string,     // Channel creation date
}
```

---

## Future Enhancements

Potential additions:

- [ ] **Upload frequency**: Videos per month
- [ ] **Growth rate**: Subscriber growth
- [ ] **Engagement rate**: Likes/comments per view
- [ ] **Revenue estimate**: Based on views
- [ ] **Content categories**: Multiple category tags
- [ ] **Collaboration history**: Featured channels
- [ ] **Social media links**: Other platforms

---

## See Also

- `FILTERING_GUIDE.md` - Complete filtering documentation
- `youtube/hooks/useFilters.ts` - Filter hook implementation
- `youtube/lib/aggregator.ts` - Channel aggregation logic
- `youtube/components/FilterBar.tsx` - UI component

---

**Happy channel hunting! 🎯**
