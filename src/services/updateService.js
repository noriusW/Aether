import axios from 'axios';

const GITHUB_REPO = "noriusW/Aether"; 
const CURRENT_VERSION = "1.0.1-beta"; 

export const checkUpdates = async () => {
  try {
    const response = await axios.get(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      timeout: 5000
    });
    
    const latestVersion = response.data.tag_name.replace('v', '');
    const downloadUrl = response.data.html_url;
    const releaseNotes = response.data.body;

    if (isNewerVersion(CURRENT_VERSION, latestVersion)) {
      return {
        available: true,
        version: latestVersion,
        url: downloadUrl,
        notes: releaseNotes
      };
    }
    return { available: false };
  } catch (e) {
    console.warn("[Update Service] Failed to check for updates:", e.message);
    return { available: false };
  }
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
