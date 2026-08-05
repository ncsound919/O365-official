'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { PLATFORMS } from '@/lib/site';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sections = ['top', 'ecosystem', 'why', 'donate', 'contact'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:px-6">
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'flex w-full max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 sm:px-6',
          scrolled
            ? 'glass shadow-2xl shadow-black/40 border-white/10'
            : 'border border-transparent'
        )}
      >
        {/* Ambient header glow */}
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-40 blur-2xl bg-gradient-to-r from-cyan-elec/20 via-transparent to-gold/20" />

        {/* Brand */}
        <a href="#top" onClick={() => scrollTo('top')} className="group flex items-center gap-2.5" aria-label="Overlay365 home">
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-graphite shadow-lg shadow-black/30">
            <img src="/icon.png" alt="Overlay365" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-soft-white">
            Overlay<span className="text-gradient-cyan-gold">365</span>
          </span>
          <span className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-soft-white/50 lg:inline-flex">
            <Sparkles size={9} className="text-gold" /> Ecosystem
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-0.5 md:flex">
          {PLATFORMS.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'relative rounded-full px-4 py-2 text-sm font-medium transition-colors',
                active === 'ecosystem' ? 'text-soft-white' : 'text-soft-white/60 hover:text-soft-white'
              )}
            >
              {p.shortName}
            </a>
          ))}
          {[
            { id: 'why', label: 'Mission' },
            { id: 'contact', label: 'Contact' },
          ].map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className={cn(
                'relative rounded-full px-4 py-2 text-sm font-medium transition-colors',
                active === link.id ? 'text-soft-white' : 'text-soft-white/60 hover:text-soft-white'
              )}
            >
              {active === link.id && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 -z-10 rounded-full border border-cyan-elec/40 bg-white/10 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {link.label}
            </button>
          ))}
          <a
            href="#donate"
            onClick={() => scrollTo('donate')}
            className="group relative ml-2 overflow-hidden rounded-full bg-gradient-to-r from-cyan-elec to-gold px-5 py-2.5 text-sm font-bold text-midnight shadow-lg shadow-cyan-elec/25 transition-transform hover:scale-105"
          >
            <span className="relative z-10 flex items-center gap-1.5">Donate <span className="opacity-70">→</span></span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="rounded-xl p-2 text-soft-white/80 hover:bg-white/5 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="absolute inset-x-4 top-[4.5rem] overflow-hidden rounded-2xl glass md:hidden"
          >
            <div className="space-y-1 p-3">
              {PLATFORMS.map((p) => (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-soft-white/85 hover:bg-white/5"
                >
                  <span className="h-9 w-9 overflow-hidden rounded-lg border border-white/10">
                    <img src={p.logo} alt="" className="h-full w-full object-cover" />
                  </span>
                  {p.name}
                </a>
              ))}
              {[{ id: 'why', label: 'Mission' }, { id: 'donate', label: 'Donate' }, { id: 'contact', label: 'Contact' }].map((l) => (
                <button
                  key={l.id}
                  onClick={() => scrollTo(l.id)}
                  className={cn(
                    'w-full rounded-xl px-3 py-3 text-left text-sm font-semibold hover:bg-white/5',
                    l.id === 'donate' ? 'text-gold' : 'text-soft-white/85'
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
