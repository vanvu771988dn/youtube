const express = require('express');
const path = require('path');
const apiReddit = require('./server/reddit');

const isProd = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;

async function createServer() {
  const app = express();

  // Mount API routes
  app.use('/api/reddit', apiReddit);

  // Instruct user to run frontend separately in dev
  app.get('/', (req, res) => {
    res.send('Backend API running. Start the frontend (Vite) separately.');
  });

  app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
  });
}

createServer();
