import React, { useEffect, useMemo, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const AudioVisualizer = ({ isPlaying, analyserRef }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const { theme } = useTheme();
  const colors = useMemo(() => {
    const vars = theme?.variables || {};
    return {
      accent: vars['--accent'] || '#6366f1',
      accentAlt: vars['--accent-muted'] || '#a5b4fc'
    };
  }, [theme]);

  useEffect(() => {
    const renderFrame = () => {
      const canvas = canvasRef.current;
      const analyser = analyserRef?.current;

      if (!canvas || !analyser) {
         if (isPlaying) animationRef.current = requestAnimationFrame(renderFrame);
         return;
      }

      try {
        const ctx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        analyser.getByteFrequencyData(dataArray);

        const width = canvas.width;
        const height = canvas.height;
        const barWidth = (width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / 255) * height;

          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, colors.accent);
          gradient.addColorStop(1, colors.accentAlt);

          ctx.fillStyle = gradient;
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);

          x += barWidth + 1;
        }
      } catch (e) {
      }

      animationRef.current = requestAnimationFrame(renderFrame);
    };

    if (isPlaying) {
      renderFrame();
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, analyserRef]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={60} 
      className="w-full h-full opacity-80" 
    />
  );
};

export default AudioVisualizer;
