import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Globe, Cpu, RefreshCw, Sliders, Palette, Wind, Trash2, Search, Music, Activity, AlertCircle } from 'lucide-react';
import { setUserCredentials } from '../services/soundcloud';
import { useUserData } from '../context/UserDataContext';

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
    userProfile, syncSoundCloud, clearCache, clearAppData, t, showToast
  } = useUserData();

  const [localSection, setLocalSection] = useState('AUDIO'); 
  const [filterText, setFilterText] = useState('');
  const [clientId, setClientId] = useState('a281614d7f34dc30b665dfcaa3ed7505');
  const [userToken, setUserToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSystemUpdate = (setting) => {
    updateAppSettings(setting);
    showToast(t.settings_restart_needed);
  };

  const menuItems = [
    { id: 'AUDIO', label: 'Audio Engine', icon: <Activity size={16} /> },
    { id: 'VISUAL', label: 'Visual Engine', icon: <Palette size={16} /> },
    { id: 'LOCALIZATION', label: t.settings_language, icon: <Globe size={16} /> },
    { id: 'CONNECTIVITY', label: 'Network & Auth', icon: <Globe size={16} /> },
    { id: 'SYSTEM', label: 'App System', icon: <Cpu size={16} /> },
  ];

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (window.electron) {
        const creds = await window.electron.invoke('authenticate-soundcloud');
        if (creds) {
          setUserCredentials(creds.clientId, creds.token);
          await syncSoundCloud(); 
        }
      }
    } catch (e) {}
    setLoading(false);
  };

  const filteredMenu = useMemo(() => {
    if (!filterText) return menuItems;
    const lowQuery = filterText.toLowerCase();
    const searchMap = [
      { id: 'AUDIO', keywords: ['eq', 'equalizer', 'bass', 'boost', 'compressor', 'sound', 'audio'] },
      { id: 'VISUAL', keywords: ['opacity', 'transparency', 'blur', 'glass', 'sidebar', 'visual', 'ui'] },
      { id: 'CONNECTIVITY', keywords: ['soundcloud', 'auth', 'token', 'client', 'account', 'login'] },
      { id: 'SYSTEM', keywords: ['tray', 'close', 'cache', 'reset', 'memory', 'start', 'discord', 'rpc'] }
    ];
    const matchedIds = searchMap.filter(m => m.keywords.some(k => k.includes(lowQuery))).map(m => m.id);
    return menuItems.filter(item => matchedIds.includes(item.id));
  }, [filterText]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden px-12 pt-8 pb-32">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">System Preferences</h2>
          <p className="text-white/30 text-sm font-medium">Fine-tune your Aether experience.</p>
        </div>
        <div className="relative group">
           <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
           <div className="relative flex items-center bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-2.5 w-64 group-focus-within:border-indigo-500/30 transition-all">
              <Search size={14} className="text-white/20 mr-3" />
              <input value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Search settings..." className="bg-transparent border-none outline-none text-xs text-white/80 w-full" />
           </div>
        </div>
      </div>

      <div className="flex flex-1 gap-12 overflow-hidden">
        <div className="w-48 flex flex-col gap-1">
           {filteredMenu.map(item => (
             <button key={item.id} onClick={() => setLocalSection(item.id)} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${localSection === item.id ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/30 hover:text-white hover:bg-white/5'}`}>
               {item.icon}{item.label}
             </button>
           ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
           <AnimatePresence mode="wait">
             <motion.div key={localSection} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="space-y-8">
                
                {localSection === 'AUDIO' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <SettingsSection title="10-Band Equalizer">
                       <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
                          {Object.keys(EQ_PRESETS).map(name => (
                            <button key={name} onClick={() => updateAudioSettings({ eq: EQ_PRESETS[name] })} className="py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-indigo-400 transition-all">{name}</button>
                          ))}
                       </div>
                       <div className="flex justify-between items-end h-48 gap-2 px-2 pb-2">
                          {audioSettings.eq.map((val, i) => (
                            <div key={i} className="flex flex-col items-center flex-1 gap-3 h-full">
                               <div className="flex-1 w-1 bg-white/5 rounded-full relative">
                                  <div className="absolute bottom-0 left-0 w-full bg-indigo-500 rounded-full transition-all duration-300" style={{ height: `${((val + 12) / 24) * 100}%` }}></div>
                                  <input type="range" min="-12" max={12} step="1" value={val} onChange={(e) => {
                                    const newEq = [...audioSettings.eq];
                                    newEq[i] = parseInt(e.target.value);
                                    updateAudioSettings({ eq: newEq });
                                  }} className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize" style={{ writingMode: 'vertical-lr', direction: 'rtl' }} />
                               </div>
                               <span className="text-[8px] font-bold text-white/20 tracking-tighter">{['32','64','125','250','500','1k','2k','4k','8k','16k'][i]}</span>
                            </div>
                          ))}
                       </div>
                    </SettingsSection>
                    <SettingsSection title="Signal Enhancement">
                       <SliderControl label="Low-Frequency Bass Boost" value={audioSettings.bassBoost} onChange={(val) => updateAudioSettings({ bassBoost: val })} min={0} max={15} suffix="dB" />
                       <ToggleControl label="Dynamic Range Compression" active={audioSettings.compressor} onToggle={() => updateAudioSettings({ compressor: !audioSettings.compressor })} />
                    </SettingsSection>
                  </div>
                )}

                {localSection === 'VISUAL' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <SettingsSection title={t.settings_ui}>
                      <SliderControl label="Main Glass Opacity" value={visualSettings.glassOpacity} onChange={(val) => updateVisualSettings({ glassOpacity: val })} suffix="%" />
                      <SliderControl label="Sidebar Translucency" value={visualSettings.sidebarOpacity} onChange={(val) => updateVisualSettings({ sidebarOpacity: val })} suffix="%" />
                      <SliderControl label={t.neural_blur} min={0} max={100} value={visualSettings.blurAmount} onChange={(val) => updateVisualSettings({ blurAmount: val })} suffix="px" />
                    </SettingsSection>
                    
                    <SettingsSection title={t.settings_performance}>
                       <ToggleControl 
                         label={t.settings_bg_anim} 
                         active={visualSettings.animations} 
                         onToggle={() => updateVisualSettings({ animations: !visualSettings.animations })} 
                       />
                       <p className="text-[10px] text-white/20 mt-2 px-1 italic">{t.settings_low_power}</p>
                    </SettingsSection>
                  </div>
                )}

                {localSection === 'LOCALIZATION' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <SettingsSection title={t.settings_language}>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button 
                            onClick={() => updateAppSettings({ language: 'en' })}
                            className={`p-5 rounded-[24px] border transition-all text-left group ${appSettings.language === 'en' ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                               <span className="font-bold text-white">English</span>
                               {appSettings.language === 'en' && <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]"></div>}
                            </div>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Standard Interface</p>
                          </button>

                          <button 
                            onClick={() => updateAppSettings({ language: 'ru' })}
                            className={`p-5 rounded-[24px] border transition-all text-left group ${appSettings.language === 'ru' ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                               <span className="font-bold text-white">Русский</span>
                               {appSettings.language === 'ru' && <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]"></div>}
                            </div>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Российская локализация</p>
                          </button>
                       </div>
                    </SettingsSection>
                  </div>
                )}

                {localSection === 'CONNECTIVITY' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <SettingsSection title="SoundCloud Bridge">
                      <div className="flex items-center justify-between p-5 rounded-[24px] bg-white/[0.03] border border-white/5">
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center ${userProfile ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}><Music size={20} /></div>
                           <div>
                              <p className="text-sm font-bold text-white">{userProfile ? userProfile.username : "Guest Mode"}</p>
                              <p className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">{userProfile ? "Session Active" : "Limited Access"}</p>
                           </div>
                        </div>
                        <button onClick={handleAuth} className="px-5 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl">
                          {userProfile ? 'Relink' : 'Connect'}
                        </button>
                      </div>
                      <InputControl label="API Client ID" value={clientId} onChange={setClientId} icon={<Key size={14} />} />
                      <InputControl label="OAuth Token" value={userToken} onChange={setUserToken} placeholder="OAuth 2-..." icon={<Shield size={14} />} />
                    </SettingsSection>
                  </div>
                )}

                {localSection === 'SYSTEM' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <SettingsSection title={t.settings_general}>
                       <ToggleControl label={t.settings_auto_start} active={appSettings.autoStart} onToggle={() => handleSystemUpdate({ autoStart: !appSettings.autoStart })} />
                       <ToggleControl label="Minimize to Tray on Close" active={appSettings.closeToTray} onToggle={() => handleSystemUpdate({ closeToTray: !appSettings.closeToTray })} />
                       <ToggleControl label="Display Status in Taskbar" active={appSettings.showTrayIcon} onToggle={() => handleSystemUpdate({ showTrayIcon: !appSettings.showTrayIcon })} />
                       <div className="flex items-center gap-4">
                         <div className="flex-1">
                            <ToggleControl label={t.settings_discord_rpc} active={appSettings.discordRPC} onToggle={() => updateAppSettings({ discordRPC: !appSettings.discordRPC })} />
                         </div>
                         <div title={t.function_unavailable} className="text-yellow-500 cursor-help opacity-60 hover:opacity-100 transition-opacity pr-1">
                            <AlertCircle size={14} />
                         </div>
                       </div>
                    </SettingsSection>
                    <SettingsSection title="Memory & Cache">
                       <ToggleControl label="Persist Trending Data" active={appSettings.persistCache} onToggle={() => updateAppSettings({ persistCache: !appSettings.persistCache })} />
                       <button onClick={clearCache} className="w-full py-3 bg-white/5 rounded-xl text-xs font-bold text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all">Clear Metadata Cache</button>
                       <button onClick={clearAppData} className="w-full py-3 bg-red-500/5 border border-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-red-500 hover:text-white transition-all">Hard Reset Application</button>
                    </SettingsSection>
                  </div>
                )}
             </motion.div>
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const SettingsSection = ({ title, children }) => (
  <div className="space-y-4">
    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-2">{title}</h3>
    <div className="glow-border bg-black/40 p-6 rounded-[32px] space-y-6 backdrop-blur-3xl border border-white/5">{children}</div>
  </div>
);

const SliderControl = ({ label, value, onChange, min = 0, max = 100, suffix = "" }) => (
  <div className="space-y-3 px-1">
    <div className="flex justify-between items-center"><label className="text-xs font-bold text-white/60 uppercase tracking-widest">{label}</label><span className="text-[10px] font-mono text-indigo-400 font-black bg-indigo-500/10 px-2 py-0.5 rounded-full">{value}{suffix}</span></div>
    <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:bg-white/10 transition-colors" />
  </div>
);

const ToggleControl = ({ label, active, onToggle, disabled }) => (
  <div onClick={() => !disabled && onToggle && onToggle()} className={`flex items-center justify-between py-1 transition-all ${disabled ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:translate-x-1'}`}><p className="text-xs font-bold text-white/70 uppercase tracking-wide">{label}</p><div className={`w-8 h-4.5 rounded-full flex items-center px-0.5 transition-colors ${active ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-white/10'}`}><div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform ${active ? 'ml-auto' : ''}`}></div></div></div>
);

const InputControl = ({ label, value, onChange, placeholder, icon }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest px-1">{label}</label>
    <div className="relative group"><input type="password" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-3 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500/40 transition-all" /><div className="absolute right-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-indigo-500 transition-colors">{icon}</div></div>
  </div>
);

export default Settings;
