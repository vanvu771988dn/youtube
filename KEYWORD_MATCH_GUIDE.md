# Keyword Match (OR/AND) Feature Guide

## Overview
The Keyword Match feature allows you to control how multiple keywords are searched when using the search functionality. You can choose between **OR** (match any keyword) or **AND** (match all keywords) logic.

## How to Use

### 1. Enter Multiple Keywords
In the search box, enter multiple keywords separated by:
- Semicolons (`;`)
- Commas (`,`)
- Pipes (`|`)

**Example:**
```
gaming; tutorial; minecraft
```

### 2. Choose Match Type

#### OR (Any) - Default
- Finds videos that contain **ANY** of your keywords
- Broader search - more results
- Example: "gaming; tutorial" finds videos about gaming OR tutorial

**Use when:**
- You want more results
- Keywords are related but not necessarily together
- Exploring different topics

#### AND (All)
- Finds videos that contain **ALL** of your keywords
- Narrower search - fewer but more specific results  
- Example: "gaming; tutorial" finds videos about gaming AND tutorial

**Use when:**
- You want very specific results
- Keywords must appear together
- Refining a broad topic

## Examples

### Example 1: Gaming Content

**OR Logic:**
```
Keywords: fortnite; valorant; apex
Result: Videos about Fortnite OR Valorant OR Apex
```

**AND Logic:**
```
Keywords: fortnite; tutorial; beginner
Result: Videos that are Fortnite AND tutorial AND beginner
```

### Example 2: Tech Reviews

**OR Logic:**
```
Keywords: iphone; samsung; review
Result: iPhone reviews OR Samsung reviews OR any reviews
```

**AND Logic:**
```
Keywords: iphone; 15; pro; review
Result: Only iPhone 15 Pro reviews
```

### Example 3: Educational Content

**OR Logic:**
```
Keywords: python; javascript; tutorial
Result: Python tutorials OR JavaScript tutorials
```

**AND Logic:**
```
Keywords: python; machine learning; beginners
Result: Python machine learning tutorials for beginners
```

## How It Works Technically

### YouTube API Query Generation

**OR Logic** (Default):
- Sends query: `keyword1 OR keyword2 OR keyword3`
- YouTube searches for videos matching any term
- More results returned

**AND Logic:**
- Sends query: `keyword1 keyword2 keyword3`
- YouTube searches for videos matching all terms (implicit AND)
- Fewer, more targeted results

### For Channel Mode
The same logic applies when searching channels:
- **OR**: Find channels about any of the topics
- **AND**: Find channels about all topics combined

## UI Location

The OR/AND toggle is located:
- **Position**: Filter bar, next to the Search box
- **Format**: Radio buttons
- **Options**: 
  - ☐ OR (Any) - Selected by default
  - ☐ AND (All)

## Tips & Best Practices

### When to Use OR
✅ Initial exploration of topics  
✅ Finding content across multiple categories  
✅ Casting a wide net  
✅ 2-3 unrelated keywords

### When to Use AND
✅ Highly specific searches  
✅ Finding niche content  
✅ Combining related concepts  
✅ 3-5 related keywords

### Optimization Tips
1. **Start with OR** - Get a feel for available content
2. **Switch to AND** - Narrow down to specific matches
3. **Use 2-4 keywords** - Too many keywords = no results with AND
4. **Combine with filters** - Use view count, date filters for best results

## Examples by Use Case

### Content Creator Research
```
OR: "vlog; daily; lifestyle" 
→ Find various lifestyle content styles

AND: "vlog; daily; morning routine"
→ Find specific morning routine vlogs
```

### Educational Content
```
OR: "tutorial; course; lesson"
→ All educational content

AND: "tutorial; react; hooks; 2024"
→ Specific React hooks tutorials from 2024
```

### Entertainment
```
OR: "funny; comedy; memes"
→ Any entertaining content

AND: "funny; cats; compilation"
→ Funny cat compilations only
```

## Troubleshooting

**Problem: No results with AND**
- Solution: Use fewer keywords or try OR first
- Reason: ALL keywords must match

**Problem: Too many irrelevant results with OR**
- Solution: Switch to AND or add more specific keywords
- Use additional filters (views, date, category)

**Problem: Results don't seem to match**
- Check that keywords are correctly separated (semicolons/commas)
- Verify the selected OR/AND option
- Click "Apply Filters" to ensure changes are active

## Technical Implementation

### Files Modified
- `lib/types.ts` - Added `keywordMatch` to FilterState
- `hooks/useFilters.ts` - Added default OR value
- `components/FilterBar.tsx` - Added radio button UI
- `lib/aggregator.ts` - Implemented query logic
- `App.tsx` - Added filter removal handling

### State Management
```typescript
interface FilterState {
  keywords: string;
  keywordMatch: 'OR' | 'AND'; // ← New field
  // ... other filters
}
```

### Query Building Logic
```typescript
const terms = keywords.split(/[;,|]+/).map(t => t.trim());
const isAndLogic = keywordMatch === 'AND';
const query = isAndLogic 
  ? terms.join(' ')        // AND: implicit
  : terms.join(' OR ');    // OR: explicit
```

## Future Enhancements
Potential improvements:
- NOT operator (exclude keywords)
- Custom operators (e.g., "keyword1 AND (keyword2 OR keyword3)")
- Save search presets with match type
- Visual query builder

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Status**: ✅ Active Feature
