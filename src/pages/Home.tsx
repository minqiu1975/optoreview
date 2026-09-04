import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Upload, Sparkles, FileText, HelpCircle, ArrowRight, BookOpen } from 'lucide-react';
import Navbar from '@/sections/Navbar';
import Hero from '@/sections/Hero';
import Trust from '@/sections/Trust';
import Footer from '@/sections/Footer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

const pageCards = [
  {
    title: '上传文稿',
    desc: '支持 PDF 与 Word 格式，单文件最大 100MB。系统自动提取标题、摘要与正文。',
    icon: Upload,
    color: '#0E6B5E',
    path: '/analyze',
    label: '开始分析',
  },
  {
    title: 'AI 深度研读',
    desc: '模拟顶刊资深编辑与尖锐审稿人视角，逐段分析论证逻辑、评估创新贡献。',
    icon: Sparkles,
    color: '#8B5E34',
    path: '/workflow',
    label: '了解流程',
  },
  {
    title: '获取三份报告',
    desc: '评价、质疑与完善建议三份结构化报告。支持 Markdown 格式导出。',
    icon: FileText,
    color: '#2E5A8C',
    path: '/reports',
    label: '查看报告',
  },
  {
    title: '常见问题',
    desc: '关于文件格式、分析时长、数据安全、使用技巧等常见疑问解答。',
    icon: HelpCircle,
    color: '#6B5E8B',
    path: '/faq',
    label: '了解更多',
  },
];

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function Home() {
  const navigate = useNavigate();
  const cardsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!cardsRef.current) return;
    const cards = cardsRef.current.querySelectorAll('.page-card');
    gsap.fromTo(
      cards,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.12,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: cardsRef.current,
          start: 'top 85%',
          once: true,
        },
      }
    );
  }, { scope: cardsRef });

  return (
    <div className="min-h-[100dvh]" style={{ background: 'var(--color-bg-base)' }}>
      <Navbar />
      <Hero />

      {/* Page Navigation Cards */}
      <section id="explore" ref={cardsRef} className="py-20 md:py-[80px] px-6 md:px-12" style={{ background: 'var(--color-bg-panel)' }}>
        <div className="max-w-[1200px] mx-auto">
          {/* Section header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: 'var(--color-primary-light)' }}>
              <BookOpen size={14} style={{ color: 'var(--color-primary)' }} />
              <span className="text-[12px] font-semibold tracking-wide" style={{ color: 'var(--color-primary)' }}>EXPLORE</span>
            </div>
            <h2 className="text-[26px] md:text-[36px] font-bold tracking-[-0.01em] section-title-accent" style={{ color: 'var(--color-text-primary)' }}>
              开始使用
            </h2>
            <p className="mt-4 text-base" style={{ color: 'var(--color-text-muted)' }}>
              选择你需要的服务，开启光学论文预审之旅
            </p>
          </div>

          {/* 2x2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[900px] mx-auto">
            {pageCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.button
                  key={card.path}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.1 * i }}
                  onClick={() => navigate(card.path)}
                  className="page-card text-left rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden"
                  style={{
                    background: 'var(--color-bg-base)',
                    borderColor: 'var(--color-border)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px rgba(0,0,0,0.10), 0 0 0 1px ${card.color}25`;
                    (e.currentTarget as HTMLElement).style.borderColor = `${card.color}40`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                  }}
                >
                  {/* Top accent line */}
                  <div className="absolute top-0 left-7 right-7 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(90deg, transparent, ${card.color}, transparent)` }} />

                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ background: `${card.color}12` }}>
                      <Icon size={24} style={{ color: card.color }} />
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0"
                      style={{ color: card.color }}>
                      {card.label}
                      <ArrowRight size={16} />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    {card.title}
                  </h3>
                  <p className="text-[15px] leading-[1.7]" style={{ color: 'var(--color-text-secondary)' }}>
                    {card.desc}
                  </p>
                </motion.button>
              );
            })}
          </div>

          {/* CTA banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.6 }}
            className="mt-12 text-center"
          >
            <button
              onClick={() => navigate('/analyze')}
              className="btn-premium inline-flex items-center gap-2 text-base font-medium text-white px-8 py-3.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              <Sparkles size={18} />
              立即开始分析
              <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>
      </section>

      <Trust />
      <Footer />
    </div>
  );
}
