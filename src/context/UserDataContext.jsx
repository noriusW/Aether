import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { get, set, del } from 'idb-keyval';
import { fetchUserProfile, fetchUserLikes, fetchUserPlaylists } from '../services/soundcloud';

const UserDataContext = createContext();
export const useUserData = () => useContext(UserDataContext);

export const UserDataProvider = ({ children }) => {
  const [likedSongs, setLikedSongs] = useState([]);
  const [history, setHistory] = useState([]);
  const [localPlaylists, setLocalPlaylists] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [trendingCache, setTrendingCache] = useState(null);
  const [dailyMixes, setDailyMixes] = useState(null);
  const [dailyMixesTimestamp, setDailyMixesTimestamp] = useState(null);
  const [homeRecommendations, setHomeRecommendations] = useState([]);
  const [neuralFeedback, setNeuralFeedback] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastTimeoutsRef = useRef(new Map());

  useEffect(() => {
    return () => {
      toastTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      toastTimeoutsRef.current.clear();
    };
  }, []);

  const showToast = (message) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message }]);
    const timeoutId = setTimeout(() => {
      setToasts(p => p.filter(t => t.id !== id));
      toastTimeoutsRef.current.delete(id);
    }, 3000);
    toastTimeoutsRef.current.set(id, timeoutId);
  };

  const [visualSettings, setVisualSettings] = useState({
    glassOpacity: 85,
    sidebarOpacity: 40,
    blurAmount: 40,
    accentColor: '#6366f1',
    animations: true
  });

  const [appSettings, setAppSettings] = useState({
    closeToTray: true,
    showTrayIcon: true,
    autoStart: false,
    persistCache: true,
    language: 'en',
    discordRPC: true
  });

  const translations = {
    en: {
      home: "Home",
      discover: "Discover",
      radio: "Radio",
      likes: "Likes",
      playlists: "Playlists",
      tracks: "Tracks",
      artists: "Artists",
      trending: "Trending",
      history: "History",
      settings: "Settings",
      profile: "Profile",
      connected: "Connected",
      local: "Local",
      search_placeholder: "Search Aether...",
      neural_vibe: "Neural Mood Wave",
      neural_vibe_desc: "Adjust the neural vibe slider to calibrate the recommendation engine to your current frequency.",
      neural_feature: "Neural Feature",
      sensitivity: "Sensitivity",
      vibe_deep: "Deep",
      vibe_chill: "Chill",
      vibe_medium: "Medium",
      vibe_energetic: "Energetic",
      vibe_maximum: "Maximum",
      ignite_wave: "Ignite Wave",
      live_now: "Live Now",
      on_air: "On Air",
      daily_mixes: "Smart Daily Mixes",
      daily_collection: "Daily Collection",
      mix_remix: "Remix of the Day",
      mix_discovery: "Sonic Discovery",
      mix_focus: "Deep Focus",
      mix_energy: "High Energy",
      mix_vibe: "Mood Booster",
      live_tag: "Live",
      neural_discovery: "Neural Discovery",
      neural_recalibrating: "Recalibrating Neural Grids...",
      neural_sync: "Synchronized with your sonic profile",
      neural_sync_request: "Neural Sync Request",
      signal_center: "Signal Center",
      yes: "Yes",
      no: "No",
      neural_wave_initiated: "Neural Wave Initiated",
      neural_link_sync: "Neural Link Sync",
      neural_blur: "Neural Blur Amount",
      neural_failure: "Aether encountered a critical neural link failure. The system core has been stabilized.",
      settings_ui: "UI Appearance",
      settings_language: "Language",
      settings_general: "General Settings",
      settings_performance: "Performance",
      settings_bg_anim: "Background Animations",
      settings_low_power: "Lower GPU usage",
      settings_auto_start: "Launch on System Startup",
      settings_discord_rpc: "Discord Rich Presence",
      function_unavailable: "This feature is currently undergoing maintenance and may not work.",
      settings_restart_needed: "Restart suggested to apply all changes.",
      radio_global: "Global Frequencies",
      radio_tuning: "Tuning...",
      playlist_empty: "Library Empty",
      playlist_create: "Create New",
      playlist_placeholder: "Playlist Title...",
      playlist_desc: "Organize your sonic discoveries into local collections.",
      playlist_recs: "Recommended Additions",
      playlist_analyzing: "Analyzing sonic patterns...",
      awaiting_input: "Awaiting Sonic Input",
      profile_stats: "Neural Statistics",
      profile_bio: "Sonic Bio",
      profile_joined: "Joined Aether",
      back: "Back",
      play_all: "Play All",
      searching: "Searching Aether...",
      no_results: "No results found",
      auth_title: "Connect SoundCloud",
      auth_guest: "Guest Mode",
      auth_token: "Manual Token",
      auth_back: "Go Back",
      auth_sync: "Synchronize",
      auth_waiting: "Waiting for Login...",
      logout: "Log Out",
      ctx_play: "Play Instantly",
      ctx_queue: "Add to Queue",
      ctx_radio: "Start Radio",
      ctx_like: "Add to Likes",
      ctx_unlike: "Remove from Likes",
      ctx_playlist: "Add to Playlist",
      ctx_remove: "Remove from Playlist",
      ctx_view_profile: "View Profile",
      ctx_no_playlists: "No Playlists",
      ctx_play_all: "Play All"
    },
    ru: {
      home: "Главная",
      discover: "Обзор",
      radio: "Радио",
      likes: "Понравилось",
      playlists: "Плейлисты",
      tracks: "Треки",
      artists: "Артисты",
      trending: "В тренде",
      history: "История",
      settings: "Настройки",
      profile: "Профиль",
      connected: "Подключено",
      local: "Локальный",
      search_placeholder: "Поиск в Aether...",
      neural_vibe: "Нейронная волна",
      neural_vibe_desc: "Настройте слайдер нейронной волны, чтобы откалибровать систему рекомендаций под вашу частоту.",
      neural_feature: "Нейронная функция",
      sensitivity: "Чувствительность",
      vibe_deep: "Глубокая",
      vibe_chill: "Спокойная",
      vibe_medium: "Средняя",
      vibe_energetic: "Энергичная",
      vibe_maximum: "Максимальная",
      ignite_wave: "Запустить волну",
      live_now: "В эфире",
      on_air: "Ожидание",
      daily_mixes: "Умные миксы дня",
      daily_collection: "Дневная подборка",
      mix_remix: "Ремикс дня",
      mix_discovery: "Звуковое открытие",
      mix_focus: "Глубокий фокус",
      mix_energy: "Заряд энергии",
      mix_vibe: "Настроение",
      neural_sync: "Синхронизировано с вашим профилем",
      neural_sync_request: "Запрос нейронной синхронизации",
      signal_center: "Центр сигналов",
      yes: "Да",
      no: "Нет",
      neural_wave_initiated: "Нейронная волна запущена",
      neural_link_sync: "Синхронизация нейросвязи",
      neural_blur: "Интенсивность нейронного размытия",
      neural_failure: "Критический сбой нейронной связи. Ядро системы стабилизировано.",
      settings_ui: "Внешний вид",
      settings_language: "Язык интерфейса",
      settings_general: "Общие настройки",
      settings_performance: "Производительность",
      settings_bg_anim: "Анимации фона",
      settings_low_power: "Снизить нагрузку на GPU",
      settings_auto_start: "Запуск при старте системы",
      settings_discord_rpc: "Discord Rich Presence",
      function_unavailable: "Эта функция временно находится на техническом обслуживании и может не работать.",
      settings_restart_needed: "Рекомендуется перезагрузка для применения всех изменений.",
      radio_global: "Мировые частоты",
      radio_tuning: "Настройка...",
      playlist_empty: "Библиотека пуста",
      playlist_create: "Создать плейлист",
      playlist_placeholder: "Название...",
      playlist_desc: "Организуйте свои звуковые открытия в локальные коллекции.",
      playlist_recs: "Рекомендуем добавить",
      playlist_analyzing: "Анализ звуковых паттернов...",
      awaiting_input: "Ожидание звукового сигнала",
      profile_stats: "Нейронная статистика",
      profile_bio: "Био",
      profile_joined: "В системе Aether с",
      back: "Назад",
      play_all: "Играть всё",
      searching: "Ищем в Aether...",
      no_results: "Ничего не найдено",
      auth_title: "Подключить SoundCloud",
      auth_guest: "Гостевой режим",
      auth_token: "Ввести токен",
      auth_back: "Вернуться",
      auth_sync: "Синхронизация",
      logout: "Выйти",
      ctx_play: "Играть сейчас",
      ctx_queue: "Добавить в очередь",
      ctx_radio: "Запустить радио",
      ctx_like: "Добавить в любимые",
      ctx_unlike: "Удалить из любимых",
      ctx_playlist: "Добавить в плейлист",
      ctx_remove: "Удалить из плейлиста",
      ctx_view_profile: "Открыть профиль",
      ctx_no_playlists: "Нет плейлистов",
      ctx_play_all: "Играть всё"
    }
  };

  const t = translations[appSettings.language] || translations.en;

  const [audioSettings, setAudioSettings] = useState({
    enabled: true,
    eq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bassBoost: 0,
    clarity: 0,
    compressor: true
  });

  useEffect(() => {
    const init = async () => {
      const [liked, hist, playlists, vSets, aSets, auSets, tCache, dMixes, dMixesTime] = await Promise.all([
        get('likedSongs'), get('history'), get('localPlaylists'),
        get('visualSettings'), get('appSettings'), get('audioSettings'), get('trendingCache'),
        get('dailyMixes'), get('dailyMixesTimestamp')
      ]);

      if (liked) setLikedSongs(liked);
      if (hist) setHistory(hist);
      if (playlists) setLocalPlaylists(playlists);
      if (vSets) setVisualSettings(vSets);

      const resolvedAppSettings = aSets || appSettings;
      if (aSets) {
        setAppSettings(aSets);
      } else {
        set('appSettings', resolvedAppSettings);
      }
      if (window.electron) window.electron.send('update-app-settings', resolvedAppSettings);

      if (auSets) setAudioSettings(auSets);
      if (tCache && resolvedAppSettings.persistCache) setTrendingCache(tCache);
      if (dMixes) setDailyMixes(dMixes);
      if (dMixesTime) setDailyMixesTimestamp(dMixesTime);
      
      syncSoundCloud();
    };
    init();
  }, []);

  const updateVisualSettings = (s) => { setVisualSettings(p => { const u = {...p, ...s}; set('visualSettings', u); return u; }); };
  const updateAppSettings = (s) => { setAppSettings(p => { const u = {...p, ...s}; set('appSettings', u); if (window.electron) window.electron.send('update-app-settings', u); return u; }); };
  const updateAudioSettings = (s) => { setAudioSettings(p => { const u = {...p, ...s}; set('audioSettings', u); return u; }); };

  const clearCache = async () => { await del('trendingCache'); setTrendingCache(null); };

  const updateDailyMixes = (mixes) => {
    setDailyMixes(mixes);
    const ts = Date.now();
    setDailyMixesTimestamp(ts);
    set('dailyMixes', mixes);
    set('dailyMixesTimestamp', ts);
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const syncSoundCloud = async () => {
    setIsSyncing(true);
    try {
      const profile = await fetchUserProfile();
      if (profile) {
        setUserProfile(profile);
        const [likes, playlists] = await Promise.all([fetchUserLikes(), fetchUserPlaylists()]);
        if (Array.isArray(likes) && likes.length > 0) setLikedSongs(likes);
        if (Array.isArray(playlists)) setUserPlaylists(playlists);
        showToast(t.auth_sync + " Complete");
      }
    } catch (e) {
      console.warn('SoundCloud sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const logout = () => {
    setUserProfile(null);
    setLikedSongs([]);
    setUserPlaylists([]);
    localStorage.removeItem('sc_oauth_token');
    localStorage.removeItem('sc_client_id');
    if (window.electron) window.electron.send('logout-request');
  };

  const createPlaylist = (name) => {
    const newPlaylist = { id: Date.now(), title: name, tracks: [], artwork: null, type: 'local-playlist' };
    const updated = [newPlaylist, ...localPlaylists];
    setLocalPlaylists(updated);
    set('localPlaylists', updated);
    return newPlaylist;
  };

  const addToPlaylist = (id, track) => {
    const updated = localPlaylists.map(p => p.id === id ? { ...p, tracks: [...p.tracks, track], artwork: p.artwork || track.artwork } : p);
    setLocalPlaylists(updated);
    set('localPlaylists', updated);
  };

  const removeFromPlaylist = (playlistId, trackId) => {
    const updated = localPlaylists.map(p => 
      p.id === playlistId ? { ...p, tracks: p.tracks.filter(t => t.id !== trackId) } : p
    );
    setLocalPlaylists(updated);
    set('localPlaylists', updated);
  };

  const deletePlaylist = (id) => {
    const updated = localPlaylists.filter(p => p.id !== id);
    setLocalPlaylists(updated);
    set('localPlaylists', updated);
  };

  const toggleLike = (track) => {
    setLikedSongs(p => {
      const exists = p.find(t => t.id === track.id);
      const n = exists ? p.filter(t => t.id !== track.id) : [track, ...p];
      set('likedSongs', n);
      return n;
    });
  };

  const isLiked = (id) => likedSongs.some(t => t.id === id);

  const addToHistory = (t) => { setHistory(p => { const n = [t, ...p.filter(x => x.id !== t.id)].slice(0, 50); set('history', n); return n; }); };

  return (
    <UserDataContext.Provider value={{
      likedSongs, history, localPlaylists, userProfile, userPlaylists,
      visualSettings, appSettings, audioSettings, trendingCache, neuralFeedback, t,
      dailyMixes, dailyMixesTimestamp, updateDailyMixes, logout,
      homeRecommendations, setHomeRecommendations,
      isSyncing, syncSoundCloud, toasts, showToast,
      updateVisualSettings, updateAppSettings, updateAudioSettings, setTrendingCache,
      createPlaylist, addToPlaylist, removeFromPlaylist, deletePlaylist, toggleLike, isLiked, addToHistory, clearCache
    }}>
      {children}
    </UserDataContext.Provider>
  );
};