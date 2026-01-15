import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Play } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';
import { usePlayer } from '../context/PlayerContext';
import { SectionHeader, TrackRow, AnimatedPlayIcon } from '../components/PremiumUI';

const Library = () => {
  const { likedSongs, toggleLike, t } = useUserData();
  const { playTrack, setQueue, currentTrack, isPlaying, togglePlay, playbackContext } = usePlayer();

  const handlePlay = React.useCallback((track) => {
    if (currentTrack?.id === track.id) { togglePlay(); return; }
    setQueue(likedSongs);
    playTrack(track, { id: 'library', type: 'library' });
  }, [currentTrack, likedSongs, togglePlay, setQueue, playTrack]);

  const onRightClick = React.useCallback((e, track) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('track-context-menu', { detail: { x: e.clientX, y: e.clientY, track } }));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.02 } }
  };

  if (likedSongs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-white/30 space-y-4">
         <div className="p-8 rounded-full bg-white/5"><Heart size={64} /></div>
         <h3 className="text-xl font-bold text-white">{t.playlist_empty}</h3>
         <p className="text-sm font-medium opacity-50">{t.discover_prompt || 'Go explore the universe.'}</p>
      </div>
    );
  }

  const isLibraryPlaying = playbackContext?.id === 'library' && playbackContext?.type === 'library';

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-black/20 to-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto px-10 pb-32 pt-10 custom-scrollbar">
         <SectionHeader 
            title={t.likes} 
            description={`${likedSongs.length} Tracks • Private Collection`}
            action={
               <button 
                  onClick={() => { 
                     if(isLibraryPlaying) togglePlay(); 
                     else if(likedSongs.length) { setQueue(likedSongs); playTrack(likedSongs[0], { id: 'library', type: 'library' }); } 
                  }}
                  className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
               >
                  <AnimatedPlayIcon isPlaying={isLibraryPlaying && isPlaying} size={24} color="black" />
               </button>
            }
         />

         <div className="grid grid-cols-[auto_auto_1fr_auto] gap-4 px-4 py-2 text-[10px] uppercase font-bold text-white/20 border-b border-white/5 mb-4">
            <div className="w-8 text-center">#</div>
            <div className="w-12"></div>
            <div>Title</div>
            <div className="w-12 text-right">Time</div>
         </div>

         <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-1">
            {likedSongs.map((track, i) => (
               <TrackRow 
                  key={track.id}
                  index={i}
                  track={track}
                  active={currentTrack?.id === track.id}
                  playing={isPlaying}
                  onClick={() => handlePlay(track)}
                  onContextMenu={(e) => onRightClick(e, track)}
               />
            ))}
         </motion.div>
      </div>
    </div>
  );
};

export default Library;