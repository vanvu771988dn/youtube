// Updated section of lib/api.ts to handle new filter structure
// Add this to the existing _mockBackend function

const _mockBackend = (filters: ApiFilterParams): ApiResponse => {
  let results = [...allMockVideos];
  
  // Platform filter
  if (filters.platform !== 'all') {
    results = results.filter(v => v.platform === filters.platform);
  }

  // Mode-specific filters
  if (filters.mode === 'video') {
    // Video filters
    const vf = filters.videoFilters;
    
    // Upload date filter
    if (vf.uploadDate !== 'all') {
      let startDate: Date | null = null;
      switch (vf.uploadDate) {
        case 'today':
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
        case '24h':
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3m':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '6m':
          startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      if (startDate) {
        results = results.filter(v => new Date(v.uploadDate) >= startDate!);
      }
    }

    // View count filter
    if (vf.viewCount.min > 0 || vf.viewCount.max < Infinity) {
      results = results.filter(v => 
        v.viewCount >= vf.viewCount.min && v.viewCount <= vf.viewCount.max
      );
    }

    // Duration filter
    if (vf.duration.length > 0) {
      results = results.filter(video => {
        return vf.duration.some(durationBracket => {
          switch (durationBracket) {
            case 60: return video.duration < 60;
            case 300: return video.duration >= 60 && video.duration < 300;
            case 1200: return video.duration >= 300 && video.duration < 1200;
            case Infinity: return video.duration >= 1200;
            default: return false;
          }
        });
      });
    }

    // Trending 24h filter
    if (vf.trending24h) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      results = results.filter(v => new Date(v.uploadDate) >= oneDayAgo);
    }
  } else {
    // Channel filters
    const cf = filters.channelFilters;
    
    // Subscriber count filter
    if (cf.subscriberCount.min > 0 || cf.subscriberCount.max < Infinity) {
      results = results.filter(v => 
        v.subscriberCount >= cf.subscriberCount.min && 
        v.subscriberCount <= cf.subscriberCount.max
      );
    }

    // Video count filter (mock - in reality this would query channel data)
    if (cf.videoCount.min > 0 || cf.videoCount.max < Infinity) {
      results = results.filter(v => {
        const mockVideoCount = v.videoCount || Math.floor(Math.random() * 1000);
        return mockVideoCount >= cf.videoCount.min && mockVideoCount <= cf.videoCount.max;
      });
    }

    // Channel age filter
    if (cf.channelAge !== 'all') {
      const now = new Date();
      let maxAge: number;
      switch (cf.channelAge) {
        case '6m': maxAge = 0.5; break;
        case '1y': maxAge = 1; break;
        case '2y': maxAge = 2; break;
        case '5y': maxAge = 5; break;
        case '10y': maxAge = 10; break;
        default: maxAge = Infinity;
      }
      results = results.filter(v => (v.channelAge || 0) <= maxAge);
    }

    // Monetization filter
    if (cf.monetizationEnabled !== 'all') {
      const isMonetized = cf.monetizationEnabled === 'yes';
      results = results.filter(v => {
        // Mock monetization status (in reality from API)
        const mockMonetized = v.monetizationEnabled ?? (v.subscriberCount > 1000);
        return mockMonetized === isMonetized;
      });
    }

    // Monetization age filter
    if (cf.monetizationAge !== 'all') {
      let maxAge: number;
      switch (cf.monetizationAge) {
        case '6m': maxAge = 0.5; break;
        case '1y': maxAge = 1; break;
        case '2y': maxAge = 2; break;
        case '5y': maxAge = 5; break;
        case '10y': maxAge = 10; break;
        default: maxAge = Infinity;
      }
      results = results.filter(v => {
        // Mock - time since monetization started
        const monetizationYears = (v.channelAge || 0) * 0.7; // Assume monetized 70% through channel life
        return monetizationYears <= maxAge;
      });
    }

    // For channel mode, group by channel and show representative video
    const channelMap = new Map<string, Video>();
    results.forEach(video => {
      const channelId = video.channelId || video.creatorName;
      if (!channelMap.has(channelId) || 
          (channelMap.get(channelId)!.viewCount < video.viewCount)) {
        channelMap.set(channelId, video);
      }
    });
    results = Array.from(channelMap.values());
  }

  // Sorting
  results.sort((a, b) => {
    switch (filters.sortBy) {
      case 'date': 
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      case 'views': 
        return b.viewCount - a.viewCount;
      case 'subscribers':
        return b.subscriberCount - a.subscriberCount;
      case 'trending': 
      default: 
        return calculateVelocity(b.viewCount, b.uploadDate) - calculateVelocity(a.viewCount, a.uploadDate);
    }
  });

  // Pagination
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