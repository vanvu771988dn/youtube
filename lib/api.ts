import { ApiFilterParams, ApiResponse, Video } from './types';

// --- MOCK BACKEND ---
// This section simulates a backend API to avoid making real network requests in this environment.
// It generates a consistent set of data and then filters/paginates it like a real API would.

const allMockVideos: Video[] = Array.from({ length: 200 }, (_, i) => {
  const isYouTube = Math.random() > 0.4;
  const views = Math.floor(Math.random() * 20000000) + 1000;
  // Upload date from now up to 1.5 years ago
  const uploadDate = new Date(Date.now() - Math.random() * 1.5 * 365 * 24 * 60 * 60 * 1000); 

  return {
    id: `${isYouTube ? 'yt' : 'tk'}_${i}`,
    platform: isYouTube ? 'youtube' : 'tiktok',
    title: `Trending ${isYouTube ? 'Video' : 'Clip'} #${i + 1}: A Viral Moment`,
    thumbnail: `https://picsum.photos/400/225?random=${i}`,
    url: '#',
    creatorName: `Creator ${i + 1}`,
    subscriberCount: Math.floor(Math.random() * 10000000),
    viewCount: views,
    likeCount: Math.floor(views * (Math.random() * 0.08 + 0.02)), // 2-10%
    duration: Math.floor(Math.random() * 2400) + 15, // 15s to 40m
    uploadDate: uploadDate.toISOString(),
    channelAge: isYouTube ? Math.floor(Math.random() * 10) + 1 : undefined,
    tags: ['viral', 'trending', isYouTube ? 'youtube' : 'tiktok'],
    commentCount: Math.floor(views * (Math.random() * 0.01 + 0.001)),
  };
});

const calculateVelocity = (video: Video): number => {
    const hoursSinceUpload = (Date.now() - new Date(video.uploadDate).getTime()) / (1000 * 60 * 60);
    if (hoursSinceUpload < 0.1) return video.viewCount * 10;
    return video.viewCount / hoursSinceUpload;
};

const mockApi = (filters: ApiFilterParams): ApiResponse => {
  let results = [...allMockVideos];

  // --- APPLY FILTERS ---
  if (filters.platform !== 'all') {
    results = results.filter(v => v.platform === filters.platform);
  }

  if (filters.uploadDate !== 'all') {
    const now = new Date();
    const cutoff = new Date();
    switch (filters.uploadDate) {
        case 'today': cutoff.setHours(0, 0, 0, 0); break;
        case '24h': cutoff.setDate(now.getDate() - 1); break;
        case '7d': cutoff.setDate(now.getDate() - 7); break;
        case '30d': cutoff.setDate(now.getDate() - 30); break;
        case '3m': cutoff.setMonth(now.getMonth() - 3); break;
        case '1y': cutoff.setFullYear(now.getFullYear() - 1); break;
        case 'custom': 
          if(filters.customDate.start) {
            const startDate = new Date(filters.customDate.start);
            results = results.filter(v => new Date(v.uploadDate) >= startDate);
          }
          if(filters.customDate.end) {
            const endDate = new Date(filters.customDate.end);
            endDate.setHours(23, 59, 59, 999); // Include the whole end day
            results = results.filter(v => new Date(v.uploadDate) <= endDate);
          }
          break;
    }
     if (filters.uploadDate !== 'custom') {
        results = results.filter(v => new Date(v.uploadDate) >= cutoff);
     }
  }

  if (filters.keywords) {
    const lowerCaseKeywords = filters.keywords.toLowerCase().split(' ').filter(Boolean);
    results = results.filter(v => {
        const searchableText = `${v.title.toLowerCase()} ${v.tags.join(' ')}`;
        return lowerCaseKeywords.every(k => searchableText.includes(k));
    });
  }

  results = results.filter(v => v.viewCount >= filters.viewCount.min && v.viewCount <= filters.viewCount.max);
  results = results.filter(v => v.subscriberCount >= filters.subscriberCount.min && v.subscriberCount <= filters.subscriberCount.max);

  if (filters.channelAge !== 'all') {
    results = results.filter(v => v.channelAge !== undefined && v.channelAge <= filters.channelAge);
  }

  if (filters.duration.length > 0) {
      results = results.filter(v => {
          return filters.duration.some(d => {
              if (d === 60) return v.duration < 60;
              if (d === 300) return v.duration >= 60 && v.duration <= 300;
              if (d === 1200) return v.duration > 300 && v.duration <= 1200;
              if (d === Infinity) return v.duration > 1200;
              return false;
          });
      });
  }
  
  if (filters.trending24h) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      results = results.filter(v => new Date(v.uploadDate) >= twentyFourHoursAgo);
  }

  // --- SORTING ---
  results.sort((a, b) => {
    switch (filters.sortBy) {
        case 'date': return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        case 'views': return b.viewCount - a.viewCount;
        case 'trending':
        default: return calculateVelocity(b) - calculateVelocity(a);
    }
  });

  // --- PAGINATION ---
  const total = results.length;
  const { page, limit } = filters;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedData = results.slice(startIndex, endIndex);
  const hasMore = endIndex < total;

  return {
    success: true,
    data: paginatedData,
    meta: { total, page, limit, hasMore, fetchedAt: new Date().toISOString(), cacheHit: false }
  };
};

// --- API CLIENT ---
export const fetchTrends = (filters: Partial<ApiFilterParams>): Promise<ApiResponse> => {
  const fullFilters: ApiFilterParams = {
    platform: 'all', uploadDate: 'all', customDate: { start: null, end: null },
    viewCount: { min: 0, max: 20000000 }, subscriberCount: { min: 0, max: 10000000 },
    keywords: '', channelAge: 'all', duration: [], trending24h: false, sortBy: 'trending',
    page: 1, limit: 20,
    ...filters,
  };

  console.log('Fetching with filters:', fullFilters);
  
  return new Promise((resolve) => {
    setTimeout(() => { resolve(mockApi(fullFilters)); }, 500);
  });
};
