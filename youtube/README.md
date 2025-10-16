<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1u4TLuloGK21-GjX9Dmqxu40wqOn2tSnG

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your API keys:
   - Create a `.env.local` file in the project root
   - Add your YouTube Data API v3 key:
     ```
     YOUTUBE_API_KEY=your_youtube_api_key_here
     ```
   - (Optional) Add your Gemini API key for AI features:
     ```
     GEMINI_API_KEY=your_gemini_api_key_here
     ```
   
   **Note:** Without a YouTube API key, the app will use mock data for demonstration purposes.

3. Get a YouTube Data API v3 key:
   - Go to [Google Cloud Console](https://console.developers.google.com/)
   - Create a new project or select an existing one
   - Enable the YouTube Data API v3
   - Create credentials (API Key)
   - Copy the API key to your `.env.local` file

4. Run the app:
   ```bash
   npm run dev
   ```

## Run Backend API

The backend provides API endpoints (e.g., Reddit trending) for the frontend to consume.

**Prerequisites:** Node.js (same as frontend)

1. Open a terminal in the project root and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend server:
   ```bash
   node server.cjs
   ```
   The backend will run at http://localhost:3000 by default.

**Note:**
- The backend is required for Reddit API features. Start it before using the frontend if you want Reddit data.
- The frontend and backend run independently. You can run both at the same time in separate terminals.

## Features

- **Real YouTube Data**: Fetches trending videos and search results from YouTube Data API v3
- **Advanced Filtering**: Filter by platform, upload date, view count, subscriber count, duration, and more
- **Search Functionality**: Search for videos by keywords
- **Responsive Design**: Works on desktop and mobile devices
- **Caching**: Intelligent caching for better performance
- **Fallback Support**: Falls back to mock data if YouTube API is unavailable

## Documentation

- Filtering (unified): `youtube/docs/FILTERS.md`
- Keywords analysis: `youtube/KEYWORDS_ANALYSIS_README.md`
