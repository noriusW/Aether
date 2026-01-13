import React, { useEffect, useState } from 'react';
import { Play, Pause, ListMusic, User as UserIcon, Search } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useUserData } from '../context/UserDataContext';
import { searchTracks, fetchPlaylistById } from '../services/soundcloud';
import Loader from '../components/Loader';

const Discover = ({ query, onOpenPlaylist, onOpenArtist }) => {
  const { playTrack, setQueue, currentTrack, isPlaying, togglePlay } = usePlayer();
  const { t } = useUserData();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('tracks'); 

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
      if (currentTrack?.id === item.id) {
        togglePlay();
        return;
      }
      setQueue(results);
      playTrack(item);
    } 
    else if (filter === 'playlists') {
      if (e.currentTarget.id === 'play-btn') {
        const fullPlaylist = await fetchPlaylistById(item.id);
        if (fullPlaylist?.tracks?.length) {
          setQueue(fullPlaylist.tracks);
          playTrack(fullPlaylist.tracks[0]);
        }
      } else {
        onOpenPlaylist(item.id);
      }
    }
    else if (filter === 'artists') {
      onOpenArtist(item.id);
    }
  };
  
  const onRightClick = (e, track) => {
    e.preventDefault();
    if (filter !== 'tracks') return;
    window.dispatchEvent(new CustomEvent('track-context-menu', { detail: { x: e.clientX, y: e.clientY, track } }));
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader /></div>;

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-32 pt-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-light text-white/90 flex items-center gap-3 tracking-wide">
          <Search size={18} className="text-indigo-400" />
          {t.searching} "{query || t.trending}"
        </h2>
        <div className="flex bg-white/5 rounded-lg p-1">
           {[
             { id: 'tracks', label: t.tracks }, 
             { id: 'artists', label: t.artists }, 
             { id: 'playlists', label: t.playlists }
           ].map(f => (
             <button 
               key={f.id}
               onClick={() => setFilter(f.id)}
               className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-colors ${filter === f.id ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
             >
               {f.label}
             </button>
           ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {results.map((item) => {
          const isTrack = filter === 'tracks';
          const isPlaylist = filter === 'playlists';
          const isArtist = filter === 'artists';
          const isActive = isTrack && currentTrack?.id === item.id;
          const isActivePlaying = isActive && isPlaying;

          return (
            <div 
              key={item.id} 
              onClick={(e) => handleItemAction(item, e)} 
              onContextMenu={(e) => onRightClick(e, item)}
              className="group cursor-pointer p-3 rounded-2xl hover:bg-white/[0.03] transition-colors duration-300"
            >
              <div className={`aspect-square rounded-xl bg-[#0a0a0a] mb-3 relative overflow-hidden border border-white/5 ${isArtist ? 'rounded-full' : ''}`}>
                {item.artwork ? (
                   <img src={item.artwork} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                   <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                      {isArtist ? <UserIcon size={40} className="text-white/10" /> : <ListMusic size={40} className="text-white/10" />}
                   </div>
                )}
                
                {(isTrack || isPlaylist) && (
                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 translate-y-2 group-hover:translate-y-0 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 group-hover:opacity-100'}`}>
                     <button 
                       id="play-btn"
                       onClick={(e) => handleItemAction(item, e)}
                       className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                     >
                       {isActivePlaying ? (
                         <Pause fill="black" size={16} />
                       ) : (
                         <Play fill="black" size={16} className="ml-1" />
                       )}
                     </button>
                  </div>
                )}
              </div>
              <h3 className={`text-sm font-medium truncate px-1 ${isActive ? 'text-indigo-300' : 'text-white/80'}`}>{item.title}</h3>
              <p className="text-[11px] text-white/30 truncate px-1 mt-0.5">
                {isPlaylist ? `${item.trackCount} ${t.tracks.toLowerCase()}` : item.artist}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Discover;