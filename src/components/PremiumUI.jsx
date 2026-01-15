import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause } from 'lucide-react';

export const SectionHeader = ({ title, description, action }) => (
   <div className="flex items-end justify-between mb-8">
      <div>
         <h2 className="text-4xl font-black text-white tracking-tighter mb-2">{title}</h2>
         {description && <p className="text-white/50 text-sm font-medium">{description}</p>}
      </div>
      {action && <div>{action}</div>}
   </div>
);

export const Card = ({ children, className = "", onClick, ...props }) => (
   <motion.div 
      onClick={onClick}
      className={`p-6 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all backdrop-blur-md ${className}`}
      {...props}
   >
      {children}
   </motion.div>
);

export const FeatureCard = ({ title, description, icon, active, onToggle, onClick }) => (
   <div 
      onClick={onToggle || onClick}
      className={`p-6 rounded-[28px] border cursor-pointer transition-all flex flex-col justify-between h-40 group relative overflow-hidden ${active ? 'bg-white/[0.08] border-white/20' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'}`}
   >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex justify-between items-start relative z-10">
         <div className={`p-3 rounded-2xl bg-black/20 ${active ? 'text-white' : 'text-white/40 group-hover:text-white'}`}>{icon}</div>
         {onToggle && (
            <div className={`w-12 h-7 rounded-full p-1 transition-colors ${active ? 'bg-indigo-500' : 'bg-white/10'}`}>
               <motion.div 
                  className="w-5 h-5 rounded-full bg-white shadow-sm" 
                  animate={{ x: active ? 20 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
               />
            </div>
         )}
      </div>
      <div className="relative z-10">
         <h3 className={`font-bold text-lg mb-1 ${active ? 'text-white' : 'text-white/80'}`}>{title}</h3>
         <p className="text-xs text-white/40 leading-relaxed line-clamp-2 group-hover:text-white/60 transition-colors">{description}</p>
      </div>
   </div>
);

export const AnimatedPlayIcon = ({ isPlaying, size = 16, color = "currentColor" }) => (
   <AnimatePresence mode="wait" initial={false}>
      {isPlaying ? (
         <motion.div
            key="pause"
            initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.2 }}
         >
            <Pause fill={color} size={size} className="text-current" />
         </motion.div>
      ) : (
         <motion.div
            key="play"
            initial={{ scale: 0.5, opacity: 0, rotate: 45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: -45 }}
            transition={{ duration: 0.2 }}
         >
            <Play fill={color} size={size} className="ml-0.5 text-current" />
         </motion.div>
      )}
   </AnimatePresence>
);

export const TrackRow = React.memo(({ track, index, active, playing, onClick, onContextMenu, onLike, isLiked }) => (
   <motion.div 
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.05)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`group flex items-center gap-4 p-3 rounded-2xl transition-all border border-transparent ${active ? 'bg-indigo-500/10 border-indigo-500/20' : 'hover:border-white/5'}`}
   >
      <div className="w-8 text-center flex justify-center text-xs font-bold text-white/20 group-hover:text-white">
         <div className="hidden group-hover:block text-white">
            <AnimatedPlayIcon isPlaying={active && playing} size={12} />
         </div>
         <div className="group-hover:hidden">
            {active && playing ? (
               <div className="flex gap-0.5 items-end h-3 justify-center">
                  {[1,2,3].map(i => <motion.div key={i} animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.5 + i*0.1 }} className="w-1 bg-indigo-400 rounded-full" />)}
               </div>
            ) : (
               <span className={active ? "text-indigo-400" : ""}>{index + 1}</span>
            )}
         </div>
      </div>

      <div className="w-12 h-12 rounded-xl bg-black/40 overflow-hidden relative shadow-lg shrink-0">
         <img src={track.artwork || `https://ui-avatars.com/api/?name=${track.title}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="flex-1 min-w-0">
         <h4 className={`font-bold text-sm truncate ${active ? 'text-indigo-300' : 'text-white/90'}`}>{track.title}</h4>
         <p className="text-xs text-white/40 truncate font-medium group-hover:text-white/60">{track.artist}</p>
      </div>

      <div className="text-xs font-mono text-white/20 w-12 text-right group-hover:text-white/50">
         {track.duration ? `${Math.floor(track.duration/60000)}:${String(Math.floor((track.duration%60000)/1000)).padStart(2, '0')}` : '--:--'}
      </div>
   </motion.div>
));

export const SubTabs = ({ tabs, activeTab, onChange }) => (
   <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl w-fit">
      {tabs.map(tab => (
         <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTab === tab.id ? 'text-black' : 'text-white/40 hover:text-white'}`}
         >
            {activeTab === tab.id && (
               <motion.div 
                  layoutId="subTabActive"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
               />
            )}
            <span className="relative z-10">{tab.label}</span>
         </button>
      ))}
   </div>
);

export const GhostButton = ({ children, onClick, active, icon }) => (
   <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${active ? 'bg-white text-black border-white' : 'bg-transparent text-white/40 border-white/5 hover:border-white/20 hover:text-white'}`}
   >
      {icon}
      <span>{children}</span>
   </button>
);

export const Slider = ({ value, onChange, min=0, max=100 }) => (
   <div className="relative h-1.5 bg-white/10 rounded-full w-full group cursor-pointer">
      <motion.div 
         className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
         style={{ width: `${(value / max) * 100}%` }}
      />
      <div 
         className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
         style={{ left: `${(value / max) * 100}%`, transform: 'translate(-50%, -50%)' }}
      />
      <input 
         type="range" min={min} max={max} value={value} 
         onChange={(e) => onChange(parseInt(e.target.value))}
         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
   </div>
);