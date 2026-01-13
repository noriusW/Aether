/**
 * Aether Neural Engine (Advanced Smart Search)
 * Handles natural language processing for musical intent.
 */

const MOODS = ['sad', 'happy', 'chill', 'aggressive', 'relaxing', 'atmospheric', 'dark', 'energetic', 'rainy'];
const GENRES = ['synthwave', 'retrowave', 'lofi', 'techno', 'ambient', 'cyberpunk', 'dnb', 'vaporwave'];
const ERAS = {
  '80s': '1980..1989',
  '90s': '1990..1999',
  'retro': '1970..1990',
  'modern': '2010..2025'
};

export const processAetherQuery = (query) => {
  const q = query.toLowerCase();
  const tokens = q.split(' ');
  
  const analysis = {
    original: query,
    filters: {
      mood: MOODS.find(m => q.includes(m)) || null,
      genre: GENRES.find(g => q.includes(g)) || null,
      year_range: null,
      artist_intent: null
    },
    sc_query: query, // Optimized query for SoundCloud
    intent_score: 0
  };

  // Era Detection
  Object.entries(ERAS).forEach(([key, range]) => {
    if (q.includes(key)) analysis.filters.year_range = range;
  });

  // Year Detection (e.g. "born in 1990")
  const yearMatch = q.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) analysis.filters.year_range = yearMatch[0];

  // Intent Scoring
  if (analysis.filters.mood) analysis.intent_score += 40;
  if (analysis.filters.genre) analysis.intent_score += 40;
  if (analysis.filters.year_range) analysis.intent_score += 20;

  // Construct optimized SoundCloud Search String
  const parts = [];
  if (analysis.filters.genre) parts.push(analysis.filters.genre);
  if (analysis.filters.mood) parts.push(analysis.filters.mood);
  if (!analysis.filters.genre && !analysis.filters.mood) parts.push(query);
  
  analysis.sc_query = parts.join(' ');

  return analysis;
};