'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, ExternalLink, Heart, CreditCard, DollarSign } from 'lucide-react';

export interface DonationTier {
  amount: number;
  label: string;
  impact: string;
  impactLevel: number;
}

export const DONATION_TIERS: DonationTier[] = [
  { amount: 10, label: 'Supporter', impact: 'Maintains 100 student sandbox sessions', impactLevel: 25 },
  { amount: 25, label: 'Builder', impact: 'Sponsors 1 full HBCU student course license', impactLevel: 50 },
  { amount: 50, label: 'Community Champion', impact: 'Funds alternative credit lab development', impactLevel: 75 },
  { amount: 100, label: 'Institutional Partner', impact: 'Sponsors MDI open-banking sandbox expansion', impactLevel: 100 },
];

const CASHTAG = '$helptools';
const STRIPE_DONATION_LINK = 'https://buy.stripe.com/dRm6oJa7yevp2jF3em3oA06';

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-elec to-gold px-5 py-2.5 text-sm font-bold text-midnight transition-all hover:scale-105 active:scale-95"
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? `Copied ${value}` : label}
    </button>
  );
}

export function Donate() {
  const [selectedAmount, setSelectedAmount] = useState<number>(25);

  return (
    <section id="donate" className="relative mx-auto max-w-6xl px-5 py-28 sm:px-8">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/8 blur-[150px] animate-aurora" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="gradient-border relative overflow-hidden rounded-[2.5rem] p-[1.5px]"
      >
        <div className="relative overflow-hidden rounded-[calc(2.5rem-1.5px)] bg-graphite/80 p-8 backdrop-blur-sm sm:p-12">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-elec/8 via-transparent to-gold/8" />
          <div className="grid-bg animate-grid-pan absolute inset-0 opacity-25 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/12 blur-[130px]" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-cyan-elec/12 blur-[130px]" />
          <div className="noise absolute inset-0" />

          <div className="relative z-10 space-y-10">
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-gold shadow-[0_0_20px_rgba(245,196,81,0.15)]">
                <Heart size={12} className="fill-current animate-pulse" />
                Open-Source Community Donation
              </div>
              <h2 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-extrabold tracking-tight text-soft-white sm:text-5xl md:text-6xl">
                Built For The Community, <span className="serif-accent text-gradient-cyan-gold">Sustained By The Community.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-soft-white/60 sm:text-lg">
                Every platform on Overlay365 is open-access, with free tools at the core and paid upgrades. Core access
                is always free; paid tiers on Justice and Health help fund the platforms everyone relies on. Your
                contribution powers uptime, development, and education for all.
              </p>

              {/* Stripe button */}
              <a
                href={STRIPE_DONATION_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative mt-8 inline-flex items-center gap-2 overflow-hidden rounded-full bg-indigo-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-500/30 transition-transform hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <CreditCard size={17} />
                  Donate via Stripe (card / Apple Pay)
                </span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              </a>
            </div>

          {/* Support channels */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* CashApp & Chime */}
            <div className="flex flex-col justify-between rounded-3xl border border-emerald-500/30 bg-midnight/70 p-6 backdrop-blur-sm">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">CashApp &amp; Chime</span>
                <span className="mt-1 block font-display text-3xl font-black tracking-tight text-soft-white">{CASHTAG}</span>
                <p className="mt-1 text-sm text-soft-white/50">Direct support via CashApp or Chime handles.</p>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <CopyButton value={CASHTAG} label={`Copy ${CASHTAG}`} />
                <a
                  href="https://cash.app/$helptools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold text-soft-white/85 transition-colors hover:border-white/30 hover:text-soft-white"
                >
                  Open CashApp
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Venmo */}
            <div className="flex flex-col justify-between rounded-3xl border border-blue-500/30 bg-midnight/70 p-6 backdrop-blur-sm">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-blue-400">Venmo Handle</span>
                <span className="mt-1 block font-display text-3xl font-black tracking-tight text-soft-white">{CASHTAG}</span>
                <p className="mt-1 text-sm text-soft-white/50">Support directly on Venmo for community projects.</p>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <CopyButton value={CASHTAG} label={`Copy ${CASHTAG}`} />
                <a
                  href="https://venmo.com/u/helptools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold text-soft-white/85 transition-colors hover:border-white/30 hover:text-soft-white"
                >
                  Open Venmo
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>

          {/* Donation tiers */}
          <div className="rounded-3xl border border-white/10 bg-midnight/60 p-6 backdrop-blur-sm sm:p-8">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <DollarSign size={20} className="text-gold" />
              <h3 className="font-display text-xl font-bold text-soft-white">Select Your Pledge Level</h3>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {DONATION_TIERS.map((tier) => {
                const selected = selectedAmount === tier.amount;
                return (
                  <button
                    key={tier.amount}
                    onClick={() => setSelectedAmount(tier.amount)}
                    className={`relative overflow-hidden rounded-2xl border p-5 text-center transition-all ${
                      selected
                        ? 'border-gold/60 bg-gold/10 ring-2 ring-gold/20'
                        : 'border-white/10 bg-midnight/70 hover:border-white/25'
                    }`}
                  >
                    {selected && (
                      <div className="absolute right-[-38px] top-[16px] w-[130px] rotate-45 bg-gradient-to-r from-cyan-elec to-gold py-0.5 text-center text-[10px] font-black uppercase tracking-tighter text-midnight">
                        Selected
                      </div>
                    )}
                    <span className="block text-3xl font-black text-soft-white">${tier.amount}</span>
                    <span className="mt-1 block text-xs font-bold text-gold">{tier.label}</span>
                  </button>
                );
              })}
            </div>

            {selectedAmount && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.2 }}
                className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-midnight/70 p-5 sm:flex-row"
              >
                <div className="text-center sm:text-left">
                  <span className="block text-xs font-bold uppercase tracking-widest text-soft-white/40">
                    Ready to send ${selectedAmount}?
                  </span>
                  <p className="mt-1 text-sm text-soft-white/70">
                    Send <strong className="text-gold">${selectedAmount}</strong> on CashApp to{' '}
                    <strong>{CASHTAG}</strong>.
                  </p>
                </div>
                <a
                  href={`https://cash.app/$helptools/${selectedAmount}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-cyan-elec to-gold px-6 py-3 text-sm font-bold text-midnight transition-transform hover:scale-105"
                >
                  <span>Donate ${selectedAmount} via CashApp</span>
                  <ExternalLink size={14} />
                </a>
              </motion.div>
            )}
          </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
