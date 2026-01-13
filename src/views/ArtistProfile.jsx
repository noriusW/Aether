import React, { useEffect, useState } from 'react';
import { Play, Pause, ArrowLeft, Users, Music, ListMusic, Info } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useUserData } from '../context/UserDataContext';
import { fetchArtistById, fetchArtistTracks, fetchArtistPlaylists } from '../services/soundcloud';
import Loader from '../components/Loader';

const ArtistProfile = ({ artistId, onBack }) => {
  const { playTrack, setQueue, currentTrack, isPlaying, togglePlay } = usePlayer();
  const { t } = useUserData();
  const [artist, setArtist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('TRACKS'); // TRACKS, ALBUMS, ABOUT

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
    playTrack(tracks[0]);
  };

  const handleTrackPlay = (track) => {
    setQueue(tracks);
    playTrack(track);
  };

  const onRightClick = (e, item, type = 'track') => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('track-context-menu', { 
      detail: { x: e.clientX, y: e.clientY, track: { ...item, type } } 
    }));
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader /></div>;
  if (!artist) return <div className="p-8 text-white/40">Artist not found.</div>;

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-32 pt-4">
      <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold uppercase tracking-widest">{t.back}</span>
      </button>

      <div className="flex items-center gap-8 mb-12">
        <div className="w-48 h-48 rounded-full overflow-hidden shadow-2xl border-4 border-white/5 shrink-0">
          <img src={artist.avatar_url?.replace('large', 't500x500')} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">{artist.username}</h1>
          <p className="text-white/40 text-lg mb-6">{artist.city ? `${artist.city}, ` : ''}{artist.country || 'Global'}</p>
          
          <div className="flex items-center gap-6 text-sm">
             <div className="flex items-center gap-2 text-indigo-400">
                <Users size={16} />
                <span className="font-bold">{artist.followers_count?.toLocaleString()} followers</span>
             </div>
             <div className="flex items-center gap-2 text-white/40">
                <Music size={16} />
                <span>{artist.track_count} {t.tracks.toLowerCase()}</span>
             </div>
          </div>

          <button 
            onClick={handlePlayAll}
            className="mt-8 px-10 py-3.5 bg-white text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl"
          >
            <Play fill="black" size={18} />
            {t.play_all}
          </button>
        </div>
      </div>

      <div className="mb-8 border-b border-white/5 flex gap-8">
         <TabButton active={activeSubTab === 'TRACKS'} label={t.tracks} onClick={() => setActiveSubTab('TRACKS')} />
         <TabButton active={activeSubTab === 'ALBUMS'} label={t.playlists} onClick={() => setActiveSubTab('ALBUMS')} />
         <TabButton active={activeSubTab === 'ABOUT'} label={t.profile_bio} onClick={() => setActiveSubTab('ABOUT')} />
      </div>

      <div className="animate-[fadeIn_0.3s_ease-out]">
        {activeSubTab === 'TRACKS' && (
          <div className="space-y-1">
            {tracks.length > 0 ? tracks.map((track, i) => {
              const isActive = currentTrack?.id === track.id;
              const isActivePlaying = isActive && isPlaying;

              return (
                <div 
                  key={track.id} 
                  onDoubleClick={() => handleTrackPlay(track)}
                  onContextMenu={(e) => onRightClick(e, track)}
                  className={`group flex items-center gap-4 p-3 rounded-xl transition-colors border ${isActive ? 'bg-white/10 border-indigo-500/30' : 'hover:bg-white/5 border-transparent hover:border-white/5'}`}
                >
                  <div className="w-8 text-xs text-white/20 text-center group-hover:hidden font-mono">
                    {(i + 1).toString().padStart(2, '0')}
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
                    <p className="text-xs text-white/40 truncate">{track.genre || 'SoundCloud'}</p>
                  </div>

                  <div className="text-xs text-white/30 font-mono">
                    {track.duration ? `${Math.floor(track.duration/60000)}:${String(Math.floor((track.duration%60000)/1000)).padStart(2, '0')}` : '--:--'}
                  </div>
                </div>
              );
            }) : (
              <div className="py-20 text-center text-white/20">{t.no_results}</div>
            )}
          </div>
        )}

        {activeSubTab === 'ALBUMS' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {playlists.length > 0 ? playlists.map((p) => (
              <div key={p.id} className="group cursor-pointer" onContextMenu={(e) => onRightClick(e, p, 'playlist')}>
                <div className="aspect-square bg-[#0a0a0a] border border-white/5 rounded-2xl mb-3 overflow-hidden relative shadow-lg">
                  {p.artwork ? (
                    <img src={p.artwork} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-black flex items-center justify-center">
                      <ListMusic size={40} className="text-white/10" />
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white/90 truncate">{p.title}</h3>
                <p className="text-xs text-white/30">{p.trackCount} {t.tracks.toLowerCase()}</p>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center text-white/20">{t.no_results}</div>
            )}
          </div>
        )}

        {activeSubTab === 'ABOUT' && (
          <div className="max-w-3xl space-y-8">
            <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 glow-border">
               <h3 className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                 <Info size={14} className="text-indigo-400" />
                 {t.profile_bio}
               </h3>
               <p className="text-white/70 leading-relaxed whitespace-pre-line text-lg font-light italic">
                 {artist.description || "The artist hasn't shared a biography yet."}
               </p>
            </div>
            
            <div className="flex gap-4">
               {artist.myspace_name && <SocialBadge label="MySpace" value={artist.myspace_name} />}
               <SocialBadge label={t.tracks} value={artist.track_count} />
               <SocialBadge label="City" value={artist.city || 'Hidden'} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TabButton = ({ active, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all ${active ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-white/20 hover:text-white/40'}`}
  >
    {label}
  </button>
);

const SocialBadge = ({ label, value }) => (
  <div className="px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
    {label}: <span className="text-white/80">{value}</span>
  </div>
);

export default ArtistProfile;
