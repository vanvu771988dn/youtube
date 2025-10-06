# TrendHub Setup Guide

## Quick Fix for Current Errors

If you're seeing errors like "fetchVideos is not exported", follow these steps:

### 1. Fix the Hook Import Issue

The app uses `useTrends` hook (not `useVideos`). Check that `App.tsx` imports correctly:

```typescript
import { useTrends } from './hooks/useTrends';
```

If you have a `useVideos.ts` file, either delete it or use the fixed version provided.

### 2. Set Up Environment Variables

Create a `.env.local` file in your project root:

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit with your API keys
nano .env.local  # or use your preferred editor
```

Add your YouTube API key:
```
YOUTUBE_API_KEY=your_actual_api_key_here
```

### 3. Get a YouTube API Key

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**
4. Go to Credentials → Create Credentials → API Key
5. Copy the API key to your `.env.local` file

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the App

```bash
npm run dev
```

The app should now run at `http://localhost:3000`

## Common Issues & Solutions

### Issue: "fetchVideos is not exported"
**Solution**: The API exports `fetchTrends`, not `fetchVideos`. Use the `useTrends` hook from `hooks/useTrends.ts`.

### Issue: Tailwind CDN warning
**Solution**: This is just a warning. For production, you'd install Tailwind as a PostCSS plugin. For development, the CDN is fine.

### Issue: YouTube API quota exceeded
**Solution**: YouTube API has daily quotas. If exceeded:
- Wait 24 hours for quota reset
- The app will fall back to mock data automatically
- Request quota increase in Google Cloud Console

### Issue: No videos showing
**Solution**: 
1. Check browser console for errors
2. Verify API key is correct in `.env.local`
3. Ensure API key has YouTube Data API v3 enabled
4. Try clearing cache and refreshing

## Features

- ✅ Real YouTube Data API integration
- ✅ Advanced filtering (views, subscribers, duration, etc.)
- ✅ Search functionality
- ✅ Responsive design
- ✅ Infinite scroll
- ✅ Smart caching
- ✅ Fallback to mock data if API unavailable

## Architecture

```
├── components/          # React components
│   ├── FilterBar.tsx   # Main filter interface
│   ├── VideoGrid.tsx   # Video display grid
│   └── errors/         # Error handling components
├── hooks/              # Custom React hooks
│   ├── useTrends.ts    # Main data fetching hook
│   └── useFilters.ts   # Filter state management
├── lib/                # Core utilities
│   ├── api.ts          # API client & caching
│   ├── config.ts       # Configuration
│   └── types.ts        # TypeScript definitions
├── services/           # External API services
│   └── youtube.service.ts  # YouTube API wrapper
└── utils/              # Helper functions
```

## Development Tips

1. **Mock Data Mode**: If you don't have a YouTube API key, the app uses realistic mock data
2. **Caching**: API responses are cached for 5 minutes to reduce API calls
3. **Debugging**: Check browser console for detailed logs
4. **Hot Reload**: Vite provides instant hot module replacement

## Testing YouTube Integration

Use the built-in test component to verify your API setup:

```typescript
// The YouTubeTest component in App.tsx
// Click "Test YouTube API" button to validate configuration
```

## API Quota Management

YouTube Data API v3 free tier limits:
- 10,000 units per day
- Each search costs ~100 units
- Each video details request costs ~1 unit

Tips to conserve quota:
- Enable caching (on by default)
- Avoid excessive filter changes
- Use mock data for development

## Production Deployment

See the main README.md for deployment instructions to:
- Vercel
- Netlify
- GitHub Pages
- Your own server

## Need Help?

1. Check browser console for errors
2. Verify all environment variables are set
3. Ensure API key has correct permissions
4. Try clearing browser cache
5. Check that all dependencies are installed

## Contributing

Found a bug? Have a feature idea? Contributions welcome!