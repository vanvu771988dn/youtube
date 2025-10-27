const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mock data for opportunities
const mockOpportunities = [
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
  },
  {
    niche: 'Mental Health for Entrepreneurs',
    score: 81,
    competition: 'low',
    monetization: 'medium',
    keywords: ['entrepreneur burnout', 'startup stress', 'founder wellness'],
    reasons: ['Underserved market', 'High engagement', 'Growing awareness'],
    category: 'health'
  },
  {
    niche: 'No-Code App Development',
    score: 87,
    competition: 'medium',
    monetization: 'high',
    keywords: ['no code apps', 'bubble tutorial', 'app development'],
    reasons: ['Democratizing tech', 'Tool affiliate programs', 'Course potential'],
    category: 'technology'
  }
];

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    server: 'Creator Dashboard Backend',
    timestamp: new Date().toISOString()
  });
});

// Niche analysis endpoint
app.post('/api/niche/analyze', (req, res) => {
  const { keywords = [], videos = [] } = req.body;

  // Generate mock analysis based on input
  const analysis = {
    niche: {
      name: keywords.length > 0 ? `${keywords[0]} niche` : 'Video niche',
      keywords: keywords.slice(0, 5)
    },
    score: {
      overall: Math.floor(Math.random() * 30) + 70, // 70-100
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
      estimatedMonthlyRevenue: {
        min: Math.floor(Math.random() * 1000) + 500,
        max: Math.floor(Math.random() * 2000) + 2000
      },
      cpm: Math.floor(Math.random() * 10) + 5,
      category: 'general'
    },
    competition: {
      level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      competitorCount: Math.floor(Math.random() * 1000) + 100,
      difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)]
    },
    contentGaps: [
      {
        keyword: `${keywords[0] || 'tutorial'} for beginners`,
        opportunityScore: Math.floor(Math.random() * 20) + 80,
        difficulty: 'easy',
        estimatedViews: Math.floor(Math.random() * 50000) + 30000
      },
      {
        keyword: `advanced ${keywords[0] || 'tips'}`,
        opportunityScore: Math.floor(Math.random() * 15) + 75,
        difficulty: 'medium',
        estimatedViews: Math.floor(Math.random() * 40000) + 25000
      },
      {
        keyword: `complete ${keywords[0] || 'guide'} 2024`,
        opportunityScore: Math.floor(Math.random() * 25) + 70,
        difficulty: 'easy',
        estimatedViews: Math.floor(Math.random() * 60000) + 35000
      }
    ]
  };

  res.json({
    success: true,
    data: analysis
  });
});

// Trending opportunities endpoint
app.get('/api/niche/trending-opportunities', (req, res) => {
  const { category = 'all', minScore = 70 } = req.query;
  
  let filtered = mockOpportunities.filter(opp => 
    opp.score >= parseInt(minScore)
  );
  
  if (category !== 'all') {
    filtered = filtered.filter(opp => opp.category === category);
  }
  
  res.json({
    success: true,
    data: {
      opportunities: filtered,
      total: filtered.length,
      lastUpdated: new Date().toISOString()
    }
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    error: 'Server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'POST /api/niche/analyze',
      'GET /api/niche/trending-opportunities'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🎯 Creator Dashboard Backend running on port ${PORT}`);
  console.log(`📊 Niche Analysis: http://localhost:${PORT}/api/niche/analyze`);
  console.log(`🔥 Trending Opportunities: http://localhost:${PORT}/api/niche/trending-opportunities`);
  console.log(`💡 Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;