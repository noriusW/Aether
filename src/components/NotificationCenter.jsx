import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bell, Download, CheckCircle, X, AlertTriangle, PlugZap, WifiOff, Info } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';

const NotificationCenter = ({ onClose }) => {
  const { notifications, clearNotifications, t } = useUserData();

  const items = useMemo(() => {
    return [...(notifications || [])].sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }, [notifications]);

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const iconFor = (item) => {
    if (item.type === 'update') return <Download size={18} />;
    if (item.type === 'rpc') return <PlugZap size={18} />;
    if (item.type === 'connection') return <WifiOff size={18} />;
    if (item.level === 'error') return <AlertTriangle size={18} />;
    if (item.level === 'success') return <CheckCircle size={18} />;
    return <Info size={18} />;
  };

  const levelStyles = (level) => {
    if (level === 'error') return 'border-red-500/20 bg-red-500/5 text-red-400';
    if (level === 'warning') return 'border-yellow-500/20 bg-yellow-500/5 text-yellow-300';
    if (level === 'success') return 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400';
    return 'border-white/5 bg-white/[0.03] text-white/70';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute top-16 left-0 w-[360px] bg-[#050505] border border-white/10 rounded-[28px] shadow-[0_20px_80px_rgba(0,0,0,0.8)] z-[100] overflow-hidden flex flex-col backdrop-blur-3xl cursor-default"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-indigo-400" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">
            {t.notifications_title || 'Notifications'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={clearNotifications}
              className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all"
            >
              {t.notifications_clear || 'Clear All'}
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-full text-white/20 hover:text-white transition-all cursor-pointer">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-3 max-h-[460px] overflow-y-auto custom-scrollbar space-y-2">
        {items.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center opacity-40">
             <CheckCircle size={30} className="mb-3" />
             <p className="text-[10px] font-bold uppercase tracking-widest">{t.notifications_empty || 'No notifications yet'}</p>
          </div>
        )}

        {items.map((item) => {
          const notes = item.notes ? String(item.notes).trim() : '';
          const preview = notes.length > 180 ? `${notes.slice(0, 180)}...` : notes;
          return (
            <div key={item.id} className={`p-4 rounded-[20px] border ${levelStyles(item.level)}`}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-black/40 text-white/70">
                  {iconFor(item)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold text-white truncate">{item.title || (t.notifications_title || 'Notification')}</p>
                    <div className="flex items-center gap-2">
                      {!item.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>}
                      <span className="text-[9px] text-white/30">{formatTime(item.ts)}</span>
                    </div>
                  </div>
                  {item.body && <p className="text-[10px] text-white/40 leading-relaxed mt-1">{item.body}</p>}
                  {preview && (
                    <p className="text-[10px] text-white/30 leading-relaxed mt-2 whitespace-pre-line max-h-24 overflow-hidden">
                      {preview}
                    </p>
                  )}
                  {item.url && (
                    <button
                      onClick={() => {
                        if (window.electron?.invoke) window.electron.invoke('open-external', item.url);
                        else window.open(item.url, '_blank');
                      }}
                      className="mt-3 w-full py-2 bg-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-white hover:text-black transition-all"
                    >
                      {t.update_download || 'Open release'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default NotificationCenter;
