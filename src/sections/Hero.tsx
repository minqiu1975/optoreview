import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { FileUp, ListOrdered, ChevronDown, ArrowRight, Sparkles } from 'lucide-react';
import gsap from 'gsap';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* Particle system */
interface Particle {
  x: number;
  y: number;
  r: number;
  dx: number;
  dy: number;
  opacity: number;
}

function initParticles(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let animId = 0;
  const particles: Particle[] = [];
  const PARTICLE_COUNT = 40;
  const PRIMARY = '14, 107, 94';

  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3 - 0.1,
      opacity: Math.random() * 0.25 + 0.05,
    });
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${PRIMARY}, ${p.opacity})`;
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${PRIMARY}, ${0.06 * (1 - dist / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(draw);
  }
  draw();

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
  };
}

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  useEffect(() => {
    if (!canvasRef.current) return;
    const cleanup = initParticles(canvasRef.current);
    return cleanup;
  }, []);

  const navigate = useNavigate();

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
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      />

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
        {/* Light rays */}
        <div className="absolute top-0 left-1/4 w-px h-[40%] pointer-events-none"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(14,107,94,0.08) 50%, transparent)' }} />
        <div className="absolute top-[10%] right-1/3 w-px h-[30%] pointer-events-none"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(14,107,94,0.05) 50%, transparent)' }} />
        {/* Decorative dots grid */}
        <div className="absolute bottom-[15%] left-[8%] grid grid-cols-4 gap-3 opacity-[0.08]">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-[var(--color-primary)]" />
          ))}
        </div>
        <div className="absolute top-[20%] right-[8%] grid grid-cols-3 gap-3 opacity-[0.06]">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-[var(--color-primary)]" />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-[900px]">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.2 }}
          className="flex items-center gap-2.5 mb-6 px-4 py-2 rounded-full"
          style={{ background: 'var(--color-primary-light)', border: '1px solid rgba(14,107,94,0.15)' }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--color-primary)' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--color-primary)' }} />
          </span>
          <span className="text-[13px] font-medium tracking-wide" style={{ color: 'var(--color-primary)' }}>
            Powered by domain-specific AI
          </span>
        </motion.div>

        {/* Title */}
        <h1 className="font-display text-[28px] md:text-[48px] font-bold leading-[1.15] tracking-[-0.02em]">
          <span className="hero-word inline-block" style={{ color: 'var(--color-text-primary)' }}>
            {titleWords1[0]}
          </span>
          <br />
          <span className="hero-word inline-block text-gradient" style={{ color: 'var(--color-primary)' }}>
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
          style={{ background: 'var(--color-primary-light)', border: '1px solid rgba(14,107,94,0.2)' }}
        >
          <Sparkles size={13} style={{ color: 'var(--color-primary)' }} />
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
            onClick={() => navigate('/analyze')}
            className="btn-premium flex items-center gap-2 text-base font-medium text-white px-7 py-3 rounded-lg transition-transform duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderRadius: '12px' }}
          >
            <FileUp size={18} />
            立即开始分析
            <ArrowRight size={18} />
          </button>
          <button
            onClick={() => navigate('/workflow')}
            className="flex items-center gap-2 text-base font-medium px-6 py-3 rounded-xl border transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              color: 'var(--color-text-primary)',
              borderColor: 'var(--color-border)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.background = 'var(--color-bg-panel)';
              el.style.borderColor = 'var(--color-primary)';
              el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.background = 'transparent';
              el.style.borderColor = 'var(--color-border)';
              el.style.boxShadow = 'none';
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
        onClick={() => scrollTo('#explore')}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-scroll-chevron focus:outline-none p-2 rounded-full transition-colors duration-200 hover:bg-[var(--color-primary-light)]"
        style={{ color: 'var(--color-text-muted)' }}
        aria-label="Scroll down"
      >
        <ChevronDown size={20} />
      </motion.button>
    </section>
  );
}
