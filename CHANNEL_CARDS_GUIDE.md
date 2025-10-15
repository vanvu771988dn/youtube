# Channel Cards Display Guide

## Overview

When you switch to **Channel Mode**, the video cards transform into **Channel Cards** that display comprehensive channel information and link directly to the YouTube channel page.

---

## Channel Card Features

### 🎨 Visual Design

**Enhanced Layout:**
- **Larger banner/thumbnail** (48px height)
- **Hover effects**: Card scales up, border glows cyan
- **Image zoom**: Thumbnail zooms on hover
- **Badge overlay**: "👤 Channel" badge appears on hover
- **Platform icon**: Shows YouTube/Dailymotion icon

---

### 📊 Information Displayed

#### 1. **Channel Thumbnail**
- Large banner-style image
- Uses `channelThumbnail` or falls back to `creatorAvatar`
- Gradient placeholder while loading
- Smooth fade-in animation

#### 2. **Channel Name**
- Large, bold text (text-lg)
- Clickable link to channel
- Hover effect (turns cyan)
- Truncates with ellipsis if too long

#### 3. **Action Buttons**
- **"Visit Channel →"** - Primary button (cyan)
  - Opens YouTube channel page in new tab
- **"Similar"** - Secondary button
  - Searches for similar channels
- **"Track" / "Tracked"** - Toggle button
  - Saves channel to your tracked list

#### 4. **Channel Description**
- Shows up to 3 lines of text
- Styled in bordered box
- Only appears if description exists
- Light text on dark background

#### 5. **Channel Statistics** (4-box grid)

**Box 1: Subscribers** 👥
- Total subscriber count
- Formatted (e.g., "1.2M")

**Box 2: Videos** 📹
- Total number of videos
- Formatted count

**Box 3: Total Views** 👁️
- Cumulative channel views
- Highlighted in cyan
- Formatted (e.g., "45.3M")

**Box 4: Avg Length** ⏱️
- Average video duration
- Formatted (e.g., "12m 34s")

#### 6. **Last Updated**
- Shows when channel last uploaded
- Calendar icon
- Relative time (e.g., "2 days ago")

---

## How to Use

### Step 1: Switch to Channel Mode

1. Open the **FilterBar**
2. Click **"👤 Channel Filters"** tab
3. Apply channel filters (optional)
4. Click **"Apply Filters"**

### Step 2: Browse Channels

The video grid now shows channel cards instead of video cards. Each card represents one unique channel.

### Step 3: Click to Visit

**Click anywhere on the card** to open the YouTube channel page:
- Click the **thumbnail**
- Click the **channel name**
- Click **"Visit Channel →"** button

All open the channel in a new browser tab.

### Step 4: Additional Actions

**Search Similar Channels:**
- Click **"Similar"** button
- App searches for channels with similar names/content

**Track Channel:**
- Click **"Track"** button
- Button turns green when tracked
- Saves to your tracked channels list

---

## Visual Layout

```
┌─────────────────────────────────────┐
│  [Channel Banner/Thumbnail]         │
│  [Platform Icon]    [👤 Channel]    │
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Channel Name (clickable)           │
├─────────────────────────────────────┤
│ [Visit Channel →] [Similar] [Track] │
├─────────────────────────────────────┤
│  Description (if available)         │
│  Max 3 lines...                     │
├─────────────────────────────────────┤
│ Statistics Grid:                    │
│ ┌──────────┬──────────┐            │
│ │👥 Subs   │📹 Videos │            │
│ │ 1.2M     │ 245      │            │
│ ├──────────┼──────────┤            │
│ │👁️ Views  │⏱️ Avg    │            │
│ │ 45.3M    │ 12m 34s  │            │
│ └──────────┴──────────┘            │
│ 📅 Last updated: 2 days ago         │
└─────────────────────────────────────┘
```

---

## Styling Details

### Colors

- **Background**: Slate-800
- **Border**: Slate-700 (glows cyan on hover)
- **Primary button**: Cyan-600
- **Secondary buttons**: Slate-700
- **Text**: White/Slate-300
- **Accents**: Cyan-400 for highlights

### Animations

- **Card hover**: Lifts up, scales to 105%, shadow intensifies
- **Thumbnail hover**: Zooms to 110%, overlay fades in
- **Badge reveal**: Slides up from bottom on hover
- **Loading**: Smooth fade-in when image loads

### Responsive

- **Desktop**: 5 columns (xl:grid-cols-5)
- **Laptop**: 4 columns (lg:grid-cols-4)
- **Tablet**: 3 columns (md:grid-cols-3)
- **Mobile**: 2 columns (sm:grid-cols-2)
- **Small mobile**: 1 column (default)

---

## Data Flow

### 1. User Action
```
User clicks "👤 Channel Filters" tab
```

### 2. Filter Application
```
mode: 'channel'
channelFilters: { subscriberCount, videoCount, etc. }
```

### 3. Backend Processing
```
1. Fetch videos from YouTube API
2. Group by channelId
3. Calculate aggregated stats:
   - videoCount
   - avgVideoLength
   - channelViewCount
   - lastUpdatedAt
4. Return one result per channel
```

### 4. Card Rendering
```
VideoCard component detects mode='channel'
Renders channel layout instead of video layout
Shows channel-specific information
Links to channel page
```

---

## Channel URL Format

The card generates the YouTube channel URL using:

```typescript
const channelUrl = video.channelId 
  ? `https://www.youtube.com/channel/${video.channelId}` 
  : '#';
```

**Example:**
```
Channel ID: UCxyz123
URL: https://www.youtube.com/channel/UCxyz123
```

**Fallback:**
If no `channelId` is available, the link is disabled (`#`).

---

## Required Video Fields (Channel Mode)

For proper display, the video object should include:

```typescript
{
  // Channel identity
  channelId: string,
  creatorName: string,
  creatorAvatar: string,
  channelThumbnail?: string,
  
  // Channel stats (aggregated)
  subscriberCount: number,
  videoCount?: number,
  channelViewCount?: number,
  avgVideoLength?: number,
  
  // Channel metadata
  channelDescription?: string,
  channelCreatedAt?: string,
  lastUpdatedAt?: string,
  
  // Other
  platform: 'youtube' | ...,
  uploadDate: string,
}
```

---

## Examples

### Example 1: Gaming Channel Card

```
┌─────────────────────────────────────┐
│  [Gaming Channel Banner]            │
│  🎮                     [👤 Channel]│
└─────────────────────────────────────┘
  GameMaster Pro
  [Visit Channel →] [Similar] [Tracked]
  
  Daily gaming content, tutorials, and
  live streams. Subscribe for more!
  
  ┌──────────┬──────────┐
  │👥 Subs   │📹 Videos │
  │ 450K     │ 1.2K     │
  ├──────────┼──────────┤
  │👁️ Views  │⏱️ Avg    │
  │ 125M     │ 18m 45s  │
  └──────────┴──────────┘
  📅 Last updated: 5 hours ago
```

### Example 2: Educational Channel Card

```
┌─────────────────────────────────────┐
│  [Education Channel Banner]         │
│  📚                     [👤 Channel]│
└─────────────────────────────────────┘
  LearnHub Academy
  [Visit Channel →] [Similar] [Track]
  
  Quality educational content for all
  ages. Science, math, history & more!
  
  ┌──────────┬──────────┐
  │👥 Subs   │📹 Videos │
  │ 2.3M     │ 567      │
  ├──────────┼──────────┤
  │👁️ Views  │⏱️ Avg    │
  │ 340M     │ 24m 12s  │
  └──────────┴──────────┘
  📅 Last updated: 1 day ago
```

---

## Comparison: Video vs Channel Mode

| Feature | Video Mode | Channel Mode |
|---------|------------|--------------|
| **Shows** | Individual videos | Unique channels |
| **Thumbnail** | Video thumbnail | Channel banner |
| **Title** | Video title | Channel name |
| **Stats** | Views, likes, duration | Subscribers, total videos, avg length |
| **Description** | Video description | Channel description |
| **Link** | Video page | Channel page |
| **Actions** | Bookmark video | Track channel, find similar |

---

## Tips & Tricks

### 🎯 Discovery

1. **Use filters wisely**: Combine subscriber count + video count for targeted results
2. **Check avg length**: Find channels that match your preferred content length
3. **Last updated**: Ensure channel is active (recent uploads)

### 🔗 Navigation

1. **Multiple ways to visit**: Click thumbnail, name, or button
2. **Open in new tab**: Links always open in new tab (target="_blank")
3. **Track for later**: Use Track button to save channels

### 🎨 Visual Cues

1. **Hover effects**: See channel badge and zoom effect
2. **Border glow**: Cyan border indicates interactivity
3. **Button colors**: Cyan = primary action, Grey = secondary

---

## Troubleshooting

### Issue 1: No Channel Data

**Symptoms:**
- Missing statistics (—)
- No description
- Generic avatar

**Cause:**
- API didn't return channel metadata
- Channel info not enriched

**Solution:**
- Ensure YouTube API includes channel data
- Check aggregator logic

### Issue 2: Thumbnail Not Loading

**Symptoms:**
- Grey placeholder persists
- No image appears

**Cause:**
- Invalid channelThumbnail URL
- Network error

**Solution:**
- Falls back to creatorAvatar
- Check browser console for errors

### Issue 3: Link Doesn't Work

**Symptoms:**
- Clicking does nothing
- Link shows '#'

**Cause:**
- No channelId available

**Solution:**
- Ensure video object includes channelId
- Check aggregator sets channelId properly

---

## See Also

- `CHANNEL_FILTERS_GUIDE.md` - How to use channel filters
- `youtube/components/VideoCard.tsx` - Card implementation
- `youtube/lib/aggregator.ts` - Channel aggregation logic

---

**Enjoy discovering amazing YouTube channels! 🎯**
