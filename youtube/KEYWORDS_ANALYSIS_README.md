# 🔍 Trending Keywords Analysis Feature

## Overview

The **Trending Keywords Analysis** feature is a powerful tool built into your YouTube Trending application that helps you discover hot trending keywords, tags, and content categories on YouTube. This feature analyzes real YouTube data to identify what's trending right now.

## 🚀 Quick Start

### 1. Access the Feature

1. Start your application:
   ```bash
   npm run dev
   ```

2. In the main dashboard, click the **"🔍 Trending Keywords"** button in the top-right corner

### 2. Configure Your Analysis

Before analyzing, set your filters:

- **Date Range**: Choose the time period to analyze
  - Last 24 Hours
  - Last 7 Days
  - Last 30 Days (recommended)
  - Last 90 Days
  - Last 6 Months
  - Last Year
  - Custom Range (specify start and end dates)

- **Category**: Select a specific YouTube category or analyze all categories
  - All Categories (default)
  - Gaming, Music, Entertainment, Education, etc.

- **Region**: Choose the geographic region
  - United States, United Kingdom, Canada, Australia, India, Japan, etc.

- **Sample Size**: Number of videos to analyze
  - 50 videos (fast)
  - 100 videos (recommended)
  - 150 videos
  - 200 videos (most comprehensive)

### 3. Run the Analysis

Click the **"🚀 Analyze Keywords"** button to start the analysis. The process typically takes 10-30 seconds depending on your sample size.

## 📊 Understanding the Results

### Summary Statistics

Four key metrics are displayed at the top:
- **Videos Analyzed**: Total number of videos processed
- **Unique Keywords**: Number of distinct keywords found
- **Unique Tags**: Number of unique video tags
- **Categories**: Number of different content categories

### Top Trending Keywords

A list of the **top 30 keywords** found in video titles and descriptions, ranked by frequency. Each keyword shows:
- Rank position
- The keyword itself
- Number of occurrences

**Use these keywords to:**
- Optimize your video titles
- Create content around trending topics
- Understand what viewers are searching for

### Top Trending Tags

The **top 50 most popular video tags** displayed as interactive badges. These show:
- The tag name
- Number of times it appears

**Use these tags to:**
- Tag your own videos effectively
- Discover niche topics
- Follow trending hashtags

### Top Categories

A visual breakdown showing:
- Category name
- Number of videos in that category
- Percentage of total analyzed videos
- Progress bar visualization

**Use this to:**
- Identify which content types are trending
- Find underserved niches
- Plan your content strategy

## 💾 Exporting Results

### JSON Export
Download a complete JSON file containing all analysis data for further processing or storage.

**Use cases:**
- Import into analytics tools
- Track trends over time
- Share with team members

### CSV Export
Download a CSV file with keyword rankings for easy viewing in Excel or Google Sheets.

**Use cases:**
- Create reports
- Perform additional analysis
- Integration with other tools

## 🎯 Best Practices

### 1. Regular Analysis
- Run analysis weekly to stay updated on trends
- Compare results over time to identify emerging trends

### 2. Optimal Settings
- Use **30-day date range** for balanced results
- **100-150 videos** provides good accuracy without quota concerns
- Analyze **specific categories** for niche content ideas

### 3. Combining Insights
- Cross-reference with the main **Viral Insights** feature
- Look for keywords appearing in both title keywords and tags
- Focus on keywords with high counts (10+ occurrences)

## 🔧 Technical Details

### API Usage
- **Trending videos request**: ~1 API unit
- **Search requests**: ~100 units per page
- **Video details**: ~1 unit per request

**Example for 100 videos:**
- Total usage: ~300-400 API units
- Daily limit: 10,000 units
- You can run ~25-30 analyses per day

### Data Sources
The analysis fetches data from:
1. YouTube's **Most Popular** videos (trending now)
2. Recent videos with high view counts (based on date range)
3. Video metadata including titles, tags, and categories

### Privacy
- All analysis is done client-side in your browser
- No data is sent to external servers (except YouTube API)
- Your API key remains secure

## 🛠️ Troubleshooting

### Error: "YouTube API key not configured"
**Solution**: Ensure `VITE_YOUTUBE_API_KEY` is set in your `.env.local` file

### Error: "No videos found"
**Solutions:**
- Try a broader date range
- Select "All Categories" instead of a specific category
- Check your internet connection
- Verify your API key is valid

### Error: "Quota exceeded"
**Solutions:**
- Wait 24 hours for quota to reset
- Reduce sample size
- Use analysis results from earlier in the day

### Slow Analysis
**Solutions:**
- Reduce sample size to 50-100 videos
- Use shorter date ranges (7d instead of 90d)
- Check your internet speed

## 📈 Advanced Usage

### Trend Comparison
1. Run analysis weekly
2. Export results as JSON each time
3. Compare keywords week-over-week
4. Identify rising and falling trends

### Niche Research
1. Select a specific category (e.g., "Gaming")
2. Use 30-day date range
3. Look for keywords with 5-15 occurrences
4. These represent emerging niches

### Content Planning
1. Run analysis monthly
2. Create content around top 10 keywords
3. Use top tags in your videos
4. Focus on categories with high percentages

### Competitive Analysis
1. Note your competitors' categories
2. Analyze those specific categories
3. Find keywords they might be missing
4. Create differentiated content

## 🎬 Example Workflow

**Goal**: Find trending gaming keywords for YouTube videos

1. **Set Filters**:
   - Date Range: Last 30 Days
   - Category: Gaming
   - Region: United States
   - Sample Size: 150 videos

2. **Run Analysis**: Click "Analyze Keywords"

3. **Review Results**:
   - Check top 10 keywords
   - Note tags with 20+ occurrences
   - See which gaming sub-categories are trending

4. **Take Action**:
   - Create video targeting top keyword
   - Use top 10 tags in your video
   - Schedule content for popular sub-categories

5. **Export & Track**:
   - Download JSON for records
   - Compare with next month's analysis

## 🔗 Integration with Main App

The Keywords Analysis feature works seamlessly with your main trending videos dashboard:

- **From Keywords → Videos**: After finding a trending keyword, go back to the main dashboard and search for it
- **From Videos → Keywords**: Use trending videos to identify keywords, then verify with this tool
- **Viral Insights**: Compare keyword analysis with the "Viral Insights" feature for comprehensive understanding

## 🚀 Future Enhancements

Potential improvements (feel free to implement):
- Historical trend tracking over time
- Keyword competition score
- Suggested video titles based on keywords
- Automatic keyword monitoring with alerts
- Multi-region comparison
- Sentiment analysis of keywords
- Related keyword suggestions

## 📚 Resources

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [YouTube Search Algorithm Guide](https://support.google.com/youtube/answer/9002)
- [Video SEO Best Practices](https://creatoracademy.youtube.com/page/course/seo)

## 💡 Tips for Content Creators

1. **Title Optimization**: Use top keywords in your first 60 characters
2. **Tag Strategy**: Include 10-15 tags from the top trending tags
3. **Category Selection**: Upload to categories with high trend percentages
4. **Timing**: Create content on keywords trending for 7-30 days (not too new, not too old)
5. **Uniqueness**: Combine multiple trending keywords for unique angles

## 🤝 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your `.env.local` file has the correct API key
3. Ensure YouTube Data API v3 is enabled in Google Cloud Console
4. Check your API quota usage in Google Cloud Console

---

**Happy Keyword Hunting! 🎯**

Remember: Trends change quickly. Regular analysis keeps you ahead of the curve!
