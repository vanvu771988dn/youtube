import { Video } from './types';

export type TrackedChannel = {
  channelId?: string;
  creatorName: string;
  creatorAvatar?: string;
  channelThumbnail?: string;
  channelCreatedAt?: string;
};

const STORAGE_KEY = 'trendhub.tracked.channels.v1';

const safeParse = (raw: string | null): TrackedChannel[] => {
  try {
    return raw ? (JSON.parse(raw) as TrackedChannel[]) : [];
  } catch {
    return [];
  }
};

const save = (items: TrackedChannel[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

const makeKey = (ch: TrackedChannel) => (ch.channelId ? `id:${ch.channelId}` : `name:${ch.creatorName.toLowerCase()}`);

export const getAllTrackedChannels = (): TrackedChannel[] => {
  return safeParse(typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null);
};

export const isChannelTracked = (channelId?: string, creatorName?: string): boolean => {
  const items = getAllTrackedChannels();
  const key = makeKey({ channelId, creatorName: creatorName || '' });
  return items.some(i => makeKey(i) === key);
};

export const toggleTrackChannel = (ch: TrackedChannel): boolean => {
  const items = getAllTrackedChannels();
  const key = makeKey(ch);
  const exists = items.some(i => makeKey(i) === key);
  if (exists) {
    save(items.filter(i => makeKey(i) !== key));
    return false;
  }
  items.unshift(ch);
  save(items);
  return true;
};
