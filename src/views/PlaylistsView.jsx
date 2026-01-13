import React, { useState } from 'react';
import { Plus, ListMusic, Trash2, Play, FolderPlus } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';
import { usePlayer } from '../context/PlayerContext';

const PlaylistsView = ({ onOpenPlaylist }) => {
  const { localPlaylists, createPlaylist, deletePlaylist, t } = useUserData();
  const { playTrack, setQueue } = usePlayer();
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreating(false);
  };

  const handlePlayPlaylist = (e, p) => {
    e.stopPropagation();
    if (p.tracks.length > 0) {
      setQueue(p.tracks);
      playTrack(p.tracks[0]);
    }
  };

  const onRightClick = (e, p) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('track-context-menu', { 
      detail: { x: e.clientX, y: e.clientY, track: { ...p, type: 'playlist' } } 
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto px-12 pb-32 pt-4">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">{t.playlists}</h2>
          <p className="text-white/30 text-sm">{t.playlist_desc}</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          <Plus size={18} />
          {t.playlist_create}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* Create Card */}
        {isCreating && (
          <div className="p-1 glass-surface rounded-[32px] animate-in fade-in zoom-in-95">
            <form onSubmit={handleCreate} className="bg-black/40 p-6 rounded-[31px] space-y-4">
               <input 
                 autoFocus
                 value={newPlaylistName}
                 onChange={e => setNewPlaylistName(e.target.value)}
                 placeholder={t.playlist_placeholder}
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
               />
               <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-2 bg-white text-black font-bold rounded-lg text-xs">Save</button>
                  <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-2 bg-white/5 text-white/40 font-bold rounded-lg text-xs">Cancel</button>
               </div>
            </form>
          </div>
        )}

        {localPlaylists.map(p => (
          <div 
            key={p.id} 
            onClick={() => onOpenPlaylist(p.id)}
            onContextMenu={(e) => onRightClick(e, p)}
            className="group relative p-5 glass-surface rounded-[32px] cursor-pointer hover:border-indigo-500/30 transition-all"
          >
             <div className="aspect-square rounded-2xl bg-black/40 border border-white/5 mb-4 overflow-hidden relative shadow-inner">
                {p.artwork ? (
                  <img src={p.artwork} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/5">
                    <ListMusic size={64} />
                  </div>
                )}
                
                {/* Play Button on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                   <button 
                     onClick={(e) => handlePlayPlaylist(e, p)}
                     className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all"
                   >
                      <Play fill="black" size={24} className="ml-1" />
                   </button>
                </div>
             </div>

             <div className="flex items-center justify-between pr-1">
                <div className="min-w-0">
                   <h3 className="font-bold text-white/90 truncate text-lg tracking-tight group-hover:text-indigo-300 transition-colors">{p.title}</h3>
                   <p className="text-xs text-white/30 uppercase font-black tracking-widest mt-1">{p.tracks?.length || 0} Tracks</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deletePlaylist(p.id); }}
                  className="p-2 rounded-full text-white/10 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                >
                   <Trash2 size={16} />
                </button>
             </div>
          </div>
        ))}

        {localPlaylists.length === 0 && !isCreating && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-white/10 border-2 border-dashed border-white/5 rounded-[40px]">
             <FolderPlus size={64} className="mb-4" />
             <p className="font-bold uppercase tracking-[0.2em] text-sm">{t.playlist_empty}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistsView;