/**
 * Formats a large number into a compact, readable string (e.g., 1.2M, 150K).
 * @param num The number to format.
 * @returns A formatted string.
 */
export const formatCount = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '0';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return num.toString();
};

/**
 * Converts a duration in seconds to a MM:SS or HH:MM:SS format.
 * @param seconds The duration in seconds.
 * @returns A formatted time string.
 */
export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`;
  }
  return `${m}:${pad(s)}`;
};

/**
 * Calculates and formats the time elapsed since a given date string.
 * @param dateString An ISO 8601 date string.
 * @returns A human-readable relative time string (e.g., "2 days ago").
 */
export const timeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
    const intervals: { [key: string]: number } = {
        year: 31536000,
        month: 2592000,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    if (seconds < 5) return "just now";

    for (const unit in intervals) {
        const interval = Math.floor(seconds / intervals[unit]);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }
    return `${Math.floor(seconds)} seconds ago`;
};

/**
 * Calculates a "trending velocity" score for a video.
 * A higher score indicates a faster accumulation of views over time.
 * @param views The total number of views.
 * @param uploadDate The ISO 8601 date string of when the video was uploaded.
 * @returns A numeric velocity score.
 */
export const calculateVelocity = (views: number, uploadDate: string): number => {
    const hoursSinceUpload = (Date.now() - new Date(uploadDate).getTime()) / (1000 * 60 * 60);
    // Give a huge boost to very new videos to account for initial explosion
    if (hoursSinceUpload < 0.1) return views * 10;
    if (hoursSinceUpload <= 0) return 0;
    return views / hoursSinceUpload;
};