import React from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';
import { usePlayer } from '../context/PlayerContext';

const Library = () => {
  const { likedSongs, toggleLike, t } = useUserData();
  const { playTrack, setQueue, currentTrack, isPlaying, togglePlay } = usePlayer();

  const handlePlay = (track, e) => {
    e.stopPropagation();
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }
    setQueue(likedSongs);
    playTrack(track);
  };

  const onRightClick = (e, track) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('track-context-menu', { detail: { x: e.clientX, y: e.clientY, track } }));
  };

  if (likedSongs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-white/30 h-full pb-32">
        <Heart size={48} className="mb-4 opacity-20" />
        <p>{t.playlist_empty || 'No liked songs yet.'}</p>
        <p className="text-sm mt-2">{t.discover_prompt || 'Explore to find your sound.'}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-32 pt-4">
      <h2 className="text-lg font-light text-white/90 mb-6 flex items-center gap-3 tracking-wide">
        <Heart size={18} className="text-indigo-400" />
        {t.likes}
      </h2>

      <div className="space-y-2">
        {likedSongs.map((track, i) => {
          const isActive = currentTrack?.id === track.id;
          const isActivePlaying = isActive && isPlaying;

          return (
            <div 
              key={`${track.id}-${i}`} 
              className={`group flex items-center gap-4 p-3 rounded-xl transition-colors border ${isActive ? 'bg-white/10 border-indigo-500/30' : 'hover:bg-white/5 border-transparent hover:border-white/5'}`}
              onContextMenu={(e) => onRightClick(e, track)}
              onClick={(e) => handlePlay(track, e)}
            >
               <div className="w-12 h-12 rounded bg-gray-800 relative overflow-hidden shrink-0 cursor-pointer">
                  <img src={track.artwork || `https://ui-avatars.com/api/?name=${track.title}&background=random&color=fff&size=200`} className="w-full h-full object-cover" />
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                     {isActivePlaying ? <Pause fill="white" size={16} /> : <Play fill="white" size={16} />}
                  </div>
               </div>
               
               <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium truncate ${isActive ? 'text-indigo-300' : 'text-white'}`}>{track.title}</h4>
                  <p className="text-xs text-white/40 truncate">{track.artist}</p>
               </div>

               <div className="text-xs text-white/30 px-4">
                  {track.duration ? `${Math.floor(track.duration/60000)}:${String(Math.floor((track.duration%60000)/1000)).padStart(2, '0')}` : '3:45'}
               </div>

               <button onClick={(e) => { e.stopPropagation(); toggleLike(track); }} className="p-2 hover:bg-white/10 rounded-full text-indigo-400">
                 <Heart fill="currentColor" size={16} />
               </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Library;