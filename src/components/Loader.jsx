import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ small = false }) => {
  return (
    <div className="flex items-center justify-center gap-[3px] h-full">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="bg-indigo-500 rounded-full"
          animate={{
            height: [10, 25, 10],
            backgroundColor: ["#6366f1", "#a855f7", "#6366f1"],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
          style={{
            width: small ? 3 : 5,
            height: 15,
            filter: 'drop-shadow(0 0 5px rgba(99, 102, 241, 0.5))'
          }}
        />
      ))}
    </div>
  );
};

export default Loader;