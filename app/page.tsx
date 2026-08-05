import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Ecosystem } from '@/components/Ecosystem';
import { WhyOverlay } from '@/components/WhyOverlay';
import { Community } from '@/components/Community';
import { Donate } from '@/components/Donate';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-midnight">
      <Navbar />
      <Hero />
      <Ecosystem />
      <WhyOverlay />
      <Community />
      <Donate />
      <Footer />
    </main>
  );
}
