import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useUserData } from './UserDataContext';
import { getStreamUrl } from '../services/soundcloud';

const PlayerContext = createContext();
export const usePlayer = () => useContext(PlayerContext);

const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const PlayerProvider = ({ children }) => {
  const { addToHistory, audioSettings } = useUserData();
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem('player_volume')) || 0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState([]);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('OFF');

  const audioRef = useRef(new Audio());
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const filtersRef = useRef([]); // EQ
  const bassFilterRef = useRef(null);
  const compressorRef = useRef(null);
  const analyserRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.crossOrigin = "anonymous";
  }, []);

  // --- AUDIO ENGINE INITIALIZATION ---
  const initAudioEngine = () => {
    if (audioContextRef.current) return;

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = ctx;

    const source = ctx.createMediaElementSource(audioRef.current);
    sourceRef.current = source;

    // 1. Create 10-band EQ
    const filters = EQ_FREQUENCIES.map((freq, i) => {
      const filter = ctx.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1;
      filter.gain.value = audioSettings.eq[i];
      return filter;
    });
    filtersRef.current = filters;

    // 2. Bass Boost Node
    const bass = ctx.createBiquadFilter();
    bass.type = 'lowshelf';
    bass.frequency.value = 150;
    bass.gain.value = audioSettings.bassBoost;
    bassFilterRef.current = bass;

    // 3. Dynamics Compressor (Normalize volume)
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-24, ctx.currentTime);
    comp.knee.setValueAtTime(30, ctx.currentTime);
    comp.ratio.setValueAtTime(12, ctx.currentTime);
    comp.attack.setValueAtTime(0.003, ctx.currentTime);
    comp.release.setValueAtTime(0.25, ctx.currentTime);
    compressorRef.current = comp;

    // 4. Analyser for visualizer
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    // 5. CONNECT THE CHAIN
    // Source -> EQ[0] -> EQ[1] -> ... -> Bass -> Compressor -> Analyser -> Output
    let lastNode = source;
    filters.forEach(f => { lastNode.connect(f); lastNode = f; });
    lastNode.connect(bass);
    bass.connect(comp);
    comp.connect(analyser);
    analyser.connect(ctx.destination);
  };

  // Sync EQ & Effects when settings change
  useEffect(() => {
    if (!audioContextRef.current) return;
    
    // Sync EQ
    filtersRef.current.forEach((filter, i) => {
      filter.gain.setTargetAtTime(audioSettings.eq[i], audioContextRef.current.currentTime, 0.01);
    });

    // Sync Bass Boost
    if (bassFilterRef.current) {
      bassFilterRef.current.gain.setTargetAtTime(audioSettings.bassBoost, audioContextRef.current.currentTime, 0.01);
    }

    // Sync Compressor toggle
    if (compressorRef.current) {
      const ratio = audioSettings.compressor ? 12 : 1;
      compressorRef.current.ratio.setTargetAtTime(ratio, audioContextRef.current.currentTime, 0.01);
    }
  }, [audioSettings]);

  useEffect(() => {
    if (isPlaying && audioRef.current.src) {
      initAudioEngine();
      if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const loadTrack = async () => {
      if (currentTrack) {
        setIsLoadingStream(true);
        // Update Discord RPC
        if (window.electron) window.electron.send('update-presence', currentTrack);
        
        try {
          const url = await getStreamUrl(currentTrack);
          audioRef.current.src = url;
          audioRef.current.volume = isMuted ? 0 : volume;
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (e) { console.error(e); }
        finally { setIsLoadingStream(false); }
      }
    };
    loadTrack();
  }, [currentTrack]);

  useEffect(() => {
    audioRef.current.volume = isMuted ? 0 : volume;
    localStorage.setItem('player_volume', volume.toString());
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    const updateTime = () => { setProgress(audio.currentTime); setDuration(audio.duration || 0); };
    const handleEnded = () => {
      if (repeatMode === 'ONE') { audio.currentTime = 0; audio.play(); }
      else handleNext();
    };
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);
    
    const trayNext = () => handleNext();
    const trayPrev = () => handlePrev();
    window.addEventListener('tray-next-track', trayNext);
    window.addEventListener('tray-prev-track', trayPrev);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
      window.removeEventListener('tray-next-track', trayNext);
      window.removeEventListener('tray-prev-track', trayPrev);
    };
  }, [repeatMode, queue, currentTrack]);

  const playTrack = (t) => { if (currentTrack?.id === t.id) { togglePlay(); return; } setCurrentTrack(t); addToHistory(t); };
  const togglePlay = () => setIsPlaying(p => !p);
  const toggleMute = () => setIsMuted(p => !p);
  const seek = (t) => { audioRef.current.currentTime = t; setProgress(t); };

  const handleNext = () => {
    if (queue.length === 0) return;
    const idx = queue.findIndex(t => t.id === currentTrack?.id);
    if (isShuffle) playTrack(queue[Math.floor(Math.random() * queue.length)]);
    else if (idx < queue.length - 1) playTrack(queue[idx + 1]);
    else if (repeatMode === 'ALL') playTrack(queue[0]);
  };

  const handlePrev = () => {
    if (queue.length === 0) return;
    const idx = queue.findIndex(t => t.id === currentTrack?.id);
    if (idx > 0) playTrack(queue[idx - 1]);
  };

  return (
    <PlayerContext.Provider value={{
      currentTrack, isPlaying, isLoadingStream, volume, isMuted, isShuffle, repeatMode,
      progress, duration, queue, audioRef, analyserRef,
      setQueue, playTrack, togglePlay, setVolume, toggleMute, setIsShuffle, setRepeatMode,
      handleNext, handlePrev, seek
    }}>
      {children}
    </PlayerContext.Provider>
  );
};
