'use client';

import { motion } from 'motion/react';
import { HeartHandshake, Link2, ShieldCheck, TrendingUp } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { TiltCard } from './TiltCard';

const REASONS = [
  {
    icon: Link2,
    title: 'One Ecosystem, Not Fragments',
    body: 'Health, wealth, and justice are deeply connected in real life. Overlay365 keeps them connected digitally — no more juggling isolated apps.',
    accent: 'text-cyan-elec bg-cyan-elec/10 border-cyan-elec/20',
    glow: 'from-cyan-elec/25',
    iconGlow: 'bg-cyan-elec/20 shadow-cyan-elec/30',
  },
  {
    icon: ShieldCheck,
    title: 'Built on Trust & Transparency',
    body: 'Deterministic, auditable logic across every platform. What the system does is explainable, and your data stays yours.',
    accent: 'text-gold bg-gold/10 border-gold/20',
    glow: 'from-gold/25',
    iconGlow: 'bg-gold/20 shadow-gold/30',
  },
  {
    icon: TrendingUp,
    title: 'Designed for Real Progress',
    body: 'Every platform is engineered around measurable outcomes — stronger health, growing wealth, and equal access to justice.',
    accent: 'text-blue-brand bg-blue-brand/10 border-blue-brand/20',
    glow: 'from-blue-brand/25',
    iconGlow: 'bg-blue-brand/20 shadow-blue-brand/30',
  },
  {
    icon: HeartHandshake,
    title: 'Rooted in Community',
    body: 'A culturally-rooted ecosystem built for the diaspora, designed to help people and communities build stronger futures every day.',
    accent: 'text-cyan-elec bg-cyan-elec/10 border-cyan-elec/20',
    glow: 'from-cyan-elec/25',
    iconGlow: 'bg-cyan-elec/20 shadow-cyan-elec/30',
  },
];

export function WhyOverlay() {
  return (
    <section id="why" className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8">
      <div className="pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full bg-gold/6 blur-[150px] animate-aurora-2" />
      <div className="pointer-events-none absolute left-0 bottom-1/4 h-80 w-80 rounded-full bg-cyan-elec/6 blur-[150px] animate-aurora" />

      <SectionHeading
        eyebrow="Why Overlay365"
        title="A premium digital ecosystem,"
        titleAccent="not a website."
        description="Every experience reinforces that Health, Wealth, and Justice are interconnected services within one modern, scalable platform."
      />

      <div className="perspective-1200 mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {REASONS.map((reason, i) => {
          const Icon = reason.icon;
          return (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="perspective-1200"
            >
              <TiltCard
                maxTilt={9}
                className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-graphite/60 p-6 backdrop-blur-sm transition-colors duration-300 hover:border-white/20"
              >
                {/* Hover gradient wash */}
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${reason.glow} via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
                <div className={`relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border shadow-lg transition-transform duration-300 group-hover:scale-110 ${reason.accent} ${reason.iconGlow}`} style={{ transform: 'translateZ(24px)' }}>
                  <Icon size={22} />
                </div>
                <h3 className="font-display text-lg font-bold text-soft-white" style={{ transform: 'translateZ(18px)' }}>{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-soft-white/55" style={{ transform: 'translateZ(12px)' }}>{reason.body}</p>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
