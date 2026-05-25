import Navbar from '@/sections/Navbar';
import Hero from '@/sections/Hero';
import Workflow from '@/sections/Workflow';
import ReportPreview from '@/sections/ReportPreview';
import Trust from '@/sections/Trust';
import FAQ from '@/sections/FAQ';
import AppSection from '@/sections/AppSection';
import Footer from '@/sections/Footer';

export default function Home() {
  return (
    <div className="min-h-[100dvh]" style={{ background: 'var(--color-bg-base)' }}>
      <Navbar />
      <Hero />
      <Workflow />
      <ReportPreview />
      <Trust />
      <FAQ />
      <AppSection />
      <Footer />
    </div>
  );
}
