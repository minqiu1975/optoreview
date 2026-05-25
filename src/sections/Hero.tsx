import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileUp, ListOrdered, ChevronDown, ArrowRight } from 'lucide-react';
import gsap from 'gsap';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // GSAP word-by-word animation for the title
    if (!heroRef.current) return;
    const words = heroRef.current.querySelectorAll('.hero-word');
    gsap.fromTo(
      words,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.12,
        ease: 'expo.out',
        delay: 0.4,
      }
    );
  }, []);

  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const titleWords1 = ['投稿之前，先听'];
  const titleWords2 = ['审稿人怎么说'];

  return (
    <section
      ref={heroRef}
      className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden px-6 md:px-12"
      style={{ background: 'var(--color-bg-base)', paddingTop: '64px' }}
    >
      {/* Background decorative animations */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* SVG Ripple 1 */}
        <svg className="absolute" style={{ left: '10%', bottom: '30%' }} width="800" height="800" viewBox="0 0 800 800">
          <circle cx="400" cy="400" r="50" fill="none" stroke="var(--color-primary)" strokeWidth="1" opacity="0">
            <animate attributeName="r" values="50;400" dur="6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.08;0" dur="6s" repeatCount="indefinite" />
          </circle>
        </svg>
        {/* SVG Ripple 2 */}
        <svg className="absolute" style={{ right: '10%', top: '20%' }} width="800" height="800" viewBox="0 0 800 800">
          <circle cx="400" cy="400" r="50" fill="none" stroke="var(--color-primary)" strokeWidth="1" opacity="0">
            <animate attributeName="r" values="50;400" dur="6s" begin="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.08;0" dur="6s" begin="3s" repeatCount="indefinite" />
          </circle>
        </svg>
        {/* Floating gradient orb */}
        <div
          className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full animate-float pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(14,107,94,0.06) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-[900px]">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.2 }}
          className="flex items-center gap-2 mb-6"
        >
          <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: 'var(--color-primary)' }} />
          <span className="text-[13px] font-medium tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            Powered by domain-specific AI
          </span>
        </motion.div>

        {/* Title */}
        <h1 className="font-display text-[28px] md:text-[48px] font-bold leading-[1.15] tracking-[-0.02em]">
          <span className="hero-word inline-block" style={{ color: 'var(--color-text-primary)' }}>
            {titleWords1[0]}
          </span>
          <br />
          <span className="hero-word inline-block" style={{ color: 'var(--color-primary)' }}>
            {titleWords2[0]}
          </span>
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOutExpo, delay: 1.2 }}
          className="mt-5 text-base md:text-lg font-normal leading-[1.7] max-w-[640px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          针对光学、光电子学与光学工程领域的 AI 顶刊编辑预审服务。
          <br className="hidden md:block" />
          上传文稿，获取资深编辑视角的深度评价、尖锐质疑与完善建议。
        </motion.p>

        {/* Creator attribution */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOutExpo, delay: 1.4 }}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full"
          style={{ background: 'var(--color-primary-light)', border: '1px solid var(--color-primary)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-primary)' }} />
          <span className="text-[13px] font-medium" style={{ color: 'var(--color-primary)' }}>
            西湖大学仇旻教授用 Kimi AI 工具产生本网站
          </span>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOutExpo, delay: 1.5 }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-9"
        >
          <button
            onClick={() => scrollTo('#app-section')}
            className="flex items-center gap-2 text-base font-medium text-white px-7 py-3 rounded-lg transition-all duration-250 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: 'linear-gradient(180deg, #0E6B5E 0%, #0A5248 100%)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
          >
            <FileUp size={18} />
            立即开始分析
            <ArrowRight size={18} />
          </button>
          <button
            onClick={() => scrollTo('#workflow')}
            className="flex items-center gap-2 text-base font-medium px-6 py-3 rounded-lg border transition-all duration-250 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              color: 'var(--color-text-primary)',
              borderColor: 'var(--color-border)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.background = 'var(--color-bg-input)';
              el.style.borderColor = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.background = 'transparent';
              el.style.borderColor = 'var(--color-border)';
            }}
          >
            <ListOrdered size={18} />
            了解工作流程
          </button>
        </motion.div>
      </div>

      {/* Scroll chevron */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
        onClick={() => scrollTo('#workflow')}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-scroll-chevron focus:outline-none"
        style={{ color: 'var(--color-text-muted)' }}
        aria-label="Scroll down"
      >
        <ChevronDown size={20} />
      </motion.button>
    </section>
  );
}
