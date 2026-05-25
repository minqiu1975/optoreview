import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowDown } from 'lucide-react';

const navLinks = [
  { label: '工作流程', href: '#workflow' },
  { label: '报告预览', href: '#reports' },
  { label: '常见问题', href: '#faq' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToApp = () => {
    setMobileOpen(false);
    const el = document.querySelector('#app-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <motion.nav
        initial={{ y: '-100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.2 }}
        className="fixed top-0 left-0 right-0 z-50 h-16"
        style={{
          background: scrolled ? 'rgba(247, 244, 240, 0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
          transition: 'background 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.3s',
        }}
      >
        <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between px-6 md:px-12">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded-lg"
          >
            {/* Lens SVG icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <span className="font-display text-[22px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
              OptoReview
            </span>
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="relative text-[15px] font-medium transition-colors duration-200 focus:outline-none group"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'var(--color-primary)'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'var(--color-text-secondary)'; }}
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-primary)] transition-all duration-200 group-hover:w-full" />
              </button>
            ))}
            <button
              onClick={scrollToApp}
              className="flex items-center gap-1.5 text-sm font-medium text-white px-5 py-2 rounded-lg transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              style={{ background: 'var(--color-primary)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-primary-hover)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-primary)'; }}
            >
              <ArrowDown size={16} />
              开始分析
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 focus:outline-none"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8"
            style={{ background: 'rgba(247, 244, 240, 0.98)', backdropFilter: 'blur(20px)' }}
          >
            <button
              className="absolute top-4 right-4 p-2 focus:outline-none"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
            {navLinks.map((link, i) => (
              <motion.button
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                onClick={() => scrollTo(link.href)}
                className="text-[32px] font-medium focus:outline-none"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {link.label}
              </motion.button>
            ))}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.24, duration: 0.3 }}
              onClick={scrollToApp}
              className="text-[32px] font-medium px-8 py-3 rounded-lg text-white focus:outline-none"
              style={{ background: 'var(--color-primary)' }}
            >
              开始分析
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
