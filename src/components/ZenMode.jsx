import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minimize2, SkipBack, SkipForward, Play, Pause } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import AudioVisualizer from './AudioVisualizer';

const ZenMode = ({ onClose }) => {
  const { currentTrack, isPlaying, togglePlay, handleNext, handlePrev, analyserRef } = usePlayer();
  const [mouseIdle, setMouseIdle] = useState(false);
  const idleTimer = useRef(null);

  useEffect(() => {
    const resetTimer = () => {
      setMouseIdle(false);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setMouseIdle(true), 3000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('click', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('click', resetTimer);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  if (!currentTrack) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
         <img src={currentTrack.artwork} className="absolute inset-0 w-full h-full object-cover opacity-30 blur-[100px] scale-150 animate-pulse-slow" />
         <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center gap-12 max-w-4xl w-full px-8">
         <motion.div 
           layoutId="zen-artwork"
           className="relative w-[50vh] h-[50vh] max-w-[500px] max-h-[500px] rounded-full shadow-[0_0_100px_rgba(0,0,0,0.5)]"
         >
            <motion.img 
              src={currentTrack.artwork} 
              className="w-full h-full object-cover rounded-full"
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear", repeatType: "loop" }} 
              style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
            />
            {/* Center Vinyl Hole */}
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-4 h-4 bg-black rounded-full border-2 border-white/10" />
            </div>
            
            {/* Circular Visualizer (Simulated via border glow for now) */}
            <div className={`absolute inset-[-20px] rounded-full border-2 border-white/5 opacity-50 ${isPlaying ? 'animate-ping' : ''}`} style={{ animationDuration: '2s' }}></div>
         </motion.div>

         <div className="text-center space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black text-white tracking-tighter"
            >
              {currentTrack.title}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-xl text-white/50 font-medium uppercase tracking-widest"
            >
              {currentTrack.artist}
            </motion.p>
         </div>
      </div>

      {/* Controls Overlay */}
      <AnimatePresence>
        {!mouseIdle && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-12 left-0 w-full flex justify-center items-center gap-8 z-20"
          >
             <button onClick={handlePrev} className="p-4 rounded-full bg-white/5 hover:bg-white/20 text-white transition-all hover:scale-110"><SkipBack size={32} /></button>
             <button onClick={togglePlay} className="p-6 rounded-full bg-white text-black hover:scale-110 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                {isPlaying ? <Pause size={48} fill="black" /> : <Play size={48} fill="black" className="ml-2" />}
             </button>
             <button onClick={handleNext} className="p-4 rounded-full bg-white/5 hover:bg-white/20 text-white transition-all hover:scale-110"><SkipForward size={32} /></button>
             
             <button 
               onClick={onClose}
               className="absolute top-12 right-12 p-4 rounded-full bg-white/5 hover:bg-white/20 text-white/50 hover:text-white transition-all"
             >
               <Minimize2 size={24} />
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ZenMode;
