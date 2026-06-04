'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface LogoLoaderProps {
  className?: string;
  size?: number;
  label?: string;
}

interface LoaderWrapperProps extends LogoLoaderProps {
  surfaceClassName?: string;
}

const DEFAULT_LOGO_SRC = '/favicon-round.png';

const FALLBACK_LOGO_SRC =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="18" fill="%23eff6ff"/><path d="M18 22.5A4.5 4.5 0 0 1 22.5 18h9.75l4.25 5.25H41.5A4.5 4.5 0 0 1 46 27.75v13.75A4.5 4.5 0 0 1 41.5 46h-19A4.5 4.5 0 0 1 18 41.5v-19Z" fill="%231d4ed8"/><path d="M24 31h16M24 36h10" stroke="%23fff" stroke-width="3.5" stroke-linecap="round"/></svg>';

export function LogoLoader({
  className = '',
  size = 72,
  label = '',
}: LogoLoaderProps) {
  const [logoSrc, setLogoSrc] = useState(DEFAULT_LOGO_SRC);

  const containerSize = Math.max(56, size);
  const logoSize = Math.round(containerSize * 0.72);

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          width: containerSize + 52,
          height: containerSize + 52,
        }}
      >
        {/* Soft Glow */}
        <motion.div
          className="absolute rounded-full bg-blue-500/15 blur-2xl"
          style={{
            width: containerSize + 48,
            height: containerSize + 48,
          }}
          animate={{
            scale: [1, 1.12, 1],
            opacity: [0.45, 0.75, 0.45],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Outer Rotating Ring */}
        <motion.div
          className="absolute rounded-full border-2 border-transparent border-t-blue-600 border-r-blue-200"
          style={{
            width: containerSize + 28,
            height: containerSize + 28,
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.25,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Inner Background Circle */}
        <div
          className="absolute rounded-full border border-slate-200 bg-white shadow-sm"
          style={{
            width: containerSize + 10,
            height: containerSize + 10,
          }}
        />

        {/* Logo Card */}
        <motion.div
          className="relative z-10 flex items-center justify-center overflow-hidden rounded-full border border-white bg-white shadow-[0_20px_45px_-20px_rgba(37,99,235,0.45)]"
          style={{
            width: containerSize,
            height: containerSize,
            padding: Math.round(containerSize * 0.16),
          }}
          animate={{
            scale: [1, 1.035, 1],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Image
            src={logoSrc}
            alt="DoorstepFilings favicon"
            width={logoSize}
            height={logoSize}
            priority
            unoptimized
            className="block h-full w-full object-contain"
            onError={() => {
              if (logoSrc !== FALLBACK_LOGO_SRC) {
                setLogoSrc(FALLBACK_LOGO_SRC);
              }
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

function LoaderSurface({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.55)] backdrop-blur-xl ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.12),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.10),_transparent_40%)]" />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function PanelLogoLoader({
  className = '',
  label = 'Loading details...',
  size = 64,
  surfaceClassName = '',
}: LoaderWrapperProps) {
  return (
    <div
      className={`flex min-h-[18rem] items-center justify-center px-4 py-6 ${className}`}
    >
      <LoaderSurface className={`w-full max-w-md ${surfaceClassName}`}>
        <LogoLoader size={size} label={label} />
      </LoaderSurface>
    </div>
  );
}

export function PageLogoLoader({
  className = '',
  label = 'Preparing your workspace...',
  size = 72,
  surfaceClassName = '',
}: LoaderWrapperProps) {
  return (
    <div
      className={`flex min-h-[60vh] items-center justify-center px-4 py-10 ${className}`}
    >
      <LoaderSurface className={`w-full max-w-md ${surfaceClassName}`}>
        <LogoLoader size={size} label={label} />
      </LoaderSurface>
    </div>
  );
}

export function GlobalLogoLoader({
  label = 'Authenticating session...',
  size = 76,
}: Pick<LogoLoaderProps, 'label' | 'size'>) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-50/90 px-4 backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.14),_transparent_42%)]" />

      <LoaderSurface className="relative w-full max-w-md">
        <LogoLoader size={size} label={label} />
      </LoaderSurface>
    </div>
  );
}
