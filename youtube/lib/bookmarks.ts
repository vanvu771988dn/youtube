import { Video } from './types';

export type BookmarkedVideo = Pick<Video,
  'id' | 'platform' | 'title' | 'thumbnail' | 'url' | 'creatorName' | 'creatorAvatar' | 'uploadDate'>;

const STORAGE_KEY = 'trendhub.bookmarks.v1';

const safeParse = (raw: string | null): BookmarkedVideo[] => {
  try {
    return raw ? (JSON.parse(raw) as BookmarkedVideo[]) : [];
  } catch {
    return [];
  }
};

const save = (items: BookmarkedVideo[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors (quota/private mode)
  }
};

const makeKey = (id: string, platform: string) => `${platform}:${id}`;

export const getAllBookmarks = (): BookmarkedVideo[] => {
  return safeParse(typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null);
};

export const isBookmarked = (id: string, platform: string): boolean => {
  const items = getAllBookmarks();
  const key = makeKey(id, platform);
  return items.some(v => makeKey(v.id, v.platform) === key);
};

export const addBookmark = (video: BookmarkedVideo) => {
  const items = getAllBookmarks();
  const key = makeKey(video.id, video.platform);
  if (!items.some(v => makeKey(v.id, v.platform) === key)) {
    items.unshift(video);
    save(items);
  }
};

export const removeBookmark = (id: string, platform: string) => {
  const items = getAllBookmarks().filter(v => makeKey(v.id, v.platform) !== makeKey(id, platform));
  save(items);
};

export const toggleBookmark = (video: BookmarkedVideo): boolean => {
  const key = makeKey(video.id, video.platform);
  const items = getAllBookmarks();
  const exists = items.some(v => makeKey(v.id, v.platform) === key);
  if (exists) {
    save(items.filter(v => makeKey(v.id, v.platform) !== key));
    return false;
  } else {
    items.unshift(video);
    save(items);
    return true;
  }
};
