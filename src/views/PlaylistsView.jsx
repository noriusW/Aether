import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ListMusic, Trash2, Play, FolderPlus, Disc, Save } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';
import { usePlayer } from '../context/PlayerContext';
import { SectionHeader, AnimatedPlayIcon } from '../components/PremiumUI';

const PlaylistsView = ({ onOpenPlaylist }) => {
  const { localPlaylists, createPlaylist, deletePlaylist, t, setSidebarSubItems } = useUserData();
  const { playTrack, setQueue, currentTrack, isPlaying, playbackContext } = usePlayer();
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, NEW
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    setSidebarSubItems({
      parentId: 'PLAYLISTS',
      activeId: activeTab,
      items: [
        { id: 'ALL', label: 'My Collection' },
        { id: 'NEW', label: 'New Playlist' }
      ],
      onSelect: (id) => setActiveTab(id)
    });
    return () => setSidebarSubItems(null);
  }, [activeTab, t]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setActiveTab('ALL');
  };

  const handlePlayPlaylist = (e, p) => {
    e.stopPropagation();
    if (p.tracks.length > 0) {
      setQueue(p.tracks);
      playTrack(p.tracks[0], { id: p.id, type: 'playlist' });
    }
  };

  const onRightClick = (e, p) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('track-context-menu', { 
      detail: { x: e.clientX, y: e.clientY, track: { ...p, type: 'playlist' } } 
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-black/20 to-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto px-10 pb-32 pt-10 custom-scrollbar">
        <SectionHeader 
           title={t.playlists} 
           description={t.playlist_desc}
        />

        <AnimatePresence mode="wait">
           {activeTab === 'NEW' && (
              <motion.div 
                 key="new"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 className="max-w-2xl mx-auto mt-10 p-10 rounded-[40px] bg-white/[0.02] border border-white/5 backdrop-blur-xl relative overflow-hidden"
              >
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] pointer-events-none" />
                 
                 <div className="relative z-10 text-center space-y-8">
                    <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-2xl">
                       <FolderPlus size={40} className="text-white" />
                    </div>
                    
                    <div className="space-y-2">
                       <h3 className="text-3xl font-black text-white tracking-tight">Create Collection</h3>
                       <p className="text-white/40">Give your new sonic journey a name.</p>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-6">
                       <div className="relative group">
                          <input 
                             autoFocus
                             value={newPlaylistName}
                             onChange={e => setNewPlaylistName(e.target.value)}
                             placeholder="Playlist Title..."
                             className="w-full bg-black/40 border border-white/10 rounded-2xl px-8 py-5 text-xl font-bold text-white outline-none focus:border-indigo-500/50 transition-all text-center placeholder-white/20"
                          />
                       </div>
                       
                       <div className="flex justify-center gap-4">
                          <button 
                             type="button" 
                             onClick={() => setActiveTab('ALL')}
                             className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-bold text-xs uppercase tracking-widest transition-all"
                          >
                             Cancel
                          </button>
                          <button 
                             type="submit" 
                             disabled={!newPlaylistName.trim()}
                             className="px-8 py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:hover:scale-100"
                          >
                             Create Playlist
                          </button>
                       </div>
                    </form>
                 </div>
              </motion.div>
           )}

           {activeTab === 'ALL' && (
              <motion.div 
                 key="all"
                 variants={containerVariants}
                 initial="hidden"
                 animate="show"
                 exit={{ opacity: 0 }}
                 className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                 {localPlaylists.map(p => {
                   const isPlaylistPlaying = playbackContext?.id === p.id && playbackContext?.type === 'playlist';
                   
                   return (
                     <motion.div 
                       key={p.id} 
                       variants={itemVariants}
                       onClick={() => onOpenPlaylist(p.id)}
                       onContextMenu={(e) => onRightClick(e, p)}
                       whileHover={{ y: -8 }}
                       whileTap={{ scale: 0.95 }}
                       className="group relative p-4 rounded-[32px] cursor-pointer border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
                     >
                        <div className="aspect-square rounded-[24px] bg-[#0a0a0a] mb-5 overflow-hidden relative shadow-lg border border-white/5 group-hover:shadow-2xl transition-all">
                           {p.artwork ? (
                             <img src={p.artwork} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-white/5 bg-gradient-to-br from-indigo-900/20 to-black">
                               <ListMusic size={64} />
                             </div>
                           )}
                           
                           <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-all backdrop-blur-[2px] ${isPlaylistPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                              <button 
                                onClick={(e) => handlePlayPlaylist(e, p)}
                                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all"
                              >
                                 <AnimatedPlayIcon isPlaying={isPlaylistPlaying && isPlaying} size={24} color="black" />
                              </button>
                           </div>
                        </div>

                        <div className="flex items-start justify-between px-2 pb-2">
                           <div className="min-w-0 pr-4">
                              <h3 className="font-bold text-white text-lg tracking-tight truncate group-hover:text-indigo-300 transition-colors">{p.title}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                 <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                 <p className="text-xs text-white/40 uppercase font-black tracking-widest">{p.tracks?.length || 0} Tracks</p>
                              </div>
                           </div>
                           <button 
                             onClick={(e) => { e.stopPropagation(); deletePlaylist(p.id); }}
                             className="p-2.5 rounded-full text-white/10 hover:bg-red-500/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                             title="Delete Playlist"
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                     </motion.div>
                   );
                 })}

                 {localPlaylists.length === 0 && (
                   <motion.div 
                     variants={itemVariants}
                     className="col-span-full py-24 flex flex-col items-center justify-center text-white/10 border-2 border-dashed border-white/5 rounded-[40px]"
                   >
                      <FolderPlus size={64} className="mb-4 opacity-50" />
                      <p className="font-bold uppercase tracking-[0.2em] text-sm text-white/30">{t.playlist_empty}</p>
                   </motion.div>
                 )}
              </motion.div>
           )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PlaylistsView;