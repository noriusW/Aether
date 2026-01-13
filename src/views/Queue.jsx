import React from 'react';
import { ListMusic, Play, Pause } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useUserData } from '../context/UserDataContext';

const Queue = () => {
  const { queue, currentTrack, isPlaying, playTrack, togglePlay, setQueue } = usePlayer();
  const { t } = useUserData();

  const handlePlay = (track, e) => {
    e.stopPropagation();
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }
    setQueue(queue);
    playTrack(track);
  };

  const onRightClick = (e, track) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('track-context-menu', { detail: { x: e.clientX, y: e.clientY, track } }));
  };

  if (!queue || queue.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-white/30 h-full pb-32">
        <ListMusic size={48} className="mb-4 opacity-20" />
        <p className="text-sm">{t.queue_empty || 'Queue is empty'}</p>
        <p className="text-xs mt-2 text-white/30">{t.queue_hint || 'Add tracks from playlists or mixes.'}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-32 pt-4">
      <h2 className="text-lg font-light text-white/90 mb-6 flex items-center gap-3 tracking-wide">
        <ListMusic size={18} className="text-indigo-400" />
        {t.queue || 'Queue'}
      </h2>

      <div className="space-y-2">
        {queue.map((track, i) => {
          const isActive = currentTrack?.id === track.id;
          const isActivePlaying = isActive && isPlaying;

          return (
            <div 
              key={`${track.id}-${i}`} 
              className={`group flex items-center gap-4 p-3 rounded-xl transition-colors border ${isActive ? 'bg-white/10 border-indigo-500/30' : 'hover:bg-white/5 border-transparent hover:border-white/5'}`}
              onContextMenu={(e) => onRightClick(e, track)}
              onClick={(e) => handlePlay(track, e)}
            >
               <div className="w-10 text-center text-xs font-mono text-white/20">{String(i + 1).padStart(2, '0')}</div>
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
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Queue;
