# Changelog

All notable changes to TrendHub will be documented in this file.

## [2.0.0] - 2025-10-06

### 🎉 Major Release: Dual Filter Modes

This release introduces a complete overhaul of the filtering system with two distinct modes for different use cases.

### ✨ Added

#### Filter Modes
- **Video Mode (🎬)**: Filter trending videos by video-specific metrics
  - Upload date filtering (today to last year)
  - View count range slider (0-20M)
  - Video duration brackets (<1m, 1-5m, 5-20m, >20m)
  - Trending in last 24 hours toggle
  
- **Channel Mode (👤)**: Filter content creators by channel-specific metrics
  - Subscriber count range slider (0-10M)
  - Video count range slider (0-10K)
  - Channel age filter (6 months to 10 years)
  - Monetization status filter (All/Yes/No)
  - Monetization age filter (when monetization started)

#### UI Components
- Mode toggle tabs with visual icons
- Separate filter sections based on active mode
- Active filters badge component (shows applied filters)
- Quick remove buttons for individual filters
- Mobile-optimized filter sheet with sticky header/footer
- Pending changes indicator (yellow dot)
- Active filter count badge

#### Filter Presets
- 🔥 **Viral Videos**: Short-form viral content (Video mode)
- 🌱 **New Creators**: Discover emerging channels (Channel mode)
- ⭐ **Established Channels**: Successful monetized creators (Channel mode)
- 📚 **Deep Dives**: Long-form content (Video mode)

#### Documentation
- `FILTER_MODES_GUIDE.md`: Comprehensive user guide
- `IMPLEMENTATION_SUMMARY.md`: Technical documentation
- `QUICK_REFERENCE.md`: Quick reference cheat sheet
- In-app tooltips and help text

### 🔄 Changed

#### Architecture
- Split `FilterState` into mode-specific sub-objects
  - `videoFilters`: VideoFilters interface
  - `channelFilters`: ChannelFilters interface
- Enhanced `useFilters` hook with mode-specific handlers
  - Added `onVideoFilterChange()`
  - Added `onChannelFilterChange()`
- Updated API filter processing logic for both modes

#### UI/UX
- Reorganized filter layout for better clarity
- Improved mobile experience with optimized sheet
- Enhanced visual feedback for filter changes
- Added section headers with emoji indicators
- Improved filter button with status indicators

#### Data Processing
- Channel mode now groups results by channel
- Shows representative video per channel in channel mode
- Updated sorting options (added "Most Subscribers")
- Enhanced caching with mode-aware keys

### 🐛 Fixed
- Filter state not persisting across mode switches (now intentional reset)
- Mobile filter sheet scroll issues
- Apply button not enabling on filter changes
- Preset loading overwriting all filters (now preserves search)

### 🎨 Improved

#### Performance
- Optimized filter processing with early returns
- Reduced unnecessary re-renders
- Smarter cache invalidation
- Lazy loading of filter components

#### Accessibility
- Added ARIA labels to mode tabs
- Improved keyboard navigation
- Better screen reader support
- High contrast mode compatible

#### Developer Experience
- Type-safe filter operations
- Clear separation of concerns
- Comprehensive TypeScript types
- Well-documented code

### 📝 Migration Notes

#### Breaking Changes
**useFilters Hook**
```typescript
// Before
const { filters, onFilterChange } = useFilters();

// After  
const { 
  filters, 
  onFilterChange,
  onVideoFilterChange,    // NEW
  onChannelFilterChange   // NEW
} = useFilters();
```

**FilterBar Component**
```typescript
// Before
<FilterBar 
  filters={filters}
  onFilterChange={onFilterChange}
/>

// After
<FilterBar 
  filters={filters}
  onFilterChange={onFilterChange}
  onVideoFilterChange={onVideoFilterChange}      // NEW
  onChannelFilterChange={onChannelFilterChange}  // NEW
/>
```

**API Response in Channel Mode**
- Results are now deduplicated by channel
- One video per unique channel returned
- Use Video mode for all videos from all channels

### 🔮 Upcoming in v2.1

- [ ] Custom date range picker
- [ ] Save custom filter presets
- [ ] Export filtered results
- [ ] Filter history (back/forward navigation)
- [ ] Advanced search operators
- [ ] Multi-channel comparison view

---

## [1.0.0] - 2025-09-15

### Initial Release

#### Features
- YouTube and TikTok video aggregation
- Basic filtering (platform, upload date, views)
- Search functionality
- Infinite scroll
- Responsive design
- Mock data fallback
- Service worker caching

#### Components
- VideoGrid with lazy loading
- VideoCard with platform icons
- Basic FilterBar
- Error boundaries
- Loading states

#### Technical
- React 18
- TypeScript
- Vite build system
- Tailwind CSS
- YouTube Data API v3 integration

---

## Version Guidelines

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version: Incompatible API changes
- **MINOR** version: New features (backward-compatible)
- **PATCH** version: Bug fixes (backward-compatible)

## Change Categories

- `Added`: New features
- `Changed`: Changes in existing functionality
- `Deprecated`: Soon-to-be removed features
- `Removed`: Removed features
- `Fixed`: Bug fixes
- `Security`: Security fixes
- `Improved`: Enhancements to existing features

---

**Note**: For detailed technical changes, see git commit history and pull requests.