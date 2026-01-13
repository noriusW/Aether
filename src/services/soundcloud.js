import axios from 'axios';
import { get, set } from 'idb-keyval';
import { cacheGet, cacheSet } from '../utils/offlineCache';

const API_URL = 'https://api-v2.soundcloud.com';
let activeClientId = localStorage.getItem('sc_client_id') || null;
let activeUserToken = localStorage.getItem('sc_oauth_token') || null;

const getAuthHeaders = () => activeUserToken ? { 'Authorization': activeUserToken } : {};

const getClientId = async () => {
  if (activeClientId) return activeClientId;
  try {
    if (window.electron) {
      const key = await window.electron.invoke('get-soundcloud-key');
      if (key) { activeClientId = key; return key; }
    }
  } catch (e) { console.warn(e); }
  return 'a281614d7f34dc30b665dfcaa3ed7505';
};

const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

const normalizeQuery = (query) => (query || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');

const dedupeById = (items) => Array.from(new Map(items.filter(Boolean).map((t) => [t.id, t])).values());

export const setUserCredentials = (clientId, token) => {
  activeClientId = clientId;
  activeUserToken = token;
  if (clientId) localStorage.setItem('sc_client_id', clientId);
  if (token) localStorage.setItem('sc_oauth_token', token);
};

export const fetchUserProfile = async () => {
  try {
    const res = await axios.get(`${API_URL}/me`, {
      headers: getAuthHeaders(),
      params: { client_id: await getClientId() }
    });
    return res.data;
  } catch (e) { return null; }
};

export const fetchUserPlaylists = async () => {
  try {
    const res = await axios.get(`${API_URL}/me/playlists`, {
      headers: getAuthHeaders(),
      params: { client_id: await getClientId(), limit: 50 }
    });
    return (res.data.collection || []).map(formatPlaylist);
  } catch (e) { return []; }
};

export const fetchUserLikes = async () => {
  try {
    const res = await axios.get(`${API_URL}/me/favorites`, {
      headers: getAuthHeaders(),
      params: { client_id: await getClientId(), limit: 50 }
    });
    return (res.data.collection || []).map(formatTrack);
  } catch (e) { return []; }
};

export const fetchPlaylistById = async (id) => {
  if (typeof id === 'number' || !isNaN(id)) {
    const locals = await get('localPlaylists') || [];
    const found = locals.find(p => p.id === Number(id));
    if (found) return found;
  }
  const cacheKey = `playlist:${id}`;
  const cached = await cacheGet(cacheKey, { allowStale: isOffline() });
  if (cached) return cached;
  try {
    const cid = await getClientId();
    const res = await axios.get(`${API_URL}/playlists/${id}`, {
      params: { client_id: cid }, headers: getAuthHeaders()
    });
    let tracks = res.data.tracks || [];
    const stubs = tracks.filter(t => !t.title);
    if (stubs.length > 0) {
      const ids = stubs.map(t => t.id);
      let resolved = [];
      for (let i = 0; i < ids.length; i += 50) {
        const chunk = ids.slice(i, i + 50).join(',');
        const r = await axios.get(`${API_URL}/tracks`, { params: { ids: chunk, client_id: cid }, headers: getAuthHeaders() });
        if (r.data) resolved = [...resolved, ...r.data];
      }
      tracks = tracks.map(t => t.title ? t : (resolved.find(rt => rt.id === t.id) || t));
    }
    const payload = { ...formatPlaylist(res.data), tracks: tracks.map(formatTrack) };
    await cacheSet(cacheKey, payload, { ttlMs: 1000 * 60 * 60 });
    return payload;
  } catch (e) {
    const fallback = await cacheGet(cacheKey, { allowStale: true });
    return fallback || null;
  }
};

export const fetchArtistById = async (id) => {
  const cacheKey = `artist:${id}`;
  const cached = await cacheGet(cacheKey, { allowStale: isOffline() });
  if (cached) return cached;
  try {
    const res = await axios.get(`${API_URL}/users/${id}`, { params: { client_id: await getClientId() }, headers: getAuthHeaders() });
    await cacheSet(cacheKey, res.data, { ttlMs: 1000 * 60 * 60 * 12 });
    return res.data;
  } catch (e) {
    const fallback = await cacheGet(cacheKey, { allowStale: true });
    return fallback || null;
  }
};

export const fetchArtistTracks = async (id) => {
  const cacheKey = `artist-tracks:${id}`;
  const cached = await cacheGet(cacheKey, { allowStale: isOffline() });
  if (cached) return cached;
  try {
    const res = await axios.get(`${API_URL}/users/${id}/tracks`, { params: { client_id: await getClientId(), limit: 50 }, headers: getAuthHeaders() });
    const tracks = (res.data.collection || []).map(formatTrack);
    await cacheSet(cacheKey, tracks, { ttlMs: 1000 * 60 * 30 });
    return tracks;
  } catch (e) {
    const fallback = await cacheGet(cacheKey, { allowStale: true });
    return fallback || [];
  }
};

export const fetchArtistPlaylists = async (id) => {
  const cacheKey = `artist-playlists:${id}`;
  const cached = await cacheGet(cacheKey, { allowStale: isOffline() });
  if (cached) return cached;
  try {
    const res = await axios.get(`${API_URL}/users/${id}/playlists`, { params: { client_id: await getClientId(), limit: 20 }, headers: getAuthHeaders() });
    const playlists = (res.data.collection || []).map(formatPlaylist);
    await cacheSet(cacheKey, playlists, { ttlMs: 1000 * 60 * 30 });
    return playlists;
  } catch (e) {
    const fallback = await cacheGet(cacheKey, { allowStale: true });
    return fallback || [];
  }
};

export const fetchRelatedTracks = async (id) => {
  const cacheKey = `related:${id}`;
  const cached = await cacheGet(cacheKey, { allowStale: isOffline() });
  if (cached) return cached;
  try {
    const res = await axios.get(`${API_URL}/tracks/${id}/related`, { params: { client_id: await getClientId(), limit: 20 }, headers: getAuthHeaders() });
    const tracks = dedupeById((res.data.collection || []).map(formatTrack));
    await cacheSet(cacheKey, tracks, { ttlMs: 1000 * 60 * 60 * 6 });
    return tracks;
  } catch (e) {
    const fallback = await cacheGet(cacheKey, { allowStale: true });
    return fallback || [];
  }
};

export const searchTracks = async (query, type = 'tracks') => {
  const normalized = normalizeQuery(query);
  if (!normalized) return [];
  const cacheKey = `search:${type}:${normalized}`;
  const cached = await cacheGet(cacheKey, { allowStale: isOffline() });
  if (cached) return cached;

  try {
    const cid = await getClientId();
    const ep = type === 'tracks' ? 'tracks' : type === 'playlists' ? 'playlists' : 'users';
    const res = await axios.get(`${API_URL}/search/${ep}`, { params: { q: normalized, client_id: cid, limit: 40 }, headers: getAuthHeaders() });
    const results = (res.data.collection || []).map(item => {
      if (type === 'tracks') return formatTrack(item);
      if (type === 'playlists') return formatPlaylist(item);
      return formatUser(item);
    });

    if (type === 'tracks') {
      const autoGeneratedKeywords = ['ai generated', 'suno', 'udio', 'ai cover', 'ai song', 'generated by ai', 'ai remix'];
      const filtered = results.filter(t => {
        const searchStr = `${t.title} ${t.artist}`.toLowerCase();
        return !autoGeneratedKeywords.some(key => searchStr.includes(key));
      });
      const unique = dedupeById(filtered);
      await cacheSet(cacheKey, unique, { ttlMs: 1000 * 60 * 15 });
      return unique;
    }

    const unique = dedupeById(results);
    await cacheSet(cacheKey, unique, { ttlMs: 1000 * 60 * 15 });
    return unique;
  } catch (e) {
    const fallback = await cacheGet(cacheKey, { allowStale: true });
    return fallback || [];
  }
};

export const getStreamUrl = async (t) => {
  const cacheKey = t?.id ? `stream:${t.id}` : null;
  if (cacheKey) {
    const cached = await cacheGet(cacheKey, { allowStale: isOffline() });
    if (cached) return cached;
  }
  try {
    if (!t.mediaUrl) return t.streamUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    const res = await axios.get(t.mediaUrl, { params: { client_id: await getClientId() }, headers: getAuthHeaders() });
    const url = res.data?.url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    if (cacheKey) await cacheSet(cacheKey, url, { ttlMs: 1000 * 60 * 5 });
    return url;
  } catch (e) {
    if (cacheKey) {
      const fallback = await cacheGet(cacheKey, { allowStale: true });
      if (fallback) return fallback;
    }
    return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  }
};

export const fetchLyrics = async (artist, title) => {
  try {
    const q = `${artist.split(/[\(\[#\-]/)[0]} ${title.split(/[\(\[#\-]/)[0]}`.trim();
    const s = await axios.get(`https://music.163.com/api/search/get/web`, { params: { s: q, type: 1, limit: 1 }, timeout: 5000 });
    const id = s.data?.result?.songs?.[0]?.id;
    if (!id) return null;
    const l = await axios.get(`https://music.163.com/api/song/lyric`, { params: { id, lv: -1, kv: -1, tv: -1 } });
    return l.data?.lrc?.lyric?.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
  } catch (e) { return null; }
};

const formatTrack = (t) => ({
  id: t.id, title: t.title || "Unknown", artist: t.user?.username || "Unknown", artistId: t.user?.id,
  artwork: t.artwork_url?.replace('large', 't500x500') || t.user?.avatar_url?.replace('large', 't500x500'),
  duration: t.duration, mediaUrl: (t.media?.transcodings || []).find(x => x.format.protocol === 'progressive')?.url || t.media?.transcodings?.[0]?.url,
  genre: t.genre, type: 'track'
});

const formatPlaylist = (p) => ({
  id: p.id, title: p.title || "Untitled", artist: p.user?.username || "Aether User", userId: p.user?.id,
  artwork: p.artwork_url?.replace('large', 't500x500'), trackCount: p.track_count || p.tracks?.length || 0, type: 'playlist'
});

const formatUser = (u) => ({ id: u.id, title: u.username || "Unknown", artist: `${u.followers_count || 0} followers`, artwork: u.avatar_url?.replace('large', 't500x500'), type: 'artist' });
