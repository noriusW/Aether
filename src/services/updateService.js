import axios from 'axios';

const GITHUB_REPO = "noriusW/Aether"; 
const CURRENT_VERSION = "1.0.0-beta.1"; 

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

const isNewerVersion = (current, latest) => {
  const c = current.split('.').map(Number);
  const l = latest.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (l[i] > c[i]) return true;
    if (l[i] < c[i]) return false;
  }
  return false;
};
