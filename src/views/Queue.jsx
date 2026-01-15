import React from 'react';
import { motion, Reorder } from 'framer-motion';
import { usePlayer } from '../context/PlayerContext';
import { useUserData } from '../context/UserDataContext';
import { SectionHeader, TrackRow } from '../components/PremiumUI';
import { Trash2 } from 'lucide-react';

const Queue = () => {
  const { queue, currentTrack, isPlaying, playTrack, togglePlay, setQueue } = usePlayer();
  const { t } = useUserData();

  const handlePlay = (track) => {
    if (currentTrack?.id === track.id) { togglePlay(); return; }
    playTrack(track); // Preserve current context
  };

  const onRightClick = (e, track) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('track-context-menu', { detail: { x: e.clientX, y: e.clientY, track } }));
  };

  const handleClear = () => {
    if (currentTrack) setQueue([currentTrack]);
    else setQueue([]);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.03 } }
  };

  if (queue.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-white/30 space-y-4">
         <h3 className="text-xl font-bold text-white">{t.queue_empty}</h3>
         <p className="text-sm font-medium opacity-50">{t.queue_hint}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-black/20 to-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto px-10 pb-32 pt-10 custom-scrollbar">
         <SectionHeader 
            title={t.queue} 
            description={`${queue.length} Tracks upcoming`}
            action={
               <button 
                  onClick={handleClear}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all text-xs font-bold uppercase tracking-wider"
               >
                  <Trash2 size={14} /> Clear
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
            {/* We could use Reorder.Group here for drag-drop, keeping it simple motion for now to match style */}
            {queue.map((track, i) => (
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

export default Queue;