import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Compass, RefreshCcw, Sparkles, Play, AudioLines, Pause } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useUserData } from '../context/UserDataContext';
import { generateRecommendations, generateDailyMixes } from '../services/recommendationService';
import { SectionHeader, AnimatedPlayIcon } from '../components/PremiumUI';
import Loader from '../components/Loader';

const Home = () => {
  const { playTrack, setQueue, currentTrack, isPlaying, togglePlay, playbackContext } = usePlayer();
  const { likedSongs, dislikedSongs, t, homeRecommendations, setHomeRecommendations, dailyMixes, updateDailyMixes, algorithmSettings } = useUserData();
  const [loading, setLoading] = useState(false);

  const loadRecommendations = useCallback(async (force = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const tracks = await generateRecommendations(likedSongs, algorithmSettings, dislikedSongs);
      setHomeRecommendations(tracks);
    } catch (e) {}
    setLoading(false);
  }, [likedSongs, algorithmSettings, dislikedSongs, loading, setHomeRecommendations]);

  useEffect(() => {
    if (!homeRecommendations.length) loadRecommendations();
    if (!dailyMixes) {
       generateDailyMixes(likedSongs).then(updateDailyMixes);
    }
  }, [likedSongs.length, homeRecommendations.length, dailyMixes, loadRecommendations, updateDailyMixes]);

  const handlePlay = useCallback((track, e) => {
    e.stopPropagation();
    if (currentTrack?.id === track.id) { togglePlay(); return; }
    setQueue(homeRecommendations);
    playTrack(track, { id: 'home', type: 'recommendations' });
  }, [currentTrack, homeRecommendations, togglePlay, setQueue, playTrack]);

  const handleMixPlay = useCallback((mix, e) => {
    e.stopPropagation();
    const isMixActive = playbackContext?.id === mix.id && playbackContext?.type === 'mix';
    
    if (isMixActive) {
       togglePlay();
    } else if (mix.tracks.length) {
       setQueue(mix.tracks);
       playTrack(mix.tracks[0], { id: mix.id, type: 'mix' });
    }
  }, [playbackContext, togglePlay, setQueue, playTrack]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  if (loading && !homeRecommendations.length) return <div className="h-full flex items-center justify-center"><Loader /></div>;

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-black/20 to-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto px-10 pb-32 pt-10 custom-scrollbar">
        
        {/* Hero / Daily Mixes */}
        {dailyMixes && (
          <div className="mb-12">
             <SectionHeader title={t.daily_mixes || 'Daily Flow'} description="Curated stations based on your sonic profile." />
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dailyMixes.slice(0, 3).map((mix, i) => {
                   const isMixActive = playbackContext?.id === mix.id && playbackContext?.type === 'mix';
                   
                   return (
                      <motion.div 
                         key={mix.id} 
                         initial={{ opacity: 0, y: 20 }} 
                         animate={{ opacity: 1, y: 0 }} 
                         transition={{ delay: i * 0.1 }}
                         onClick={(e) => handleMixPlay(mix, e)}
                         className="group relative h-64 rounded-[32px] overflow-hidden cursor-pointer shadow-2xl"
                      >
                         <div className={`absolute inset-0 bg-gradient-to-br ${mix.color} opacity-80 group-hover:scale-110 transition-transform duration-700`} />
                         <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                         
                         <div className="absolute top-6 left-6 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white">
                            {isMixActive && isPlaying ? <AudioLines size={20} className="animate-pulse" /> : <Sparkles size={20} />}
                         </div>

                         <div className="absolute bottom-6 left-6 right-6">
                            <h3 className="text-2xl font-black text-white mb-1 leading-tight">{mix.title}</h3>
                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{mix.tracks.length} Tracks</p>
                         </div>

                         <div className={`absolute bottom-6 right-6 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center transition-all transform shadow-lg ${isMixActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0'}`}>
                            <AnimatedPlayIcon isPlaying={isMixActive && isPlaying} size={20} color="black" />
                         </div>
                      </motion.div>
                   );
                })}
             </div>
          </div>
        )}

        {/* Discovery Section */}
        <SectionHeader 
           title={t.neural_discovery} 
           description={t.neural_sync} 
           action={
             <button onClick={() => loadRecommendations(true)} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
             </button>
           }
        />

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
        >
          {homeRecommendations.map((track) => {
            const isActive = currentTrack?.id === track.id;
            return (
              <motion.div 
                key={track.id} 
                layout
                whileHover={{ y: -8 }}
                onClick={(e) => handlePlay(track, e)} 
                onContextMenu={(e) => window.dispatchEvent(new CustomEvent('track-context-menu', { detail: { x: e.clientX, y: e.clientY, track } }))}
                className="group relative flex flex-col gap-3 cursor-pointer"
              >
                <div className="aspect-square rounded-[24px] bg-[#0a0a0a] overflow-hidden relative shadow-lg border border-white/5 group-hover:shadow-2xl transition-all">
                   <img src={track.artwork || `https://ui-avatars.com/api/?name=${track.title}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                   {isActive && <div className="absolute inset-0 bg-indigo-500/40 backdrop-blur-[2px]" />}
                   
                   <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform">
                         <AnimatedPlayIcon isPlaying={isActive && isPlaying} size={24} color="black" />
                      </div>
                   </div>
                </div>
                <div>
                   <h4 className={`font-bold text-sm truncate ${isActive ? 'text-indigo-400' : 'text-white group-hover:text-white'}`}>{track.title}</h4>
                   <p className="text-xs text-white/40 font-bold uppercase tracking-wider truncate group-hover:text-white/60">{track.artist}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default Home;