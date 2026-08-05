'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ArrowRight, X, Maximize2 } from 'lucide-react';
import { BRAND } from '@/lib/site';

function Particle({ index, className }: { index: number; className?: string }) {
  const size = 2 + (index % 3);
  return (
    <motion.span
      className={`pointer-events-none absolute rounded-full ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        background: index % 2 === 0 ? 'rgba(34,211,238,0.55)' : 'rgba(245,196,81,0.55)',
        boxShadow: index % 2 === 0 ? '0 0 8px rgba(34,211,238,0.8)' : '0 0 8px rgba(245,196,81,0.8)',
      }}
      initial={{ y: '110vh', opacity: 0 }}
      animate={{ y: '-10vh', opacity: [0, 1, 0] }}
      transition={{ duration: 12 + (index % 6) * 2, repeat: Infinity, delay: index * 0.7, ease: 'linear' }}
    />
  );
}

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const [zoomed, setZoomed] = useState(false);

  const onMouseMove = (e: React.MouseEvent) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  return (
    <section
      id="top"
      ref={heroRef}
      onMouseMove={onMouseMove}
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      {/* Aurora blobs */}
      <div className="pointer-events-none absolute left-1/4 top-10 h-[480px] w-[480px] rounded-full bg-cyan-elec/15 blur-[140px] animate-aurora" />
      <div className="pointer-events-none absolute right-1/4 bottom-10 h-[420px] w-[420px] rounded-full bg-gold/15 blur-[140px] animate-aurora-2" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-brand/10 blur-[160px] animate-aurora" />

      {/* Animated grid */}
      <div className="grid-bg animate-grid-pan absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
      {/* Mouse spotlight */}
      <div className="spotlight absolute inset-0" />
      {/* Particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 16 }).map((_, i) => (
          <Particle key={i} index={i} className={i % 3 === 0 ? 'left-[15%]' : i % 3 === 1 ? 'left-[60%]' : 'left-[85%]'} />
        ))}
      </div>
      {/* Noise */}
      <div className="noise absolute inset-0" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-32 text-center">
        {/* Emblem with rotating ring — click to zoom */}
        <motion.button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label="View Overlay365 logo close-up"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="group relative mx-auto mb-10 flex h-44 w-44 cursor-pointer items-center justify-center outline-none sm:h-48 sm:w-48"
        >
          <svg className="absolute inset-0 h-full w-full animate-spin-slow" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="ring-grad" x1="0" y1="0" x2="100" y2="100">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#f5c451" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="47" stroke="url(#ring-grad)" strokeWidth="1.5" strokeDasharray="6 8" opacity="0.6" />
          </svg>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
            className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/20 bg-graphite sm:h-36 sm:w-36"
          >
            <img src="/overlay365.png" alt="Overlay365" className="h-full w-full object-cover" />
          </motion.div>
          {/* Hover hint */}
          <span className="pointer-events-none absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-soft-white/80 opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
            <Maximize2 size={14} />
          </span>
        </motion.button>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-soft-white sm:text-6xl md:text-7xl"
        >
          <span className="text-gradient-cyan-gold text-shimmer">CONNECTED BY DESIGN</span>
          <span className="mx-3 text-gold">·</span>
          <span className="text-shimmer">POWERED BY US</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-soft-white/60 sm:text-lg md:text-xl"
        >
          {BRAND.subheadline}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="mt-11 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a
            href="#ecosystem"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-cyan-elec to-gold px-9 py-4 text-base font-bold text-midnight shadow-xl shadow-cyan-elec/30 transition-transform hover:scale-105"
          >
            <span className="relative z-10">Explore the Ecosystem</span>
            <ArrowRight size={18} className="relative z-10 transition-transform group-hover:translate-x-1" />
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          </a>
          <a
            href="#ecosystem"
            className="glass inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-soft-white/85 transition-colors hover:border-white/25 hover:text-soft-white"
          >
            Meet the Three Platforms
          </a>
        </motion.div>

        {/* Scroll cue */}
        <motion.a
          href="#ecosystem"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-soft-white/40 transition-colors hover:text-soft-white"
          aria-label="Scroll to ecosystem"
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <ChevronDown size={26} />
          </motion.div>
        </motion.a>
      </div>

      {/* Logo zoom lightbox */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomed(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-midnight/90 p-6 backdrop-blur-xl"
          >
            <motion.button
              type="button"
              onClick={() => setZoomed(false)}
              aria-label="Close logo close-up"
              className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-soft-white/80 transition-colors hover:bg-white/10 hover:text-soft-white"
            >
              <X size={20} />
            </motion.button>
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-3xl overflow-hidden rounded-3xl border border-white/15 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img src="/overlay365.png" alt="Overlay365 logo close-up" className="h-auto w-full object-contain" />
              <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />
              <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-midnight/90 to-transparent px-6 pb-5 pt-10 text-center font-display text-sm font-bold tracking-[0.2em] text-soft-white">
                CONNECTED BY DESIGN <span className="text-gold">·</span> POWERED BY US
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
