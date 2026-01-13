import React from 'react';
import { Clock, Play, Pause } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';
import { usePlayer } from '../context/PlayerContext';

const History = () => {
  const { history, t } = useUserData();
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();

  const handlePlay = (track, e) => {
    e.stopPropagation();
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }
    playTrack(track);
  };

  const onRightClick = (e, track) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('track-context-menu', { detail: { x: e.clientX, y: e.clientY, track } }));
  };

  if (history.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-white/30 h-full pb-32">
        <Clock size={48} className="mb-4 opacity-20" />
        <p>{t.history_empty || 'No listening history.'}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-32">
      <h2 className="text-lg font-light text-white/90 mb-6 flex items-center gap-3 tracking-wide pt-4">
        <Clock size={18} className="text-indigo-400" />
        {t.history}
      </h2>

      <div className="space-y-2">
        {history.map((track, i) => {
          const isActive = currentTrack?.id === track.id;
          const isActivePlaying = isActive && isPlaying;

          return (
            <div 
              key={`${track.id}-${i}`} 
              className={`group flex items-center gap-4 p-3 rounded-xl transition-colors border cursor-pointer ${isActive ? 'bg-white/10 border-indigo-500/30' : 'hover:bg-white/5 border-transparent hover:border-white/5'}`} 
              onClick={(e) => handlePlay(track, e)}
              onContextMenu={(e) => onRightClick(e, track)}
            >
               <div className="w-10 h-10 rounded bg-gray-800 relative overflow-hidden shrink-0">
                  <img src={track.artwork || `https://ui-avatars.com/api/?name=${track.title}&background=random&color=fff&size=200`} className="w-full h-full object-cover opacity-60" />
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                     {isActivePlaying ? <Pause fill="white" size={14} /> : <Play fill="white" size={14} />}
                  </div>
               </div>
               
               <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium truncate ${isActive ? 'text-indigo-300' : 'text-white/80'}`}>{track.title}</h4>
                  <p className="text-xs text-white/30 truncate">{track.artist}</p>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default History;