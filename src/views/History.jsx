import React from 'react';
import { motion } from 'framer-motion';
import { useUserData } from '../context/UserDataContext';
import { usePlayer } from '../context/PlayerContext';
import { SectionHeader, TrackRow } from '../components/PremiumUI';

const History = () => {
  const { history, t } = useUserData();
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();

  const handlePlay = React.useCallback((track) => {
    if (currentTrack?.id === track.id) { togglePlay(); return; }
    playTrack(track, { id: 'history', type: 'history' });
  }, [currentTrack, togglePlay, playTrack]);

  const onRightClick = React.useCallback((e, track) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('track-context-menu', { detail: { x: e.clientX, y: e.clientY, track } }));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.03 } }
  };

  if (history.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-white/30 space-y-4">
         <h3 className="text-xl font-bold text-white">{t.history} is empty</h3>
         <p className="text-sm font-medium opacity-50">Start listening to build your timeline.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-black/20 to-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto px-10 pb-32 pt-10 custom-scrollbar">
         <SectionHeader 
            title={t.history} 
            description="Your recent sonic journey."
         />

         <div className="grid grid-cols-[auto_auto_1fr_auto] gap-4 px-4 py-2 text-[10px] uppercase font-bold text-white/20 border-b border-white/5 mb-4">
            <div className="w-8 text-center">#</div>
            <div className="w-12"></div>
            <div>Title</div>
            <div className="w-12 text-right">Time</div>
         </div>

         <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-1">
            {history.map((track, i) => (
               <TrackRow 
                  key={`${track.id}-${i}`}
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

export default History;
