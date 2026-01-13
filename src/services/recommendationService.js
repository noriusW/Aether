import { searchTracks, fetchRelatedTracks } from './soundcloud';

// Утилита для перемешивания массива
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
const normalizeGenre = (genre) => (genre || '').toString().trim().toLowerCase();

// Извлекаем топ жанров пользователя
const getTopGenres = (likedSongs) => {
  const genres = likedSongs
    .map(t => normalizeGenre(t.genre))
    .filter(Boolean)
    .reduce((acc, g) => { acc[g] = (acc[g] || 0) + 1; return acc; }, {});
  
  return Object.entries(genres)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(g => g[0]);
};

export const generateRecommendations = async (likedSongs) => {
  if (!likedSongs || likedSongs.length < 2) {
    return await searchTracks('electronic mix');
  }

  console.log('[Recommendation Engine] Building personalized picks...');

  const seeds = shuffle([...likedSongs]).slice(0, 5);
  const relatedPools = await Promise.all(seeds.map(s => fetchRelatedTracks(s.id)));
  const combined = relatedPools.flat().filter(Boolean);

  const unique = dedupeById(combined);
  const filtered = unique.filter(t => !likedSongs.some(ls => ls.id === t.id));

  if (filtered.length < 10) {
    const topGenres = getTopGenres(likedSongs);
    const fallbackQuery = `${topGenres[0] || 'electronic'} mix`;
    const fallback = await searchTracks(fallbackQuery);
    return shuffle(dedupeById([...filtered, ...fallback])).slice(0, 40);
  }

  return shuffle(filtered).slice(0, 40);
};

export const generateMoodWave = async (vibeValue, likedSongs = []) => {
  console.log(`[Recommendation Engine] Building mood mix: ${vibeValue}%`);
  
  // 1. Собираем пул кандидатов на основе лайков (если есть)
  let candidatePool = [];
  if (likedSongs.length > 0) {
    const seeds = shuffle([...likedSongs]).slice(0, 6);
    const related = await Promise.all(seeds.map(s => fetchRelatedTracks(s.id)));
    candidatePool = related.flat();
  }

  // 2. Определяем ключевые слова для фильтрации/поиска в зависимости от вайба
  let moodKeywords = [];
  if (vibeValue < 20) moodKeywords = ['ambient', 'deep', 'focus', 'minimal', 'calm'];
  else if (vibeValue < 40) moodKeywords = ['lofi', 'chill', 'relax', 'mellow'];
  else if (vibeValue < 60) moodKeywords = ['house', 'melodic', 'progressive', 'electronic'];
  else if (vibeValue < 80) moodKeywords = ['synthwave', 'retrowave', 'drive', 'energetic'];
  else moodKeywords = ['phonk', 'hardstyle', 'bass', 'trap', 'energy', 'high'];

  // 3. Если пуль пуст (нет лайков), делаем обычный поиск
  if (candidatePool.length < 10) {
    const topGenres = getTopGenres(likedSongs);
    const baseGenre = topGenres[0] || 'electronic';
    const query = `${moodKeywords[0]} ${baseGenre}`.trim();
    return shuffle(await searchTracks(query)).slice(0, 40);
  }

  // 4. Фильтруем пул по ключевым словам настроения (умное сопоставление)
  const scoredPool = dedupeById(candidatePool).map(track => {
    let score = 0;
    const text = `${track.title} ${track.genre || ''} ${track.artist}`.toLowerCase();
    moodKeywords.forEach(word => {
      if (text.includes(word)) score += 5;
    });
    return { track, score };
  });

  const finalTracks = scoredPool
    .filter(item => item.score > 0 || Math.random() > 0.7) // Оставляем подходящие + немного рандома для открытия нового
    .sort((a, b) => b.score - a.score)
    .map(item => item.track);

  const withoutLikes = finalTracks.filter(t => !likedSongs.some(ls => ls.id === t.id));

  // 5. Если после фильтрации мало треков, добавляем результаты поиска
  if (withoutLikes.length < 10) {
    const searchFallback = await searchTracks(moodKeywords.join(' '));
    return shuffle(dedupeById([...withoutLikes, ...searchFallback])).slice(0, 40);
  }

  return withoutLikes.slice(0, 40);
};

export const generateDailyMixes = async (likedSongs) => {
  if (likedSongs.length < 5) {
    // Fallback для новых аккаунтов
    const MIX_TYPES = [
      { id: 'remix', title: 'Remix of the Day', query: 'remix popular', color: 'from-pink-500 to-rose-700' },
      { id: 'discovery', title: 'Sonic Discovery', query: 'electronic underground', color: 'from-cyan-500 to-blue-700' },
      { id: 'focus', title: 'Deep Focus', query: 'ambient focus', color: 'from-emerald-500 to-teal-700' },
      { id: 'energy', title: 'High Energy', query: 'phonk energy', color: 'from-orange-500 to-red-700' },
      { id: 'vibe', title: 'Mood Booster', query: 'uplifting house', color: 'from-indigo-500 to-purple-700' }
    ];
    return await Promise.all(MIX_TYPES.map(async m => ({ ...m, tracks: await searchTracks(m.query), artwork: null })));
  }

  const topGenres = getTopGenres(likedSongs);
  
  const MIX_CONFIGS = [
    { id: 'remix', title: 'Remix of the Day', seedIdx: 0, color: 'from-pink-500 to-rose-700' },
    { id: 'discovery', title: 'Sonic Discovery', seedIdx: 1, color: 'from-cyan-500 to-blue-700' },
    { id: 'focus', title: 'Deep Focus', seedIdx: 2, color: 'from-emerald-500 to-teal-700' },
    { id: 'energy', title: 'High Energy', seedIdx: 3, color: 'from-orange-500 to-red-700' },
    { id: 'vibe', title: 'Mood Booster', seedIdx: 4, color: 'from-indigo-500 to-purple-700' }
  ];

  const shuffledLikes = shuffle([...likedSongs]);

  return await Promise.all(MIX_CONFIGS.map(async (config) => {
    const seed = shuffledLikes[config.seedIdx % shuffledLikes.length];
    const related = await fetchRelatedTracks(seed.id);
    
    // Добавляем немного треков того же жанра для стабильности
    const baseGenre = normalizeGenre(seed.genre) || topGenres[0] || 'electronic';
    const genreTracks = await searchTracks(`${baseGenre} mix`);
    
    const combined = dedupeById([...related, ...genreTracks.slice(0, 10)]);
    const unique = combined.filter(t => !likedSongs.some(ls => ls.id === t.id));

    return {
      ...config,
      tracks: unique.slice(0, 25),
      artwork: unique[0]?.artwork || seed.artwork
    };
  }));
};

export const generateTrackRadio = async (track) => {
  const related = await fetchRelatedTracks(track.id);
  if (related.length > 0) return shuffle(related);
  const fallback = await searchTracks(`${track.title || ''} ${track.artist || ''}`.trim());
  return shuffle(fallback);
};

export const generateArtistRadio = async (artistName) => {
  const results = await searchTracks(`${artistName} radio mix`);
  if (results.length > 0) return shuffle(results);
  return shuffle(await searchTracks(artistName));
};

export const generatePlaylistRadio = async (playlist) => {
  const seeds = shuffle([...(playlist.tracks || [])]).slice(0, 3);
  if (seeds.length === 0) {
    const fallbackQuery = `${playlist.title || 'playlist'} mix`;
    return shuffle(await searchTracks(fallbackQuery));
  }
  const results = await Promise.all(seeds.map(t => fetchRelatedTracks(t.id)));
  return shuffle(dedupeById(results.flat()));
};
