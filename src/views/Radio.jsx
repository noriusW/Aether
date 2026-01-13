import React, { useEffect, useState } from 'react';
import { Play, Pause, Radio as RadioIcon, Sparkles, Zap, Moon, Sun, Coffee, Disc, RefreshCw, ArrowLeft, Clock } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useUserData } from '../context/UserDataContext';
import { searchTracks, getStreamUrl } from '../services/soundcloud';
import { generateMoodWave, generateDailyMixes } from '../services/recommendationService';
import Loader from '../components/Loader';

const Radio = () => {
  const { playTrack, setQueue, currentTrack, isPlaying, togglePlay } = usePlayer();
  const { t, likedSongs, dailyMixes, dailyMixesTimestamp, updateDailyMixes } = useUserData();
  const [loading, setLoading] = useState(false);
  const [vibe, setVibe] = useState(50);
  const [selectedMix, setSelectedMix] = useState(null);

  const loadMixes = async (force = false) => {
    // If not forced, check if we have valid mixes (less than 24h old)
    if (!force && dailyMixes && dailyMixesTimestamp) {
      const hoursSinceUpdate = (Date.now() - dailyMixesTimestamp) / (1000 * 60 * 60);
      if (hoursSinceUpdate < 24) return;
    }

    setLoading(true);
    try {
      const mixes = await generateDailyMixes(likedSongs);
      updateDailyMixes(mixes);
    } catch (e) {
      console.error("Failed to load daily mixes", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMixes();
  }, []);

  const handleMoodWave = async () => {
    setLoading(true);
    try {
      const tracks = await generateMoodWave(vibe, likedSongs);
      if (tracks.length > 0) {
        setQueue(tracks);
        playTrack(tracks[0]);
      }
    } catch (error) {
      console.error("Failed to generate Mood Wave:", error);
    }
    setLoading(false);
  };

  const getVibeIcon = () => {
    if (vibe < 25) return <Moon size={18} className="text-blue-400" />;
    if (vibe < 50) return <Coffee size={18} className="text-green-400" />;
    if (vibe < 75) return <Sun size={18} className="text-yellow-400" />;
    return <Zap size={18} className="text-red-400" />;
  };

  const getVibeLabel = () => {
    if (vibe < 20) return `${t.neural_vibe} (${t.vibe_deep})`;
    if (vibe < 40) return `${t.neural_vibe} (${t.vibe_chill})`;
    if (vibe < 60) return `${t.neural_vibe} (${t.vibe_medium})`;
    if (vibe < 80) return `${t.neural_vibe} (${t.vibe_energetic})`;
    return `${t.neural_vibe} (${t.vibe_maximum})`;
  };

  const getMixTitle = (mix) => {
    const keys = {
      'remix': t.mix_remix,
      'discovery': t.mix_discovery,
      'focus': t.mix_focus,
      'energy': t.mix_energy,
      'vibe': t.mix_vibe
    };
    return keys[mix.id] || mix.title;
  };

  const handlePlayMix = (e, mix) => {
    e.stopPropagation();
    if (mix.tracks.length > 0) {
      setQueue(mix.tracks);
      playTrack(mix.tracks[0]);
    }
  };

  const formatDuration = (ms) => {
    const min = Math.floor(ms / 60000);
    const sec = ((ms % 60000) / 1000).toFixed(0);
    return `${min}:${sec.padStart(2, '0')}`;
  };

  if (selectedMix) {
    return (
      <div className="flex-1 overflow-y-auto px-8 pb-32 animate-in fade-in duration-500">
        <button 
          onClick={() => setSelectedMix(null)}
          className="mt-6 mb-8 flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">{t.back}</span>
        </button>

        <div className="flex flex-col md:flex-row gap-8 mb-12 items-end">
          <div className={`w-64 h-64 rounded-[40px] bg-gradient-to-br ${selectedMix.color} shadow-2xl flex-shrink-0 relative overflow-hidden group`}>
             {selectedMix.artwork ? (
               <img src={selectedMix.artwork} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60" alt="" />
             ) : (
               <div className="absolute inset-0 flex items-center justify-center opacity-20">
                 <Disc size={120} />
               </div>
             )}
             <div className="absolute inset-0 flex items-center justify-center">
                <button 
                  onClick={(e) => handlePlayMix(e, selectedMix)}
                  className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500"
                >
                  <Play fill="black" size={32} className="ml-1" />
                </button>
             </div>
          </div>
          
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-2 block">{t.daily_collection}</span>
            <h1 className="text-5xl font-black text-white mb-6 tracking-tighter">{getMixTitle(selectedMix)}</h1>
            <div className="flex items-center gap-6">
               <button 
                 onClick={(e) => handlePlayMix(e, selectedMix)}
                 className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl flex items-center gap-3"
               >
                 <Play fill="black" size={18} />
                 {t.play_all}
               </button>
               <span className="text-white/20 text-xs font-mono">{selectedMix.tracks.length} Tracks / {t.neural_discovery}</span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {selectedMix.tracks.map((track, i) => {
            const isActive = currentTrack?.id === track.id;
            return (
              <div 
                key={track.id}
                onClick={() => { setQueue(selectedMix.tracks); playTrack(track); }}
                className={`group flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer ${isActive ? 'bg-white/10' : ''}`}
              >
                <span className="w-8 text-center text-xs font-mono text-white/10 group-hover:text-indigo-400 transition-colors">
                  {isActive && isPlaying ? <div className="flex items-end justify-center gap-0.5 h-3"><div className="w-0.5 h-full bg-indigo-400 animate-bounce"></div><div className="w-0.5 h-2/3 bg-indigo-400 animate-bounce [animation-delay:0.2s]"></div><div className="w-0.5 h-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></div></div> : (i + 1).toString().padStart(2, '0')}
                </span>
                <img src={track.artwork} className="w-10 h-10 rounded-lg object-cover shadow-md" alt="" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${isActive ? 'text-indigo-400' : 'text-white'}`}>{track.title}</p>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-tighter truncate">{track.artist}</p>
                </div>
                <span className="text-xs font-mono text-white/20">{formatDuration(track.duration)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-32">
       {/* Mood Wave Section */}
       <div className="mb-12 p-8 rounded-[40px] bg-gradient-to-br from-indigo-600/10 to-purple-900/10 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Sparkles size={120} className="text-indigo-400" />
          </div>
          
          <div className="relative z-10">
             <div className="flex items-center gap-2 mb-2">
                <div className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">{t.neural_feature}</div>
             </div>
             <h2 className="text-3xl font-bold text-white mb-2">{t.neural_vibe}</h2>
             <p className="text-white/40 text-sm mb-8 max-w-md">{t.neural_vibe_desc}</p>
             
             <div className="flex flex-col gap-6 max-w-lg">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-6 flex justify-center">
                        {getVibeIcon()}
                      </div>
                      <span className="text-sm font-bold text-white uppercase tracking-tighter min-w-[180px]">{getVibeLabel()}</span>
                   </div>
                   <span className="text-xs font-mono text-white/20 w-32 text-right">{vibe}% {t.sensitivity}</span>
                </div>
                
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={vibe} 
                  onChange={(e) => setVibe(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500 transition-all active:scale-[1.01]"
                />
                
                <button 
                  onClick={handleMoodWave}
                  disabled={loading}
                  className="w-fit px-8 py-3 bg-white text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 flex items-center gap-3"
                >
                  {loading ? <Loader size={16} /> : <Sparkles size={18} />}
                  {t.ignite_wave}
                </button>
             </div>
          </div>
       </div>

       <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-light text-white/90 flex items-center gap-3 tracking-wide">
            <Disc size={18} className="text-indigo-400" />
            {t.daily_mixes}
          </h2>
          
          <button 
            onClick={() => loadMixes(true)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all disabled:opacity-50 group"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
          </button>
       </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {(dailyMixes || []).map((mix) => {
           const isMixActive = mix.tracks.some(tr => tr.id === currentTrack?.id);
           const isMixPlaying = isMixActive && isPlaying;

           return (
            <div key={mix.id} onClick={() => setSelectedMix(mix)} className="group cursor-pointer relative overflow-hidden rounded-3xl aspect-[3/4] border border-white/5 bg-black/40 hover:border-white/20 transition-all shadow-lg hover:shadow-indigo-500/10">
               {/* Background Gradient */}
               <div className={`absolute inset-0 bg-gradient-to-b ${mix.color} opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
               
               {mix.artwork ? (
                 <img src={mix.artwork} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity mix-blend-overlay" alt="" />
               ) : (
                 <div className="absolute inset-0 flex items-center justify-center opacity-10">
                   <Disc size={100} />
                 </div>
               )}

               <div className="absolute inset-0 p-6 flex flex-col justify-end relative z-10">
                  <div 
                    onClick={(e) => handlePlayMix(e, mix)}
                    className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center transition-transform shadow-lg ${isMixActive ? 'scale-110 bg-white text-black' : 'group-hover:scale-110 text-white'}`}
                  >
                    {isMixPlaying ? <Pause fill="currentColor" size={16} /> : <Play fill="currentColor" size={16} className="ml-0.5" />}
                  </div>
                  
                  <h3 className={`text-xl font-bold mb-1 tracking-tight leading-tight ${isMixActive ? 'text-indigo-300' : 'text-white'}`}>{getMixTitle(mix)}</h3>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] text-white/40 uppercase tracking-widest font-black">{t.daily_collection}</span>
                  </div>
               </div>
            </div>
           );
        })}
      </div>
    </div>
  );
};

export default Radio;
