#!/usr/bin/env python3
"""
YouTube Trending Keywords Analyzer
Fetches trending videos from the past month and identifies hot keywords
"""

import os
import json
import requests
from collections import Counter
from datetime import datetime, timedelta
import re
from urllib.parse import urlencode

# Configuration
API_KEY = os.getenv('YOUTUBE_API_KEY', '')
BASE_URL = 'https://www.googleapis.com/youtube/v3'
REGION_CODE = 'US'
MAX_RESULTS = 50
CATEGORY_ID = '0'  # All categories

# Common stop words to exclude
STOP_WORDS = set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their', 'what',
    'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
    'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just',
    'now', 'than', 'my', 'your', 'our', 'like', 'get', 'got', 'new', 'out',
    'up', 'down', 'over', 'after', 'before', 'into', 'through', 'during',
])


def get_api_key():
    """Get YouTube API key from environment or prompt user"""
    if not API_KEY:
        print("YouTube API key not found in environment variables.")
        print("Please enter your YouTube Data API v3 key:")
        return input().strip()
    return API_KEY


def fetch_trending_videos(api_key, page_token=None):
    """Fetch trending videos from YouTube"""
    url = f'{BASE_URL}/videos'
    params = {
        'part': 'snippet,statistics,contentDetails',
        'chart': 'mostPopular',
        'regionCode': REGION_CODE,
        'maxResults': MAX_RESULTS,
        'key': api_key,
    }
    
    if page_token:
        params['pageToken'] = page_token
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching trending videos: {e}")
        return None


def search_recent_videos(api_key, page_token=None):
    """Search for recent popular videos from the past month"""
    # Calculate date 30 days ago
    one_month_ago = datetime.utcnow() - timedelta(days=30)
    published_after = one_month_ago.strftime('%Y-%m-%dT%H:%M:%SZ')
    
    url = f'{BASE_URL}/search'
    params = {
        'part': 'snippet',
        'type': 'video',
        'order': 'viewCount',
        'maxResults': MAX_RESULTS,
        'publishedAfter': published_after,
        'relevanceLanguage': 'en',
        'key': api_key,
    }
    
    if page_token:
        params['pageToken'] = page_token
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Get video IDs
        video_ids = [item['id']['videoId'] for item in data.get('items', [])]
        
        if video_ids:
            # Fetch full video details
            videos_url = f'{BASE_URL}/videos'
            videos_params = {
                'part': 'snippet,statistics,contentDetails',
                'id': ','.join(video_ids),
                'key': api_key,
            }
            videos_response = requests.get(videos_url, params=videos_params)
            videos_response.raise_for_status()
            videos_data = videos_response.json()
            videos_data['nextPageToken'] = data.get('nextPageToken')
            return videos_data
        
        return data
    except requests.exceptions.RequestException as e:
        print(f"Error searching recent videos: {e}")
        return None


def extract_keywords_from_text(text, min_length=3):
    """Extract keywords from text"""
    if not text:
        return []
    
    # Convert to lowercase and remove special characters
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    
    # Split into words
    words = text.split()
    
    # Filter out stop words and short words
    keywords = [
        word for word in words 
        if len(word) >= min_length and word not in STOP_WORDS
    ]
    
    return keywords


def analyze_videos(videos):
    """Analyze videos to extract trending keywords"""
    all_keywords = []
    all_tags = []
    categories = Counter()
    
    for video in videos:
        snippet = video.get('snippet', {})
        statistics = video.get('statistics', {})
        
        # Extract keywords from title
        title_keywords = extract_keywords_from_text(snippet.get('title', ''))
        all_keywords.extend(title_keywords)
        
        # Extract keywords from description
        description_keywords = extract_keywords_from_text(snippet.get('description', ''))
        all_keywords.extend(description_keywords)
        
        # Extract tags
        tags = snippet.get('tags', [])
        if tags:
            # Normalize tags
            normalized_tags = [tag.lower() for tag in tags]
            all_tags.extend(normalized_tags)
        
        # Track category
        category_id = snippet.get('categoryId', 'Unknown')
        categories[category_id] += 1
    
    # Count keyword frequency
    keyword_counts = Counter(all_keywords)
    tag_counts = Counter(all_tags)
    
    return keyword_counts, tag_counts, categories


def get_category_name(category_id, api_key):
    """Get category name from ID"""
    url = f'{BASE_URL}/videoCategories'
    params = {
        'part': 'snippet',
        'id': category_id,
        'key': api_key,
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        if data.get('items'):
            return data['items'][0]['snippet']['title']
    except:
        pass
    
    return f'Category {category_id}'


def main():
    """Main function"""
    print("=" * 60)
    print("YouTube Trending Keywords Analyzer")
    print("=" * 60)
    print()
    
    # Get API key
    api_key = get_api_key()
    if not api_key:
        print("Error: API key is required!")
        return
    
    print(f"Fetching trending videos from the past month...")
    print()
    
    all_videos = []
    
    # Fetch trending videos
    print("1. Fetching current trending videos...")
    trending_data = fetch_trending_videos(api_key)
    if trending_data and trending_data.get('items'):
        all_videos.extend(trending_data['items'])
        print(f"   ✓ Fetched {len(trending_data['items'])} trending videos")
    
    # Fetch recent popular videos
    print("2. Fetching recent popular videos from past 30 days...")
    pages_to_fetch = 3  # Fetch multiple pages for better data
    for page in range(pages_to_fetch):
        page_token = None
        recent_data = search_recent_videos(api_key, page_token)
        if recent_data and recent_data.get('items'):
            all_videos.extend(recent_data['items'])
            print(f"   ✓ Fetched page {page + 1}: {len(recent_data['items'])} videos")
            page_token = recent_data.get('nextPageToken')
            if not page_token:
                break
    
    if not all_videos:
        print("Error: No videos fetched. Please check your API key and quota.")
        return
    
    print()
    print(f"Total videos collected: {len(all_videos)}")
    print()
    print("Analyzing keywords...")
    
    # Analyze videos
    keyword_counts, tag_counts, categories = analyze_videos(all_videos)
    
    # Generate report
    print()
    print("=" * 60)
    print("ANALYSIS RESULTS")
    print("=" * 60)
    print()
    
    # Top Keywords from Titles and Descriptions
    print("📊 TOP 30 TRENDING KEYWORDS (from titles & descriptions):")
    print("-" * 60)
    for i, (keyword, count) in enumerate(keyword_counts.most_common(30), 1):
        print(f"{i:2d}. {keyword:20s} - {count:3d} occurrences")
    
    print()
    print("=" * 60)
    
    # Top Tags
    print()
    print("🏷️  TOP 30 TRENDING TAGS:")
    print("-" * 60)
    for i, (tag, count) in enumerate(tag_counts.most_common(30), 1):
        print(f"{i:2d}. {tag:30s} - {count:3d} occurrences")
    
    print()
    print("=" * 60)
    
    # Top Categories
    print()
    print("📂 TOP CATEGORIES:")
    print("-" * 60)
    for i, (category_id, count) in enumerate(categories.most_common(10), 1):
        category_name = get_category_name(category_id, api_key)
        percentage = (count / len(all_videos)) * 100
        print(f"{i:2d}. {category_name:25s} - {count:3d} videos ({percentage:5.1f}%)")
    
    print()
    print("=" * 60)
    
    # Save results to file
    output_file = 'youtube_trending_keywords_report.json'
    results = {
        'generated_at': datetime.utcnow().isoformat(),
        'total_videos_analyzed': len(all_videos),
        'period': 'Past 30 days',
        'top_keywords': [
            {'keyword': kw, 'count': count} 
            for kw, count in keyword_counts.most_common(50)
        ],
        'top_tags': [
            {'tag': tag, 'count': count} 
            for tag, count in tag_counts.most_common(50)
        ],
        'top_categories': [
            {
                'category_id': cat_id,
                'category_name': get_category_name(cat_id, api_key),
                'count': count,
                'percentage': (count / len(all_videos)) * 100
            }
            for cat_id, count in categories.most_common(10)
        ]
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print()
    print(f"✅ Detailed report saved to: {output_file}")
    print()


if __name__ == '__main__':
    main()
