import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { get, set, del } from 'idb-keyval';
import { fetchUserProfile, fetchUserLikes, fetchUserPlaylists } from '../services/soundcloud';
import { clearOfflineCache, getCacheStats } from '../utils/offlineCache';

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
  const [notifications, setNotifications] = useState([]);
  const [cacheStats, setCacheStats] = useState({ items: 0, bytes: 0 });
  const [toasts, setToasts] = useState([]);
  const toastTimeoutsRef = useRef(new Map());
  const MAX_NOTIFICATIONS = 60;

  useEffect(() => {
    return () => {
      toastTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      toastTimeoutsRef.current.clear();
    };
  }, []);

  const showToast = useCallback((message) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message }]);
    const timeoutId = setTimeout(() => {
      setToasts(p => p.filter(t => t.id !== id));
      toastTimeoutsRef.current.delete(id);
    }, 3000);
    toastTimeoutsRef.current.set(id, timeoutId);
  }, []);

  const refreshCacheStats = useCallback(async () => {
    const stats = await getCacheStats();
    setCacheStats(stats);
  }, []);

  const addNotification = useCallback((entry) => {
    const now = Date.now();
    const base = {
      id: now + Math.random(),
      ts: now,
      read: false,
      level: 'info',
      type: 'system',
      ...entry
    };

    setNotifications((prev) => {
      const deduped = base.key ? prev.filter((n) => n.key !== base.key) : prev;
      const next = [base, ...deduped].slice(0, MAX_NOTIFICATIONS);
      set('notifications', next);
      return next;
    });
  }, [MAX_NOTIFICATIONS]);

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => {
      if (!prev.some((n) => !n.read)) return prev;
      const next = prev.map((n) => (n.read ? n : { ...n, read: true }));
      set('notifications', next);
      return next;
    });
  }, []);

  const clearNotifications = useCallback(async () => {
    setNotifications([]);
    await del('notifications');
  }, []);

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
      search_placeholder: "Search music...",
      neural_vibe: "Mood Wave",
      neural_vibe_desc: "Tune the slider to shape the radio mix for your mood.",
      neural_feature: "Mood Control",
      sensitivity: "Sensitivity",
      vibe_deep: "Deep",
      vibe_chill: "Chill",
      vibe_medium: "Medium",
      vibe_energetic: "Energetic",
      vibe_maximum: "Maximum",
      ignite_wave: "Ignite Wave",
      live_now: "Live Now",
      on_air: "On Air",
      daily_mixes: "Daily Mixes",
      daily_collection: "Daily Collection",
      mix_remix: "Remix of the Day",
      mix_discovery: "Sonic Discovery",
      mix_focus: "Deep Focus",
      mix_energy: "High Energy",
      mix_vibe: "Mood Booster",
      live_tag: "Live",
      neural_discovery: "Recommended for You",
      neural_recalibrating: "Refreshing recommendations...",
      neural_sync: "Up to date with your listening",
      neural_sync_request: "Feedback request",
      signal_center: "Notifications",
      notifications_title: "Notifications",
      notifications_clear: "Clear All",
      notifications_empty: "No notifications yet",
      update_available: "Update available",
      update_download: "Open release",
      update_failed: "Update check failed",
      connection_offline: "You're offline",
      connection_online: "Back online",
      rpc_ready: "Discord RPC connected",
      rpc_disabled: "Discord RPC disabled",
      rpc_error: "Discord RPC error",
      rpc_reconnecting: "Discord RPC reconnecting",
      sync_paused: "Sync paused until connection returns.",
      sync_failed: "SoundCloud sync failed",
      sync_success: "SoundCloud synced",
      queue: "Queue",
      queue_empty: "Queue is empty",
      queue_hint: "Add tracks from playlists or mixes.",
      yes: "Yes",
      no: "No",
      neural_wave_initiated: "Mix started",
      neural_link_sync: "Syncing",
      neural_blur: "Blur Amount",
      neural_failure: "Aether hit an error and recovered.",
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
      awaiting_input: "Pick a track to start",
      profile_stats: "Listening Stats",
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
      search_placeholder: "Поиск музыки...",
      neural_vibe: "Волна настроения",
      neural_vibe_desc: "Подстройте слайдер, чтобы сформировать радио под настроение.",
      neural_feature: "Контроль настроения",
      sensitivity: "Чувствительность",
      vibe_deep: "Глубокая",
      vibe_chill: "Спокойная",
      vibe_medium: "Средняя",
      vibe_energetic: "Энергичная",
      vibe_maximum: "Максимальная",
      ignite_wave: "Запустить волну",
      live_now: "В эфире",
      on_air: "Ожидание",
      daily_mixes: "Миксы дня",
      daily_collection: "Дневная подборка",
      mix_remix: "Ремикс дня",
      mix_discovery: "Звуковое открытие",
      mix_focus: "Глубокий фокус",
      mix_energy: "Заряд энергии",
      mix_vibe: "Настроение",
      neural_discovery: "Рекомендации для вас",
      neural_recalibrating: "Обновляем рекомендации...",
      neural_sync: "Актуально по вашим прослушиваниям",
      neural_sync_request: "Запрос обратной связи",
      signal_center: "Уведомления",
      notifications_title: "Уведомления",
      notifications_clear: "Очистить все",
      notifications_empty: "Пока нет уведомлений",
      update_available: "Доступно обновление",
      update_download: "Открыть релиз",
      update_failed: "Ошибка проверки обновлений",
      connection_offline: "Нет подключения к интернету",
      connection_online: "Подключение восстановлено",
      rpc_ready: "Discord RPC подключен",
      rpc_disabled: "Discord RPC выключен",
      rpc_error: "Ошибка Discord RPC",
      rpc_reconnecting: "Переподключение Discord RPC",
      sync_paused: "Синхронизация приостановлена до восстановления связи.",
      sync_failed: "Синхронизация SoundCloud не удалась",
      sync_success: "SoundCloud синхронизирован",
      queue: "Очередь",
      queue_empty: "Очередь пуста",
      queue_hint: "Добавляйте треки из плейлистов и миксов.",
      yes: "Да",
      no: "Нет",
      neural_wave_initiated: "Микс запущен",
      neural_link_sync: "Синхронизация",
      neural_blur: "Интенсивность размытия",
      neural_failure: "Произошла ошибка. Приложение восстановлено.",
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
      awaiting_input: "Выберите трек, чтобы начать",
      profile_stats: "Статистика прослушиваний",
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
      const [liked, hist, playlists, vSets, aSets, auSets, tCache, dMixes, dMixesTime, storedNotifications] = await Promise.all([
        get('likedSongs'), get('history'), get('localPlaylists'),
        get('visualSettings'), get('appSettings'), get('audioSettings'), get('trendingCache'),
        get('dailyMixes'), get('dailyMixesTimestamp'), get('notifications')
      ]);

      if (liked) setLikedSongs(liked);
      if (hist) setHistory(hist);
      if (playlists) setLocalPlaylists(playlists);
      if (vSets) setVisualSettings(vSets);
      if (storedNotifications) setNotifications(storedNotifications);

      const resolvedAppSettings = aSets || appSettings;
      if (aSets) {
        setAppSettings(aSets);
      } else {
        set('appSettings', resolvedAppSettings);
      }
      if (typeof resolvedAppSettings.persistCache !== 'undefined') {
        localStorage.setItem('persist_cache', resolvedAppSettings.persistCache ? 'true' : 'false');
      }
      if (window.electron) window.electron.send('update-app-settings', resolvedAppSettings);

      if (auSets) setAudioSettings(auSets);
      if (tCache && resolvedAppSettings.persistCache) setTrendingCache(tCache);
      if (dMixes) setDailyMixes(dMixes);
      if (dMixesTime) setDailyMixesTimestamp(dMixesTime);
      
      refreshCacheStats();
      syncSoundCloud();
    };
    init();
  }, []);

  const updateVisualSettings = (s) => { setVisualSettings(p => { const u = {...p, ...s}; set('visualSettings', u); return u; }); };
  const updateAppSettings = (s) => {
    const shouldClearCache = s && s.persistCache === false;
    setAppSettings(p => {
      const u = { ...p, ...s };
      set('appSettings', u);
      if (typeof u.persistCache !== 'undefined') {
        localStorage.setItem('persist_cache', u.persistCache ? 'true' : 'false');
      }
      if (window.electron) window.electron.send('update-app-settings', u);
      return u;
    });
    if (shouldClearCache) {
      clearOfflineCache().then(refreshCacheStats);
    }
  };
  const updateAudioSettings = (s) => { setAudioSettings(p => { const u = {...p, ...s}; set('audioSettings', u); return u; }); };

  const clearCache = async () => {
    await del('trendingCache');
    setTrendingCache(null);
    await clearOfflineCache();
    refreshCacheStats();
  };

  const clearAppData = async () => {
    const defaultVisualSettings = {
      glassOpacity: 85,
      sidebarOpacity: 40,
      blurAmount: 40,
      accentColor: '#6366f1',
      animations: true
    };
    const defaultAppSettings = {
      closeToTray: true,
      showTrayIcon: true,
      autoStart: false,
      persistCache: true,
      language: 'en',
      discordRPC: true
    };
    const defaultAudioSettings = {
      enabled: true,
      eq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      bassBoost: 0,
      clarity: 0,
      compressor: true
    };

    const keysToClear = [
      'likedSongs', 'history', 'localPlaylists', 'visualSettings', 'appSettings', 'audioSettings',
      'trendingCache', 'dailyMixes', 'dailyMixesTimestamp', 'notifications'
    ];
    await Promise.all(keysToClear.map((k) => del(k)));
    await clearOfflineCache();

    setLikedSongs([]);
    setHistory([]);
    setLocalPlaylists([]);
    setUserProfile(null);
    setUserPlaylists([]);
    setTrendingCache(null);
    setDailyMixes(null);
    setDailyMixesTimestamp(null);
    setHomeRecommendations([]);
    setNotifications([]);
    setAudioSettings(defaultAudioSettings);
    setVisualSettings(defaultVisualSettings);
    setAppSettings(defaultAppSettings);
    set('visualSettings', defaultVisualSettings);
    set('appSettings', defaultAppSettings);
    set('audioSettings', defaultAudioSettings);
    if (window.electron) window.electron.send('update-app-settings', defaultAppSettings);

    localStorage.removeItem('sc_oauth_token');
    localStorage.removeItem('sc_client_id');
    localStorage.removeItem('player_volume');
    localStorage.setItem('persist_cache', defaultAppSettings.persistCache ? 'true' : 'false');
    refreshCacheStats();
  };

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
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        addNotification({
          type: 'connection',
          level: 'warning',
          title: t.connection_offline,
          body: t.sync_paused,
          key: 'connection-status'
        });
        setIsSyncing(false);
        return;
      }
      const profile = await fetchUserProfile();
      if (profile) {
        setUserProfile(profile);
        const [likes, playlists] = await Promise.all([fetchUserLikes(), fetchUserPlaylists()]);
        if (Array.isArray(likes) && likes.length > 0) setLikedSongs(likes);
        if (Array.isArray(playlists)) setUserPlaylists(playlists);
        showToast(t.sync_success);
      }
    } catch (e) {
      console.warn('SoundCloud sync failed:', e);
      addNotification({
        type: 'connection',
        level: 'error',
        title: t.sync_failed,
        body: e?.message || 'SoundCloud request failed.'
      });
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
      visualSettings, appSettings, audioSettings, trendingCache, t,
      dailyMixes, dailyMixesTimestamp, updateDailyMixes, logout,
      homeRecommendations, setHomeRecommendations,
      notifications, addNotification, markNotificationsRead, clearNotifications,
      cacheStats, refreshCacheStats,
      isSyncing, syncSoundCloud, toasts, showToast,
      updateVisualSettings, updateAppSettings, updateAudioSettings, setTrendingCache,
      createPlaylist, addToPlaylist, removeFromPlaylist, deletePlaylist, toggleLike, isLiked, addToHistory,
      clearCache, clearAppData
    }}>
      {children}
    </UserDataContext.Provider>
  );
};
