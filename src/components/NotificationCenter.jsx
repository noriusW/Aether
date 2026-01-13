import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Info, Download, CheckCircle, X, Brain, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';

const NotificationCenter = ({ updateInfo, onClose }) => {
  const { neuralFeedback, handleNeuralFeedback, t } = useUserData();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute top-16 left-0 w-85 bg-[#050505] border border-white/10 rounded-[32px] shadow-[0_20px_80px_rgba(0,0,0,0.8)] z-[100] overflow-hidden flex flex-col backdrop-blur-3xl cursor-default"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
          <Bell size={14} />
          {t.signal_center || 'Signal Center'}
        </h3>
        <button onClick={onClose} className="p-1 rounded-full text-white/20 hover:text-white transition-all cursor-pointer">
          <X size={16} />
        </button>
      </div>

      <div className="p-3 max-h-[450px] overflow-y-auto custom-scrollbar space-y-2">
        
        {/* NEURAL FEEDBACK QUESTION */}
        {neuralFeedback && (
          <div className="p-5 rounded-[24px] bg-indigo-500/10 border border-indigo-500/20 animate-pulse-subtle">
             <div className="flex items-center gap-3 mb-4">
                <Brain size={18} className="text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">{t.neural_sync_request}</span>
             </div>
             <p className="text-sm font-bold text-white mb-5 leading-tight">{neuralFeedback.question}</p>
             <div className="flex gap-2">
                <button 
                  onClick={() => handleNeuralFeedback('YES')}
                  className="flex-1 py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:scale-105 transition-all"
                >
                  <ThumbsUp size={12} /> {t.yes || 'Yes'}
                </button>
                <button 
                  onClick={() => handleNeuralFeedback('NO')}
                  className="flex-1 py-2.5 bg-white/5 text-white/60 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-red-500/20 hover:text-red-400 transition-all"
                >
                  <ThumbsDown size={12} /> {t.no || 'No'}
                </button>
             </div>
          </div>
        )}

        {updateInfo && (
          <div className="p-5 rounded-[24px] bg-white/[0.03] border border-white/5 group">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-indigo-500 text-white">
                <Download size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white mb-1">Update v{updateInfo.version}</p>
                <p className="text-[10px] text-white/30 leading-relaxed">Optimization patch available.</p>
                <button 
                  onClick={() => window.electron.invoke('open-external', updateInfo.url)}
                  className="mt-4 w-full py-2 bg-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-white hover:text-black transition-all"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        {!neuralFeedback && !updateInfo && (
          <div className="py-12 flex flex-col items-center justify-center opacity-20">
             <CheckCircle size={32} className="mb-3" />
             <p className="text-[10px] font-bold uppercase tracking-widest">Core Synchronized</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-black text-center border-t border-white/5">
         <p className="text-[8px] text-white/10 uppercase tracking-[0.4em] font-bold">Aether Intelligence Active</p>
      </div>
    </motion.div>
  );
};

export default NotificationCenter;
