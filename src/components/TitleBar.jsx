import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';

const TitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!window.electron) return;
    const handleMaximized = () => setIsMaximized(true);
    const handleUnmaximized = () => setIsMaximized(false);

    window.electron.on('window-maximized', handleMaximized);
    window.electron.on('window-unmaximized', handleUnmaximized);

    return () => {
      window.electron.off('window-maximized');
      window.electron.off('window-unmaximized');
    };
  }, []);

  const send = (channel) => {
    try {
      if (window.electron) {
        window.electron.send(channel);
      }
    } catch (e) {
      console.error('IPC Error:', e);
    }
  };

  return (
    <div className="flex items-center gap-2 z-50 no-drag app-region-no-drag">
      <button 
        onClick={() => send('minimize-window')}
        className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors group cursor-default"
      >
        <Minus size={14} className="text-white/40 group-hover:text-white" />
      </button>
      <button 
        onClick={() => send('maximize-window')}
        className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors group cursor-default"
      >
        {isMaximized ? (
          <Copy size={12} className="text-white/40 group-hover:text-white rotate-180" />
        ) : (
          <Square size={12} className="text-white/40 group-hover:text-white" />
        )}
      </button>
      <button 
        onClick={() => send('close-window')}
        className="w-8 h-8 rounded-full hover:bg-red-500/20 flex items-center justify-center transition-colors group cursor-default"
      >
        <X size={14} className="text-white/40 group-hover:text-red-400" />
      </button>
    </div>
  );
};

export default TitleBar;