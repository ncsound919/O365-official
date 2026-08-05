import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Bricolage_Grotesque, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { BRAND } from '@/lib/site';

const instrument = Instrument_Serif({
  weight: ['400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#05060a',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.canonicalUrl),
  title: {
    default: 'Overlay365 — One Digital Platform. Three Life Systems.',
    template: '%s — Overlay365',
  },
  description:
    'Overlay365 brings together health, wealth, and justice into one connected platform designed to help people build stronger futures every day.',
  applicationName: 'Overlay365',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'Overlay365',
    title: 'Overlay365 — One Digital Platform. Three Life Systems.',
    description:
      'Overlay365 brings together health, wealth, and justice into one connected platform designed to help people build stronger futures every day.',
    url: BRAND.canonicalUrl,
    images: ['/overlay365.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Overlay365 — One Digital Platform. Three Life Systems.',
    description:
      'Overlay365 brings together health, wealth, and justice into one connected platform designed to help people build stronger futures every day.',
    images: ['/overlay365.png'],
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`antialiased bg-midnight text-soft-white font-body ${instrument.variable} ${bricolage.variable} ${jakarta.variable}`}>
        {children}
      </body>
    </html>
  );
}
