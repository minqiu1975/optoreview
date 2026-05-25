import { useRef } from 'react';
import { Upload, Sparkles, FileText, ChevronRight, Zap } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    num: '01',
    title: '上传文稿',
    desc: '支持 PDF 与 Word 格式，单文件最大 100MB。系统会自动提取文稿标题、摘要与正文内容。',
    tip: 'Drag & Drop 或点击上传',
    icon: Upload,
    color: '#0E6B5E',
  },
  {
    num: '02',
    title: 'AI 深度研读',
    desc: '模拟光学领域顶刊资深编辑与尖锐审稿人视角，系统检索相关历史文献，逐段分析论证逻辑、评估创新贡献、识别潜在问题。',
    tip: '多模型并行分析',
    icon: Sparkles,
    color: '#8B5E34',
  },
  {
    num: '03',
    title: '获取三份报告',
    desc: '顺序生成评价、质疑与完善建议三份结构化报告。支持 Markdown 格式导出，可直接用于修改稿件。',
    tip: '平均耗时 2-3 分钟',
    icon: FileText,
    color: '#2E5A8C',
  },
];

export default function Workflow() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;
    const cards = sectionRef.current.querySelectorAll('.workflow-card');
    gsap.fromTo(
      cards,
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
    <section
      id="workflow"
      ref={sectionRef}
      className="py-20 md:py-[80px] px-6 md:px-12"
      style={{ background: 'var(--color-bg-panel)' }}
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Section title */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: 'var(--color-primary-light)' }}>
            <Zap size={14} style={{ color: 'var(--color-primary)' }} />
            <span className="text-[12px] font-semibold tracking-wide" style={{ color: 'var(--color-primary)' }}>SIMPLE PROCESS</span>
          </div>
          <h2 className="text-[26px] md:text-[36px] font-bold tracking-[-0.01em] section-title-accent" style={{ color: 'var(--color-text-primary)' }}>
            三步完成预审
          </h2>
          <p className="mt-4 text-base" style={{ color: 'var(--color-text-muted)' }}>
            从上传到获取报告，全程不超过 5 分钟
          </p>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="workflow-card relative rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 group"
                style={{
                  background: 'var(--color-bg-base)',
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
                {/* Top accent line */}
                <div className="absolute top-0 left-8 right-8 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent, ${step.color}, transparent)` }} />

                {/* Step number + icon */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rounded-2xl"
                    style={{ background: `${step.color}12` }}
                  >
                    <Icon size={24} style={{ color: step.color }} />
                  </div>
                  <div className="flex flex-col">
                    <span
                      className="text-[20px] font-bold leading-none"
                      style={{ color: step.color }}
                    >
                      {step.num}
                    </span>
                    <span className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      STEP
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  {step.title}
                </h3>
                <p className="text-[15px] leading-[1.7]" style={{ color: 'var(--color-text-secondary)' }}>
                  {step.desc}
                </p>
                {step.tip && (
                  <div className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-bg-panel)' }}>
                    <Zap size={12} style={{ color: 'var(--color-text-muted)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                      {step.tip}
                    </span>
                  </div>
                )}

                {/* Connector arrow (desktop only, between cards) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-10 h-10 rounded-full"
                    style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  >
                    <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom progress bar */}
        <div className="mt-12 max-w-[400px] mx-auto">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, i) => (
              <div key={step.num} className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: step.color }}>
                  {i + 1}
                </div>
                <span className="text-[11px] font-medium hidden sm:block" style={{ color: 'var(--color-text-muted)' }}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-border-light)' }}>
            <div className="h-full rounded-full" style={{ width: '100%', background: 'linear-gradient(90deg, #0E6B5E 0%, #8B5E34 50%, #2E5A8C 100%)' }} />
          </div>
        </div>
      </div>
    </section>
  );
}
