import axios from 'axios';

const GITHUB_REPO = "noriusW/Aether";
const CURRENT_VERSION = "1.1.0";
const CACHE_KEY = "update_cache";
const CACHE_TTL_MS = 1000 * 60 * 30;

const loadCache = () => {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const saveCache = (value) => {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), value }));
  } catch (e) {}
};

export const checkUpdates = async (options = {}) => {
  const currentVersion = options.currentVersion || CURRENT_VERSION;
  const cached = loadCache();
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.value;

  try {
    const current = normalizeVersion(currentVersion);
    let release = null;

    if (current.isPrerelease) {
      const response = await axios.get(`https://api.github.com/repos/${GITHUB_REPO}/releases`, {
        timeout: 5000
      });
      release = pickLatestRelease(response.data, true);
    } else {
      const response = await axios.get(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        timeout: 5000
      });
      release = response.data;
    }

    if (!release || !release.tag_name) return { available: false };

    const latestVersion = release.tag_name.replace('v', '');
    const downloadUrl = release.html_url;
    const releaseNotes = release.body || '';
    const summary = releaseNotes.split('\n').find(line => line.trim()) || '';

    const result = isNewerVersion(currentVersion, latestVersion) ? {
      available: true,
      version: latestVersion,
      url: downloadUrl,
      notes: releaseNotes,
      summary
    } : { available: false };

    saveCache(result);
    return result;
  } catch (e) {
    console.warn("[Update Service] Failed to check for updates:", e.message);
    const fallback = cached?.value || { available: false };
    return { ...fallback, error: e.message };
  }
};

const pickLatestRelease = (releases = [], includePrerelease = false) => {
  const usable = releases.filter(r => r && r.tag_name);
  const candidates = includePrerelease ? usable : usable.filter(r => !r.prerelease);
  if (!candidates.length) return usable[0] || null;
  return candidates.sort((a, b) => compareVersions(b.tag_name, a.tag_name))[0];
};

const normalizeVersion = (version) => {
  const cleaned = (version || '').toString().trim().replace(/^v/i, '');
  const [core, pre] = cleaned.split('-');
  const parts = core.split('.').map((part) => {
    const n = parseInt(part, 10);
    return Number.isNaN(n) ? 0 : n;
  });
  while (parts.length < 3) parts.push(0);
  return { parts: parts.slice(0, 3), isPrerelease: Boolean(pre) };
};

const compareVersions = (a, b) => {
  const va = normalizeVersion(a);
  const vb = normalizeVersion(b);
  for (let i = 0; i < 3; i++) {
    if (va.parts[i] > vb.parts[i]) return 1;
    if (va.parts[i] < vb.parts[i]) return -1;
  }
  if (va.isPrerelease === vb.isPrerelease) return 0;
  return va.isPrerelease ? -1 : 1;
};

const isNewerVersion = (current, latest) => {
  const c = normalizeVersion(current);
  const l = normalizeVersion(latest);
  for (let i = 0; i < 3; i++) {
    if (l.parts[i] > c.parts[i]) return true;
    if (l.parts[i] < c.parts[i]) return false;
  }
  if (c.isPrerelease && !l.isPrerelease) return true;
  return false;
};
