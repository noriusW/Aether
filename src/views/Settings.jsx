import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Globe, Cpu, RefreshCw, Trash2, Search, Music, Activity, Image, Paintbrush, Layers, Package, Sparkles, Sliders, Wifi, Monitor, Grid, BrainCircuit, Zap, Eye, Volume2, Maximize2, LogOut, Check, ArrowRight, Settings as SettingsIcon, Download, AlertTriangle, Ban } from 'lucide-react';
import { setUserCredentials } from '../services/soundcloud';
import { useUserData } from '../context/UserDataContext';
import { useTheme } from '../context/ThemeContext';
import { DEFAULT_THEME_ID } from '../themes/themes';
import { useExtensions } from '../context/ExtensionContext';

const EQ_PRESETS = {
  'FLAT': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'BASS': [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  'POP': [-2, -1, 0, 2, 4, 4, 2, 0, -1, -2],
  'TECHNO': [5, 4, 0, 0, 0, 0, 3, 4, 5, 6],
  'VOCAL': [-3, -3, -2, 0, 2, 4, 4, 2, 0, -1],
  'CHILL': [3, 2, 1, 0, 0, -1, -1, 0, 1, 2]
};

const Settings = () => {
  const { 
    visualSettings, updateVisualSettings, 
    appSettings, updateAppSettings, 
    audioSettings, updateAudioSettings,
    algorithmSettings, updateAlgorithmSettings,
    userProfile, syncSoundCloud, clearCache, clearAppData, cacheStats, refreshCacheStats, t, showToast, logout
  } = useUserData();
  const { themes, theme } = useTheme();
  const {
    storeConfig,
    availableExtensions,
    installedExtensions,
    extensionErrors,
    loadingStore,
    storeError,
    refreshStore,
    updateStoreConfig,
    installExtension,
    removeExtension,
    toggleExtension,
    blockedExtensions,
    connectionAttempts,
    manualRetry
  } = useExtensions();

  const [activeTab, setActiveTab] = useState('AUDIO'); 
  const [filterText, setFilterText] = useState('');
  const [clientId, setClientId] = useState('a281614d7f34dc30b665dfcaa3ed7505');
  const [userToken, setUserToken] = useState('');
  const [customThemeName, setCustomThemeName] = useState('');

  useEffect(() => { refreshCacheStats(); }, [refreshCacheStats]);

  useEffect(() => {
    if (activeTab === 'EXTENSIONS' && availableExtensions.length === 0 && !loadingStore) {
      refreshStore();
    }
  }, [activeTab, availableExtensions.length, loadingStore, refreshStore]);

  // --- Helpers ---
  const customThemes = visualSettings.customThemes || [];
  const handleThemeSelect = (id) => updateVisualSettings({ themeId: id });
  const handleDeleteCustomTheme = (id) => {
    const next = customThemes.filter((item) => item.id !== id);
    const nextThemeId = visualSettings.themeId === id ? DEFAULT_THEME_ID : visualSettings.themeId;
    updateVisualSettings({ customThemes: next, themeId: nextThemeId });
  };
  const handleSaveCustomTheme = () => {
    if (!customThemeName.trim()) return;
    const timestamp = Date.now();
    const nextTheme = {
      ...theme,
      id: `custom-${timestamp}`,
      name: customThemeName.trim(),
      description: 'Custom User Theme',
      variables: theme.variables,
      palette: visualSettings.palette || theme.palette,
      background: visualSettings.background || theme.background
    };
    updateVisualSettings({ customThemes: [nextTheme, ...customThemes], themeId: nextTheme.id });
    setCustomThemeName('');
    showToast(t.theme_saved);
  };

  const handleInstallExtension = (ext) => { if (ext) installExtension(ext); };
  const installedLookup = useMemo(() => new Map((installedExtensions || []).map((i) => [i.id, i])), [installedExtensions]);

  const handleAuth = async () => {
    try {
      if (window.electron) {
        const creds = await window.electron.invoke('authenticate-soundcloud');
        if (creds) {
          setUserCredentials(creds.clientId, creds.token);
          await syncSoundCloud(); 
        }
      }
    } catch (e) {}
  };

  const handleSystemUpdate = (setting) => {
    updateAppSettings(setting);
    showToast(t.settings_restart_needed);
  };

  const menuItems = [
    { id: 'ALGORITHMS', label: 'Neural Engine', icon: <BrainCircuit size={20} />, color: 'text-pink-400' },
    { id: 'AUDIO', label: 'Audio Engine', icon: <Sliders size={20} />, color: 'text-cyan-400' },
    { id: 'THEMES', label: 'Appearance', icon: <Paintbrush size={20} />, color: 'text-emerald-400' },
    { id: 'VISUAL', label: 'Interface', icon: <Eye size={20} />, color: 'text-indigo-400' },
    { id: 'EXTENSIONS', label: 'Extensions', icon: <Grid size={20} />, color: 'text-orange-400' },
    { id: 'CONNECTIVITY', label: 'Account', icon: <Globe size={20} />, color: 'text-blue-400' },
    { id: 'SYSTEM', label: 'System', icon: <Cpu size={20} />, color: 'text-gray-400' },
  ];

  const filteredMenu = useMemo(() => {
    if (!filterText) return menuItems;
    const lower = filterText.toLowerCase();
    return menuItems.filter(i => 
      i.label.toLowerCase().includes(lower) || i.id.toLowerCase().includes(lower)
    );
  }, [filterText]);

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-black/20 to-transparent">
      {/* Header */}
      <div className="flex items-center justify-between px-10 pt-10 pb-6 shrink-0">
        <div>
           <h1 className="text-4xl font-black text-white tracking-tighter mb-1">Preferences</h1>
           <p className="text-white/40 text-sm font-medium">Fine-tune your experience</p>
        </div>
        <div className="relative group w-72">
           <div className="absolute inset-0 bg-white/5 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
           <div className="relative bg-white/[0.03] border border-white/10 rounded-2xl flex items-center px-4 py-3 group-focus-within:border-white/20 group-focus-within:bg-black/40 transition-all">
              <Search size={18} className="text-white/30 mr-3" />
              <input 
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Search settings..."
                className="bg-transparent border-none outline-none text-sm text-white/90 w-full placeholder-white/20"
              />
           </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden px-6 pb-6 gap-6">
         {/* Sidebar */}
         <div className="w-64 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 py-2">
            {filteredMenu.map(item => {
               const isActive = activeTab === item.id;
               return (
                 <motion.button
                   key={item.id}
                   onClick={() => setActiveTab(item.id)}
                   className={`relative flex items-center gap-4 px-5 py-4 rounded-2xl transition-all w-full text-left overflow-hidden group ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
                   whileTap={{ scale: 0.98 }}
                 >
                    {isActive && <motion.div layoutId="activeSetting" className="absolute inset-0 bg-white/5 border border-white/10 rounded-2xl shadow-inner" />}
                    <div className={`relative z-10 p-2 rounded-xl bg-black/20 ${isActive ? item.color : 'text-white/40 group-hover:text-white'}`}>
                       {item.icon}
                    </div>
                    <span className={`relative z-10 text-sm font-bold tracking-wide ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white'}`}>
                       {item.label}
                    </span>
                 </motion.button>
               );
            })}
         </div>

         {/* Content */}
         <div className="flex-1 bg-black/20 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-xl relative">
            <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-10">
               <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="max-w-4xl mx-auto space-y-10"
                  >
                     {activeTab === 'ALGORITHMS' && (
                        <div className="space-y-8">
                           <SectionHeader title="Neural Configuration" description="Customize how Aether curates your sonic journey." />
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FeatureCard 
                                 title="Smart Stacking" 
                                 description="Automatically groups duplicate tracks and hides low-quality re-uploads."
                                 icon={<Layers size={24} className="text-pink-400" />}
                                 active={algorithmSettings.smartStacking}
                                 onToggle={() => updateAlgorithmSettings({ smartStacking: !algorithmSettings.smartStacking })}
                              />
                              <FeatureCard 
                                 title="Predictive Loading" 
                                 description="Pre-buffers the next track for seamless, zero-latency transitions."
                                 icon={<Zap size={24} className="text-yellow-400" />}
                                 active={algorithmSettings.predictiveLoading}
                                 onToggle={() => updateAlgorithmSettings({ predictiveLoading: !algorithmSettings.predictiveLoading })}
                              />
                              <FeatureCard 
                                 title="Flow Mode" 
                                 description="Sorts queues by BPM and energy to create a DJ-like progression."
                                 icon={<Activity size={24} className="text-cyan-400" />}
                                 active={algorithmSettings.flowMode}
                                 onToggle={() => updateAlgorithmSettings({ flowMode: !algorithmSettings.flowMode })}
                              />
                           </div>
                           
                           <div className="p-8 rounded-[32px] bg-white/[0.03] border border-white/5">
                              <div className="flex items-center justify-between mb-6">
                                 <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400"><BrainCircuit size={24} /></div>
                                    <div>
                                       <h3 className="text-lg font-bold text-white">Mood Sensitivity</h3>
                                       <p className="text-xs text-white/40 font-medium">Adjust the energy baseline for recommendations</p>
                                    </div>
                                 </div>
                                 <div className="text-2xl font-black text-white">{algorithmSettings.energyLevel}%</div>
                              </div>
                              <input 
                                type="range" 
                                min="0" max="100" 
                                value={algorithmSettings.energyLevel} 
                                onChange={(e) => updateAlgorithmSettings({ energyLevel: parseInt(e.target.value) })}
                                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
                              />
                              <div className="flex justify-between mt-3 text-[10px] uppercase font-bold text-white/20 tracking-widest">
                                 <span>Chill / Ambient</span>
                                 <span>Balanced</span>
                                 <span>High Energy</span>
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === 'AUDIO' && (
                        <div className="space-y-8">
                           <SectionHeader title="Audio Engineering" description="Shape the soundstage to your preference." />
                           
                           {/* EQ Visualizer */}
                           <div className="p-8 rounded-[32px] bg-gradient-to-b from-white/[0.05] to-transparent border border-white/5">
                              <div className="flex justify-between items-end h-48 gap-4 px-4">
                                 {audioSettings.eq.map((val, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-4 h-full group relative">
                                       <div className="absolute inset-0 bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                       <div className="relative flex-1 w-2 bg-white/10 rounded-full overflow-hidden">
                                          <motion.div 
                                            className="absolute bottom-0 left-0 right-0 bg-cyan-400"
                                            animate={{ height: `${((val + 12) / 24) * 100}%` }}
                                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                          />
                                       </div>
                                       <input 
                                          type="range" min="-12" max={12} step="1" 
                                          value={val} 
                                          onChange={(e) => {
                                             const newEq = [...audioSettings.eq];
                                             newEq[i] = parseInt(e.target.value);
                                             updateAudioSettings({ eq: newEq });
                                          }}
                                          className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
                                          style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                                       />
                                       <span className="text-[9px] font-bold text-white/30 font-mono">
                                          {['32','64','125','250','500','1k','2k','4k','8k','16k'][i]}
                                       </span>
                                    </div>
                                 ))}
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <ControlPanel label="Bass Boost" icon={<Volume2 size={20} />}>
                                 <Slider value={audioSettings.bassBoost} onChange={(v) => updateAudioSettings({ bassBoost: v })} max={15} />
                              </ControlPanel>
                              <FeatureCard 
                                 title="Dynamic Compressor" 
                                 description="Normalizes volume peaks for consistent loudness."
                                 icon={<Activity size={24} className="text-emerald-400" />}
                                 active={audioSettings.compressor}
                                 onToggle={() => updateAudioSettings({ compressor: !audioSettings.compressor })}
                              />
                           </div>
                        </div>
                     )}

                     {activeTab === 'THEMES' && (
                        <div className="space-y-8">
                           <SectionHeader title="Visual Identity" description="Define the aesthetic of your interface." />
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {themes.map(t => (
                                 <motion.div 
                                    key={t.id} 
                                    onClick={() => handleThemeSelect(t.id)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`cursor-pointer p-6 rounded-[32px] border transition-all relative overflow-hidden ${visualSettings.themeId === t.id ? 'border-cyan-500/50 bg-cyan-900/10' : 'border-white/5 bg-white/[0.02] hover:border-white/10'}`}
                                 >
                                    <div className="flex justify-between items-start mb-4">
                                       <h4 className="text-lg font-bold text-white">{t.name}</h4>
                                       {visualSettings.themeId === t.id && <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_cyan]" />}
                                    </div>
                                    <div className="flex gap-2">
                                       {(t.palette || []).slice(0, 5).map((c, i) => (
                                          <div key={i} className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: c }} />
                                       ))}
                                    </div>
                                 </motion.div>
                              ))}
                           </div>

                           <div className="p-8 rounded-[32px] bg-white/[0.03] border border-white/5 space-y-6">
                              <h3 className="text-lg font-bold text-white">Advanced Customization</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 <div>
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 block">Accent Color</label>
                                    <div className="flex items-center gap-4">
                                       <input type="color" value={visualSettings.accentColor} onChange={(e) => updateVisualSettings({ accentColor: e.target.value })} className="w-12 h-12 rounded-xl bg-transparent cursor-pointer" />
                                       <div className="text-white/60 font-mono text-sm">{visualSettings.accentColor}</div>
                                    </div>
                                 </div>
                                 <div>
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 block">Font Family</label>
                                    <input 
                                       value={visualSettings.fontFamily} 
                                       onChange={(e) => updateVisualSettings({ fontFamily: e.target.value })}
                                       className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500/50"
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === 'VISUAL' && (
                        <div className="space-y-8">
                           <SectionHeader title="Interface & Glass" description="Adjust opacity and performance of the visual effects." />
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <ControlPanel label="Main Glass Opacity" icon={<Layers size={20} />}>
                                 <Slider value={visualSettings.glassOpacity} onChange={(v) => updateVisualSettings({ glassOpacity: v })} />
                              </ControlPanel>
                              <ControlPanel label="Sidebar Translucency" icon={<Layers size={20} />}>
                                 <Slider value={visualSettings.sidebarOpacity} onChange={(v) => updateVisualSettings({ sidebarOpacity: v })} />
                              </ControlPanel>
                           </div>
                           <FeatureCard 
                              title="Background Animations" 
                              description="Enable dynamic, reactive visual effects on the background. Disable to save battery."
                              icon={<Zap size={24} className="text-indigo-400" />}
                              active={visualSettings.animations}
                              onToggle={() => updateVisualSettings({ animations: !visualSettings.animations })}
                           />
                           
                           <ControlPanel label="Audio Visualizer" icon={<Activity size={20} />}>
                              <SelectControl 
                                 label="Style" 
                                 value={visualSettings.visualizerStyle || 'ambient'} 
                                 onChange={(v) => updateVisualSettings({ visualizerStyle: v })}
                                 options={[
                                    { value: 'ambient', label: 'Ambient Glow (Player Background)' },
                                    { value: 'compact', label: 'Compact (Inside Seek Bar)' }
                                 ]}
                              />
                           </ControlPanel>
                        </div>
                     )}

                     {activeTab === 'LOCALIZATION' && (
                        <div className="space-y-8">
                           <SectionHeader title="Language & Region" description="Select your preferred interface language." />
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {[
                                 { code: 'en', label: 'English', desc: 'Standard' },
                                 { code: 'ru', label: 'Русский', desc: 'Российская локализация' }
                              ].map(lang => (
                                 <motion.div
                                    key={lang.code}
                                    onClick={() => updateAppSettings({ language: lang.code })}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`cursor-pointer p-6 rounded-[24px] border flex items-center justify-between ${appSettings.language === lang.code ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05]'}`}
                                 >
                                    <div>
                                       <h4 className="text-lg font-bold text-white">{lang.label}</h4>
                                       <p className="text-white/40 text-xs uppercase tracking-widest font-bold">{lang.desc}</p>
                                    </div>
                                    {appSettings.language === lang.code && <div className="w-4 h-4 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
                                 </motion.div>
                              ))}
                           </div>
                        </div>
                     )}

                     {activeTab === 'CONNECTIVITY' && (
                        <div className="space-y-8">
                           <SectionHeader title="Account & Network" description="Manage your connections and sync status." />
                           
                           <div className="p-10 rounded-[40px] bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/10 relative overflow-hidden">
                              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                 <div className="w-24 h-24 rounded-full bg-black/40 border-2 border-white/10 flex items-center justify-center text-white/50 text-3xl font-black">
                                    {userProfile ? userProfile.username[0] : '?'}
                                 </div>
                                 <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-3xl font-black text-white mb-2">{userProfile ? userProfile.username : 'Guest User'}</h2>
                                    <p className="text-white/50 text-sm mb-6">{userProfile ? 'Connected via SoundCloud' : 'Local Mode Only'}</p>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                       <button onClick={handleAuth} className="px-6 py-3 bg-white text-black font-bold rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                                          {userProfile ? 'Sync Account' : 'Connect Account'}
                                       </button>
                                       {userProfile && (
                                          <button onClick={logout} className="px-6 py-3 bg-red-500/20 text-red-400 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors">
                                             Sign Out
                                          </button>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === 'SYSTEM' && (
                        <div className="space-y-8">
                           <SectionHeader title="System Preferences" description="Control application behavior and storage." />
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FeatureCard 
                                 title="Launch on Startup" 
                                 description="Automatically start Aether when you log in."
                                 icon={<Cpu size={24} />}
                                 active={appSettings.autoStart}
                                 onToggle={() => handleSystemUpdate({ autoStart: !appSettings.autoStart })}
                              />
                              <FeatureCard 
                                 title="Auto Updates" 
                                 description="Keep Aether up to date with the latest features."
                                 icon={<Download size={24} />}
                                 active={appSettings.autoUpdate !== false}
                                 onToggle={() => handleSystemUpdate({ autoUpdate: !appSettings.autoUpdate })}
                              />
                              <FeatureCard 
                                 title="Close to Tray" 
                                 description="Minimize to the system tray instead of quitting."
                                 icon={<Monitor size={24} />}
                                 active={appSettings.closeToTray}
                                 onToggle={() => handleSystemUpdate({ closeToTray: !appSettings.closeToTray })}
                              />
                              <FeatureCard 
                                 title="Discord RPC" 
                                 description="Show your current track on your Discord profile."
                                 icon={<Activity size={24} />}
                                 active={appSettings.discordRPC}
                                 onToggle={() => updateAppSettings({ discordRPC: !appSettings.discordRPC })}
                              />
                           </div>

                           <div className="p-8 rounded-[32px] bg-white/[0.03] border border-white/5">
                              <h3 className="text-lg font-bold text-white mb-6">Storage & Maintenance</h3>
                              <div className="flex items-center justify-between mb-6">
                                 <div>
                                    <div className="text-2xl font-black text-white">{(cacheStats.bytes / (1024 * 1024)).toFixed(1)} MB</div>
                                    <div className="text-xs text-white/40 uppercase tracking-widest font-bold">Cached Data</div>
                                 </div>
                                 <button onClick={clearCache} className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest transition-colors">
                                    Clear Cache
                                 </button>
                              </div>
                              <button onClick={clearAppData} className="w-full py-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                                 <Trash2 size={16} /> Factory Reset Application
                              </button>
                           </div>
                        </div>
                     )}

                     {activeTab === 'EXTENSIONS' && (
                        <div className="space-y-8">
                           <SectionHeader title="Extension Store" description="Expand Aether's capabilities with community modules." />
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                              <InputControl label="GitHub Owner" value={storeConfig.owner} onChange={(v) => updateStoreConfig({ owner: v })} icon={<Package size={16}/>} />
                              <InputControl label="Repository" value={storeConfig.repo} onChange={(v) => updateStoreConfig({ repo: v })} icon={<Package size={16}/>} />
                           </div>
                           
                           <button onClick={refreshStore} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors">
                              {loadingStore ? 'Syncing...' : 'Refresh Marketplace'}
                           </button>

                           {extensionErrors.length > 0 && (
                              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs">
                                 {extensionErrors.map((e, i) => <div key={i}>{e.message}</div>)}
                              </div>
                           )}

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {availableExtensions.length === 0 && !loadingStore && (
                                 <div className="col-span-full py-12 text-center text-white/30 text-sm">No extensions found.</div>
                              )}
                              {availableExtensions.map((ext) => {
                                 const installed = installedLookup.get(ext.id);
                                 return (
                                    <ExtensionCard 
                                       key={ext.id} 
                                       extension={ext} 
                                       installed={installed} 
                                       isUpdate={installed && installed.version !== ext.version}
                                       onInstall={() => handleInstallExtension(ext)} 
                                    />
                                 );
                              })}
                           </div>

                           {installedExtensions.length > 0 && (
                              <div className="pt-8 border-t border-white/5">
                                 <h3 className="text-lg font-bold text-white mb-6">Installed Modules</h3>
                                 <div className="space-y-4">
                                    {installedExtensions.map(ext => {
                                       const isBlocked = blockedExtensions.includes(ext.id);
                                       const attempts = connectionAttempts[ext.id] || 0;
                                       return (
                                          <InstalledExtensionRow 
                                             key={ext.id} 
                                             extension={ext} 
                                             isBlocked={isBlocked}
                                             attempts={attempts}
                                             onToggle={() => toggleExtension(ext.id)}
                                             onRemove={() => removeExtension(ext.id)}
                                             onRetry={() => manualRetry(ext.id)}
                                          />
                                       );
                                    })}
                                 </div>
                              </div>
                           )}
                        </div>
                     )}
                  </motion.div>
               </AnimatePresence>
            </div>
         </div>
      </div>
    </div>
  );
};

// --- Polished UI Components ---

const SectionHeader = ({ title, description }) => (
   <div className="mb-6">
      <h2 className="text-3xl font-black text-white tracking-tight mb-2">{title}</h2>
      <p className="text-white/50 text-sm">{description}</p>
   </div>
);

const FeatureCard = ({ title, description, icon, active, onToggle }) => (
   <div 
      onClick={onToggle}
      className={`p-6 rounded-[24px] border cursor-pointer transition-all flex flex-col justify-between h-40 ${active ? 'bg-white/[0.08] border-white/20' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'}`}
   >
      <div className="flex justify-between items-start">
         <div className={`p-3 rounded-xl bg-black/20 ${active ? 'text-white' : 'text-white/40'}`}>{icon}</div>
         <div className={`w-12 h-7 rounded-full p-1 transition-colors ${active ? 'bg-green-500' : 'bg-white/10'}`}>
            <motion.div 
               className="w-5 h-5 rounded-full bg-white shadow-sm" 
               animate={{ x: active ? 20 : 0 }}
               transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
         </div>
      </div>
      <div>
         <h3 className={`font-bold text-lg mb-1 ${active ? 'text-white' : 'text-white/80'}`}>{title}</h3>
         <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{description}</p>
      </div>
   </div>
);

const ControlPanel = ({ label, icon, children }) => (
   <div className="p-6 rounded-[24px] bg-white/[0.03] border border-white/5 flex flex-col justify-center gap-4">
      <div className="flex items-center gap-3 text-white/70 font-bold mb-2">
         {icon}
         <span>{label}</span>
      </div>
      {children}
   </div>
);

const Slider = ({ value, onChange, min=0, max=100 }) => (
   <div className="relative h-2 bg-white/10 rounded-full w-full group">
      <motion.div 
         className="absolute top-0 left-0 h-full bg-cyan-400 rounded-full"
         style={{ width: `${(value / max) * 100}%` }}
      />
      <input 
         type="range" min={min} max={max} value={value} 
         onChange={(e) => onChange(parseInt(e.target.value))}
         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
   </div>
);

const InputControl = ({ label, value, onChange, placeholder, icon, inputType = 'text' }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">{label}</label>
    <div className="relative group">
      <input 
         type={inputType} 
         value={value} 
         onChange={(e) => onChange(e.target.value)} 
         placeholder={placeholder} 
         className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-5 py-3 text-sm text-white/90 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] transition-all pl-12" 
      />
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-500 transition-colors">{icon}</div>
    </div>
  </div>
);

const ExtensionCard = ({ extension, installed, isUpdate, onInstall }) => (
  <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col gap-4">
    <div className="flex justify-between items-start">
       <div>
          <h4 className="font-bold text-white text-lg">{extension.name}</h4>
          <p className="text-xs text-white/40 font-mono mt-1">v{extension.version}</p>
       </div>
       <div className="flex gap-1">{extension.tags?.slice(0, 2).map(tag => <span key={tag} className="px-2 py-1 bg-white/5 rounded-md text-[10px] uppercase font-bold text-white/30">{tag}</span>)}</div>
    </div>
    <p className="text-sm text-white/60 leading-relaxed">{extension.description}</p>
    <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
       <span className="text-xs text-white/30 font-bold">{extension.author}</span>
       <button onClick={onInstall} disabled={installed && !isUpdate} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${installed && !isUpdate ? 'bg-white/5 text-white/20' : 'bg-white text-black hover:scale-105'}`}>
          {installed ? (isUpdate ? 'Update' : 'Installed') : 'Get'}
       </button>
    </div>
  </div>
);

const InstalledExtensionRow = ({ extension, isBlocked, attempts, onToggle, onRemove, onRetry }) => (
  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
     <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-white/5 text-white/40"><Package size={20} /></div>
        <div>
           <div className="font-bold text-white text-sm">{extension.name || extension.id}</div>
           <div className="text-[10px] text-white/30 uppercase tracking-widest">{extension.description}</div>
        </div>
     </div>
     <div className="flex items-center gap-4">
        {isBlocked ? (
           <div className="flex items-center gap-3 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
              <Ban size={14} className="text-red-400" />
              <div className="flex flex-col items-end">
                 <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Blocked</span>
                 <span className="text-[9px] text-red-400/60 font-mono">{attempts}/5</span>
              </div>
              <button 
                 onClick={onRetry} 
                 className="ml-2 p-1.5 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors" 
                 title="Retry Connection"
              >
                 <RefreshCw size={12} />
              </button>
           </div>
        ) : (
           <div onClick={onToggle} className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${extension.enabled !== false ? 'bg-green-500' : 'bg-white/10'}`}>
              <motion.div className="w-4 h-4 bg-white rounded-full shadow-sm" animate={{ x: extension.enabled !== false ? 16 : 0 }} />
           </div>
        )}
        <button onClick={onRemove} className="p-2 text-white/20 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
     </div>
  </div>
);

const ColorControl = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between gap-4 py-2 px-1">
    <label className="text-sm font-bold text-white/80">{label}</label>
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 shadow-lg cursor-pointer hover:scale-110 transition-transform">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer" />
      </div>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-24 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2 text-xs text-white/70 font-mono focus:outline-none focus:border-indigo-500/40 transition-all" />
    </div>
  </div>
);

const SelectControl = ({ label, value, onChange, options = [] }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">{label}</label>
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-white/90 focus:outline-none focus:border-indigo-500/40 appearance-none cursor-pointer hover:bg-white/[0.05] transition-all">
        {options.map((opt) => <option key={opt.value} value={opt.value} className="bg-gray-900 text-white">{opt.label}</option>)}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30"><Sliders size={14} /></div>
    </div>
  </div>
);

export default Settings;