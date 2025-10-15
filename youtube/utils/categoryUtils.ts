/**
 * Utility functions for YouTube category management
 */

import { YOUTUBE_CATEGORIES } from '../lib/constants';

/**
 * Gets the human-readable category name from a category ID
 * 
 * @param categoryId - The YouTube category ID (e.g., "10", "27")
 * @returns The category label (e.g., "Music", "Education") or "Unknown"
 * 
 * @example
 * getCategoryName("10") // "Music"
 * getCategoryName("27") // "Education"
 * getCategoryName("999") // "Unknown"
 */
export function getCategoryName(categoryId?: string): string {
  if (!categoryId) return 'General';
  
  const category = YOUTUBE_CATEGORIES.find(cat => cat.id === categoryId);
  return category ? category.label : 'General';
}

/**
 * Gets a category icon/emoji based on category ID
 * 
 * @param categoryId - The YouTube category ID
 * @returns An emoji representing the category
 * 
 * @example
 * getCategoryIcon("10") // "🎵"
 * getCategoryIcon("27") // "📚"
 */
export function getCategoryIcon(categoryId?: string): string {
  if (!categoryId) return '📹';
  
  const iconMap: Record<string, string> = {
    '0': '📹',  // All Categories
    '1': '🎬',  // Film & Animation
    '2': '🚗',  // Autos & Vehicles
    '10': '🎵', // Music
    '15': '🐾', // Pets & Animals
    '17': '⚽', // Sports
    '20': '🎮', // Gaming
    '22': '👥', // People & Blogs
    '23': '😂', // Comedy
    '24': '🎭', // Entertainment
    '25': '📰', // News & Politics
    '26': '💄', // Howto & Style
    '27': '📚', // Education
    '28': '🔬', // Science & Technology
  };
  
  return iconMap[categoryId] || '📹';
}

/**
 * Gets category color for styling
 * 
 * @param categoryId - The YouTube category ID
 * @returns Tailwind color classes
 */
export function getCategoryColor(categoryId?: string): string {
  if (!categoryId) return 'bg-slate-600';
  
  const colorMap: Record<string, string> = {
    '0': 'bg-slate-600',
    '1': 'bg-purple-600',
    '2': 'bg-orange-600',
    '10': 'bg-pink-600',
    '15': 'bg-amber-600',
    '17': 'bg-green-600',
    '20': 'bg-indigo-600',
    '22': 'bg-blue-600',
    '23': 'bg-yellow-600',
    '24': 'bg-red-600',
    '25': 'bg-gray-600',
    '26': 'bg-rose-600',
    '27': 'bg-cyan-600',
    '28': 'bg-teal-600',
  };
  
  return colorMap[categoryId] || 'bg-slate-600';
}
