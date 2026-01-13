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

// Извлекаем топ жанров пользователя
const getTopGenres = (likedSongs) => {
  const genres = likedSongs
    .map(t => t.genre)
    .filter(Boolean)
    .reduce((acc, g) => { acc[g] = (acc[g] || 0) + 1; return acc; }, {});
  
  return Object.entries(genres)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(g => g[0]);
};

export const generateRecommendations = async (likedSongs) => {
  if (!likedSongs || likedSongs.length < 2) {
    return await searchTracks('electronic synthwave 2025');
  }

  console.log(`[Neural Engine] Initializing Deep Discovery...`);

  // Берем последние 5 лайков как семена
  const seeds = likedSongs.slice(0, 5);
  const relatedPools = await Promise.all(seeds.map(s => fetchRelatedTracks(s.id)));
  let combined = relatedPools.flat();

  // Убираем дубликаты
  const unique = Array.from(new Map(combined.map(t => [t.id, t])).values());
  // Убираем то, что уже лайкнуто
  const filtered = unique.filter(t => !likedSongs.some(ls => ls.id === t.id));

  return shuffle(filtered).slice(0, 40);
};

export const generateMoodWave = async (vibeValue, likedSongs = []) => {
  console.log(`[Neural Engine] Calibrating Mood Wave: ${vibeValue}%`);
  
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
    const query = `${moodKeywords[0]} ${topGenres.join(' ')}`;
    return shuffle(await searchTracks(query));
  }

  // 4. Фильтруем пул по ключевым словам настроения (умное сопоставление)
  const scoredPool = candidatePool.map(track => {
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

  // 5. Если после фильтрации мало треков, добавляем результаты поиска
  if (finalTracks.length < 10) {
    const searchFallback = await searchTracks(moodKeywords.join(' '));
    return shuffle([...finalTracks, ...searchFallback]);
  }

  return finalTracks.slice(0, 40);
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
    const genreTracks = await searchTracks(`${seed.genre || topGenres[0]} mix`);
    
    const combined = shuffle([...related, ...genreTracks.slice(0, 10)]);
    const unique = Array.from(new Map(combined.map(t => [t.id, t])).values())
      .filter(t => !likedSongs.some(ls => ls.id === t.id));

    return {
      ...config,
      tracks: unique.slice(0, 25),
      artwork: unique[0]?.artwork || seed.artwork
    };
  }));
};

export const generateTrackRadio = async (track) => {
  const related = await fetchRelatedTracks(track.id);
  return shuffle(related);
};

export const generateArtistRadio = async (artistName) => {
  const results = await searchTracks(`${artistName} radio mix`);
  return shuffle(results);
};

export const generatePlaylistRadio = async (playlist) => {
  const seeds = shuffle([...(playlist.tracks || [])]).slice(0, 3);
  const results = await Promise.all(seeds.map(t => fetchRelatedTracks(t.id)));
  return shuffle(results.flat());
};