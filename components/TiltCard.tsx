'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Max tilt in degrees. Default 8. */
  maxTilt?: number;
  /** Enable glare sweep. Default true. */
  glare?: boolean;
  /** Render as an anchor (for link cards). */
  as?: 'div' | 'a';
  href?: string;
  target?: string;
  rel?: string;
}

export function TiltCard({
  children,
  className,
  maxTilt = 8,
  glare = true,
  as = 'div',
  href,
  target,
  rel,
  ...rest
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<string>('perspective(1200px) rotateX(0deg) rotateY(0deg)');
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, o: 0 });
  const [hov, setHov] = useState(false);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - py) * maxTilt * 2;
    const ry = (px - 0.5) * maxTilt * 2;
    setTransform(`perspective(1200px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`);
    setGlarePos({ x: px * 100, y: py * 100, o: 1 });
  };

  const onLeave = () => {
    setTransform('perspective(1200px) rotateX(0deg) rotateY(0deg)');
    setGlarePos((p) => ({ ...p, o: 0 }));
    setHov(false);
  };

  const Tag = as as any;

  return (
    <Tag
      ref={ref}
      href={href}
      target={target}
      rel={rel}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onMouseEnter={() => setHov(true)}
      className={cn('preserve-3d relative will-change-transform', className)}
      style={{ transform, transition: hov ? 'transform 0.08s ease-out' : 'transform 0.5s cubic-bezier(0.22,1,0.36,1)' }}
      {...rest}
    >
      {children}
      {glare && (
        <div
          className="pointer-events-none absolute inset-0 z-20 rounded-[inherit]"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.16), transparent 55%)`,
            opacity: glarePos.o,
            transition: 'opacity 0.3s',
          }}
        />
      )}
    </Tag>
  );
}
