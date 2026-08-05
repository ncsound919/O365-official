'use client';

import { Mail, Phone, Instagram, Facebook, Linkedin } from 'lucide-react';
import { PLATFORMS } from '@/lib/site';

const CONTACTS = [
  { icon: Instagram, label: 'Instagram', value: '@overlay365', href: 'https://instagram.com/overlay365', external: true },
  { icon: Facebook, label: 'Facebook', value: 'Overlay365', href: 'https://facebook.com/Overlay365', external: true },
  { icon: Linkedin, label: 'LinkedIn', value: 'Terrence Perry', href: 'https://linkedin.com/in/terrenceperry', external: true },
  { icon: Mail, label: 'Email', value: 'tap4500@gmail.com', href: 'mailto:tap4500@gmail.com', external: false },
  { icon: Phone, label: 'Phone', value: '984-365-6059', href: 'tel:9843656059', external: false },
];

export function Footer() {
  return (
    <footer id="contact" className="border-t border-white/10 bg-graphite/60">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/10">
                <img src="/icon.png" alt="Overlay365" className="h-full w-full object-cover" />
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-soft-white">
                Overlay<span className="text-gradient-cyan-gold">365</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-soft-white/50">
              Building Better Futures Every Day. One digital platform, three life systems, infinite possibilities.
            </p>
          </div>

          {/* Platforms */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-soft-white/40">Platforms</h4>
            <ul className="mt-4 space-y-2.5">
              {PLATFORMS.map((p) => (
                <li key={p.id}>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-soft-white/70 transition-colors hover:text-soft-white"
                  >
                    <span className="h-5 w-5 overflow-hidden rounded border border-white/10">
                      <img src={p.logo} alt="" className="h-full w-full object-cover" />
                    </span>
                    {p.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-soft-white/40">Contact</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {CONTACTS.map((c) => (
                <li key={c.label}>
                  <a
                    href={c.href}
                    {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="inline-flex items-center gap-2 text-soft-white/70 transition-colors hover:text-soft-white"
                  >
                    <c.icon size={15} className="text-cyan-elec" />
                    {c.label}: {c.value}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-soft-white/40">
            © {new Date().getFullYear()} Overlay365. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-soft-white/30">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-elec" />
            overlay365.org
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            overlay365.com
          </div>
        </div>
      </div>
    </footer>
  );
}
