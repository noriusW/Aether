import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Home, Library, Radio, Clock, Heart, Play, SkipBack, SkipForward, Volume2, VolumeX, Disc, LayoutGrid, User, Pause, Settings as SettingsIcon, Loader2, Sparkles, ListMusic, AlignLeft, Bell, Shuffle, Repeat, Check, Music2, Maximize2 } from 'lucide-react';
import TitleBar from './components/TitleBar';
import Loader from './components/Loader';
import SearchBar from './components/SearchBar';
import ContextMenu from './components/ContextMenu';
import NotificationCenter from './components/NotificationCenter';
import AudioVisualizer from './components/AudioVisualizer';
import LyricsOverlay from './components/LyricsOverlay';
import ResizeBorders from './components/ResizeBorders';
import Magnetic from './components/Magnetic';
import ZenMode from './components/ZenMode';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { UserDataProvider, useUserData } from './context/UserDataContext';
import { ExtensionProvider, useExtensions } from './context/ExtensionContext';
import { ThemeProvider, ThemeStyle } from './context/ThemeContext';
import BackgroundLayer from './components/BackgroundLayer';
import { processAetherQuery } from './utils/smartSearch';
import { setUserCredentials } from './services/soundcloud';
import { checkUpdates } from './services/updateService';
import { generateTrackRadio, generateArtistRadio, generatePlaylistRadio } from './services/recommendationService';

// Lazy Load Views
const HomeView = React.lazy(() => import('./views/Home'));
const DiscoverView = React.lazy(() => import('./views/Discover'));
const RadioView = React.lazy(() => import('./views/Radio'));
const LibraryView = React.lazy(() => import('./views/Library'));
const HistoryView = React.lazy(() => import('./views/History'));
const SettingsView = React.lazy(() => import('./views/Settings'));
const ProfileView = React.lazy(() => import('./views/Profile'));
const PlaylistDetail = React.lazy(() => import('./views/PlaylistDetail'));
const ArtistProfile = React.lazy(() => import('./views/ArtistProfile'));
const PlaylistsView = React.lazy(() => import('./views/PlaylistsView'));
const QueueView = React.lazy(() => import('./views/Queue'));

const SubSidebarList = ({ parentId, currentActive, config }) => {
  if (currentActive !== parentId || !config || config.parentId !== parentId) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }} 
      animate={{ opacity: 1, height: 'auto' }} 
      exit={{ opacity: 0, height: 0 }}
      className="ml-9 space-y-1 mb-3 border-l border-white/10 pl-3 overflow-hidden"
    >
       {config.items.map(item => (
         <button 
           key={item.id} 
           onClick={(e) => { e.stopPropagation(); config.onSelect(item.id); }}
           className={`text-[10px] font-black uppercase tracking-[0.15em] block py-1.5 w-full text-left transition-all ${config.activeId === item.id ? 'text-indigo-400' : 'text-white/30 hover:text-white'}`}
         >
           {item.label}
         </button>
       ))}
    </motion.div>
  );
};

const MainApp = () => {
  const { userProfile, syncSoundCloud, visualSettings, localPlaylists, addToPlaylist, toggleLike, toggleDislike, appSettings, t, toasts, showToast, removeFromPlaylist, notifications, addNotification, markNotificationsRead, sidebarSubItems } = useUserData();
  const { playTrack, togglePlay, currentTrack, setQueue, handleNext } = usePlayer(); 
  const { extensionViews } = useExtensions();
  const [appState, setAppState] = useState('BOOT');
  const [activeTab, setActiveTab] = useState('HOME');
  const [isZenMode, setIsZenMode] = useState(false);

  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [menu, setMenu] = useState(null); 
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const mainRef = useRef(null);

  useEffect(() => {
    const bootTimer = setTimeout(() => {
      setAppState('EXPANDING');
      if (window.electron) window.electron.send('resize-window', { width: 'max', height: 'max', center: true });
    }, 2500);
    const authTimer = setTimeout(() => setAppState(userProfile ? 'DASHBOARD' : 'AUTH'), 3800);
    return () => { clearTimeout(bootTimer); clearTimeout(authTimer); };
  }, [userProfile]);

  useEffect(() => {
    if (appState !== 'DASHBOARD') return;
    let cancelled = false;

    const handleUpdateStatus = (payload) => {
      if (!payload || cancelled) return;
      if (payload.code === 'available') {
        addNotification({
          type: 'update', level: 'info',
          title: `${t.update_available} v${payload.version || ''}`.trim(),
          body: payload.notes ? String(payload.notes).split('\n').find((line) => line.trim()) : '',
          notes: payload.notes || '', key: `update-${payload.version || 'available'}`, url: payload.url
        });
      }
      if (payload.code === 'download-progress') {
        addNotification({
          type: 'update', level: 'info', title: t.update_downloading || 'Downloading update',
          body: `${payload.percent || 0}%`, progress: payload.percent || 0, key: 'update-download'
        });
      }
      if (payload.code === 'downloaded') {
        addNotification({
          type: 'update', level: 'success', title: t.update_ready || 'Update ready',
          body: t.update_restart || 'Restart to finish installing the update.',
          notes: payload.notes || '', key: 'update-downloaded', action: 'install-update', ctaLabel: t.update_install || 'Install update'
        });
      }
      if (payload.code === 'error') {
        addNotification({ type: 'update', level: 'warning', title: t.update_failed, body: payload.message || t.update_failed, key: 'update-error' });
      }
    };

    if (window.electron) {
      window.electron.off('update-status');
      window.electron.on('update-status', handleUpdateStatus);
      if (appSettings.autoUpdate !== false) window.electron.invoke('check-for-updates').catch(() => {});
      return () => { cancelled = true; window.electron.off('update-status'); };
    }
    return () => { cancelled = true; };
  }, [appState, addNotification, appSettings.autoUpdate, t]);

  useEffect(() => {
    const handleOffline = () => addNotification({ type: 'connection', level: 'warning', title: t.connection_offline, body: t.sync_paused, key: 'connection-status' });
    const handleOnline = () => addNotification({ type: 'connection', level: 'success', title: t.connection_online, key: 'connection-status' });
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    if (typeof navigator !== 'undefined' && navigator.onLine === false) handleOffline();
    return () => { window.removeEventListener('offline', handleOffline); window.removeEventListener('online', handleOnline); };
  }, [addNotification]);

  useEffect(() => {
    const closeAll = () => { setMenu(null); setShowNotifications(false); };
    window.addEventListener('click', closeAll);
    const contextHandler = (e) => {
      const bounds = mainRef.current?.getBoundingClientRect() || null;
      const localX = bounds ? e.detail.x - bounds.left : e.detail.x;
      const localY = bounds ? e.detail.y - bounds.top : e.detail.y;
      setMenu({ x: localX, y: localY, track: e.detail.track, type: e.detail.type, bounds: bounds ? { width: bounds.width, height: bounds.height } : null });
    };
    window.addEventListener('track-context-menu', contextHandler);
    return () => { window.removeEventListener('click', closeAll); window.removeEventListener('track-context-menu', contextHandler); };
  }, [togglePlay]);

  const handleMenuAction = async (action, payload) => {
    const item = menu?.track;
    if (!item && !payload) return;
    if (action === 'play') playTrack(item);
    if (action === 'queue') { setQueue(prev => [...prev, item]); showToast(t.ctx_queue); }
    if (action === 'radio') { showToast(t.neural_wave_initiated); const tracks = await generateTrackRadio(item); setQueue(tracks); playTrack(tracks[0]); }
    if (action === 'open_artist') { 
        setSelectedArtist(item.id || item.artistId); 
        setSelectedPlaylist(null); 
        setActiveTab('DISCOVER'); // Sync navigation
    }
    if (action === 'add_playlist' && payload) { addToPlaylist(payload.id, item); showToast(`Added to ${payload.title}`); }
    if (action === 'remove_playlist' && payload) { removeFromPlaylist(payload.id, item.id); showToast(t.ctx_remove); }
    if (action === 'like') { toggleLike(item); showToast('Library Updated'); }
    if (action === 'dislike') { toggleDislike(item); showToast("Track blocked"); if (currentTrack?.id === item.id) handleNext(); }
    if (action === 'play_playlist') { const tracks = item.tracks || []; if (tracks.length) { setQueue(tracks); playTrack(tracks[0]); } }
    if (action === 'playlist_radio') { showToast(t.neural_wave_initiated); const tracks = await generatePlaylistRadio(item); setQueue(tracks); playTrack(tracks[0]); }
    if (action === 'artist_radio') { showToast(t.neural_wave_initiated); const tracks = await generateArtistRadio(item.title || item.artist); setQueue(tracks); playTrack(tracks[0]); }
    setMenu(null);
  };

  const handleAuth = async () => {
    if (window.electron) {
      setIsAuthenticating(true);
      try {
        const c = await window.electron.invoke('authenticate-soundcloud');
        if (c) { setUserCredentials(c.clientId, c.token); await syncSoundCloud(); setAppState('DASHBOARD'); }
      } catch (e) {} finally { setIsAuthenticating(false); }
    }
  };

  const handleSearchQuery = (query) => {
    setSearchQuery(query);
    setSelectedPlaylist(null);
    setSelectedArtist(null);
    setActiveTab('DISCOVER');
  };

  const isSmall = appState === 'BOOT';
  const isCompactSidebar = windowWidth <= 960;
  const hasUnread = notifications.some((n) => !n.read);
  const visibleExtensionViews = (extensionViews || []).filter((view) => view && view.id && view.showInSidebar !== false && !view.replaceId);
  const extensionView = (extensionViews || []).find((view) => view?.id === activeTab && !view.replaceId);
  const replacementView = (extensionViews || []).find((view) => view?.replaceId === activeTab);

  const renderExtensionIcon = (icon) => {
    if (!icon) return <Sparkles size={16} />;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === 'function') { const Icon = icon; return <Icon size={16} />; }
    return <Sparkles size={16} />;
  };

  const renderExtensionView = (view) => {
    if (!view) return null;
    if (typeof view.render === 'function') return view.render();
    const Component = view.component;
    return Component ? <Component /> : null;
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    enter: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="flex items-center justify-center w-screen h-screen overflow-hidden bg-transparent">
        <BackgroundLayer />
        <ResizeBorders />
        <AnimatePresence>{isZenMode && <ZenMode onClose={() => setIsZenMode(false)} />}</AnimatePresence>
      <motion.div
        layout initial={{ width: 340, height: 340, borderRadius: 40, opacity: 0 }}
        animate={{ width: isSmall ? 340 : '100%', height: isSmall ? 340 : '100%', borderRadius: isSmall ? 40 : 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className={`relative overflow-hidden flex flex-col ${isSmall ? 'bg-black' : 'glass-surface bg-transparent'}`}
        style={{ backgroundColor: isSmall ? '#000000' : `rgba(var(--surface-rgb), ${visualSettings.glassOpacity / 100})` }}
      >
        {visualSettings.animations && <><div className="amoled-bg-anim"></div><div className="noise-overlay"></div></>}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
           <AnimatePresence>{toasts.map(t => (<motion.div key={t.id} initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }} className="bg-indigo-600/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 font-bold text-xs uppercase tracking-widest"><Check size={14} />{t.message}</motion.div>))}</AnimatePresence>
        </div>
        <AnimatePresence>{appState === 'BOOT' && <motion.div key="loader" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black"><div className="w-32 h-32 flex items-center justify-center"><Loader /></div></motion.div>}</AnimatePresence>
        <AnimatePresence>{appState === 'AUTH' && !userProfile && (
            <motion.div key="auth" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.8 }} className="absolute inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-xl">
               <div className="relative w-[420px] p-10 rounded-[32px] flex flex-col items-center border border-white/10 shadow-2xl overflow-hidden" style={{ backgroundColor: 'rgba(var(--surface-rgb), 0.8)' }}>
                   <div className="absolute top-0 right-0 p-4"><TitleBar /></div>
                   {isAuthenticating ? (
                     <div className="flex flex-col items-center py-12 animate-in fade-in duration-500"><div className="relative mb-8"><Loader size={48} /><div className="absolute inset-0 animate-ping opacity-20"><Loader size={48} /></div></div><h2 className="text-xl font-bold text-white mb-2">{t.auth_waiting || 'Waiting for Login...'}</h2><p className="text-white/60 text-xs text-center max-w-[240px] leading-relaxed">Please complete the sign-in process in the secure browser window.</p></div>
                   ) : (
                     <>
                       <div className="mb-8 rotate-6"><Sparkles className="text-indigo-400 w-16 h-16" /></div>
                       <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">Aether</h1>
                       <p className="text-white/50 text-xs mb-8 uppercase tracking-widest font-bold">Sonic Interface v1.2 Beta</p>
                       <div className="w-full space-y-4">
                         <button onClick={handleAuth} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded-xl hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5">{t.auth_title}</button>
                         <div className="flex gap-3"><button onClick={() => setShowManualInput(true)} className="flex-1 py-3 bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all border border-white/5 hover:text-white">{t.auth_token}</button><button onClick={() => setAppState('DASHBOARD')} className="flex-1 py-3 bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all border border-white/5 hover:text-white">{t.auth_guest}</button></div>
                       </div>
                     </>
                   )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>{(appState === 'DASHBOARD' || (appState === 'AUTH' && userProfile)) && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex overflow-hidden relative z-10">
              <aside className={`flex flex-col z-20 transition-all duration-500 border-r border-white/5 backdrop-blur-md ${isCompactSidebar ? 'w-[72px] px-3 py-6' : 'w-[280px] p-6'}`} style={{ backgroundColor: `rgba(var(--surface-2-rgb), ${visualSettings.sidebarOpacity / 100})` }}>
                <div className={`flex items-center gap-4 mb-12 mt-2 ${isCompactSidebar ? 'justify-center' : 'px-2'}`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20"><Disc size={16} className="text-white" /></div>
                  {!isCompactSidebar && <span className="font-black tracking-tighter text-lg uppercase text-white">Aether</span>}
                </div>
                <div className={`flex-1 w-full overflow-y-auto custom-scrollbar ${isCompactSidebar ? 'space-y-6' : 'space-y-8'}`}>
                   <div className="space-y-2">
                      <SidebarItem compact={isCompactSidebar} icon={<Home size={18} />} label={t.home} active={activeTab === 'HOME' && !selectedPlaylist && !selectedArtist} onClick={() => { setActiveTab('HOME'); setSelectedPlaylist(null); setSelectedArtist(null); }} />
                      
                      <SidebarItem compact={isCompactSidebar} icon={<LayoutGrid size={18} />} label={t.discover} active={activeTab === 'DISCOVER' && !selectedPlaylist && !selectedArtist} onClick={() => { setActiveTab('DISCOVER'); setSelectedPlaylist(null); setSelectedArtist(null); }} />
                      {!isCompactSidebar && <SubSidebarList parentId="DISCOVER" currentActive={activeTab} config={sidebarSubItems} />}

                      <SidebarItem compact={isCompactSidebar} icon={<Radio size={18} />} label={t.radio} active={activeTab === 'RADIO' && !selectedPlaylist && !selectedArtist} onClick={() => { setActiveTab('RADIO'); setSelectedPlaylist(null); setSelectedArtist(null); }} />
                   </div>
                   <div className="space-y-2">
                      <SidebarItem compact={isCompactSidebar} icon={<Heart size={18} />} label={t.likes} active={activeTab === 'LIKED'} onClick={() => { setActiveTab('LIKED'); setSelectedPlaylist(null); setSelectedArtist(null); }} />
                      
                      <SidebarItem compact={isCompactSidebar} icon={<ListMusic size={18} />} label={t.playlists} active={activeTab === 'PLAYLISTS'} onClick={() => { setActiveTab('PLAYLISTS'); setSelectedPlaylist(null); setSelectedArtist(null); }} />
                      {!isCompactSidebar && <SubSidebarList parentId="PLAYLISTS" currentActive={activeTab} config={sidebarSubItems} />}

                      <SidebarItem compact={isCompactSidebar} icon={<Clock size={18} />} label={t.history} active={activeTab === 'HISTORY'} onClick={() => { setActiveTab('HISTORY'); setSelectedPlaylist(null); setSelectedArtist(null); }} />
                   </div>
                   {visibleExtensionViews.length > 0 && (
                     <div className="space-y-2">
                       {visibleExtensionViews.map((view) => (
                         <SidebarItem key={view.id} compact={isCompactSidebar} icon={renderExtensionIcon(view.icon)} label={view.label || view.id} active={activeTab === view.id} onClick={() => { setActiveTab(view.id); setSelectedPlaylist(null); setSelectedArtist(null); }} />
                       ))}
                     </div>
                   )}
                </div>
                <div className="mt-auto flex flex-col gap-3 w-full">
                  <motion.div onClick={() => { setActiveTab('SETTINGS'); setSelectedPlaylist(null); setSelectedArtist(null); }} className={`flex items-center rounded-2xl cursor-pointer transition-all ${isCompactSidebar ? 'justify-center px-0 py-4' : 'gap-4 px-4 py-3'} ${activeTab === 'SETTINGS' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}><SettingsIcon size={18} />{!isCompactSidebar && <span className="text-sm font-bold">{t.settings}</span>}</motion.div>
                  <motion.div onClick={() => { setActiveTab('PROFILE'); setSelectedPlaylist(null); setSelectedArtist(null); }} className={`rounded-2xl border border-white/5 flex items-center hover:bg-white/[0.08] cursor-pointer group bg-black/20 backdrop-blur-sm ${isCompactSidebar ? 'justify-center p-2' : 'gap-3 p-3'}`}>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">{userProfile?.avatar_url ? <img src={userProfile.avatar_url} className="w-full h-full object-cover" /> : <User size={16} className="text-white/50" />}</div>
                    {!isCompactSidebar && <div className="flex flex-col min-w-0"><span className="text-xs font-bold text-white truncate">{userProfile?.username || 'Guest'}</span><span className="text-[9px] text-white/30 truncate uppercase tracking-widest font-bold">{userProfile ? t.connected : t.local}</span></div>}
                  </motion.div>
                  {!isCompactSidebar && <SubSidebarList parentId="PROFILE" currentActive={activeTab} config={sidebarSubItems} />}
                </div>
              </aside>
              <main ref={mainRef} className="flex-1 flex flex-col relative overflow-hidden bg-transparent transition-all duration-500">
                <div className="h-24 flex items-center px-8 z-30 relative justify-between">
                   <div className="flex items-center gap-4 no-drag relative">
                      <SearchBar onSearch={handleSearchQuery} t={t} />
                      <div className="relative"><motion.button onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); if (!showNotifications) markNotificationsRead(); }} className={`p-3.5 rounded-2xl border border-white/5 bg-black/20 backdrop-blur-md transition-all cursor-pointer ${showNotifications || hasUnread ? 'text-indigo-400 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'text-white/30 hover:text-white hover:bg-white/10'}`}><Bell size={18} />{hasUnread && <div className="absolute top-3 right-3 w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>}</motion.button><AnimatePresence>{showNotifications && <NotificationCenter onClose={() => setShowNotifications(false)} />}</AnimatePresence></div>
                   </div>
                   <div className="flex-1 h-full title-bar-drag mx-4"></div><div className="no-drag"><TitleBar /></div>
                </div>
                <div className="flex-1 overflow-hidden relative z-10">
                  <AnimatePresence mode="wait">
                    <Suspense fallback={<div className="flex-1 h-full flex items-center justify-center"><Loader /></div>}>
                      <motion.div key={selectedPlaylist || selectedArtist || activeTab} variants={pageVariants} initial="initial" animate="enter" exit="exit" className="absolute inset-0 flex flex-col">
                        {selectedPlaylist ? <PlaylistDetail playlistId={selectedPlaylist} onBack={() => setSelectedPlaylist(null)} onOpenArtist={(id) => { setSelectedPlaylist(null); setSelectedArtist(id); setActiveTab('DISCOVER'); }} />
                        : selectedArtist ? <ArtistProfile artistId={selectedArtist} onBack={() => { setSelectedArtist(null); setSelectedPlaylist(null); }} />
                        : replacementView ? renderExtensionView(replacementView)
                        : extensionView ? renderExtensionView(extensionView)
                        : <>
                          {activeTab === 'HOME' && <HomeView />}
                          {activeTab === 'DISCOVER' && <DiscoverView query={searchQuery} onOpenPlaylist={setSelectedPlaylist} onOpenArtist={(id) => { setSelectedArtist(id); setActiveTab('DISCOVER'); }} />}
                          {activeTab === 'RADIO' && <RadioView />}
                          {activeTab === 'LIKED' && <LibraryView />}
                          {activeTab === 'PLAYLISTS' && <PlaylistsView onOpenPlaylist={setSelectedPlaylist} />}
                          {activeTab === 'HISTORY' && <HistoryView />}
                          {activeTab === 'QUEUE' && <QueueView />}
                          {activeTab === 'SETTINGS' && <SettingsView />}
                          {activeTab === 'PROFILE' && <ProfileView />}
                        </>}
                      </motion.div>
                    </Suspense>
                  </AnimatePresence>
                </div>
                <PlayerBar onOpenArtist={(id) => { setSelectedArtist(id); setSelectedPlaylist(null); setActiveTab('DISCOVER'); }} onOpenQueue={() => { setActiveTab('QUEUE'); setSelectedPlaylist(null); setSelectedArtist(null); }} onToggleZen={() => setIsZenMode(!isZenMode)} isLyricsOpen={showLyrics} />
                <AnimatePresence>{showLyrics && currentTrack && <LyricsOverlay track={currentTrack} onClose={() => setShowLyrics(false)} />}</AnimatePresence>
                {menu && <ContextMenu x={menu.x} y={menu.y} track={menu.track} onClose={() => setMenu(null)} onAction={handleMenuAction} playlists={localPlaylists} containerBounds={menu.bounds} />}
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const PlayerBar = ({ onOpenArtist, onOpenQueue, onToggleZen, isLyricsOpen }) => {
  const { currentTrack, isPlaying, isLoadingStream, togglePlay, handleNext, handlePrev, volume, setVolume, isMuted, toggleMute, isShuffle, setIsShuffle, repeatMode, setRepeatMode, progress, duration, seek, analyserRef } = usePlayer();
  const { toggleLike, isLiked, t, visualSettings } = useUserData();
  
  return (
    <div className="absolute bottom-6 left-0 w-full px-6 pointer-events-none z-40 flex justify-center">
      <motion.div 
        layout
        layoutId="player-island"
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className={`pointer-events-auto overflow-hidden relative ${currentTrack ? 'w-full max-w-5xl rounded-[32px]' : 'rounded-full'}`}
      >
        {/* Glass Background & Theme Glow */}
        <div className="absolute inset-0 bg-[#050505]/60 backdrop-blur-3xl border border-white/[0.08] z-0" />
        
        {/* Ambient Visualizer Background */}
        {currentTrack && visualSettings.visualizerStyle === 'ambient' && (
           <>
             <div 
               className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-50 blur-xl pointer-events-none z-0" 
               style={{ '--theme-glow': visualSettings.accentColor }}
             />
             <div className="absolute inset-x-0 bottom-0 h-32 opacity-20 pointer-events-none z-0 mask-linear-fade-up">
                <AudioVisualizer isPlaying={isPlaying} analyserRef={analyserRef} />
             </div>
           </>
        )}

        <div className="relative z-20 p-2 pr-6">
          <AnimatePresence mode="popLayout">
            {!currentTrack ? (
               <motion.div 
                 key="empty" 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 transition={{ duration: 0.2 }}
                 className="flex items-center gap-3 py-2 px-6"
               >
                 <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                 <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold whitespace-nowrap">{t.awaiting_input}</span>
               </motion.div>
            ) : (
               <motion.div 
                 key="active" 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 transition={{ duration: 0.3 }}
                 className="flex items-center justify-between w-full"
               >
                 <div className="flex items-center gap-4 w-[30%]">
                    <div className={`w-14 h-14 rounded-2xl border border-white/10 relative overflow-hidden shrink-0 bg-black shadow-lg group ${isPlaying ? '' : ''}`}>
                        <img src={currentTrack.artwork || `https://ui-avatars.com/api/?name=${currentTrack.title}&background=random&color=fff&size=200`} className={`absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-[10s] ${isPlaying ? 'scale-110' : 'scale-100'}`} />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <button onClick={(e) => { e.stopPropagation(); if (onOpenQueue) onOpenQueue(); }} className="text-sm font-bold text-white truncate text-left hover:text-indigo-400 transition-colors">{currentTrack.title}</button>
                      <button onClick={(e) => { e.stopPropagation(); if (currentTrack.artistId) onOpenArtist(currentTrack.artistId); }} className="text-xs text-left text-white/50 truncate font-medium hover:text-white transition-all cursor-pointer w-fit">{currentTrack.artist}</button>
                    </div>
                    <button onClick={() => toggleLike(currentTrack)} className={`ml-2 p-2 rounded-full hover:bg-white/10 transition-colors ${isLiked(currentTrack.id) ? 'text-indigo-400' : 'text-white/20'}`}><Heart size={18} fill={isLiked(currentTrack.id) ? "currentColor" : "none"} /></button>
                 </div>

                 <div className="flex flex-col items-center w-[40%] gap-2 px-4">
                    <div className="flex items-center gap-6">
                       <button onClick={() => setIsShuffle(!isShuffle)} className={`p-1.5 transition-colors ${isShuffle ? 'text-indigo-400' : 'text-white/20 hover:text-white'}`}><Shuffle size={16} /></button>
                       <Magnetic><button onClick={handlePrev} className="text-white/50 hover:text-white transition-colors"><SkipBack size={20} /></button></Magnetic>
                       <Magnetic>
                         <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-shadow">
                           {isLoadingStream ? <Loader2 size={20} className="animate-spin" /> : (isPlaying ? <Pause fill="black" size={20} /> : <Play fill="black" size={20} className="ml-1" />)}
                         </button>
                       </Magnetic>
                       <Magnetic><button onClick={handleNext} className="text-white/50 hover:text-white transition-colors"><SkipForward size={20} /></button></Magnetic>
                       <button onClick={() => setRepeatMode(repeatMode === 'OFF' ? 'ALL' : repeatMode === 'ALL' ? 'ONE' : 'OFF')} className={`p-1.5 transition-colors relative ${repeatMode !== 'OFF' ? 'text-indigo-400' : 'text-white/20 hover:text-white'}`}>{repeatMode === 'ONE' ? <div className="relative"><Repeat size={16} /><span className="absolute -top-1 -right-2 text-[8px] font-bold">1</span></div> : <Repeat size={16} />}</button>
                    </div>
                    
                    {/* Seek Bar */}
                    <div className="w-full h-4 flex items-center cursor-pointer relative group/seek mt-2">
                       {visualSettings.visualizerStyle === 'compact' && (
                          <div className="absolute inset-0 opacity-40 pointer-events-none flex items-end pb-1 overflow-hidden mask-linear-fade"><AudioVisualizer isPlaying={isPlaying} analyserRef={analyserRef} /></div>
                       )}
                       <input type="range" min="0" max={duration || 100} value={progress} onChange={(e) => seek(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30" />
                       
                       {/* Track Line */}
                       <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 rounded-full overflow-hidden -translate-y-1/2 group-hover/seek:h-1.5 transition-all duration-300">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full relative shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${(progress / (duration || 1)) * 100}%` }}>
                             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover/seek:opacity-100 transition-opacity shadow-lg scale-150"></div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center justify-end gap-3 w-[30%]">
                    <button onClick={onToggleZen} className={`p-2 rounded-full transition-all ${false ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/30 hover:text-white hover:bg-white/10'}`} title="Zen Mode"><Maximize2 size={18} /></button>
                    <div className="flex items-center gap-2 group/vol">
                        <button onClick={toggleMute} className="text-white/30 hover:text-white transition-colors">{isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} />}</button>
                        <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden relative">
                           <div className="absolute inset-0 bg-indigo-500 origin-left transition-transform" style={{ transform: `scaleX(${isMuted ? 0 : volume})` }}></div>
                           <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={(e) => setVolume(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                    </div>
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick, compact = false }) => (
  <motion.div layout onClick={onClick} title={compact ? label : undefined} className={`flex items-center w-full rounded-xl cursor-pointer transition-all group relative overflow-hidden ${compact ? 'justify-center px-0 py-3' : 'gap-4 px-4 py-3'} ${active ? 'text-white' : 'text-white/40 hover:text-white'}`} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
    {active && <motion.div layoutId="activeSidebar" className="absolute inset-0 bg-white/10 border-l-2 border-indigo-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
    <Magnetic className="relative z-10 flex items-center gap-4 w-full"><div className={`${active ? 'text-indigo-400' : 'group-hover:text-white/90'} transition-colors`}>{icon}</div>{!compact && <span className="text-sm font-bold tracking-wide transition-all">{label}</span>}</Magnetic>
  </motion.div>
);

const AppShell = () => {
  const { appShell } = useExtensions();
  const content = (() => {
    if (appShell?.render) return appShell.render({ DefaultApp: MainApp });
    const ShellComponent = appShell?.component || appShell;
    return ShellComponent ? <ShellComponent DefaultApp={MainApp} /> : <MainApp />;
  })();

  return (
    <><ThemeStyle />{content}</>
  );
};

const App = () => (<UserDataProvider><ExtensionProvider><ThemeProvider><PlayerProvider><AppShell /></PlayerProvider></ThemeProvider></ExtensionProvider></UserDataProvider>);
export default App;
