'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface LogoLoaderProps {
  className?: string;
  size?: number;
}

export function LogoLoader({ className = '', size = 64 }: LogoLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          times: [0, 0.5, 1],
          repeat: Infinity,
        }}
        className="relative"
        style={{ width: size, height: size }}
      >
        <img
          src="/favicon-round.png"
          alt="Loading..."
          className="w-full h-full object-contain"
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="mt-4 text-sm font-medium text-muted-foreground"
      >
        Loading...
      </motion.div>
    </div>
  );
}

export function GlobalLogoLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
      <LogoLoader size={80} />
    </div>
  );
}
