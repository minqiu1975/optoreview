import { useRef } from 'react';
import { Upload, Sparkles, FileText, ChevronRight } from 'lucide-react';
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
  },
  {
    num: '02',
    title: 'AI 深度研读',
    desc: '模拟光学领域顶刊资深编辑与尖锐审稿人视角，系统检索相关历史文献，逐段分析论证逻辑、评估创新贡献、识别潜在问题。',
    tip: '',
    icon: Sparkles,
  },
  {
    num: '03',
    title: '获取三份报告',
    desc: '顺序生成评价、质疑与完善建议三份结构化报告。支持 Markdown 格式导出，可直接用于修改稿件。',
    tip: '',
    icon: FileText,
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
          <h2 className="text-[26px] md:text-[36px] font-bold tracking-[-0.01em]" style={{ color: 'var(--color-text-primary)' }}>
            三步完成预审
          </h2>
          <p className="mt-3 text-base" style={{ color: 'var(--color-text-muted)' }}>
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
                className="workflow-card relative rounded-2xl border p-8 transition-all duration-250 hover:-translate-y-0.5"
                style={{
                  background: 'var(--color-bg-base)',
                  borderColor: 'var(--color-border)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                }}
              >
                {/* Step number + icon */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--color-primary-light)' }}
                  >
                    <Icon size={24} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <span
                    className="text-[13px] font-semibold tracking-[0.05em]"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {step.num}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  {step.title}
                </h3>
                <p className="text-[15px] leading-[1.7]" style={{ color: 'var(--color-text-secondary)' }}>
                  {step.desc}
                </p>
                {step.tip && (
                  <p className="mt-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {step.tip}
                  </p>
                )}

                {/* Connector arrow (desktop only, between cards) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-6 h-6 rounded-full"
                    style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
                  >
                    <ChevronRight size={12} style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
