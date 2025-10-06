# Filter Modes Guide

## Overview

TrendHub now supports two distinct filtering modes to provide a better user experience:

### 🎬 Video Mode
Filter and discover trending videos based on video-specific metrics.

### 👤 Channel Mode
Filter and discover content creators based on channel-specific metrics.

---

## Video Mode Filters

When **Filter by Video** is selected, you can refine results using:

### 📅 Upload Date
- **All Time** - No date restriction
- **Today** - Videos uploaded today
- **Last 24 Hours** - Videos from the past day
- **Last Week** - Videos from the past 7 days
- **Last Month** - Videos from the past 30 days
- **Last 3 Months** - Videos from the past 90 days
- **Last 6 Months** - Videos from the past 180 days
- **Last Year** - Videos from the past 365 days

### 👁️ View Count
- Slider range: 0 to 20M views
- Filter videos by their popularity

### ⏱️ Video Duration
- **< 1 min** - Short clips and Shorts
- **1-5 min** - Quick content
- **5-20 min** - Standard videos
- **> 20 min** - Long-form content

### 🔥 Trending in Last 24h
- Toggle to show only videos that gained traction recently
- Great for discovering viral content

---

## Channel Mode Filters

When **Filter by Channel** is selected, you can refine results using:

### 👥 Subscriber Count
- Slider range: 0 to 10M subscribers
- Find creators at any stage of growth

### 🎥 Number of Videos
- Slider range: 0 to 10,000 videos
- Filter by channel's content volume
- Useful for finding:
  - New channels (low video count)
  - Established channels (high video count)
  - Consistent creators

### 📆 Channel Age
- **All Time** - No age restriction
- **Last 6 Months** - Very new channels
- **Last Year** - Recent channels
- **Last 2 Years** - Growing channels
- **Last 5 Years** - Established channels
- **Last 10 Years** - Veteran channels

### 💰 Monetization Status
- **All Channels** - No monetization filter
- **Monetized Only** - Channels with monetization enabled
- **Not Monetized** - Channels without monetization

### 💵 Monetized Since
Filter by how long a channel has been monetized:
- **All Time** - No restriction
- **Last 6 Months** - Recently monetized
- **Last Year** - Monetized within a year
- **Last 2 Years** - Established monetization
- **Last 5 Years** - Long-term monetized
- **Last 10 Years** - Veteran monetized channels

---

## Common Filters

These filters work in both modes:

### 🔍 Search
- Search by keywords or hashtags
- Works across titles, descriptions, and tags

### 🌐 Platform
- **All Platforms** - Show all content
- **YouTube** - YouTube only
- **TikTok** - TikTok only

### 🔢 Sort By
- **Trending** - Algorithm-based trending score
- **Most Views** - Highest view count first
- **Newest** - Most recently uploaded
- **Most Subscribers** - *(Channel mode only)* Largest channels first

---

## Filter Presets

Quick access to common filter combinations:

### 🔥 Viral Videos
- Mode: Video
- Duration: < 1 min
- Views: 1M+
- Trending in last 24h: ✓
- Perfect for: Finding viral shorts and clips

### 🌱 New Creators
- Mode: Channel
- Subscribers: 0-100K
- Channel Age: Last year
- Perfect for: Discovering up-and-coming talent

### ⭐ Established Channels
- Mode: Channel
- Subscribers: 1M+
- Channel Age: Last 5 years
- Monetization: Yes
- Perfect for: Finding successful, monetized creators

### 📚 Deep Dives
- Mode: Video
- Duration: > 20 min
- Sort: Most Views
- Perfect for: Long-form, in-depth content

---

## Usage Tips

### For Content Discovery
1. Use **Video Mode** when looking for specific types of content
2. Use **Channel Mode** when looking for creators to follow

### For Market Research
1. **Channel Mode** helps identify:
   - Market gaps (new creators with high engagement)
   - Successful monetization strategies
   - Content volume patterns
   
2. **Video Mode** helps identify:
   - Trending topics and formats
   - Optimal video lengths
   - Viral content patterns

### For Collaboration
1. Use **Channel Mode** with:
   - Subscriber filters (find channels in your range)
   - Monetization filters (find professional creators)
   - Video count (find active creators)

### Mobile Experience
- Tap the **Filters** button to open the filter panel
- Switch between Video/Channel modes with the tabs
- Apply filters to see results
- Yellow indicator shows pending changes

### Desktop Experience
- Filters are always visible
- Real-time filter adjustments
- Apply button activates when changes are made
- Use presets for quick filtering

---

## Best Practices

1. **Start Broad, Then Narrow**
   - Begin with platform and mode selection
   - Add specific filters gradually
   - Use presets as starting points

2. **Combine Filters Strategically**
   - Video Mode: Duration + Upload Date = Recent shorts
   - Channel Mode: Age + Monetization = Successful new creators

3. **Use Search Wisely**
   - Search persists across mode changes
   - Combine search with filters for precise results
   - Use hashtags for topic-specific searches

4. **Monitor Trending**
   - Enable "Trending in last 24h" for viral content
   - Check "Newest" sort for fresh uploads
   - Use "Trending" sort for algorithm picks

---

## Technical Notes

### Channel Mode Behavior
- Shows one representative video per channel
- Typically shows the channel's most viewed video
- All filters apply to channel-level metrics

### Data Refresh
- Filters use intelligent caching
- Apply button triggers new data fetch
- Real-time data from YouTube API (when configured)
- Falls back to mock data if API unavailable

### Performance
- Client-side filtering for instant feedback
- Server-side filtering for precise results
- Cached responses for faster load times

---

## Future Enhancements

Planned features:
- Custom date range picker
- Save custom filter presets
- Export filtered results
- Advanced search operators
- Multi-channel comparison
- Trending score visualization

---

## Troubleshooting

**Filters not applying?**
- Click the "Apply Filters" button
- Check for yellow indicator (pending changes)

**No results found?**
- Try broader filters
- Check platform selection
- Verify search keywords
- Use "Reset Filters" to start fresh

**Channel mode showing same videos?**
- This is expected - one video per channel
- Switch to Video mode for more results

**Mobile filters not working?**
- Ensure you tap "Apply" in the filter sheet
- Filters persist until applied

---

For more help, check the main README.md or open an issue on GitHub.