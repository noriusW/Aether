import React, { useState } from 'react';
import { User, Heart, List, Clock, Play, RefreshCw } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';
import { usePlayer } from '../context/PlayerContext';

const Profile = () => {
  const { userProfile, userPlaylists, t, logout, syncSoundCloud, isSyncing } = useUserData();
  const [activeTab, setActiveTab] = useState('PLAYLISTS'); // STATS, PLAYLISTS

  const onRightClick = (e, p) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('track-context-menu', { 
      detail: { x: e.clientX, y: e.clientY, track: { ...p, type: 'playlist' } } 
    }));
  };

  if (!userProfile) return <div className="p-8 text-white/50">{t.auth_title}</div>;

  const renderStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
       <StatCard label={t.profile_stats} value={userProfile.followers_count} />
       <StatCard label="Following" value={userProfile.followings_count} />
       <StatCard label={t.tracks} value={userProfile.track_count} />
       <StatCard label={t.playlists} value={userProfile.playlist_count} />
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-32 pt-8">
       {/* Header */}
       <div className="flex items-center gap-6 mb-12">
          <div className="w-32 h-32 rounded-full border-4 border-white/5 overflow-hidden shadow-2xl">
             <img src={userProfile.avatar_url?.replace('large', 't500x500')} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
             <div className="flex items-center justify-between mb-2">
                <h1 className="text-4xl font-bold text-white tracking-tight">{userProfile.username}</h1>
                <div className="flex gap-2">
                  <button 
                    onClick={syncSoundCloud}
                    disabled={isSyncing}
                    className="px-6 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 text-xs font-bold hover:bg-indigo-500 hover:text-white transition-all border border-indigo-500/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                    {t.auth_sync}
                  </button>
                  <button 
                    onClick={logout}
                    className="px-6 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                  >
                    {t.logout}
                  </button>
                </div>
             </div>
             <p className="text-white/40 text-sm">{userProfile.country || 'Global'} • {userProfile.full_name}</p>
             <div className="flex gap-2 mt-4">
               <button onClick={() => setActiveTab('PLAYLISTS')} className={`px-4 py-2 rounded-full text-xs font-bold ${activeTab === 'PLAYLISTS' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>{t.playlists}</button>
               <button onClick={() => setActiveTab('STATS')} className={`px-4 py-2 rounded-full text-xs font-bold ${activeTab === 'STATS' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>{t.profile_stats}</button>
             </div>
          </div>
       </div>

       {activeTab === 'STATS' && renderStats()}
       
       {activeTab === 'PLAYLISTS' && (
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {userPlaylists.map(p => (
               <div key={p.id} className="group cursor-pointer" onContextMenu={(e) => onRightClick(e, p)}>
                  <div className="aspect-square bg-white/5 rounded-2xl mb-2 overflow-hidden relative">
                     {p.artwork ? <img src={p.artwork} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-black"></div>}
                  </div>
                  <h3 className="text-sm font-bold text-white truncate">{p.title}</h3>
                  <p className="text-xs text-white/40">{p.trackCount} {t.tracks.toLowerCase()}</p>
               </div>
            ))}
         </div>
       )}
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
     <div className="text-2xl font-bold text-white mb-1">{value}</div>
     <div className="text-xs text-white/40 uppercase tracking-widest">{label}</div>
  </div>
);

export default Profile;