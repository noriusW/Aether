import React, { useEffect, useState } from 'react';
import { Play, Pause, Compass, RefreshCcw } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useUserData } from '../context/UserDataContext';
import { generateRecommendations } from '../services/recommendationService';
import Loader from '../components/Loader';

const Home = () => {
  const { playTrack, setQueue, currentTrack, isPlaying, togglePlay } = usePlayer();
  const { likedSongs, t, homeRecommendations, setHomeRecommendations } = useUserData();
  
  const [loading, setLoading] = useState(false);
  
  const loadRecommendations = async (force = false) => {
    if (loading) return;
    // Skip if we already have recommendations and it's not a force refresh
    if (!force && homeRecommendations && homeRecommendations.length > 0) return;
    
    setLoading(true);
    try {
      const tracks = await generateRecommendations(likedSongs);
      setHomeRecommendations(tracks);
    } catch (e) {
      console.error("Recommendations failed", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const handlePlay = (track, e) => {
    e.stopPropagation();
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }
    setQueue(homeRecommendations);
    playTrack(track);
  };

  if (loading && (!homeRecommendations || !homeRecommendations.length)) return <div className="h-full flex items-center justify-center"><Loader /></div>;

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-32">
      <div className="flex items-center justify-between mb-8 mt-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="relative">
               <Compass size={24} className="text-indigo-400" />
               {loading && <div className="absolute inset-0 text-indigo-400 animate-ping"><Compass size={24} /></div>}
            </div>
            {t.neural_discovery}
          </h2>
          <p className="text-white/30 text-[10px] mt-1 uppercase tracking-[0.2em] font-black">
            {loading ? t.neural_recalibrating : t.neural_sync}
          </p>
        </div>
        
        <button 
          onClick={() => loadRecommendations(true)}
          className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all group"
          title="Force Refresh"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
        {homeRecommendations.map((track) => {
          const isActive = currentTrack?.id === track.id;
          const isActivePlaying = isActive && isPlaying;

          return (
            <div 
              key={track.id} 
              onClick={(e) => handlePlay(track, e)} 
              onContextMenu={(e) => window.dispatchEvent(new CustomEvent('track-context-menu', { detail: { x: e.clientX, y: e.clientY, track } }))}
              className="group cursor-pointer p-4 rounded-[32px] glow-border bg-black/20 hover:bg-black/40 transition-all duration-500"
            >
              <div className="aspect-square rounded-2xl bg-[#0a0a0a] mb-4 relative overflow-hidden shadow-lg border border-white/5">
                <img 
                  src={track.artwork || `https://ui-avatars.com/api/?name=${track.title}&background=random&color=fff&size=400`} 
                  alt={track.title} 
                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isActivePlaying ? 'scale-110' : ''}`} 
                />
                <div className={`absolute inset-0 bg-black/20 transition-colors ${isActive ? 'bg-black/40' : 'group-hover:bg-black/40'}`}></div>
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                   <button className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-transform">
                     {isActivePlaying ? <Pause fill="black" size={24} /> : <Play fill="black" size={24} className="ml-1" />}
                   </button>
                </div>
              </div>
              <h3 className={`text-sm font-bold truncate px-1 transition-colors ${isActive ? 'text-indigo-400' : 'text-white/90'}`}>{track.title}</h3>
              <p className="text-[10px] text-white/30 truncate px-1 mt-1 font-black uppercase tracking-tighter">{track.artist}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Home;
