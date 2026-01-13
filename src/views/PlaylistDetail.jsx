import React, { useEffect, useState } from 'react';
import { Play, Pause, Clock, ArrowLeft, Trash2, Plus, Sparkles } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useUserData } from '../context/UserDataContext';
import { fetchPlaylistById } from '../services/soundcloud';
import { generatePlaylistRadio } from '../services/recommendationService';
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
      
      // Load suggestions ONLY if it's a local playlist and NOT empty
      if (data && data.type === 'local-playlist' && data.tracks.length > 0) {
        setLoadingSuggestions(true);
        try {
           const recs = await generatePlaylistRadio(data);
           // Filter out tracks already in playlist
           const existingIds = new Set(data.tracks.map(t => t.id));
           setSuggestions(recs.filter(t => !existingIds.has(t.id)).slice(0, 10));
        } catch (e) { console.error(e); }
        setLoadingSuggestions(false);
      } else {
        setSuggestions([]); // Clear suggestions if empty
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

  if (loading) return <div className="h-full flex items-center justify-center"><Loader /></div>;
  if (!playlist) return <div className="p-8 text-white/40">Playlist not found.</div>;

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-32 pt-4">
      <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold uppercase tracking-widest">{t.back}</span>
      </button>

      <div className="flex items-end gap-8 mb-12">
        <div className="w-52 h-52 rounded-3xl overflow-hidden shadow-2xl glow-border shrink-0">
          {playlist.artwork ? (
            <img src={playlist.artwork} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-900" />
          )}
        </div>
        <div className="flex-1 pb-2">
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] mb-2">Playlist</p>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">{playlist.title}</h1>
          <div className="flex items-center gap-4 text-sm text-white/40">
            <button 
              onClick={() => playlist.userId && onOpenArtist(playlist.userId)}
              className="font-bold text-white/60 hover:text-indigo-400 transition-colors"
            >
              {playlist.artist}
            </button>
            <span>•</span>
            <span>{playlist.trackCount || playlist.tracks?.length || 0} tracks</span>
          </div>
          <button 
            onClick={handlePlayAll}
            className="mt-6 px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl"
          >
            <Play fill="black" size={18} />
            {t.play_all}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {playlist.tracks.map((track, i) => {
          const isActive = currentTrack?.id === track.id;
          const isActivePlaying = isActive && isPlaying;

          return (
            <div 
              key={`${track.id}-${i}`} 
              onDoubleClick={() => handleTrackPlay(track)}
              onContextMenu={(e) => onRightClick(e, track)}
              className={`group flex items-center gap-4 p-3 rounded-xl transition-colors border ${isActive ? 'bg-white/10 border-indigo-500/30 shadow-inner' : 'hover:bg-white/5 border-transparent hover:border-white/5'}`}
            >
              <div className="w-8 text-xs text-white/20 text-center group-hover:hidden">
                {i + 1}
              </div>
              <div className="w-8 hidden group-hover:flex items-center justify-center">
                <button onClick={() => isActive ? togglePlay() : handleTrackPlay(track)}>
                  {isActivePlaying ? <Pause size={14} className="text-indigo-400" /> : <Play size={14} className="text-white" fill="currentColor" />}
                </button>
              </div>

              <div className="w-10 h-10 rounded bg-gray-800 overflow-hidden shrink-0">
                <img src={track.artwork || `https://ui-avatars.com/api/?name=${track.title}&background=random&color=fff&size=100`} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-medium truncate ${isActive ? 'text-indigo-300' : 'text-white'}`}>{track.title}</h4>
                <button 
                  onClick={() => track.artistId && onOpenArtist(track.artistId)}
                  className="text-xs text-white/40 truncate hover:text-indigo-400 transition-colors block text-left"
                >
                  {track.artist}
                </button>
              </div>

              <div className="text-xs text-white/30 font-mono mr-4">
                {track.duration ? `${Math.floor(track.duration/60000)}:${String(Math.floor((track.duration%60000)/1000)).padStart(2, '0')}` : '--:--'}
              </div>

              {playlist.type === 'local-playlist' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFromPlaylist(playlist.id, track.id); }}
                  className="p-2 text-white/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove from Playlist"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {playlist.type === 'local-playlist' && (
        <div className="mt-12 border-t border-white/5 pt-8">
           <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
             <Sparkles size={18} className="text-indigo-400" />
             {t.playlist_recs}
           </h3>
           {loadingSuggestions ? (
             <div className="text-white/20 text-sm animate-pulse">{t.playlist_analyzing}</div>
           ) : (
             <div className="space-y-1">
                {suggestions.map(track => (
                  <div key={track.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                     <div className="w-10 h-10 rounded bg-gray-800 overflow-hidden shrink-0">
                        <img src={track.artwork || `https://ui-avatars.com/api/?name=${track.title}&background=random&color=fff&size=100`} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">{track.title}</h4>
                        <p className="text-xs text-white/40 truncate">{track.artist}</p>
                     </div>
                     <button 
                       onClick={() => addToPlaylist(playlist.id, track)}
                       className="px-4 py-1.5 rounded-full border border-white/10 text-xs font-bold text-white hover:bg-white hover:text-black transition-all"
                     >
                       Add
                     </button>
                  </div>
                ))}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default PlaylistDetail;