'use client';

import { motion } from 'motion/react';
import { ArrowUpRight, HeartPulse, Coins, Scale } from 'lucide-react';
import { PLATFORMS } from '@/lib/site';
import { TiltCard } from './TiltCard';

const ICONS = { teal: HeartPulse, gold: Coins, cyan: Scale } as const;

const ACCENT = {
  teal: {
    glow: 'rgba(20,184,166,0.5)',
    border: 'group-hover:border-teal-brand/60',
    shadow: 'group-hover:shadow-[0_20px_80px_-20px_rgba(20,184,166,0.45)]',
    badge: 'from-teal-brand/20 to-cyan-elec/10 text-teal-brand border-teal-brand/30',
    cta: 'group-hover:bg-teal-brand',
    dot: 'bg-teal-brand',
    icon: 'group-hover:text-teal-brand',
    topbar: 'from-teal-brand to-emerald-400',
  },
  gold: {
    glow: 'rgba(245,196,81,0.5)',
    border: 'group-hover:border-gold/60',
    shadow: 'group-hover:shadow-[0_20px_80px_-20px_rgba(245,196,81,0.45)]',
    badge: 'from-gold/20 to-amber-deep/10 text-gold border-gold/30',
    cta: 'group-hover:bg-gold',
    dot: 'bg-gold',
    icon: 'group-hover:text-gold',
    topbar: 'from-gold to-amber-deep',
  },
  cyan: {
    glow: 'rgba(34,211,238,0.5)',
    border: 'group-hover:border-cyan-elec/60',
    shadow: 'group-hover:shadow-[0_20px_80px_-20px_rgba(34,211,238,0.45)]',
    badge: 'from-cyan-elec/20 to-blue-brand/10 text-cyan-elec border-cyan-elec/30',
    cta: 'group-hover:bg-cyan-elec',
    dot: 'bg-cyan-elec',
    icon: 'group-hover:text-cyan-elec',
    topbar: 'from-cyan-elec to-blue-brand',
  },
} as const;

export function Ecosystem() {
  return (
    <section id="ecosystem" className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8">
      {/* Ambient */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-elec/6 blur-[170px]" />
      <div className="pointer-events-none absolute right-1/5 top-1/3 h-80 w-80 rounded-full bg-gold/6 blur-[140px] animate-aurora" />

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center"
      >
        <div className="mb-5 flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-elec" />
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-elec">The Ecosystem</span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold" />
        </div>
        <h2 className="mx-auto max-w-4xl font-display text-4xl font-extrabold tracking-tight text-soft-white sm:text-5xl md:text-6xl">
          Three Life Systems. <span className="serif-accent text-gradient-cyan-gold">One Connected</span> Platform.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-soft-white/60 sm:text-lg">
          Hover each platform to illuminate the connection. Every system feeds the next — health, wealth, and justice
          working together.
        </p>
      </motion.div>

      {/* Platform cards — 3D tilt */}
      <div className="perspective-1200 relative z-10 mt-20 grid gap-7 md:grid-cols-3">
        {PLATFORMS.map((platform, i) => {
          const Icon = ICONS[platform.accent];
          const a = ACCENT[platform.accent];
          return (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 48, rotateX: -8 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.14, ease: [0.22, 1, 0.36, 1] }}
              className="perspective-1200"
            >
              <TiltCard
                as="a"
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                maxTilt={10}
                className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-graphite/70 p-7 backdrop-blur-sm transition-all duration-300"
              >
                {/* Gradient top bar */}
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${a.topbar} opacity-60`} />
                {/* Hover glow */}
                <div
                  className={`pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100 ${a.dot}`}
                  style={{ backgroundColor: a.glow, opacity: 0 }}
                />
                {/* Ambient gradient wash */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />

                {/* Logo layer (pops in 3D) */}
                <div className="relative mb-6 h-44 w-full overflow-hidden rounded-2xl border border-white/10 bg-midnight" style={{ transform: 'translateZ(30px)' }}>
                  <img
                    src={platform.logo}
                    alt={platform.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight/70 via-transparent to-transparent" />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
                  <span className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border bg-gradient-to-r px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur ${a.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${a.dot}`} />
                    {platform.shortName}
                  </span>
                </div>

                {/* Copy layer */}
                <div style={{ transform: 'translateZ(20px)' }}>
                  <div className="flex items-center gap-2.5">
                    <Icon size={20} className={`transition-colors ${a.icon}`} />
                    <h3 className="font-display text-xl font-bold text-soft-white">{platform.name}</h3>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-soft-white/50">{platform.tagline}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-soft-white/55">{platform.description}</p>
                </div>

                {/* CTA layer */}
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5" style={{ transform: 'translateZ(14px)' }}>
                  <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-soft-white/80 transition-all ${a.cta}`}>
                    {platform.cta}
                    <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>

      {/* Connector */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-14 text-center text-xs font-medium uppercase tracking-[0.35em] text-soft-white/30"
      >
        Powered by Overlay365 · Building Better Futures Every Day
      </motion.p>
    </section>
  );
}
