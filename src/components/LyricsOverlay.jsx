import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlignLeft } from 'lucide-react';
import { fetchLyrics } from '../services/soundcloud';

const LyricsOverlay = ({ track, onClose }) => {
  const [lyrics, setLyrics] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!track) return;
    const load = async () => {
      setLoading(true);
      try {
        const text = await fetchLyrics(track.artist, track.title);
        setLyrics(text);
      } catch (e) {
        setLyrics('');
      }
      setLoading(false);
    };
    load();
  }, [track]);

  // Prevent clicks inside the card from closing the overlay
  const handleCardClick = (e) => {
    e.stopPropagation();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="absolute inset-0 z-[60] flex items-center justify-center p-8 bg-black/60 backdrop-blur-xl cursor-default"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={handleCardClick}
        className="relative w-full max-w-2xl h-[80vh] flex flex-col bg-[#0a0a0a] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden p-12"
      >
        
        {/* Close Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-8 right-8 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all z-20 cursor-pointer"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-6 mb-12 relative z-10">
           <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border border-white/10 shrink-0">
              <img src={track.artwork || `https://ui-avatars.com/api/?name=${track.title}&background=random`} className="w-full h-full object-cover" />
           </div>
           <div className="min-w-0">
              <h2 className="text-3xl font-bold text-white truncate tracking-tight">{track.title}</h2>
              <p className="text-indigo-400 font-bold tracking-[0.2em] uppercase text-xs mt-2">{track.artist}</p>
           </div>
        </div>

        {/* Lyrics Content */}
        <div className="flex-1 overflow-y-auto pr-4 scroll-smooth custom-scrollbar relative z-10">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-20">
               <AlignLeft size={48} className="animate-pulse" />
               <p className="text-xs font-bold tracking-[0.3em] uppercase">Decoding Signal...</p>
            </div>
          ) : lyrics ? (
            <div className="text-xl md:text-2xl font-medium text-white/90 leading-relaxed whitespace-pre-wrap font-sans tracking-tight">
              {lyrics.replace(/\[\d{2}:\d{2}\.\d{2}\]/g, '')} {/* Strip timestamps if present */}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4">
               <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                  <AlignLeft size={32} />
               </div>
               <div>
                 <p className="text-xl text-white/40 font-medium">Instrumentation Detected</p>
                 <p className="text-[10px] text-indigo-500/40 uppercase tracking-[0.3em] mt-2 font-bold">No linguistic data found in Aether Core</p>
               </div>
            </div>
          )}
        </div>

        {/* Background Ambient Glows */}
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      </motion.div>
    </motion.div>
  );
};

export default LyricsOverlay;