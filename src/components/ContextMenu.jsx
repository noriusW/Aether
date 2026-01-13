import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Radio, Plus, Heart, ChevronRight, ListMusic, Music, User, ListPlus, Trash2 } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';

const ContextMenu = ({ x, y, track, onClose, onAction, playlists = [] }) => {
  const { t, isLiked } = useUserData();
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [adjustedPos, setAdjustedPos] = useState({ x, y });
  const menuRef = React.useRef(null);

  useEffect(() => {
    if (menuRef.current) {
      const menuWidth = 240; // w-60 = 15rem = 240px
      const menuHeight = menuRef.current.offsetHeight;
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;

      let newX = x;
      let newY = y;

      if (x + menuWidth > winWidth) {
        newX = winWidth - menuWidth - 10;
      }
      if (y + menuHeight > winHeight) {
        newY = winHeight - menuHeight - 10;
      }

      setAdjustedPos({ x: newX, y: newY });
    }
  }, [x, y, track]);

  if (!track) return null;

  // Определяем тип элемента (по умолчанию трек)
  const isArtist = track.type === 'artist';
  const isPlaylist = track.type === 'playlist';
  const isTrack = !isArtist && !isPlaylist;
  const liked = isTrack && isLiked(track.id);

  return (
    <motion.div 
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed z-[100] bg-[#0a0a0a]/95 border border-white/10 rounded-2xl shadow-2xl p-1.5 w-60 flex flex-col gap-0.5 backdrop-blur-xl"
      style={{ top: adjustedPos.y, left: adjustedPos.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 border-b border-white/5 mb-1 flex items-center gap-2">
        {isArtist ? <User size={10} /> : isPlaylist ? <ListMusic size={10} /> : <Music size={10} />}
        <span className="truncate">{track.title}</span>
      </div>
      
      {/* ACTIONS FOR TRACKS */}
      {isTrack && (
        <>
          <MenuItem icon={<Play size={14} />} label={t.ctx_play} onClick={() => onAction('play')} />
          <MenuItem icon={<ListPlus size={14} />} label={t.ctx_queue} onClick={() => onAction('queue')} />
          <MenuItem icon={<Radio size={14} />} label={t.ctx_radio} onClick={() => onAction('radio')} />
          <MenuItem icon={<Heart size={14} fill={liked ? "currentColor" : "none"} />} label={liked ? t.ctx_unlike : t.ctx_like} onClick={() => onAction('like')} />
          <div className="h-px bg-white/5 my-1 mx-2"></div>
          
          {track.playlistId && (
            <MenuItem icon={<Trash2 size={14} className="text-red-400" />} label={t.ctx_remove} onClick={() => onAction('remove_playlist', { id: track.playlistId })} />
          )}

          <div className="relative">
            <MenuItem 
              icon={<Plus size={14} />} 
              label={t.ctx_playlist} 
              active={showPlaylists}
              onClick={() => setShowPlaylists(!showPlaylists)} 
              suffix={<ChevronRight size={12} className={`transition-transform ${showPlaylists ? 'rotate-90' : ''}`} />}
            />
            <AnimatePresence>
              {showPlaylists && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute left-full top-0 ml-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl p-1.5 w-48 flex flex-col gap-0.5 backdrop-blur-xl"
                >
                  {playlists.length > 0 ? playlists.map(p => (
                    <MenuItem key={p.id} icon={<ListMusic size={14} />} label={p.title} onClick={() => onAction('add_playlist', p)} />
                  )) : (
                    <div className="px-4 py-3 text-[10px] text-white/20 italic text-center">{t.ctx_no_playlists}</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* ACTIONS FOR ARTISTS */}
      {isArtist && (
        <>
          <MenuItem icon={<User size={14} />} label={t.ctx_view_profile} onClick={() => onAction('open_artist', track)} />
          <MenuItem icon={<Radio size={14} />} label={t.ctx_radio} onClick={() => onAction('artist_radio', track)} />
        </>
      )}

      {/* ACTIONS FOR PLAYLISTS */}
      {isPlaylist && (
        <>
          <MenuItem icon={<Play size={14} />} label={t.ctx_play_all} onClick={() => onAction('play_playlist', track)} />
          <MenuItem icon={<Radio size={14} />} label={t.ctx_radio} onClick={() => onAction('playlist_radio', track)} />
        </>
      )}
    </motion.div>
  );
};

const MenuItem = ({ icon, label, onClick, suffix, active }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-left group ${active ? 'bg-indigo-600 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
  >
    <span className={`${active ? 'text-white' : 'text-indigo-400 group-hover:text-indigo-300'} transition-colors`}>{icon}</span>
    <span className="flex-1">{label}</span>
    {suffix && <span className="text-white/20">{suffix}</span>}
  </button>
);

export default ContextMenu;
