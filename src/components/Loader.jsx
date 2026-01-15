import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const Loader = ({ small = false }) => {
  const { theme } = useTheme();
  const colors = useMemo(() => {
    const vars = theme?.variables || {};
    return {
      accent: vars['--accent'] || '#6366f1',
      accentAlt: vars['--accent-muted'] || '#a5b4fc'
    };
  }, [theme]);

  return (
    <div className="flex items-center justify-center gap-1.5 w-full h-full">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="bg-indigo-500 rounded-full"
          animate={{
            height: [20, 60, 20],
            backgroundColor: [colors.accent, colors.accentAlt, colors.accent],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
          style={{
            width: small ? 4 : 8,
            filter: 'drop-shadow(0 0 8px var(--accent-glow))'
          }}
        />
      ))}
    </div>
  );
};

export default Loader;
