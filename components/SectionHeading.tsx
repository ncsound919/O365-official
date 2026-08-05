'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  titleAccent?: string;
  description?: string;
  align?: 'center' | 'left';
}

export function SectionHeading({ eyebrow, title, titleAccent, description, align = 'center' }: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn('max-w-3xl', align === 'center' ? 'mx-auto text-center' : 'text-left')}
    >
      <div className={cn('flex items-center gap-3', align === 'center' && 'justify-center')}>
        <span className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-elec" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-elec">{eyebrow}</span>
        <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold" />
      </div>
      <h2 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-soft-white sm:text-5xl">
        {title}
        {titleAccent && (
          <>
            {' '}
            <span className="serif-accent text-gradient-cyan-gold">{titleAccent}</span>
          </>
        )}
      </h2>
      {description && (
        <p className="mt-5 text-base leading-relaxed text-soft-white/60 sm:text-lg">{description}</p>
      )}
    </motion.div>
  );
}
