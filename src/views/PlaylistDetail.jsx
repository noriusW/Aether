import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, ArrowLeft, Trash2, Plus, Sparkles, Disc, User } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useUserData } from '../context/UserDataContext';
import { fetchPlaylistById } from '../services/soundcloud';
import { generatePlaylistRadio } from '../services/recommendationService';
import { SectionHeader, TrackRow, GhostButton } from '../components/PremiumUI';
import Loader from '../components/Loader';

const PlaylistDetail = ({ playlistId, onBack, onOpenArtist }) => {
  const { playTrack, setQueue, currentTrack, isPlaying, togglePlay } = usePlayer();
  const { removeFromPlaylist, addToPlaylist, t } = useUserData();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await fetchPlaylistById(playlistId);
      setPlaylist(data);
      setLoading(false);
      
      if (data && data.type === 'local-playlist' && data.tracks.length > 0) {
        setLoadingSuggestions(true);
        try {
           const recs = await generatePlaylistRadio(data);
           const existingIds = new Set(data.tracks.map(t => t.id));
           setSuggestions(recs.filter(t => !existingIds.has(t.id)).slice(0, 10));
        } catch (e) { console.error(e); }
        setLoadingSuggestions(false);
      } else {
        setSuggestions([]);
      }
    };
    load();
  }, [playlistId, playlist?.tracks?.length]);

  const handlePlayAll = () => {
    if (!playlist?.tracks?.length) return;
    setQueue(playlist.tracks);
    playTrack(playlist.tracks[0]);
  };

  const handleTrackPlay = (track) => {
    if (currentTrack?.id === track.id) { togglePlay(); return; }
    setQueue(playlist.tracks);
    playTrack(track);
  };

  const onRightClick = (e, track) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('track-context-menu', { 
      detail: { 
        x: e.clientX, 
        y: e.clientY, 
        track: { ...track, playlistId: playlist.type === 'local-playlist' ? playlist.id : null } 
      } 
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.03 } }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader /></div>;
  if (!playlist) return <div className="p-8 text-white/40 flex items-center justify-center h-full">Playlist not found.</div>;

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-black/20 to-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto px-10 pb-32 pt-6 custom-scrollbar">
        <GhostButton onClick={onBack} icon={<ArrowLeft size={16} />} className="mb-8">{t.back}</GhostButton>

        <div className="flex flex-col md:flex-row items-center md:items-end gap-10 mb-12">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-64 h-64 rounded-[40px] overflow-hidden shadow-2xl border border-white/10 shrink-0 relative group"
          >
            {playlist.artwork ? (
              <img src={playlist.artwork} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center">
                 <Disc size={64} className="text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay group-hover:opacity-0 transition-opacity"></div>
          </motion.div>
          
          <div className="flex-1 text-center md:text-left">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2 flex items-center justify-center md:justify-start gap-2">
                  <Sparkles size={12} />
                  {playlist.type === 'local-playlist' ? 'Private Collection' : 'Public Playlist'}
               </p>
               <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter leading-none">{playlist.title}</h1>
            </motion.div>
            
            <motion.div 
               initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
               className="flex items-center justify-center md:justify-start gap-4 text-sm text-white/50 mb-8"
            >
              {playlist.userId && (
                 <button 
                   onClick={() => onOpenArtist(playlist.userId)}
                   className="flex items-center gap-2 hover:text-white transition-colors group/artist"
                 >
                   <User size={14} className="group-hover/artist:text-indigo-400 transition-colors" />
                   <span className="font-bold border-b border-transparent group-hover/artist:border-white/20">{playlist.artist}</span>
                 </button>
              )}
              {playlist.userId && <span>•</span>}
              <span className="font-mono text-xs">{playlist.trackCount || playlist.tracks?.length || 0} tracks</span>
            </motion.div>
            
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlayAll}
              className="px-10 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-gray-200 transition-colors flex items-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)] mx-auto md:mx-0"
            >
              <Play fill="black" size={16} />
              {t.play_all}
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-[auto_auto_1fr_auto] gap-4 px-4 py-2 text-[10px] uppercase font-bold text-white/20 border-b border-white/5 mb-4 sticky top-0 bg-black/80 backdrop-blur-xl z-10 rounded-xl">
           <div className="w-8 text-center">#</div>
           <div className="w-12"></div>
           <div>Title</div>
           <div className="w-12 text-right">Time</div>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-1">
          {playlist.tracks.map((track, i) => (
             <TrackRow 
                key={`${track.id}-${i}`} // Use composite key to prevent dupe highlight issues if same track exists twice
                index={i}
                track={track}
                active={currentTrack?.id === track.id}
                playing={isPlaying}
                onClick={() => handleTrackPlay(track)}
                onContextMenu={(e) => onRightClick(e, track)}
             />
          ))}
        </motion.div>

        {playlist.type === 'local-playlist' && (
          <motion.div 
             initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
             className="mt-16 border-t border-white/5 pt-10"
          >
             <SectionHeader title={t.playlist_recs} description="AI suggestions based on this collection's vibe." />
             
             {loadingSuggestions ? (
               <div className="text-white/20 text-xs font-mono animate-pulse uppercase tracking-widest">{t.playlist_analyzing}</div>
             ) : (
               <div className="space-y-1">
                  {suggestions.map((track, i) => (
                    <motion.div 
                       initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                       key={track.id} 
                       className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group border border-transparent hover:border-white/5"
                    >
                       <div className="w-10 h-10 rounded-lg bg-gray-800 overflow-hidden shrink-0">
                          <img src={track.artwork || `https://ui-avatars.com/api/?name=${track.title}`} className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                          <p className="text-xs text-white/40 truncate font-medium">{track.artist}</p>
                       </div>
                       <motion.button 
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         onClick={() => addToPlaylist(playlist.id, track)}
                         className="px-5 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all"
                       >
                         Add
                       </motion.button>
                    </motion.div>
                  ))}
               </div>
             )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetail;
