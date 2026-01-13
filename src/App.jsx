import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Home, Library, Radio, Clock, Heart, Play, SkipBack, SkipForward, Volume2, VolumeX, Mic2, Disc, LayoutGrid, Music2, User, Pause, Settings as SettingsIcon, Loader2, Sparkles, MoreHorizontal, ListMusic, AlignLeft, Bell, Download, Shuffle, Repeat, X, Check } from 'lucide-react';
import TitleBar from './components/TitleBar';
import Loader from './components/Loader';
import HomeView from './views/Home';
import DiscoverView from './views/Discover';
import RadioView from './views/Radio';
import LibraryView from './views/Library';
import HistoryView from './views/History';
import SettingsView from './views/Settings';
import ProfileView from './views/Profile';
import PlaylistDetail from './views/PlaylistDetail';
import ArtistProfile from './views/ArtistProfile';
import PlaylistsView from './views/PlaylistsView';
import ContextMenu from './components/ContextMenu';
import NotificationCenter from './components/NotificationCenter';
import AudioVisualizer from './components/AudioVisualizer';
import LyricsOverlay from './components/LyricsOverlay';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { UserDataProvider, useUserData } from './context/UserDataContext';
import { processAetherQuery } from './utils/smartSearch';
import { checkUpdates } from './services/updateService';
import { generateTrackRadio, generateArtistRadio, generatePlaylistRadio } from './services/recommendationService';

const MainApp = () => {
  const { userProfile, syncSoundCloud, visualSettings, localPlaylists, addToPlaylist, toggleLike, appSettings, t, toasts, showToast, removeFromPlaylist } = useUserData();
  const { playTrack, togglePlay, currentTrack, setQueue } = usePlayer(); 
  const [appState, setAppState] = useState('BOOT');
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [activeTab, setActiveTab] = useState('HOME');

  useEffect(() => {
    if (window.electron) {
      window.electron.on('window-focus-change', (focused) => setIsWindowFocused(focused));
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [tempSearch, setTempSearch] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [menu, setMenu] = useState(null); 
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const bootTimer = setTimeout(() => {
      setAppState('EXPANDING');
      if (window.electron) window.electron.send('resize-window', { width: 'max', height: 'max', center: true });
    }, 2500);
    const authTimer = setTimeout(() => setAppState(userProfile ? 'DASHBOARD' : 'AUTH'), 3800);
    return () => { clearTimeout(bootTimer); clearTimeout(authTimer); };
  }, [userProfile]);

  useEffect(() => {
    if (appState === 'DASHBOARD') {
      checkUpdates().then(info => { if (info.available) setUpdateInfo(info); });
    }
  }, [appState]);

  useEffect(() => {
    const closeAll = () => { setMenu(null); setShowNotifications(false); };
    window.addEventListener('click', closeAll);
    const contextHandler = (e) => setMenu({ x: e.detail.x, y: e.detail.y, track: e.detail.track, type: e.detail.type });
    window.addEventListener('track-context-menu', contextHandler);
    if (window.electron) {
      window.electron.off('toggle-play-tray');
      window.electron.off('next-track-tray');
      window.electron.off('prev-track-tray');
      window.electron.on('toggle-play-tray', () => togglePlay());
      window.electron.on('next-track-tray', () => window.dispatchEvent(new CustomEvent('tray-next-track')));
      window.electron.on('prev-track-tray', () => window.dispatchEvent(new CustomEvent('tray-prev-track')));
    }
    return () => { window.removeEventListener('click', closeAll); window.removeEventListener('track-context-menu', contextHandler); };
  }, [togglePlay]);

  const handleMenuAction = async (action, payload) => {
    const item = menu?.track;
    const type = menu?.type;
    if (!item && !payload) return;

    if (action === 'play') playTrack(item);
    if (action === 'queue') {
       setQueue(prev => [...prev, item]);
       showToast(t.ctx_queue);
    }
    if (action === 'radio') {
       showToast('Neural Wave Initiated');
       const tracks = await generateTrackRadio(item);
       setQueue(tracks); playTrack(tracks[0]);
    }
    if (action === 'open_artist') setSelectedArtist(item.id || item.artistId);
    if (action === 'add_playlist' && payload) { addToPlaylist(payload.id, item); showToast(`Added to ${payload.title}`); }
    if (action === 'remove_playlist' && payload) { 
       removeFromPlaylist(payload.id, item.id); 
       showToast(t.ctx_remove); 
    }
    if (action === 'like') { toggleLike(item); showToast('Library Updated'); }
    if (action === 'play_playlist') {
       const tracks = item.tracks || [];
       if (tracks.length) { setQueue(tracks); playTrack(tracks[0]); }
    }
    if (action === 'playlist_radio') {
       showToast('Neural Wave Initiated');
       const tracks = await generatePlaylistRadio(item);
       setQueue(tracks); playTrack(tracks[0]);
    }
    if (action === 'artist_radio') {
       showToast('Neural Wave Initiated');
       const tracks = await generateArtistRadio(item.title || item.artist);
       setQueue(tracks); playTrack(tracks[0]);
    }
    setMenu(null);
  };

  const handleAuth = async () => {
    if (window.electron) {
      setIsAuthenticating(true);
      try {
        const c = await window.electron.invoke('authenticate-soundcloud');
        if (c) {
          setUserCredentials(c.clientId, c.token);
          await syncSoundCloud();
          setAppState('DASHBOARD');
        }
      } catch (e) {
        console.error("Auth failed", e);
      } finally {
        setIsAuthenticating(false);
      }
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      const a = processAetherQuery(tempSearch);
      setSearchQuery(a.sc_query);
      setSelectedPlaylist(null); setSelectedArtist(null);
      setActiveTab('DISCOVER');
    }
  };

  const isSmall = appState === 'BOOT';

  return (
    <div className="flex items-center justify-center w-screen h-screen overflow-hidden bg-transparent p-[1px]">
      <motion.div
        layout
        initial={{ width: 340, height: 340, borderRadius: 40, opacity: 0 }}
        animate={{ width: isSmall ? 340 : '100vw', height: isSmall ? 340 : '100vh', borderRadius: isSmall ? 40 : 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden glass-surface flex flex-col bg-[#050505]"
        style={{
          backgroundColor: `rgba(5, 5, 5, ${visualSettings.glassOpacity / 100})`,
          backdropFilter: `blur(${visualSettings.blurAmount}px)`,
          WebkitBackdropFilter: `blur(${visualSettings.blurAmount}px)`,
        }}
      >
        {visualSettings.animations && (
          <>
            <div className="amoled-bg-anim"></div>
            <div className="noise-overlay"></div>
          </>
        )}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
           <AnimatePresence>{toasts.map(t => (<motion.div key={t.id} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-md font-bold text-xs uppercase tracking-widest"><Check size={14} />{t.message}</motion.div>))}</AnimatePresence>
        </div>
        <AnimatePresence>{appState === 'BOOT' && (<motion.div key="loader" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black"><Loader /><p className="mt-6 text-[9px] font-bold tracking-[0.4em] text-white/20 animate-pulse uppercase">Neural Link Sync</p></motion.div>)}</AnimatePresence>
        <AnimatePresence>{appState === 'AUTH' && !userProfile && (
            <motion.div key="auth" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.8 }} className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
               <div className="relative w-[420px] p-10 bg-[#050505]/95 rounded-[32px] flex flex-col items-center border border-white/5 shadow-2xl overflow-hidden">
                   <div className="absolute top-0 right-0 p-4"><TitleBar /></div>
                   
                   {isAuthenticating ? (
                     <div className="flex flex-col items-center py-12 animate-in fade-in duration-500">
                        <div className="relative mb-8">
                           <Loader size={48} />
                           <div className="absolute inset-0 animate-ping opacity-20"><Loader size={48} /></div>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">{t.auth_waiting || 'Waiting for Login...'}</h2>
                        <p className="text-white/40 text-xs text-center max-w-[240px] leading-relaxed">Please complete the sign-in process in the secure browser window.</p>
                     </div>
                   ) : (
                     <>
                       <div className="mb-8 rotate-6"><Sparkles className="text-indigo-400 w-16 h-16" /></div>
                       <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Aether</h1>
                       <p className="text-white/30 text-xs mb-8 uppercase tracking-widest font-black">Sonic Interface v2.0</p>
                       
                       {!showManualInput ? (
                         <div className="w-full space-y-4">
                           <button onClick={handleAuth} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded-xl hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5">
                             {t.auth_title}
                           </button>
                           <div className="flex gap-3">
                             <button onClick={() => setShowManualInput(true)} className="flex-1 py-3 bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all border border-white/5">
                               {t.auth_token}
                             </button>
                             <button onClick={() => setAppState('DASHBOARD')} className="flex-1 py-3 bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all border border-white/5">
                               {t.auth_guest}
                             </button>
                           </div>
                         </div>
                       ) : (
                         <div className="w-full space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                           <input autoFocus type="password" value={manualToken} onChange={(e) => setManualToken(e.target.value)} placeholder="OAuth Token..." className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-sm text-white outline-none focus:border-indigo-500/50 transition-all" />
                           <button onClick={async () => { if (manualToken.startsWith('OAuth')) { setUserCredentials('a281614d7f34dc30b665dfcaa3ed7505', manualToken); await syncSoundCloud(); setAppState('DASHBOARD'); } }} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all">
                             {t.auth_sync}
                           </button>
                           <button onClick={() => setShowManualInput(false)} className="w-full text-[10px] text-white/20 uppercase tracking-widest font-bold hover:text-white transition-colors">
                             {t.auth_back}
                           </button>
                         </div>
                       )}
                     </>
                   )}
               </div>
            </motion.div>
          )}</AnimatePresence>
        <AnimatePresence>{(appState === 'DASHBOARD' || (appState === 'AUTH' && userProfile)) && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex overflow-hidden relative z-10">
              <aside className="w-[260px] flex flex-col p-4 z-20 transition-all duration-500 border-r border-white/5" style={{ backgroundColor: `rgba(0, 0, 0, ${visualSettings.sidebarOpacity / 100})`, backdropFilter: `blur(${visualSettings.blurAmount}px)`, WebkitBackdropFilter: `blur(${visualSettings.blurAmount}px)` }}>
                <div className="flex items-center gap-3 px-3 mb-10 mt-4 opacity-80"><Disc size={14} className="text-indigo-500" /><span className="font-bold tracking-tight text-sm uppercase text-white/90">Aether</span></div>
                <div className="flex-1 space-y-8">
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-white/20 px-3 mb-3 tracking-widest uppercase">{t.settings_general}</p>
                      <SidebarItem icon={<Home size={16} />} label={t.home} active={activeTab === 'HOME' && !selectedPlaylist && !selectedArtist} onClick={() => { setActiveTab('HOME'); setSelectedPlaylist(null); setSelectedArtist(null); }} />
                      <SidebarItem icon={<LayoutGrid size={16} />} label={t.discover} active={activeTab === 'DISCOVER' && !selectedPlaylist && !selectedArtist} onClick={() => { setActiveTab('DISCOVER'); setSelectedPlaylist(null); setSelectedArtist(null); }} />
                      <SidebarItem icon={<Radio size={16} />} label={t.radio} active={activeTab === 'RADIO' && !selectedPlaylist && !selectedArtist} onClick={() => { setActiveTab('RADIO'); setSelectedPlaylist(null); setSelectedArtist(null); }} />
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-white/20 px-3 mb-3 tracking-widest uppercase">{t.playlists}</p>
                      <SidebarItem icon={<Heart size={16} />} label={t.likes} active={activeTab === 'LIKED'} onClick={() => { setActiveTab('LIKED'); setSelectedPlaylist(null); setSelectedArtist(null); }} />
                      <SidebarItem icon={<ListMusic size={16} />} label={t.playlists} active={activeTab === 'PLAYLISTS'} onClick={() => { setActiveTab('PLAYLISTS'); setSelectedPlaylist(null); setSelectedArtist(null); }} />
                      <SidebarItem icon={<Clock size={16} />} label={t.history} active={activeTab === 'HISTORY'} onClick={() => { setActiveTab('HISTORY'); setSelectedPlaylist(null); setSelectedArtist(null); }} />
                   </div>
                </div>
                <div className="mt-auto flex flex-col gap-2">
                  <div onClick={() => setActiveTab('SETTINGS')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${activeTab === 'SETTINGS' ? 'bg-white/[0.08] text-indigo-400' : 'text-white/30 hover:text-white'}`}><SettingsIcon size={16} /><span className="text-xs font-medium">{t.settings}</span></div>
                  <div onClick={() => setActiveTab('PROFILE')} className="p-3 rounded-xl glow-border flex items-center gap-3 hover:bg-white/[0.04] cursor-pointer group bg-black/40">
                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center overflow-hidden">{userProfile?.avatar_url ? <img src={userProfile.avatar_url} className="w-full h-full object-cover" /> : <User size={12} className="text-white/50" />}</div>
                    <div className="flex flex-col min-w-0"><span className="text-xs font-medium text-white/80 truncate">{userProfile?.username || 'Guest'}</span><span className="text-[10px] text-white/30 truncate uppercase tracking-tighter font-bold">{userProfile ? t.connected : t.local}</span></div>
                  </div>
                </div>
              </aside>
              <main className="flex-1 flex flex-col relative overflow-hidden bg-black/30 backdrop-blur-md transition-all duration-500">
                <div className="h-24 flex items-center px-8 z-30 relative justify-between">
                   <div className="flex items-center gap-4 no-drag relative">
                      <div className="relative w-96 group">
                        <div className="relative flex items-center bg-[#0a0a0a]/50 border border-white/5 rounded-2xl px-4 py-3 transition-all group-focus-within:bg-black/80">
                          <Search size={14} className="text-white/20 mr-3 cursor-pointer hover:text-white" onClick={handleSearch} />
                          <input value={tempSearch} onChange={(e) => setTempSearch(e.target.value)} onKeyDown={handleSearch} placeholder={t.search_placeholder} className="bg-transparent border-none outline-none text-sm text-white/80 w-full" />
                        </div>
                      </div>
                      <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); }} className={`p-3 rounded-2xl border border-white/5 bg-black/40 transition-all hover:scale-105 cursor-pointer ${showNotifications || updateInfo ? 'text-indigo-400 border-indigo-500/20 shadow-lg' : 'text-white/20'}`}><Bell size={18} />{updateInfo && <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>}</button>
                        <AnimatePresence>{showNotifications && <NotificationCenter updateInfo={updateInfo} onClose={() => setShowNotifications(false)} />}</AnimatePresence>
                      </div>
                   </div>
                   <div className="flex-1 h-full title-bar-drag mx-4"></div>
                   <div className="no-drag"><TitleBar /></div>
                </div>
                <div className="flex-1 overflow-hidden relative z-10">
                  <AnimatePresence mode="wait">
                    <motion.div key={selectedPlaylist || selectedArtist || activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }} className="absolute inset-0 flex flex-col">
                      {selectedPlaylist ? <PlaylistDetail playlistId={selectedPlaylist} onBack={() => setSelectedPlaylist(null)} onOpenArtist={(id) => { setSelectedPlaylist(null); setSelectedArtist(id); }} />
                      : selectedArtist ? <ArtistProfile artistId={selectedArtist} onBack={() => setSelectedArtist(null)} />
                      : <>
                        {activeTab === 'HOME' && <HomeView />}
                        {activeTab === 'DISCOVER' && <DiscoverView query={searchQuery} onOpenPlaylist={setSelectedPlaylist} onOpenArtist={setSelectedArtist} />}
                        {activeTab === 'RADIO' && <RadioView />}
                        {activeTab === 'LIKED' && <LibraryView />}
                        {activeTab === 'PLAYLISTS' && <PlaylistsView onOpenPlaylist={setSelectedPlaylist} />}
                        {activeTab === 'HISTORY' && <HistoryView />}
                        {activeTab === 'SETTINGS' && <SettingsView />}
                        {activeTab === 'PROFILE' && <ProfileView />}
                      </>}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <PlayerBar onOpenArtist={setSelectedArtist} onToggleLyrics={() => setShowLyrics(!showLyrics)} isLyricsOpen={showLyrics} />
                <AnimatePresence>{showLyrics && currentTrack && <LyricsOverlay track={currentTrack} onClose={() => setShowLyrics(false)} />}</AnimatePresence>
                {menu && <ContextMenu x={menu.x} y={menu.y} track={menu.track} onClose={() => setMenu(null)} onAction={handleMenuAction} playlists={localPlaylists} />}
              </main>
            </motion.div>
          )}</AnimatePresence>
      </motion.div>
    </div>
  );
};

const PlayerBar = ({ onOpenArtist, onToggleLyrics, isLyricsOpen }) => {
  const { currentTrack, isPlaying, isLoadingStream, togglePlay, handleNext, handlePrev, volume, setVolume, isMuted, toggleMute, isShuffle, setIsShuffle, repeatMode, setRepeatMode, progress, duration, seek, audioRef, analyserRef } = usePlayer();
  const { toggleLike, isLiked, t } = useUserData();
  
  return (
    <div className="absolute bottom-6 left-0 w-full px-8 pointer-events-none z-30">
      <AnimatePresence mode="wait">
        {!currentTrack ? (
          <motion.div 
            key="empty-player"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="pointer-events-auto w-full max-w-4xl mx-auto glow-border p-3 rounded-full flex items-center justify-center bg-[#050505]/80 backdrop-blur-2xl text-[10px] text-white/20 uppercase tracking-widest shadow-2xl"
          >
            {t.awaiting_input}
          </motion.div>
        ) : (
          <motion.div 
            key="active-player"
            layoutId="player-bar"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="pointer-events-auto w-full max-w-4xl mx-auto glow-border p-3 pr-8 rounded-full flex items-center justify-between bg-[#050505]/80 backdrop-blur-2xl shadow-2xl transition-all hover:bg-black/90 group"
          >
             <div className="flex items-center gap-4 w-[30%]">
                <div className={`w-12 h-12 rounded-full border border-white/10 relative overflow-hidden shrink-0 bg-black ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''} group-hover:scale-105 transition-transform`}><img src={currentTrack.artwork || `https://ui-avatars.com/api/?name=${currentTrack.title}&background=random&color=fff&size=200`} className="absolute inset-0 w-full h-full object-cover opacity-60" /><div className="absolute inset-auto bg-black rounded-full w-2 h-2 z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-inner"></div></div>
                <div className="flex flex-col min-w-0"><span className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">{currentTrack.title}</span><button onClick={(e) => { e.stopPropagation(); if (currentTrack.artistId) onOpenArtist(currentTrack.artistId); }} className="text-[10px] text-left text-white/40 truncate uppercase tracking-tight font-medium hover:text-indigo-400 hover:underline transition-all cursor-pointer w-fit">{currentTrack.artist}</button></div>
                <button onClick={() => toggleLike(currentTrack)} className={`ml-2 p-1.5 rounded-full hover:bg-white/10 transition-colors ${isLiked(currentTrack.id) ? 'text-indigo-400' : 'text-white/20'}`}><Heart size={16} fill={isLiked(currentTrack.id) ? "currentColor" : "none"} /></button>
             </div>
             <div className="flex flex-col items-center w-[40%] gap-2 px-4">
                <div className="flex items-center gap-5">
                   <button onClick={() => setIsShuffle(!isShuffle)} className={`p-1 transition-colors ${isShuffle ? 'text-indigo-400' : 'text-white/20 hover:text-white'}`} title="Shuffle"><Shuffle size={14} /></button>
                   <SkipBack size={18} className="text-white/30 hover:text-white cursor-pointer transition-colors" onClick={handlePrev} />
                   <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl">{isLoadingStream ? <Loader2 size={16} className="animate-spin" /> : (isPlaying ? <Pause fill="black" size={16} /> : <Play fill="black" size={16} className="ml-0.5" />)}</button>
                   <SkipForward size={18} className="text-white/30 hover:text-white cursor-pointer transition-colors" onClick={handleNext} />
                   <button onClick={() => setRepeatMode(repeatMode === 'OFF' ? 'ALL' : repeatMode === 'ALL' ? 'ONE' : 'OFF')} className={`p-1 transition-colors relative ${repeatMode !== 'OFF' ? 'text-indigo-400' : 'text-white/20 hover:text-white'}`} title="Repeat">{repeatMode === 'ONE' ? <div className="relative"><Repeat size={14} /><span className="absolute -top-1 -right-2 text-[8px] font-bold">1</span></div> : <Repeat size={14} />}</button>
                </div>
                <div className="w-full h-8 flex items-center cursor-pointer relative group/seek">
                   <div className="absolute inset-0 opacity-60 pointer-events-none flex items-end pb-2"><AudioVisualizer isPlaying={isPlaying} analyserRef={analyserRef} /></div>
                   <input type="range" min="0" max={duration || 100} value={progress} onChange={(e) => seek(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                   <div className="absolute bottom-2 left-0 h-0.5 bg-white/10 w-full rounded-full pointer-events-none group-hover/seek:h-1.5 transition-all"><div className="h-full bg-indigo-500 rounded-full relative transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${(progress / (duration || 1)) * 100}%` }}><div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover/seek:opacity-100 transition-opacity shadow-lg"></div></div></div>
                </div>
             </div>
             <div className="flex items-center justify-end gap-3 w-[30%]"><button onClick={onToggleLyrics} className={`p-1.5 rounded-full transition-all ${isLyricsOpen ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'text-white/30 hover:text-white hover:bg-white/10'}`} title="Lyrics"><AlignLeft size={16} /></button><button onClick={toggleMute} className="text-white/30 hover:text-white transition-colors">{isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} />}</button><input type="range" min="0" max={1} step="0.01" value={isMuted ? 0 : volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full transition-all hover:bg-white/20" /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group ${active ? 'bg-white/[0.08] text-white shadow-inner' : 'text-white/40 hover:text-white hover:bg-white/[0.03]'}`}>
    <div className={`${active ? 'text-indigo-400' : 'group-hover:text-white/90'} transition-colors`}>{icon}</div>
    <span className="text-xs font-medium tracking-wide transition-all group-hover:translate-x-0.5">{label}</span>
  </div>
);

const App = () => (<UserDataProvider><PlayerProvider><MainApp /></PlayerProvider></UserDataProvider>);
export default App;
