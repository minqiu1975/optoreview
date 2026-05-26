import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Sparkles, FileText, ChevronRight, Zap, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useNavigate } from 'react-router';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    num: '01',
    title: '上传文稿',
    desc: '支持 PDF (.pdf) 和 Microsoft Word (.doc, .docx) 格式。文件大小不超过 100MB。系统会自动提取文稿标题、摘要与正文内容，无需手动输入任何信息。',
    details: [
      '拖拽文件到上传区域或点击选择文件',
      '系统自动识别并提取文稿元数据',
      '支持多语言光学论文',
    ],
    icon: Upload,
    color: '#0E6B5E',
  },
  {
    num: '02',
    title: 'AI 深度研读',
    desc: '模拟光学领域顶刊资深编辑与尖锐审稿人视角，系统检索相关历史文献，逐段分析论证逻辑、评估创新贡献、识别潜在问题。整个过程采用多模型并行分析确保全面性。',
    details: [
      '检索 50+ 年历史文献数据库',
      '逐段分析论证逻辑与创新性',
      '多模型交叉验证分析结果',
    ],
    icon: Sparkles,
    color: '#8B5E34',
  },
  {
    num: '03',
    title: '获取三份报告',
    desc: '顺序生成评价、质疑与完善建议三份结构化报告。三份报告之间具有逻辑递进关系，支持 Markdown 格式导出，可直接用于修改稿件。',
    details: [
      '评价报告 — 评估创新与期刊推荐',
      '质疑报告 — 尖锐审稿人视角',
      '完善建议 — 逐条回应策略',
    ],
    icon: FileText,
    color: '#2E5A8C',
  },
];

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function WorkflowPage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useGSAP(() => {
    if (!sectionRef.current) return;
    const items = sectionRef.current.querySelectorAll('.workflow-step');
    gsap.fromTo(
      items,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.15,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
          once: true,
        },
      }
    );
  }, { scope: sectionRef });

  return (
    <div className="min-h-[100dvh]" style={{ background: 'var(--color-bg-base)' }}>
      <Navbar />

      {/* Page Header */}
      <section className="pt-32 pb-12 px-6 md:px-12" style={{ background: 'var(--color-bg-panel)' }}>
        <div className="max-w-[1200px] mx-auto">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors duration-200 hover:text-[var(--color-primary)]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <ArrowLeft size={16} />
            返回首页
          </button>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: 'var(--color-primary-light)' }}>
              <Zap size={14} style={{ color: 'var(--color-primary)' }} />
              <span className="text-[12px] font-semibold tracking-wide" style={{ color: 'var(--color-primary)' }}>WORKFLOW</span>
            </div>
            <h1 className="text-[32px] md:text-[42px] font-bold tracking-[-0.02em]" style={{ color: 'var(--color-text-primary)' }}>
              三步完成<span style={{ color: 'var(--color-primary)' }}>预审</span>
            </h1>
            <p className="mt-4 text-lg max-w-[640px]" style={{ color: 'var(--color-text-secondary)' }}>
              从上传文稿到获取三份专业报告，全程不超过 5 分钟
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section ref={sectionRef} className="py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-[1200px] mx-auto space-y-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="workflow-step rounded-2xl border p-8 md:p-10 transition-all duration-300 hover:-translate-y-0.5 group"
                style={{
                  background: 'var(--color-bg-panel)',
                  borderColor: 'var(--color-border)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px rgba(0,0,0,0.10), 0 0 0 1px ${step.color}20`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${step.color}40`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                }}
              >
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  {/* Left: Number + Icon */}
                  <div className="flex items-center gap-4 md:flex-col md:items-center md:gap-3 shrink-0">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ background: `${step.color}12` }}>
                      <Icon size={28} style={{ color: step.color }} />
                    </div>
                    <span className="text-[28px] font-bold" style={{ color: `${step.color}30` }}>
                      {step.num}
                    </span>
                  </div>

                  {/* Right: Content */}
                  <div className="flex-1">
                    <h3 className="text-[22px] font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                      {step.title}
                    </h3>
                    <p className="text-[15px] leading-[1.7] mb-5" style={{ color: 'var(--color-text-secondary)' }}>
                      {step.desc}
                    </p>
                    <ul className="space-y-2.5">
                      {step.details.map((d) => (
                        <li key={d} className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${step.color}12` }}>
                            <CheckCircle size={12} style={{ color: step.color }} />
                          </div>
                          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Arrow connector */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:flex absolute -bottom-6 left-1/2 -translate-x-1/2 z-10">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.4 }}
            className="text-center pt-8"
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

      <Footer />
    </div>
  );
}
