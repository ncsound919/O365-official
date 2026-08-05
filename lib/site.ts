// Central Overlay365 configuration — brand, domains, and sub-platform links.
// Update these URLs as each platform's production deployment settles.

export const BRAND = {
  name: 'Overlay365',
  tagline: 'One Digital Platform. Three Life Systems. Infinite Possibilities.',
  headline: 'Life Is Connected. Your Digital Ecosystem Should Be Too.',
  subheadline:
    'Overlay365 brings together health, wealth, and justice into one connected platform designed to help people build stronger futures every day.',
  // Canonical domain (primary). overlay365.com redirects to this.
  canonicalUrl: 'https://overlay365.org',
  primaryDomain: 'overlay365.org',
  altDomain: 'overlay365.com',
} as const;

export interface PlatformLink {
  id: 'health' | 'wealth' | 'justice';
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  url: string;
  logo: string;
  accent: 'teal' | 'gold' | 'cyan';
  cta: string;
}

// Sub-platform external links.
// Health + Justice deploy to Vercel; Wealth deploys to Render.
export const PLATFORMS: PlatformLink[] = [
  {
    id: 'health',
    name: 'Overlay Health',
    shortName: 'Health',
    tagline: 'Manage wellness, advocate for better care.',
    description:
      'Providing actionable tools to manage personal wellness, advocate for better care, and close health disparity gaps — rooted in ancestral nutrition and heritage remedies.',
    url: 'https://uplift-health.vercel.app',
    logo: '/health.png',
    accent: 'teal',
    cta: 'Enter Health',
  },
  {
    id: 'wealth',
    name: 'Overlay Wealth',
    shortName: 'Wealth',
    tagline: 'Build literacy, growth, and generational wealth.',
    description:
      'Delivering strategies and resources for financial literacy, economic growth, and building generational wealth — through courses, simulators, and gamified learning.',
    url: 'https://uplift-wealth.onrender.com',
    logo: '/wealth.png',
    accent: 'gold',
    cta: 'Enter Wealth',
  },
  {
    id: 'justice',
    name: 'Overlay Justice',
    shortName: 'Justice',
    tagline: 'Navigate the system, advocate for your rights.',
    description:
      'Equipping you with the resources and knowledge needed to navigate the legal system, advocate for your rights, and drive systemic fairness.',
    url: 'https://uplift-justice.vercel.app',
    logo: '/justice.png',
    accent: 'cyan',
    cta: 'Enter Justice',
  },
] as const;
