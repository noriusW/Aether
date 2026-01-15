import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Heart, List, Clock, Play, RefreshCw, LogOut, MapPin, Users, Music2, Layers, Info } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';
import { usePlayer } from '../context/PlayerContext';
import { AnimatedPlayIcon } from '../components/PremiumUI';

const Profile = () => {
  const { userProfile, userPlaylists, t, logout, syncSoundCloud, isSyncing, setSidebarSubItems } = useUserData();
  const { currentTrack, isPlaying, playTrack, setQueue } = usePlayer();
  const [activeTab, setActiveTab] = useState('PLAYLISTS'); // STATS, PLAYLISTS

  useEffect(() => {
    setSidebarSubItems({
      parentId: 'PROFILE',
      activeId: activeTab,
      items: [
        { id: 'PLAYLISTS', label: t.playlists || 'Playlists' },
        { id: 'STATS', label: t.profile_stats || 'Stats' }
      ],
      onSelect: (id) => setActiveTab(id)
    });
    return () => setSidebarSubItems(null);
  }, [activeTab, t]);

  const onRightClick = (e, p) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('track-context-menu', { 
      detail: { x: e.clientX, y: e.clientY, track: { ...p, type: 'playlist' } } 
    }));
  };

  const handlePlayPlaylist = (e, p) => {
    e.stopPropagation();
    if (p.tracks?.length > 0) {
      setQueue(p.tracks);
      playTrack(p.tracks[0]);
    }
  };

  if (!userProfile) return (
    <div className="flex-1 flex flex-col items-center justify-center text-white/50 h-full">
       <User size={64} className="mb-4 opacity-20" />
       <p className="text-sm font-bold uppercase tracking-widest">{t.auth_title}</p>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
  };

  const renderStats = () => (
    <motion.div 
       variants={containerVariants}
       initial="hidden"
       animate="show"
       className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
    >
       <StatCard icon={<Users size={18}/>} label={t.profile_stats || 'Followers'} value={userProfile.followers_count} />
       <StatCard icon={<Users size={18}/>} label="Following" value={userProfile.followings_count} />
       <StatCard icon={<Music2 size={18}/>} label={t.tracks || 'Tracks'} value={userProfile.track_count} />
       <StatCard icon={<Layers size={18}/>} label={t.playlists || 'Playlists'} value={userProfile.playlist_count} />
    </motion.div>
  );

  return (
    <div className="flex-1 overflow-y-auto px-10 pb-32 pt-10 custom-scrollbar bg-gradient-to-br from-black/20 to-transparent">
       {/* Header */}
       <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative group"
          >
             <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 animate-pulse"></div>
             <div className="w-40 h-40 rounded-full border-4 border-white/10 overflow-hidden shadow-2xl relative z-10 bg-black">
                <img src={userProfile.avatar_url?.replace('large', 't500x500')} className="w-full h-full object-cover" />
             </div>
             {userProfile.premium && (
                <div className="absolute bottom-2 right-2 z-20 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border border-white/10">
                   Pro
                </div>
             )}
          </motion.div>

          <div className="flex-1 text-center md:text-left">
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h1 className="text-5xl font-black text-white tracking-tighter mb-2">{userProfile.username}</h1>
                <div className="flex items-center justify-center md:justify-start gap-2 text-white/40 text-sm font-medium mb-6">
                   <MapPin size={14} />
                   <span>{userProfile.country || 'Unknown Location'}</span>
                   <span className="w-1 h-1 rounded-full bg-white/20 mx-1"></span>
                   <span>{userProfile.full_name || userProfile.username}</span>
                </div>
             </motion.div>

             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center justify-center md:justify-start gap-3">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={syncSoundCloud}
                  disabled={isSyncing}
                  className="px-6 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-2 hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-50 font-bold text-xs uppercase tracking-widest"
                >
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                  Sync SoundCloud
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                  title={t.logout}
                >
                  <LogOut size={16} />
                </motion.button>
             </motion.div>
          </div>
       </div>

       <AnimatePresence mode="wait">
         {activeTab === 'STATS' && (
            <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
               {renderStats()}
            </motion.div>
         )}
         
         {activeTab === 'PLAYLISTS' && (
           <motion.div 
             key="playlists"
             variants={containerVariants}
             initial="hidden"
             animate="show"
             className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6"
           >
              {userPlaylists.map((p, i) => {
                 const isPlaylistPlaying = currentTrack && p.tracks?.some(t => t.id === currentTrack.id);
                 return (
                    <motion.div 
                      key={p.id} 
                      variants={itemVariants}
                      whileHover={{ y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      className="group cursor-pointer" 
                      onContextMenu={(e) => onRightClick(e, p)}
                    >
                       <div className="aspect-square bg-[#0a0a0a] rounded-[32px] mb-3 overflow-hidden relative border border-white/5 shadow-lg group-hover:shadow-2xl transition-all duration-500">
                          {p.artwork ? (
                            <img src={p.artwork} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-black flex items-center justify-center">
                               <Layers size={32} className="text-white/10 group-hover:text-white/20 transition-colors" />
                            </div>
                          )}
                          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-all backdrop-blur-[2px] ${isPlaylistPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                             <button 
                               onClick={(e) => handlePlayPlaylist(e, p)}
                               className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                             >
                                <AnimatedPlayIcon isPlaying={isPlaylistPlaying && isPlaying} size={20} color="black" />
                             </button>
                          </div>
                       </div>
                       <h3 className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors px-1">{p.title}</h3>
                       <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider px-1">{p.trackCount} {t.tracks ? t.tracks.toLowerCase() : 'tracks'}</p>
                    </motion.div>
                 );
              })}
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white/[0.03] border border-white/5 p-6 rounded-[24px] flex flex-col items-center justify-center gap-2 hover:bg-white/[0.05] transition-colors"
  >
     <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-1">
        {icon}
     </div>
     <div className="text-3xl font-black text-white tracking-tighter">
        {typeof value === 'number' ? value.toLocaleString() : value}
     </div>
     <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{label}</div>
  </motion.div>
);

export default Profile;