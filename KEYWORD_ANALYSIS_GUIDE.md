# YouTube Trending Keywords Analysis Guide

This guide will help you identify hot trending YouTube keywords from the past month.

## Quick Start

### Option 1: Using Python Script (Recommended)

1. **Set your YouTube API Key** (if not already set):
   ```powershell
   $env:YOUTUBE_API_KEY = "YOUR_API_KEY_HERE"
   ```

2. **Install required Python packages**:
   ```powershell
   pip install requests
   ```

3. **Run the analyzer**:
   ```powershell
   python analyze_keywords.py
   ```

   If you don't have the API key in your environment, the script will prompt you to enter it.

### Option 2: Using the Web Interface

Run the existing YouTube frontend application which already has trend analysis capabilities:

```powershell
cd youtube
npm run dev
```

## What the Analyzer Does

The script will:
1. ✅ Fetch current trending videos from YouTube
2. ✅ Search for popular videos from the past 30 days
3. ✅ Extract keywords from video titles, descriptions, and tags
4. ✅ Analyze and rank keywords by frequency
5. ✅ Generate a comprehensive report

## Output

The analyzer provides:

### 1. Console Output
- **Top 30 Trending Keywords**: Most frequently used words in titles and descriptions
- **Top 30 Trending Tags**: Most popular video tags
- **Top Categories**: Distribution of trending content by category

### 2. JSON Report
A file named `youtube_trending_keywords_report.json` is created with:
- Top 50 keywords with counts
- Top 50 tags with counts
- Top 10 categories with percentages
- Analysis timestamp

## Example Output

```
============================================================
YouTube Trending Keywords Analyzer
============================================================

Fetching trending videos from the past month...

1. Fetching current trending videos...
   ✓ Fetched 50 trending videos
2. Fetching recent popular videos from past 30 days...
   ✓ Fetched page 1: 50 videos
   ✓ Fetched page 2: 50 videos
   ✓ Fetched page 3: 50 videos

Total videos collected: 200

Analyzing keywords...

============================================================
ANALYSIS RESULTS
============================================================

📊 TOP 30 TRENDING KEYWORDS (from titles & descriptions):
------------------------------------------------------------
 1. game                - 145 occurrences
 2. tutorial            - 132 occurrences
 3. review              - 128 occurrences
 4. best                - 121 occurrences
 5. tips                - 115 occurrences
 ... (and more)

🏷️  TOP 30 TRENDING TAGS:
------------------------------------------------------------
 1. gaming                          -  87 occurrences
 2. tutorial                        -  76 occurrences
 3. howto                           -  65 occurrences
 ... (and more)

📂 TOP CATEGORIES:
------------------------------------------------------------
 1. Gaming                  -  85 videos ( 42.5%)
 2. Entertainment           -  45 videos ( 22.5%)
 3. Music                   -  30 videos ( 15.0%)
 ... (and more)

✅ Detailed report saved to: youtube_trending_keywords_report.json
```

## Customization

You can modify the script to:

### Change Region
Edit line 18 in `analyze_keywords.py`:
```python
REGION_CODE = 'US'  # Change to 'GB', 'CA', 'IN', etc.
```

### Adjust Time Period
Edit lines 72-73 in `analyze_keywords.py`:
```python
one_month_ago = datetime.utcnow() - timedelta(days=30)  # Change days
```

### Fetch More Videos
Edit line 19 in `analyze_keywords.py`:
```python
MAX_RESULTS = 50  # Increase up to 50 per request
```

And line 222:
```python
pages_to_fetch = 3  # Increase to fetch more pages
```

### Add Custom Stop Words
Add words to exclude from analysis in lines 23-34:
```python
STOP_WORDS = set([
    'the', 'a', 'an', 'and', 'or', 'but',
    # Add your custom words here
])
```

## API Quota Management

The YouTube API has daily quotas:
- **Free tier**: 10,000 units/day
- **search.list**: ~100 units per request
- **videos.list**: ~1 unit per request

This script uses approximately:
- 1 trending videos request (~1 unit)
- 3 search requests (~300 units)
- 4 video details requests (~4 units)
- **Total**: ~305 units per run

You can run this script about **30 times per day** with a free API key.

## Troubleshooting

### Error: "No videos fetched"
- Check that your API key is valid
- Ensure the YouTube Data API v3 is enabled in Google Cloud Console
- Check if you've exceeded your daily quota

### Error: "Module not found: requests"
```powershell
pip install requests
```

### Error: "Invalid API key"
- Verify your API key in Google Cloud Console
- Make sure the YouTube Data API v3 is enabled
- Check for any IP restrictions on your API key

### Rate Limiting
If you hit rate limits:
- Wait a few minutes before retrying
- Reduce `pages_to_fetch` value
- Use cached data from previous runs

## Next Steps

After identifying hot keywords:
1. **Content Creation**: Create videos targeting these keywords
2. **SEO Optimization**: Use keywords in your video titles and descriptions
3. **Trend Analysis**: Compare results over time to identify rising trends
4. **Competitive Analysis**: See what content is performing well
5. **Marketing Strategy**: Target ads using these keywords

## Additional Resources

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [Google Trends](https://trends.google.com/trends/) - Complement this analysis
- [VidIQ](https://vidiq.com/) - Additional keyword research tools
- [TubeBuddy](https://www.tubebuddy.com/) - Video SEO optimization
