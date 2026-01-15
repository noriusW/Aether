import React, { useRef, useEffect } from 'react';
import { useUserData } from '../context/UserDataContext';
import { useTheme } from '../context/ThemeContext';
import { usePlayer } from '../context/PlayerContext';
import { resolveBackground } from '../utils/theme';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeBackground = (theme, visualSettings) => {
  const overrides = visualSettings?.background || {};
  const palette = visualSettings?.palette || theme?.palette || [];
  const base = resolveBackground(theme, overrides, palette);
  if (!base?.type || base.type === 'none') return null;

  return {
    type: base.type,
    colors: base.colors || [],
    mediaUrl: base.mediaUrl || '',
    overlay: clamp(Number(base.overlay ?? 0.6), 0, 1),
    blur: clamp(Number(base.blur ?? 0), 0, 40),
    position: base.position || 'center',
    size: base.size || 'cover'
  };
};

const BackgroundLayer = () => {
  const { visualSettings } = useUserData();
  const { theme } = useTheme();
  const { analyserRef, isPlaying } = usePlayer();
  const background = normalizeBackground(theme, visualSettings);
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    // If animations are disabled, reset and stop
    if (!visualSettings.animations) {
      if (containerRef.current) {
        containerRef.current.style.transform = 'scale(1)';
        containerRef.current.style.filter = background ? `blur(${background.blur}px)` : 'none';
      }
      return;
    }

    const animate = () => {
      let scale = 1.02; // Default "breathing" scale
      let brightness = 1.0;
      let blur = background ? background.blur : 0;

      // Only process audio data if playing and analyser exists
      if (isPlaying && analyserRef.current) {
        try {
          const analyser = analyserRef.current;
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);

          // Bass calculation (Low frequencies)
          let bassSum = 0;
          const bassRange = 10;
          for (let i = 0; i < bassRange; i++) {
            bassSum += dataArray[i];
          }
          const bassAvg = bassSum / bassRange;
          const bassNormal = bassAvg / 255;

          // Reactivity parameters
          scale = 1 + (bassNormal * 0.08); // Max 8% scale bump
          brightness = 1 + (bassNormal * 0.3); // Brightness flare
          if (background && background.blur) {
             blur = background.blur - (bassNormal * 2); // De-blur slightly on beat? Or blur more? Let's blur more.
             blur = background.blur + (bassNormal * 8); 
          }
        } catch (e) {
          // Analyser might be disconnected or invalid
        }
      } else {
        // Idle breathing animation (simulated via time)
        const time = Date.now() / 2000;
        scale = 1 + (Math.sin(time) * 0.01);
      }

      if (containerRef.current) {
        containerRef.current.style.transform = `scale(${scale})`;
        
        let filterString = '';
        if (blur > 0) filterString += `blur(${blur}px) `;
        if (brightness !== 1) filterString += `brightness(${brightness}) `;
        
        containerRef.current.style.filter = filterString;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, visualSettings.animations, background]); // Removed analyserRef from dependency to avoid loop, it's a ref.

  if (!background) return null;

  const renderMedia = () => {
    // Styles for the inner media element
    const mediaStyle = {
      width: '100%',
      height: '100%',
      objectFit: background.size,
      objectPosition: background.position,
      opacity: background.overlay,
    };

    if (background.type === 'color') {
      return <div className="absolute inset-0" style={{ ...mediaStyle, backgroundColor: background.colors?.[0] || '#000' }} />;
    }

    if (background.type === 'gradient') {
      const colors = background.colors || [];
      const stops = colors.length >= 2
        ? `radial-gradient(circle at 20% 20%, ${colors[0]} 0%, transparent 50%), radial-gradient(circle at 80% 80%, ${colors[1]} 0%, transparent 45%), linear-gradient(135deg, ${colors.join(', ')})`
        : `linear-gradient(135deg, ${colors[0] || '#050505'}, ${colors[1] || '#0b0b0b'})`;
      return <div className="absolute inset-0" style={{ ...mediaStyle, backgroundImage: stops }} />;
    }

    if (background.type === 'video' && background.mediaUrl) {
      return (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={background.mediaUrl}
          autoPlay
          muted
          loop
          playsInline
          style={mediaStyle}
        />
      );
    }

    if (background.mediaUrl) {
      return <img src={background.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={mediaStyle} />;
    }

    return null;
  };

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-black">
      {/* 
         Container for the transform/scale effects. 
         Using -inset-5 to give 5% margin on all sides for scaling 
         without showing black edges.
      */}
      <div 
        ref={containerRef} 
        className="absolute -inset-[5%] w-[110%] h-[110%]"
        style={{ transition: 'transform 0.1s linear, filter 0.1s linear', willChange: 'transform, filter' }}
      >
         {renderMedia()}
      </div>
      {/* Static Overlay for readability */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
    </div>
  );
};

export default BackgroundLayer;
