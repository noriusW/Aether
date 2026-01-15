import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ArrowLeft, Users, Music, ListMusic, Info, Disc, Clock, Mic2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useUserData } from '../context/UserDataContext';
import { fetchArtistById, fetchArtistTracks, fetchArtistPlaylists } from '../services/soundcloud';
import { AnimatedPlayIcon, TrackRow } from '../components/PremiumUI';
import Loader from '../components/Loader';

const ArtistProfile = ({ artistId, onBack }) => {
  const { playTrack, setQueue, currentTrack, isPlaying, togglePlay, playbackContext } = usePlayer();
  const { t, setSidebarSubItems } = useUserData();
  const [artist, setArtist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('TRACKS'); // TRACKS, ALBUMS, ABOUT

  useEffect(() => {
    setSidebarSubItems({
      parentId: 'DISCOVER', // Artists belong to discover context
      activeId: activeSubTab,
      items: [
        { id: 'TRACKS', label: t.tracks || 'Tracks' },
        { id: 'ALBUMS', label: t.playlists || 'Albums' },
        { id: 'ABOUT', label: t.profile_bio || 'About' }
      ],
      onSelect: (id) => setActiveSubTab(id)
    });
    return () => setSidebarSubItems(null);
  }, [activeSubTab, t]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [artistData, artistTracks, artistPlaylists] = await Promise.all([
        fetchArtistById(artistId),
        fetchArtistTracks(artistId),
        fetchArtistPlaylists(artistId)
      ]);
      setArtist(artistData);
      setTracks(artistTracks);
      setPlaylists(artistPlaylists);
      setLoading(false);
    };
    load();
  }, [artistId]);

  const handlePlayAll = () => {
    if (!tracks.length) return;
    setQueue(tracks);
    playTrack(tracks[0], { id: artistId, type: 'artist' });
  };

  const handleTrackPlay = (track) => {
    setQueue(tracks);
    playTrack(track, { id: artistId, type: 'artist' });
  };

  const onRightClick = (e, item, type = 'track') => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('track-context-menu', { 
      detail: { x: e.clientX, y: e.clientY, track: { ...item, type } } 
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader /></div>;
  if (!artist) return <div className="p-8 text-white/40 flex items-center justify-center h-full">Artist not found or connection error.</div>;

  const isArtistPlaying = playbackContext?.id === artistId && playbackContext?.type === 'artist';

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-32 pt-6 custom-scrollbar bg-gradient-to-br from-black/20 to-transparent">
      <motion.button 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack} 
        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-6 group w-fit"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-widest">{t.back}</span>
      </motion.button>

      <div className="flex flex-col md:flex-row items-center md:items-start gap-10 mb-12">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ duration: 0.5 }}
          className="w-56 h-56 rounded-full overflow-hidden shadow-2xl border-4 border-white/5 shrink-0 relative group"
        >
          <img src={artist.avatar_url?.replace('large', 't500x500')} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-indigo-500/20 mix-blend-overlay group-hover:opacity-0 transition-opacity"></div>
        </motion.div>
        
        <div className="flex-1 text-center md:text-left">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tighter leading-tight">{artist.username}</h1>
            <p className="text-indigo-300 text-lg font-medium mb-6 flex items-center justify-center md:justify-start gap-2">
               {artist.city || artist.country ? (
                 <>
                   <span>{artist.city ? `${artist.city}, ` : ''}{artist.country || 'Global'}</span>
                   <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
                 </>
               ) : null}
               <span className="opacity-60">{artist.full_name || 'Artist'}</span>
            </p>
          </motion.div>
          
          <motion.div 
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
             className="flex flex-wrap items-center justify-center md:justify-start gap-8 text-sm mb-8"
          >
             <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-full"><Users size={18} className="text-indigo-400"/></div>
                <div>
                   <div className="font-bold text-white">{artist.followers_count?.toLocaleString()}</div>
                   <div className="text-[10px] uppercase tracking-widest text-white/40">Followers</div>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-full"><Music size={18} className="text-indigo-400"/></div>
                <div>
                   <div className="font-bold text-white">{artist.track_count}</div>
                   <div className="text-[10px] uppercase tracking-widest text-white/40">{t.tracks}</div>
                </div>
             </div>
          </motion.div>

          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => isArtistPlaying ? togglePlay() : handlePlayAll()}
            className="px-10 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-gray-200 transition-colors flex items-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)] mx-auto md:mx-0"
          >
            <AnimatedPlayIcon isPlaying={isArtistPlaying && isPlaying} size={16} color="black" />
            {t.play_all || 'Start Radio'}
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'TRACKS' && (
          <motion.div 
            key="tracks"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            className="space-y-1"
          >
            {tracks.length > 0 ? tracks.map((track, i) => (
               <TrackRow 
                  key={track.id}
                  index={i}
                  track={track}
                  active={currentTrack?.id === track.id}
                  playing={isPlaying}
                  onClick={() => handleTrackPlay(track)}
                  onContextMenu={(e) => onRightClick(e, track)}
               />
            )) : (
              <div className="py-20 text-center text-white/20 uppercase tracking-widest font-bold text-xs">{t.no_results}</div>
            )}
          </motion.div>
        )}

        {activeSubTab === 'ALBUMS' && (
          <motion.div 
            key="albums"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            {playlists.length > 0 ? playlists.map((p) => {
               const isMixActive = playbackContext?.id === p.id && playbackContext?.type === 'playlist';
               return (
                 <motion.div 
                   key={p.id} 
                   variants={itemVariants}
                   className="group cursor-pointer p-4 rounded-3xl hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all"
                   onContextMenu={(e) => onRightClick(e, p, 'playlist')}
                 >
                   <div className="aspect-square bg-[#0a0a0a] border border-white/5 rounded-2xl mb-4 overflow-hidden relative shadow-lg group-hover:shadow-xl transition-all">
                     {p.artwork ? (
                       <img src={p.artwork} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105" />
                     ) : (
                       <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-black flex items-center justify-center">
                         <ListMusic size={40} className="text-white/10" />
                       </div>
                     )}
                     <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-all backdrop-blur-[2px] ${isMixActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); if (isMixActive) togglePlay(); else { setQueue(p.tracks || []); playTrack(p.tracks[0], { id: p.id, type: 'playlist' }); } }}
                          className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                        >
                           <AnimatedPlayIcon isPlaying={isMixActive && isPlaying} size={20} color="black" />
                        </button>
                     </div>
                   </div>
                   <h3 className="text-sm font-bold text-white/90 truncate group-hover:text-white transition-colors">{p.title}</h3>
                   <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mt-1">{p.trackCount} {t.tracks ? t.tracks.toLowerCase() : 'tracks'}</p>
                 </motion.div>
               );
            }) : (
              <div className="col-span-full py-24 text-center text-white/20 uppercase tracking-widest font-bold text-xs">{t.no_results}</div>
            )}
          </motion.div>
        )}

        {activeSubTab === 'ABOUT' && (
          <motion.div 
            key="about"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8"
          >
            <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 glow-border">
               <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                 <Info size={14} className="text-indigo-400" />
                 {t.profile_bio || 'Biography'}
               </h3>
               <p className="text-white/80 leading-relaxed whitespace-pre-line text-lg font-light">
                 {artist.description || "The artist hasn't shared a biography yet."}
               </p>
            </div>
            
            <div className="space-y-4">
               {artist.myspace_name && <SocialBadge label="MySpace" value={artist.myspace_name} />}
               <SocialBadge label={t.tracks} value={artist.track_count} icon={<Music size={14}/>} />
               <SocialBadge label="City" value={artist.city || 'Hidden'} icon={<Users size={14}/>} />
               <div className="p-6 rounded-[24px] bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 mt-4">
                  <div className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">Listener Stats</div>
                  <div className="text-3xl font-black text-white">{artist.followers_count?.toLocaleString()}</div>
                  <div className="text-[10px] text-white/40 font-mono mt-1">Global Followers</div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SocialBadge = ({ label, value, icon }) => (
  <div className="flex items-center justify-between px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5">
    <div className="flex items-center gap-3">
       {icon && <div className="text-white/20">{icon}</div>}
       <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-sm font-bold text-white">{value}</span>
  </div>
);

export default ArtistProfile;