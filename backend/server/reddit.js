const express = require('express');
const axios = require('axios');
const router = express.Router();

// Example: /api/reddit?path=/r/videos/hot.json&limit=50
router.get('/', async (req, res) => {
  try {
    const { path = '/r/videos/hot.json', ...params } = req.query;
    const redditUrl = `https://www.reddit.com${path}`;
    const response = await axios.get(redditUrl, { params });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from Reddit' });
  }
});

module.exports = router;
