import { useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Lightbulb, FileText, ArrowLeft, ArrowRight, Sparkles, Download, Star } from 'lucide-react';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useNavigate } from 'react-router';

gsap.registerPlugin(ScrollTrigger);

const reports = [
  {
    title: '评价报告',
    label: 'EVALUATION REPORT',
    icon: CheckCircle,
    color: '#0E6B5E',
    bgLight: '#E8F3F1',
    desc: '模拟顶刊资深编辑视角，通过调研相关历史文献，评估稿件的创新贡献与学术价值，并推荐最适合投稿的期刊层级。',
    sections: [
      { title: '创新点评估', desc: '对标领域内近 10 年重要文献，评估研究的新颖性和学术贡献度' },
      { title: '期刊推荐', desc: '根据创新性、影响力、实验完整性综合判断，推荐最适合的投稿目标' },
      { title: '录用可能性', desc: '基于历史数据和相似稿件的审稿结果，给出客观的录用概率评估' },
    ],
    output: [
      '创新点评分（0-10）',
      '对标文献对比分析',
      '目标期刊层级推荐（综合顶刊 / 大子刊 / 小子刊 / 本领域顶刊 / 其他）',
      '整体录用概率评估',
    ],
  },
  {
    title: '质疑报告',
    label: 'CRITIQUE REPORT',
    icon: AlertTriangle,
    color: '#8B5E34',
    bgLight: '#F9F4EF',
    desc: '模拟特别尖锐的专业审稿人，从创新不足、欠缺内容、论证漏洞、结论过度推导等角度提出尖锐质疑。这份报告将帮助你预判真实审稿中可能遇到的最严苛挑战。',
    sections: [
      { title: '创新性质疑', desc: '直指研究创新点是否足够突出，是否存在"me too"研究的嫌疑' },
      { title: '论证漏洞', desc: '挑战实验设计的合理性、数据处理的严谨性、结论推导的逻辑性' },
      { title: '关键缺失', desc: '指出可能被遗漏的关键实验、理论推导或文献引用' },
    ],
    output: [
      '逐条列出质疑点',
      '标注严重等级（致命 / 严重 / 轻微）',
      '给出质疑的理论依据',
      '建议补充的关键实验或论证',
    ],
  },
  {
    title: '完善建议',
    label: 'IMPROVEMENT REPORT',
    icon: Lightbulb,
    color: '#2E5A8C',
    bgLight: '#F0F3F7',
    desc: '针对质疑报告中的每个问题，给出具体可行的完善方案。这份报告将帮助你逐一击破审稿人的关注点，将拒稿风险降至最低。',
    sections: [
      { title: '回应策略', desc: '针对每条质疑给出清晰的回应思路和论证角度' },
      { title: '补充方案', desc: '建议补充的具体实验、仿真或理论推导' },
      { title: '文献推荐', desc: '推荐可引用的关键文献，增强论证说服力' },
    ],
    output: [
      '逐条回应质疑报告',
      '具体可执行的修改建议',
      '推荐引用的关键文献列表',
      '结论表述的优化建议',
    ],
  },
];

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function ReportsPage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useGSAP(() => {
    if (!sectionRef.current) return;
    const cards = sectionRef.current.querySelectorAll('.report-detail');
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
              <FileText size={14} style={{ color: 'var(--color-primary)' }} />
              <span className="text-[12px] font-semibold tracking-wide" style={{ color: 'var(--color-primary)' }}>REPORTS</span>
            </div>
            <h1 className="text-[32px] md:text-[42px] font-bold tracking-[-0.02em]" style={{ color: 'var(--color-text-primary)' }}>
              三份报告，<span style={{ color: 'var(--color-primary)' }}>三重视角</span>
            </h1>
            <p className="mt-4 text-lg max-w-[640px]" style={{ color: 'var(--color-text-secondary)' }}>
              从资深编辑的鼓励到审稿人的尖锐质疑，全面预判你的稿件命运
            </p>
          </motion.div>
        </div>
      </section>

      {/* Report Details */}
      <section ref={sectionRef} className="py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-[1200px] mx-auto space-y-10">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <div
                key={report.label}
                className="report-detail rounded-2xl border p-8 md:p-10 transition-all duration-300 group"
                style={{
                  background: 'var(--color-bg-panel)',
                  borderTop: `4px solid ${report.color}`,
                  borderColor: 'var(--color-border)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px rgba(0,0,0,0.10), 0 4px 20px ${report.color}15`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ background: report.bgLight }}>
                    <Icon size={28} style={{ color: report.color }} />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold tracking-[0.08em] px-2 py-0.5 rounded"
                      style={{ color: report.color, background: `${report.color}10` }}>
                      {report.label}
                    </span>
                    <h2 className="text-[24px] font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>
                      {report.title}
                    </h2>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[15px] leading-[1.7] mb-8 max-w-[800px]" style={{ color: 'var(--color-text-secondary)' }}>
                  {report.desc}
                </p>

                {/* Two-column: sections + output */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Analysis sections */}
                  <div>
                    <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                      <Star size={14} style={{ color: report.color }} />
                      分析维度
                    </h4>
                    <div className="space-y-3">
                      {report.sections.map((s) => (
                        <div key={s.title} className="rounded-xl p-4" style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-light)' }}>
                          <h5 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>{s.title}</h5>
                          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{s.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Output preview */}
                  <div>
                    <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                      <Download size={14} style={{ color: report.color }} />
                      输出内容
                    </h4>
                    <ul className="space-y-2.5">
                      {report.output.map((o) => (
                        <li key={o} className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${report.color}12` }}>
                            <CheckCircle size={10} style={{ color: report.color }} />
                          </div>
                          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.4 }}
            className="text-center pt-6"
          >
            <button
              onClick={() => navigate('/analyze')}
              className="btn-premium inline-flex items-center gap-2 text-base font-medium text-white px-8 py-3.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              <Sparkles size={18} />
              体验三份报告
              <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
