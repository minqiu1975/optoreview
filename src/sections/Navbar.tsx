import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sparkles } from 'lucide-react';

const navLinks = [
  { label: '首页', path: '/' },
  { label: '工作流程', path: '/workflow' },
  { label: '报告预览', path: '/reports' },
  { label: '常见问题', path: '/faq' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const goTo = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <motion.nav
        initial={{ y: '-100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.2 }}
        className="fixed top-0 left-0 right-0 z-50 h-16"
        style={{
          background: scrolled ? 'rgba(247, 244, 240, 0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px) saturate(1.2)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(1.2)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(224, 221, 216, 0.6)' : '1px solid transparent',
          transition: 'background 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.4s',
          boxShadow: scrolled ? '0 1px 20px rgba(0,0,0,0.04)' : 'none',
        }}
      >
        <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between px-6 md:px-12">
          {/* Logo */}
          <button
            onClick={() => goTo('/')}
            className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded-lg group"
          >
            {/* Logo icon - prism + circuit SVG */}
            <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, #0E6B5E 0%, #1a9a88 100%)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
                <line x1="12" y1="22" x2="12" y2="15.5" />
                <line x1="22" y1="8.5" x2="12" y2="15.5" />
                <line x1="2" y1="8.5" x2="12" y2="15.5" />
                <line x1="7" y1="5.5" x2="7" y2="11.5" />
                <line x1="17" y1="5.5" x2="17" y2="11.5" />
                <line x1="7" y1="11.5" x2="12" y2="15.5" />
                <line x1="17" y1="11.5" x2="12" y2="15.5" />
              </svg>
            </div>
            <span className="font-display text-[22px] font-bold transition-colors duration-200" style={{ color: 'var(--color-text-primary)' }}>
              Opto<span style={{ color: 'var(--color-primary)' }}>Review</span>
            </span>
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => goTo(link.path)}
                className="relative px-3 py-2 text-[15px] font-medium transition-colors duration-200 focus:outline-none rounded-lg"
                style={{
                  color: isActive(link.path) ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  background: isActive(link.path) ? 'var(--color-primary-light)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive(link.path)) (e.target as HTMLElement).style.color = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive(link.path)) (e.target as HTMLElement).style.color = 'var(--color-text-secondary)';
                }}
              >
                {link.label}
                {isActive(link.path) && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                    style={{ background: 'var(--color-primary)' }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                  />
                )}
              </button>
            ))}
            <button
              onClick={() => goTo('/analyze')}
              className="btn-premium flex items-center gap-1.5 text-sm font-medium text-white px-5 py-2.5 rounded-lg transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ml-4"
            >
              <Sparkles size={14} />
              开始分析
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 focus:outline-none transition-colors duration-200 rounded-lg"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            style={{ color: 'var(--color-text-primary)' }}
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
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6"
            style={{ background: 'rgba(247, 244, 240, 0.98)', backdropFilter: 'blur(24px)' }}
          >
            <button
              className="absolute top-4 right-4 p-2 focus:outline-none rounded-lg transition-colors duration-200"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              style={{ color: 'var(--color-text-primary)' }}
            >
              <X size={24} />
            </button>
            {/* Logo in mobile menu */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0E6B5E 0%, #1a9a88 100%)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
                  <line x1="12" y1="22" x2="12" y2="15.5" />
                  <line x1="22" y1="8.5" x2="12" y2="15.5" />
                  <line x1="2" y1="8.5" x2="12" y2="15.5" />
                </svg>
              </div>
              <span className="font-display text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Opto<span style={{ color: 'var(--color-primary)' }}>Review</span>
              </span>
            </div>
            {navLinks.map((link, i) => (
              <motion.button
                key={link.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                onClick={() => goTo(link.path)}
                className="text-[24px] font-medium focus:outline-none transition-colors duration-200 px-6 py-2 rounded-xl"
                style={{
                  color: isActive(link.path) ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  background: isActive(link.path) ? 'var(--color-primary-light)' : 'transparent',
                }}
              >
                {link.label}
              </motion.button>
            ))}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.32, duration: 0.3 }}
              onClick={() => goTo('/analyze')}
              className="btn-premium text-[18px] font-medium px-8 py-3 rounded-lg text-white focus:outline-none flex items-center gap-2 mt-2"
            >
              <Sparkles size={18} />
              开始分析
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
