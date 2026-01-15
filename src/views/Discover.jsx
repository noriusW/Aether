import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ListMusic, User as UserIcon, Search, Mic2, Disc, Layers } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useUserData } from '../context/UserDataContext';
import { searchTracks, fetchPlaylistById } from '../services/soundcloud';
import { SectionHeader, AnimatedPlayIcon } from '../components/PremiumUI';
import Loader from '../components/Loader';

const Discover = ({ query, onOpenPlaylist, onOpenArtist }) => {
  const { playTrack, setQueue, currentTrack, isPlaying, togglePlay } = usePlayer();
  const { t, setSidebarSubItems } = useUserData();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('tracks'); 

  useEffect(() => {
    setSidebarSubItems({
      parentId: 'DISCOVER',
      activeId: filter,
      items: [
        { id: 'tracks', label: t.tracks || 'Tracks' },
        { id: 'artists', label: t.artists || 'Artists' },
        { id: 'playlists', label: t.playlists || 'Playlists' }
      ],
      onSelect: (id) => setFilter(id)
    });
    return () => setSidebarSubItems(null);
  }, [filter, t]);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      const apiType = filter === 'artists' ? 'users' : filter;
      const data = await searchTracks(query || 'synthwave', apiType);
      setResults(data);
      setLoading(false);
    };
    fetchResults();
  }, [query, filter]);

  const handleItemAction = async (item, e) => {
    e.stopPropagation();
    if (filter === 'tracks') {
      if (currentTrack?.id === item.id) { togglePlay(); return; }
      setQueue(results);
      playTrack(item);
    } else if (filter === 'playlists') {
      onOpenPlaylist(item.id);
    } else if (filter === 'artists') {
      onOpenArtist(item.id);
    }
  };

  const handlePlayButton = async (item, e) => {
    e.stopPropagation();
    if (filter === 'tracks') {
       if (currentTrack?.id === item.id) { togglePlay(); } 
       else { setQueue(results); playTrack(item); }
    } else if (filter === 'playlists') {
       const fullPlaylist = await fetchPlaylistById(item.id);
       if (fullPlaylist?.tracks?.length) { setQueue(fullPlaylist.tracks); playTrack(fullPlaylist.tracks[0]); }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-black/20 to-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto px-10 pb-32 pt-10 custom-scrollbar">
        <SectionHeader 
           title={query || t.trending} 
           description={query ? `Search results for "${query}"` : "Global top charts and emerging artists"}
        />

        {loading ? (
           <div className="h-64 flex items-center justify-center"><Loader /></div>
        ) : (
           <motion.div 
             key={`${query}-${filter}`}
             variants={containerVariants}
             initial="hidden"
             animate="show"
             className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
           >
              {results.map((item) => {
                 const isTrack = filter === 'tracks';
                 const isActive = isTrack && currentTrack?.id === item.id;
                 const showPlay = isTrack || filter === 'playlists';

                 return (
                    <motion.div 
                       key={item.id} 
                       layout
                       whileHover={{ y: -5 }}
                       whileTap={{ scale: 0.95 }}
                       onClick={(e) => handleItemAction(item, e)}
                       className={`group cursor-pointer p-4 rounded-[32px] border transition-all hover:shadow-2xl ${isActive ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/10'}`}
                    >
                       <div className={`aspect-square bg-black/40 mb-4 relative overflow-hidden shadow-lg ${filter === 'artists' ? 'rounded-full' : 'rounded-[24px]'}`}>
                          {item.artwork ? (
                             <img src={item.artwork} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center text-white/10"><Disc size={48} /></div>
                          )}
                          
                          {showPlay && (
                             <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                <button 
                                  onClick={(e) => handlePlayButton(item, e)}
                                  className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform"
                                >
                                   <AnimatedPlayIcon isPlaying={isActive && isPlaying} size={20} color="black" />
                                </button>
                             </div>
                          )}
                       </div>
                       
                       <div className={filter === 'artists' ? 'text-center' : ''}>
                          <h4 className={`font-bold text-sm truncate ${isActive ? 'text-indigo-300' : 'text-white'}`}>{item.title}</h4>
                          <p className="text-xs text-white/40 truncate font-medium mt-1">{filter === 'playlists' ? `${item.trackCount} Tracks` : item.artist}</p>
                       </div>
                    </motion.div>
                 );
              })}
           </motion.div>
        )}
      </div>
    </div>
  );
};

export default Discover;