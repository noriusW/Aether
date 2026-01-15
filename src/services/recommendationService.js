import { searchTracks, fetchRelatedTracks } from './soundcloud';

// --- UTILS ---

const shuffle = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

const dedupeById = (items) => Array.from(new Map(items.filter(Boolean).map((t) => [t.id, t])).values());

const normalizeText = (str) => (str || '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const getLevenshteinDistance = (a, b) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
      else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
    }
  }
  return matrix[b.length][a.length];
};

const isDuplicate = (track, existing) => {
  if (track.id === existing.id) return true;
  if (track.duration && existing.duration && Math.abs(track.duration - existing.duration) > 5000) return false;
  
  const titleA = normalizeText(track.title);
  const titleB = normalizeText(existing.title);
  
  if (titleA === titleB) return true;
  
  const dist = getLevenshteinDistance(titleA, titleB);
  const maxLen = Math.max(titleA.length, titleB.length);
  if (maxLen > 5 && dist < maxLen * 0.2) return true; 

  return false;
};

// --- CORE ENGINE ---

const buildInterestGraph = (likedSongs) => {
  const genres = {};
  const artists = {};
  
  likedSongs.forEach(t => {
    const g = (t.genre || 'electronic').toLowerCase();
    const a = (t.artist || '').toLowerCase();
    genres[g] = (genres[g] || 0) + 1;
    artists[a] = (artists[a] || 0) + 1;
  });

  return { genres, artists };
};

const smartStacking = (tracks) => {
  const unique = [];
  tracks.forEach(t => {
    if (!t.artwork || t.artwork.includes('default')) return; // Filter low quality
    if (!unique.some(existing => isDuplicate(t, existing))) {
      unique.push(t);
    }
  });
  return unique;
};

const GENRE_ENERGY = {
  'ambient': 10, 'piano': 15, 'lo-fi': 20, 'chill': 25, 'jazz': 30,
  'indie': 40, 'pop': 50, 'r&b': 50, 'hip-hop': 60, 'rock': 65,
  'house': 70, 'electronic': 75, 'dance': 80, 'techno': 85,
  'drum & bass': 90, 'dubstep': 95, 'phonk': 100, 'metal': 100
};

const getTrackEnergy = (track) => {
  if (track.bpm) return Math.min(100, Math.max(0, (track.bpm - 60) / 1.2)); 
  const g = (track.genre || '').toLowerCase();
  for (const [key, val] of Object.entries(GENRE_ENERGY)) {
    if (g.includes(key)) return val;
  }
  return 50; 
};

const filterByVibe = (tracks, targetEnergy, sensitivity = 25) => {
  if (targetEnergy === 50 && sensitivity > 30) return tracks;
  return tracks.filter(t => {
    const e = getTrackEnergy(t);
    return Math.abs(e - targetEnergy) <= sensitivity;
  });
};

const sortFlow = (tracks) => {
  return tracks.sort((a, b) => getTrackEnergy(a) - getTrackEnergy(b));
};

// --- PUBLIC API ---

export const generateRecommendations = async (likedSongs, settings = {}, dislikedSongs = []) => {
  const { smartStacking: useStacking = true, flowMode = false, energyLevel = 50 } = settings;

  // 1. Safe Fallback if no likes
  if (!likedSongs || likedSongs.length < 2) {
    return await searchTracks('electronic popular');
  }

  // 2. Build Candidate Pool using DIRECT RELATIONSHIPS
  // We prioritize 'fetchRelatedTracks' on recent likes over generic 'searchTracks'
  const seeds = shuffle([...likedSongs]).slice(0, 5); // 5 random liked songs
  const seedRelated = await Promise.all(seeds.map(s => fetchRelatedTracks(s.id)));
  
  let pool = seedRelated.flat().filter(Boolean);

  // 3. Filter Garbage & Dislikes
  pool = pool.filter(t => {
     // Must have artwork
     if (!t.artwork) return false;
     // Must be longer than 60s (skip snippets)
     if (t.duration && t.duration < 60000) return false;
     // Must not be liked already
     if (likedSongs.some(ls => ls.id === t.id)) return false;
     // Must not be disliked
     if (dislikedSongs.some(ds => ds.id === t.id)) return false;
     return true;
  });

  // 4. Fallback if pool is too small (e.g. niche likes) -> Use Tag Search
  if (pool.length < 10) {
     const graph = buildInterestGraph(likedSongs);
     const topGenres = Object.entries(graph.genres).sort((a,b) => b[1]-a[1]).slice(0, 2).map(x => x[0]);
     if (topGenres.length > 0) {
        // Use "best" or "top" to get higher quality results
        const genreDiscovery = await searchTracks(`${topGenres[0]} best`);
        pool = [...pool, ...genreDiscovery];
     }
  }

  // 5. Smart Stacking (Dedupe)
  if (useStacking) {
    pool = smartStacking(pool);
  } else {
    pool = dedupeById(pool);
  }

  // 6. Score & Sort (Interest Graph)
  const graph = buildInterestGraph(likedSongs);
  pool.forEach(t => {
    t._score = 0;
    const g = (t.genre || '').toLowerCase();
    const a = (t.artist || '').toLowerCase();
    if (graph.genres[g]) t._score += graph.genres[g]; 
    if (graph.artists[a]) t._score += 10; 
  });
  
  // Mix of Score + Randomness (70% score, 30% random shuffle to keep it fresh)
  pool.sort((a, b) => (b._score - a._score) + (Math.random() * 5));

  // 7. Vibe Filtering
  if (energyLevel !== 50) {
    pool = filterByVibe(pool, energyLevel, 30);
  }

  // 8. Flow Mode
  let result = pool.slice(0, 40);
  if (flowMode) {
    result = sortFlow(result);
  }

  return result;
};

export const generateMoodWave = async (vibeValue, likedSongs = [], settings = {}, dislikedSongs = []) => {
  return await generateRecommendations(likedSongs, { ...settings, energyLevel: vibeValue, flowMode: false }, dislikedSongs);
};

export const generateDailyMixes = async (likedSongs) => {
  if (likedSongs.length < 5) {
    const MIX_TYPES = [
      { id: 'remix', title: 'Remix of the Day', query: 'remix popular', color: 'from-pink-500 to-rose-700' },
      { id: 'discovery', title: 'Sonic Discovery', query: 'electronic underground', color: 'from-cyan-500 to-blue-700' },
      { id: 'focus', title: 'Deep Focus', query: 'ambient focus', color: 'from-emerald-500 to-teal-700' },
      { id: 'energy', title: 'High Energy', query: 'phonk energy', color: 'from-orange-500 to-red-700' },
      { id: 'vibe', title: 'Mood Booster', query: 'uplifting house', color: 'from-indigo-500 to-purple-700' }
    ];
    return await Promise.all(MIX_TYPES.map(async m => ({ ...m, tracks: await searchTracks(m.query), artwork: null })));
  }

  const shuffledLikes = shuffle([...likedSongs]);
  const MIX_CONFIGS = [
    { id: 'remix', title: 'Remix of the Day', seedIdx: 0, color: 'from-pink-500 to-rose-700' },
    { id: 'discovery', title: 'Sonic Discovery', seedIdx: 1, color: 'from-cyan-500 to-blue-700' },
    { id: 'focus', title: 'Deep Focus', seedIdx: 2, color: 'from-emerald-500 to-teal-700' },
    { id: 'energy', title: 'High Energy', seedIdx: 3, color: 'from-orange-500 to-red-700' },
    { id: 'vibe', title: 'Mood Booster', seedIdx: 4, color: 'from-indigo-500 to-purple-700' }
  ];

  return await Promise.all(MIX_CONFIGS.map(async (config) => {
    const seed = shuffledLikes[config.seedIdx % shuffledLikes.length];
    const related = await fetchRelatedTracks(seed.id);
    // Dedupe and limit
    const unique = smartStacking(related).filter(t => !likedSongs.some(ls => ls.id === t.id));
    
    return {
      ...config,
      tracks: unique.slice(0, 25),
      artwork: unique[0]?.artwork || seed.artwork
    };
  }));
};

// ... keep existing single track/artist generators with stacking applied
export const generateTrackRadio = async (track) => {
  const related = await fetchRelatedTracks(track.id);
  const stacked = smartStacking(related);
  return shuffle(stacked);
};

export const generateArtistRadio = async (artistName) => {
  const results = await searchTracks(`${artistName} radio mix`);
  const stacked = smartStacking(results);
  return shuffle(stacked);
};

export const generatePlaylistRadio = async (playlist) => {
  const seeds = shuffle([...(playlist.tracks || [])]).slice(0, 3);
  if (seeds.length === 0) {
    const fallbackQuery = `${playlist.title || 'playlist'} mix`;
    return shuffle(await searchTracks(fallbackQuery));
  }
  const results = await Promise.all(seeds.map(t => fetchRelatedTracks(t.id)));
  return smartStacking(results.flat());
};
