import React, { useState } from 'react';
import { Music, ArrowRight, Github, Twitter, Disc } from 'lucide-react';
import Loader from './Loader';

const AuthOverlay = ({ onLogin, visible }) => {
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    setLoading(true);
    // Simulate OAuth delay
    setTimeout(() => {
      onLogin();
    }, 2000);
  };

  if (!visible) return null;

  return (
    <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      
      {/* Main Auth Card */}
      <div className="relative w-[400px] p-1 glass-panel rounded-3xl overflow-hidden shadow-2xl animate-[fadeIn_0.8s_ease-out]">
        <div className="bg-black/40 p-8 rounded-[20px] flex flex-col items-center relative overflow-hidden">
          
          {/* Background Glow */}
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] opacity-5 animate-[spin_4s_linear_infinite]"/>
          
          {/* Icon */}
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-40"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
              <Disc className="text-white w-8 h-8 animate-[spin_10s_linear_infinite]" />
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Aether</h1>
          <p className="text-white/40 text-sm mb-8 text-center max-w-[240px]">
            A clean SoundCloud player focused on speed and discovery.
          </p>

          <button
            onClick={handleConnect}
            disabled={loading}
            className="group relative w-full h-12 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <Loader small />
            ) : (
              <>
                <span className="z-10">Connect SoundCloud</span>
                <ArrowRight className="w-4 h-4 z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </button>

          <div className="mt-6 flex gap-4 text-white/20">
            <Github className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
            <Twitter className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
          </div>

          <div className="mt-6 text-xs text-white/30 font-medium">
             v1.1.0 <span className="mx-2">-</span> Release
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthOverlay;

