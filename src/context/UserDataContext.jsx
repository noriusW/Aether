import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { get, set, del } from 'idb-keyval';
import { fetchUserProfile, fetchUserLikes, fetchUserPlaylists } from '../services/soundcloud';
import { clearOfflineCache, getCacheStats } from '../utils/offlineCache';

const UserDataContext = createContext();
export const useUserData = () => useContext(UserDataContext);

const DEFAULT_VISUAL_SETTINGS = {
  glassOpacity: 85,
  sidebarOpacity: 40,
  blurAmount: 0,
  accentColor: '#6366f1',
  animations: true,
  visualizerStyle: 'ambient', // 'ambient' or 'compact'
  themeId: 'aether-noir',
  palette: ['#6366f1', '#22d3ee', '#14b8a6', '#a855f7', '#f97316'],
  background: {
    mode: 'theme',
    type: 'gradient',
    colors: ['#050505', '#0b0b0b', '#111827'],
    mediaUrl: '',
    overlay: 0.65,
    blur: 0,
    position: 'center',
    size: 'cover'
  },
  fontFamily: 'Inter',
  customCss: '',
  customThemes: []
};

const DEFAULT_APP_SETTINGS = {
  closeToTray: true,
  showTrayIcon: true,
  autoStart: false,
  persistCache: true,
  language: 'en',
  discordRPC: true,
  autoUpdate: true
};

const DEFAULT_AUDIO_SETTINGS = {
  enabled: true,
  eq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  bassBoost: 0,
  clarity: 0,
  compressor: true
};

const DEFAULT_ALGORITHM_SETTINGS = {
  smartStacking: true,
  flowMode: false,
  energyLevel: 50,
  predictiveLoading: true
};

export const UserDataProvider = ({ children }) => {
  const [likedSongs, setLikedSongs] = useState([]);
  const [dislikedSongs, setDislikedSongs] = useState([]); // New Blacklist
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

  const [visualSettings, setVisualSettings] = useState(DEFAULT_VISUAL_SETTINGS);
  const [appSettings, setAppSettings] = useState(DEFAULT_APP_SETTINGS);
  const [audioSettings, setAudioSettings] = useState(DEFAULT_AUDIO_SETTINGS);
  const [algorithmSettings, setAlgorithmSettings] = useState(DEFAULT_ALGORITHM_SETTINGS);

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
      update_downloading: "Downloading update",
      update_ready: "Update ready",
      update_restart: "Restart to finish installing the update.",
      update_install: "Install update",
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
      settings_themes: "Theme Library",
      settings_palette: "Accent & Palette",
      settings_accent: "Accent Color",
      settings_font: "Font Family",
      settings_background: "Background",
      settings_background_mode: "Background Mode",
      settings_bg_theme: "Use theme background",
      settings_bg_custom: "Custom background",
      settings_background_type: "Background Type",
      settings_bg_gradient: "Gradient",
      settings_bg_image: "Image / GIF",
      settings_bg_video: "Video",
      settings_bg_color: "Solid color",
      settings_bg_none: "None",
      settings_bg_media: "Media URL",
      settings_bg_browse: "Select local file",
      settings_bg_overlay: "Overlay Opacity",
      settings_bg_blur: "Background Blur",
      settings_bg_color_pick: "Background Color",
      settings_custom_css: "Custom CSS",
      settings_css_hint: "Custom CSS overrides are applied after theme styles.",
      settings_language: "Language",
      settings_general: "General Settings",
      settings_performance: "Performance",
      settings_bg_anim: "Background Animations",
      settings_low_power: "Lower GPU usage",
      settings_auto_start: "Launch on System Startup",
      settings_auto_update: "Automatic Updates",
      settings_discord_rpc: "Discord Rich Presence",
      function_unavailable: "This feature is currently undergoing maintenance and may not work.",
      settings_restart_needed: "Restart suggested to apply all changes.",
      theme_name: "Custom theme name",
      theme_save: "Save theme",
      theme_saved: "Theme saved",
      palette_slot: "Slot",
      gradient_stop: "Stop",
      extensions: "Extensions",
      extensions_store: "Extension Store",
      extensions_owner: "GitHub Owner",
      extensions_repo: "Repository",
      extensions_branch: "Branch",
      extensions_path: "Index Path",
      extensions_loading: "Loading...",
      extensions_refresh: "Refresh Store",
      extensions_warning: "Extensions are loaded from GitHub and can run custom code. Install only what you trust.",
      extensions_available: "Available Extensions",
      extensions_empty: "No extensions found.",
      extensions_installed: "Installed Extensions",
      extensions_none: "No extensions installed.",
      extensions_errors: "Extension errors",
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
      ctx_dislike: "Not Interesting",
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
      update_downloading: "Загрузка обновления",
      update_ready: "Обновление готово",
      update_restart: "Перезапустите приложение, чтобы установить обновление.",
      update_install: "Установить обновление",
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
      settings_themes: "Библиотека тем",
      settings_palette: "Акцент и палитра",
      settings_accent: "Акцентный цвет",
      settings_font: "Шрифт",
      settings_background: "Фон",
      settings_background_mode: "Режим фона",
      settings_bg_theme: "Использовать фон темы",
      settings_bg_custom: "Свой фон",
      settings_background_type: "Тип фона",
      settings_bg_gradient: "Градиент",
      settings_bg_image: "Изображение / GIF",
      settings_bg_video: "Видео",
      settings_bg_color: "Цвет",
      settings_bg_none: "Без фона",
      settings_bg_media: "Ссылка на медиа",
      settings_bg_browse: "Выбрать файл",
      settings_bg_overlay: "Затемнение",
      settings_bg_blur: "Размытие фона",
      settings_bg_color_pick: "Цвет фона",
      settings_custom_css: "Пользовательский CSS",
      settings_css_hint: "Пользовательский CSS применяется после стилей темы.",
      settings_language: "Язык интерфейса",
      settings_general: "Общие настройки",
      settings_performance: "Производительность",
      settings_bg_anim: "Анимации фона",
      settings_low_power: "Снизить нагрузку на GPU",
      settings_auto_start: "Запуск при старте системы",
      settings_auto_update: "Автообновления",
      settings_discord_rpc: "Discord Rich Presence",
      function_unavailable: "Эта функция временно находится на техническом обслуживании и может не работать.",
      settings_restart_needed: "Рекомендуется перезагрузка для применения всех изменений.",
      theme_name: "Название темы",
      theme_save: "Сохранить тему",
      theme_saved: "Тема сохранена",
      palette_slot: "Слот",
      gradient_stop: "Точка",
      extensions: "Расширения",
      extensions_store: "Магазин расширений",
      extensions_owner: "Владелец GitHub",
      extensions_repo: "Репозиторий",
      extensions_branch: "Ветка",
      extensions_path: "Путь к индексу",
      extensions_loading: "Загрузка...",
      extensions_refresh: "Обновить магазин",
      extensions_warning: "Расширения загружаются с GitHub и могут выполнять код. Устанавливайте только то, чему доверяете.",
      extensions_available: "Доступные расширения",
      extensions_empty: "Расширения не найдены.",
      extensions_installed: "Установленные расширения",
      extensions_none: "Нет установленных расширений.",
      extensions_errors: "Ошибки расширений",
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
      ctx_dislike: "Не интересно",
      ctx_playlist: "Добавить в плейлист",
      ctx_remove: "Удалить из плейлиста",
      ctx_view_profile: "Открыть профиль",
      ctx_no_playlists: "Нет плейлистов",
      ctx_play_all: "Играть всё"
    }
  };

  const t = translations[appSettings.language] || translations.en;

  useEffect(() => {
    const init = async () => {
      const [liked, disliked, hist, playlists, vSets, aSets, auSets, algSets, tCache, dMixes, dMixesTime, storedNotifications] = await Promise.all([
        get('likedSongs'), get('dislikedSongs'), get('history'), get('localPlaylists'),
        get('visualSettings'), get('appSettings'), get('audioSettings'), get('algorithmSettings'),
        get('trendingCache'), get('dailyMixes'), get('dailyMixesTimestamp'), get('notifications')
      ]);

      if (liked) setLikedSongs(liked);
      if (disliked) setDislikedSongs(disliked);
      if (hist) setHistory(hist);
      if (playlists) setLocalPlaylists(playlists);
      const resolvedVisualSettings = { ...DEFAULT_VISUAL_SETTINGS, ...(vSets || {}) };
      setVisualSettings(resolvedVisualSettings);
      set('visualSettings', resolvedVisualSettings);
      if (storedNotifications) setNotifications(storedNotifications);

      const resolvedAppSettings = { ...DEFAULT_APP_SETTINGS, ...(aSets || {}) };
      setAppSettings(resolvedAppSettings);
      set('appSettings', resolvedAppSettings);
      if (typeof resolvedAppSettings.persistCache !== 'undefined') {
        localStorage.setItem('persist_cache', resolvedAppSettings.persistCache ? 'true' : 'false');
      }
      if (window.electron) window.electron.send('update-app-settings', resolvedAppSettings);

      if (auSets) setAudioSettings({ ...DEFAULT_AUDIO_SETTINGS, ...auSets });
      if (algSets) setAlgorithmSettings({ ...DEFAULT_ALGORITHM_SETTINGS, ...algSets });
      if (tCache && resolvedAppSettings.persistCache) setTrendingCache(tCache);
      if (dMixes) setDailyMixes(dMixes);
      if (dMixesTime) setDailyMixesTimestamp(dMixesTime);
      
      refreshCacheStats();
      syncSoundCloud();
    };
    init();
  }, []);

  const updateVisualSettings = (s) => {
    setVisualSettings(p => {
      const u = { ...p, ...s };
      set('visualSettings', u);
      return u;
    });
  };
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
  const updateAudioSettings = (s) => {
    setAudioSettings(p => {
      const u = { ...p, ...s };
      set('audioSettings', u);
      return u;
    });
  };
  const updateAlgorithmSettings = (s) => {
    setAlgorithmSettings(p => {
      const u = { ...p, ...s };
      set('algorithmSettings', u);
      return u;
    });
  };

  const clearCache = async () => {
    await del('trendingCache');
    setTrendingCache(null);
    await clearOfflineCache();
    refreshCacheStats();
  };

  const clearAppData = async () => {
    const keysToClear = [
      'likedSongs', 'dislikedSongs', 'history', 'localPlaylists', 'visualSettings', 'appSettings', 'audioSettings', 'algorithmSettings',
      'trendingCache', 'dailyMixes', 'dailyMixesTimestamp', 'notifications'
    ];
    await Promise.all(keysToClear.map((k) => del(k)));
    await clearOfflineCache();

    setLikedSongs([]);
    setDislikedSongs([]);
    setHistory([]);
    setLocalPlaylists([]);
    setUserProfile(null);
    setUserPlaylists([]);
    setTrendingCache(null);
    setDailyMixes(null);
    setDailyMixesTimestamp(null);
    setHomeRecommendations([]);
    setNotifications([]);
    setAudioSettings(DEFAULT_AUDIO_SETTINGS);
    setVisualSettings(DEFAULT_VISUAL_SETTINGS);
    setAppSettings(DEFAULT_APP_SETTINGS);
    setAlgorithmSettings(DEFAULT_ALGORITHM_SETTINGS);
    set('visualSettings', DEFAULT_VISUAL_SETTINGS);
    set('appSettings', DEFAULT_APP_SETTINGS);
    set('audioSettings', DEFAULT_AUDIO_SETTINGS);
    set('algorithmSettings', DEFAULT_ALGORITHM_SETTINGS);
    if (window.electron) window.electron.send('update-app-settings', DEFAULT_APP_SETTINGS);

    localStorage.removeItem('sc_oauth_token');
    localStorage.removeItem('sc_client_id');
    localStorage.removeItem('player_volume');
    localStorage.setItem('persist_cache', DEFAULT_APP_SETTINGS.persistCache ? 'true' : 'false');
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
    // Remove from disliked if liking
    if (isDisliked(track.id)) toggleDislike(track);
  };

  const toggleDislike = (track) => {
    setDislikedSongs(p => {
      const exists = p.find(t => t.id === track.id);
      const n = exists ? p.filter(t => t.id !== track.id) : [track, ...p];
      set('dislikedSongs', n);
      return n;
    });
    // Remove from likes if disliking
    if (isLiked(track.id)) toggleLike(track);
  };

  const isLiked = (id) => likedSongs.some(t => t.id === id);
  const isDisliked = (id) => dislikedSongs.some(t => t.id === id);

  const addToHistory = (t) => { setHistory(p => { const n = [t, ...p.filter(x => x.id !== t.id)].slice(0, 50); set('history', n); return n; }); };

  const [sidebarSubItems, setSidebarSubItems] = useState(null); // { parentId: string, items: [{ id, label, icon? }], onSelect: fn }

  const value = React.useMemo(() => ({
    likedSongs, dislikedSongs, history, localPlaylists, userProfile, userPlaylists,
    visualSettings, appSettings, audioSettings, algorithmSettings, trendingCache, t,
    dailyMixes, dailyMixesTimestamp, updateDailyMixes, logout,
    homeRecommendations, setHomeRecommendations,
    notifications, addNotification, markNotificationsRead, clearNotifications,
    cacheStats, refreshCacheStats,
    isSyncing, syncSoundCloud, toasts, showToast,
    updateVisualSettings, updateAppSettings, updateAudioSettings, updateAlgorithmSettings, setTrendingCache,
    createPlaylist, addToPlaylist, removeFromPlaylist, deletePlaylist, 
    toggleLike, isLiked, toggleDislike, isDisliked, 
    addToHistory, clearCache, clearAppData,
    sidebarSubItems, setSidebarSubItems
  }), [
    likedSongs, dislikedSongs, history, localPlaylists, userProfile, userPlaylists,
    visualSettings, appSettings, audioSettings, algorithmSettings, trendingCache, t,
    dailyMixes, dailyMixesTimestamp, homeRecommendations, notifications, cacheStats,
    isSyncing, toasts, sidebarSubItems,
    // Functions (these should technically be wrapped in useCallback too for max efficacy, but useMemo on value is the big win)
    updateDailyMixes, logout, setHomeRecommendations, addNotification, markNotificationsRead, clearNotifications,
    refreshCacheStats, syncSoundCloud, showToast, updateVisualSettings, updateAppSettings, updateAudioSettings, 
    updateAlgorithmSettings, setTrendingCache, createPlaylist, addToPlaylist, removeFromPlaylist, deletePlaylist, 
    toggleLike, isLiked, toggleDislike, isDisliked, addToHistory, clearCache, clearAppData, setSidebarSubItems
  ]);

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};