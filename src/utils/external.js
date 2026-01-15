export const isSafeExternalUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

export const openExternal = (url) => {
  if (!isSafeExternalUrl(url)) return false;
  if (window.electron?.invoke) {
    window.electron.invoke('open-external', url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  return true;
};
