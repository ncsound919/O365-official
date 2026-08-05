'use client';

import { motion } from 'motion/react';
import { Compass, Eye, Map, BadgeCheck, Sparkles } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { TiltCard } from './TiltCard';

const PILLARS = [
  {
    icon: Compass,
    label: 'Mission',
    title: 'Empower the Community',
    body: 'Overlay365 was built with a singular, vital mission — to empower the Black community by providing practical, everyday tools to navigate and overcome some of our most crucial modern challenges.',
    accent: 'from-cyan-elec to-gold',
  },
  {
    icon: Eye,
    label: 'Vision',
    title: 'One Platform, Infinite Possibilities',
    body: 'True empowerment requires a holistic approach. Overlay365 serves as the central foundation for three dedicated platforms — each focused on a specific pillar of community well-being.',
    accent: 'from-gold to-amber-deep',
  },
  {
    icon: Map,
    label: 'Roadmap',
    title: 'What Comes Next',
    body: 'Three life systems live today. Next: Overlay Learn, Overlay AI, Overlay Community, and Overlay Business — all under one connected roof, growing with the people it serves.',
    accent: 'from-blue-brand to-cyan-elec',
  },
];

const APPROACH = [
  'Low-cost, highly effective resources',
  'Easily adoptable into daily life',
  'Intuitive, easy to understand, immediately useful',
  'Built for young adults, professionals, and elders alike',
];

export function Community() {
  return (
    <section className="relative overflow-hidden">
      {/* Band background */}
      <div className="absolute inset-0 bg-gradient-to-br from-graphite via-midnight to-graphite" />
      <div className="grid-bg animate-grid-pan absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="pointer-events-none absolute left-1/4 top-0 h-80 w-80 rounded-full bg-cyan-elec/10 blur-[140px] animate-aurora" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-gold/10 blur-[140px] animate-aurora-2" />
      <div className="noise absolute inset-0" />

      <div className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8">
        <SectionHeading
          eyebrow="Community Impact"
          title="Technology That Builds"
          titleAccent="Opportunity."
          description="Overlay365 is designed to be more than software — it's a foundation for stronger communities and better futures."
        />

        {/* Featured mission statement — premium serif pull-quote */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="gradient-border-animated relative mx-auto mt-16 max-w-4xl overflow-hidden rounded-[2rem] p-[1.5px]"
        >
          <div className="relative overflow-hidden rounded-[calc(2rem-1.5px)] bg-midnight/90 px-8 py-12 text-center backdrop-blur-sm sm:px-14 sm:py-16">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-gold/15 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-elec/15 blur-[100px]" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
                <BadgeCheck size={12} /> Our Mission
              </span>
              <div className="relative mx-auto mt-8 max-w-2xl">
                <span className="pointer-events-none absolute -left-8 -top-8 font-serif text-[120px] leading-none text-gold/15">“</span>
                <p className="serif-accent text-2xl font-normal leading-relaxed text-soft-white sm:text-3xl md:text-4xl">
                  We believe that true empowerment requires a holistic approach — so
                  <span className="text-gradient-cyan-gold"> Overlay365 unites health, wealth, and justice </span>
                  into one connected ecosystem built for the community.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Three pillars */}
        <div className="perspective-1200 mt-14 grid gap-6 lg:grid-cols-3">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="perspective-1200"
              >
                <TiltCard
                  maxTilt={8}
                  className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-midnight/60 p-8 backdrop-blur-sm transition-colors duration-300 hover:border-white/20"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
                  <div className="mb-5 flex items-center justify-between">
                    <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${p.accent} text-midnight shadow-lg transition-transform duration-300 group-hover:scale-110`} style={{ transform: 'translateZ(24px)' }}>
                      <Icon size={20} />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-soft-white/40">{p.label}</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-soft-white" style={{ transform: 'translateZ(18px)' }}>{p.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-soft-white/60" style={{ transform: 'translateZ(10px)' }}>{p.body}</p>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>

        {/* Our Approach */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 overflow-hidden rounded-3xl border border-white/10 bg-graphite/60 p-8 backdrop-blur-sm sm:p-10"
        >
          <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-cyan-elec">
                <Sparkles size={13} /> Our Approach
              </span>
              <h3 className="mt-4 font-display text-2xl font-bold text-soft-white sm:text-3xl">
                Solutions shouldn&rsquo;t be a luxury — <span className="serif-accent text-gradient-cyan-gold">nor should they be overly complicated.</span>
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-soft-white/60">
                Overlay365 is committed to offering low-cost, highly effective resources that are easily adoptable into
                your daily life — intentionally designed to be intuitive and immediately useful for everyone.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[340px]">
              {APPROACH.map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
                  className="group flex items-center gap-2.5 rounded-xl border border-white/10 bg-midnight/60 px-4 py-3 text-sm font-medium text-soft-white/80 transition-colors hover:border-gold/30"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-cyan-elec to-gold shadow-[0_0_8px_#f5c451]" />
                  {item}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
