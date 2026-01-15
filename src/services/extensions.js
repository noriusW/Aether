import axios from 'axios';

const DEFAULT_STORE = {
  owner: 'noriusW',
  repo: 'Aether-extensions',
  branch: 'main',
  path: 'extensions.json'
};

const sanitizePart = (value) => (value || '').toString().trim().replace(/[^a-zA-Z0-9._/-]/g, '');

export const getDefaultStoreConfig = () => ({ ...DEFAULT_STORE });

export const normalizeStoreConfig = (config = {}) => ({
  owner: sanitizePart(config.owner || DEFAULT_STORE.owner),
  repo: sanitizePart(config.repo || DEFAULT_STORE.repo),
  branch: sanitizePart(config.branch || DEFAULT_STORE.branch),
  path: sanitizePart(config.path || DEFAULT_STORE.path)
});

export const buildStoreUrl = (config) => {
  const safe = normalizeStoreConfig(config);
  return `https://raw.githubusercontent.com/${safe.owner}/${safe.repo}/${safe.branch}/${safe.path}`;
};

export const normalizeExtension = (item) => {
  if (!item || typeof item !== 'object') return null;
  const id = (item.id || '').toString().trim();
  const entry = (item.entry || item.url || '').toString().trim();
  if (!id || !entry) return null;

  return {
    id,
    name: item.name || id,
    description: item.description || '',
    version: item.version || '0.0.0',
    entry,
    author: item.author || '',
    homepage: item.homepage || '',
    permissions: Array.isArray(item.permissions) ? item.permissions : [],
    tags: Array.isArray(item.tags) ? item.tags : []
  };
};

export const normalizeStoreData = (data) => {
  const raw = Array.isArray(data?.extensions) ? data.extensions : Array.isArray(data) ? data : [];
  return raw.map(normalizeExtension).filter(Boolean);
};

export const fetchExtensionStore = async (config) => {
  const url = buildStoreUrl(config);
  const response = await axios.get(url, { timeout: 6000 });
  return normalizeStoreData(response.data);
};

export const isValidHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch (e) {
    return false;
  }
};

export const loadExtensionModule = async (entryUrl) => {
  const response = await fetch(entryUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch extension: ${response.status}`);
  }
  const code = await response.text();
  const blob = new Blob([code], { type: 'text/javascript' });
  const blobUrl = URL.createObjectURL(blob);
  try {
    return await import(/* @vite-ignore */ blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
};
