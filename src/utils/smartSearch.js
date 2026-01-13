/**
 * Aether Smart Search
 * Lightweight intent parsing for mood, genre, artist, and era hints.
 */

const MOODS = ['sad', 'happy', 'chill', 'aggressive', 'relaxing', 'atmospheric', 'dark', 'energetic', 'rainy'];
const GENRES = ['synthwave', 'retrowave', 'lofi', 'techno', 'ambient', 'cyberpunk', 'dnb', 'vaporwave'];
const ERAS = {
  '80s': '1980..1989',
  '90s': '1990..1999',
  'retro': '1970..1990',
  'modern': '2010..2025'
};
const STOP_WORDS = new Set(['play', 'some', 'music', 'songs', 'song', 'tracks', 'track', 'find', 'search', 'for', 'with', 'the', 'a', 'an']);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const matchKeyword = (list, query) => list.find((word) => new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i').test(query));

const parseDecade = (query) => {
  const decadeMatch = query.match(/\b(19|20)?\d0s\b/i);
  if (!decadeMatch) return null;
  const raw = decadeMatch[0].toLowerCase();
  if (raw.length === 3) {
    const num = Number(raw.slice(0, 2));
    if (Number.isNaN(num)) return null;
    const base = num <= 20 ? 2000 : 1900;
    return `${base + num}..${base + num + 9}`;
  }
  const decade = Number(raw.slice(0, 4));
  if (Number.isNaN(decade)) return null;
  return `${decade}..${decade + 9}`;
};

export const processAetherQuery = (query) => {
  const original = (query || '').toString().trim();
  const q = original.toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);

  const analysis = {
    original,
    filters: {
      mood: matchKeyword(MOODS, q) || null,
      genre: matchKeyword(GENRES, q) || null,
      year_range: null,
      artist_intent: null
    },
    sc_query: original,
    intent_score: 0
  };

  const decadeRange = parseDecade(q);
  if (decadeRange) analysis.filters.year_range = decadeRange;

  if (!analysis.filters.year_range) {
    Object.entries(ERAS).forEach(([key, range]) => {
      if (new RegExp(`\\b${escapeRegExp(key)}\\b`, 'i').test(q)) analysis.filters.year_range = range;
    });
  }

  const yearMatch = q.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) analysis.filters.year_range = yearMatch[0];

  const artistMatch = q.match(/\b(?:by|artist|from)\s+([a-z0-9\s.'-]{2,})/i);
  if (artistMatch) analysis.filters.artist_intent = artistMatch[1].trim();

  if (analysis.filters.mood) analysis.intent_score += 35;
  if (analysis.filters.genre) analysis.intent_score += 35;
  if (analysis.filters.year_range) analysis.intent_score += 15;
  if (analysis.filters.artist_intent) analysis.intent_score += 15;

  const cleanedTokens = tokens.filter((t) => (
    !STOP_WORDS.has(t) &&
    t !== analysis.filters.mood &&
    t !== analysis.filters.genre &&
    t !== 'by' &&
    t !== 'artist' &&
    t !== 'from'
  ));

  const parts = [];
  if (analysis.filters.genre) parts.push(analysis.filters.genre);
  if (analysis.filters.mood) parts.push(analysis.filters.mood);
  if (analysis.filters.artist_intent) parts.push(analysis.filters.artist_intent);
  if (!analysis.filters.genre && !analysis.filters.mood && !analysis.filters.artist_intent) {
    parts.push(cleanedTokens.join(' ') || original);
  }
  if (analysis.filters.year_range) parts.push(analysis.filters.year_range);

  analysis.sc_query = parts.join(' ').trim() || original;

  return analysis;
};
