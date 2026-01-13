import { get, set, del } from 'idb-keyval';

const INDEX_KEY = 'offlineCacheIndex';
const ENTRY_PREFIX = 'offlineCache:';
const MAX_ITEMS = 200;
const MAX_BYTES = 15 * 1024 * 1024;
const DEFAULT_TTL_MS = 1000 * 60 * 30;

const isCacheEnabled = () => {
  if (typeof localStorage === 'undefined') return false;
  const raw = localStorage.getItem('persist_cache');
  return raw !== 'false';
};

const normalizeKey = (key) => `${ENTRY_PREFIX}${key}`;

const loadIndex = async () => (await get(INDEX_KEY)) || [];

const saveIndex = async (index) => {
  await set(INDEX_KEY, index);
};

const approximateSize = (value) => {
  try {
    const encoded = new TextEncoder().encode(JSON.stringify(value));
    return encoded.length;
  } catch (e) {
    try {
      return JSON.stringify(value).length;
    } catch (err) {
      return 0;
    }
  }
};

const pruneIndex = async (index) => {
  const now = Date.now();
  const expiredKeys = new Set(index.filter((i) => i.expiry && i.expiry < now).map((i) => i.key));
  if (expiredKeys.size) {
    await Promise.all([...expiredKeys].map((k) => del(normalizeKey(k))));
  }

  let next = index.filter((i) => i && i.key && !expiredKeys.has(i.key));
  next.sort((a, b) => (a.accessed || 0) - (b.accessed || 0));
  let totalBytes = next.reduce((sum, i) => sum + (i.size || 0), 0);

  while (next.length > MAX_ITEMS || totalBytes > MAX_BYTES) {
    const removed = next.shift();
    totalBytes -= removed?.size || 0;
    if (removed?.key) await del(normalizeKey(removed.key));
  }

  await saveIndex(next);
  return next;
};

export const cacheGet = async (key, options = {}) => {
  if (!isCacheEnabled()) return null;
  const entry = await get(normalizeKey(key));
  if (!entry) return null;

  const now = Date.now();
  const expired = entry.expiry && entry.expiry < now;
  if (expired && !options.allowStale) {
    await del(normalizeKey(key));
    const index = await loadIndex();
    await saveIndex(index.filter((i) => i.key !== key));
    return null;
  }

  const index = await loadIndex();
  const updated = index.map((i) => (i.key === key ? { ...i, accessed: now, expiry: entry.expiry, size: entry.size } : i));
  await saveIndex(updated);

  return entry.value;
};

export const cacheSet = async (key, value, options = {}) => {
  if (!isCacheEnabled()) return;
  const ttlMs = options.ttlMs === undefined ? DEFAULT_TTL_MS : options.ttlMs;
  const now = Date.now();
  const expiry = ttlMs ? now + ttlMs : null;
  const size = approximateSize(value);

  await set(normalizeKey(key), { value, expiry, size });
  const index = await loadIndex();
  const updated = [{ key, accessed: now, expiry, size }, ...index.filter((i) => i.key !== key)];
  await pruneIndex(updated);
};

export const clearOfflineCache = async () => {
  const index = await loadIndex();
  await Promise.all(index.map((i) => del(normalizeKey(i.key))));
  await del(INDEX_KEY);
};

export const getCacheStats = async () => {
  const index = await loadIndex();
  const bytes = index.reduce((sum, i) => sum + (i.size || 0), 0);
  return { items: index.length, bytes };
};
