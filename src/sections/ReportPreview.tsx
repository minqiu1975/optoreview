import { useRef } from 'react';
import { CheckCircle, AlertTriangle, Lightbulb, FileText } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const reports = [
  {
    title: '评价报告',
    label: 'EVALUATION',
    icon: CheckCircle,
    color: '#0E6B5E',
    desc: '模拟顶刊资深编辑视角，通过调研相关历史文献，评估稿件的创新贡献与学术价值，并推荐最适合投稿的期刊层级。',
    features: [
      '评估创新点与学术贡献',
      '对标历史文献分析差距',
      '推荐目标期刊层级（综合顶刊 / 大子刊 / 小子刊 / 本领域顶刊 / 其他期刊）',
      '给出录用可能性评估',
    ],
    checkColor: '#0E6B5E',
  },
  {
    title: '质疑报告',
    label: 'CRITIQUE',
    icon: AlertTriangle,
    color: '#8B5E34',
    desc: '模拟特别尖锐的专业审稿人，从创新不足、欠缺内容、论证漏洞、结论过度推导等角度提出尖锐质疑。',
    features: [
      '质疑创新点是否充分',
      '指出实验/理论的不足之处',
      '挑战过分或缺乏支撑的结论',
      '提出关键性的技术问题',
    ],
    checkColor: '#8B5E34',
  },
  {
    title: '完善建议',
    label: 'IMPROVEMENT',
    icon: Lightbulb,
    color: '#2E5A8C',
    desc: '针对质疑报告中的每个问题，给出具体可行的完善方案，帮助作者逐一击破审稿人的关注点。',
    features: [
      '针对每条质疑给出回应策略',
      '建议补充实验或理论推导',
      '推荐可引用的关键文献',
      '提供结论表述的修改建议',
    ],
    checkColor: '#2E5A8C',
  },
];

export default function ReportPreview() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;
    const cards = sectionRef.current.querySelectorAll('.report-card');
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
      id="reports"
      ref={sectionRef}
      className="py-20 md:py-[80px] px-6 md:px-12"
      style={{ background: 'var(--color-bg-base)' }}
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Title */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: 'var(--color-primary-light)' }}>
            <FileText size={14} style={{ color: 'var(--color-primary)' }} />
            <span className="text-[12px] font-semibold tracking-wide" style={{ color: 'var(--color-primary)' }}>THREE PERSPECTIVES</span>
          </div>
          <h2 className="text-[26px] md:text-[36px] font-bold tracking-[-0.01em] section-title-accent" style={{ color: 'var(--color-text-primary)' }}>
            三份报告，三重视角
          </h2>
          <p className="mt-4 text-base" style={{ color: 'var(--color-text-muted)' }}>
            从资深编辑的鼓励到审稿人的尖锐质疑，全面预判你的稿件命运
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reports.map((report, idx) => {
            const Icon = report.icon;
            return (
              <div
                key={report.label}
                className="report-card rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 group"
                style={{
                  background: 'var(--color-bg-panel)',
                  borderTop: `3px solid ${report.color}`,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px rgba(0,0,0,0.10), 0 0 0 1px ${report.color}15, 0 4px 20px ${report.color}10`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
                }}
              >
                {/* Header with icon and label */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ background: `${report.color}12` }}>
                      <Icon size={20} style={{ color: report.color }} />
                    </div>
                    <span
                      className="text-[11px] font-semibold tracking-[0.08em] px-2 py-0.5 rounded"
                      style={{ color: report.color, background: `${report.color}10` }}
                    >
                      {report.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold" style={{ color: `${report.color}60` }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="text-[22px] font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  {report.title}
                </h3>
                <p className="text-[15px] leading-[1.7] mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                  {report.desc}
                </p>

                {/* Divider */}
                <div className="h-px w-full mb-5" style={{ background: 'var(--color-border-light)' }} />

                {/* Feature list */}
                <ul className="space-y-3">
                  {report.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${report.color}12` }}>
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                          <path d="M3.5 8L6.5 11L12.5 5" stroke={report.checkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
