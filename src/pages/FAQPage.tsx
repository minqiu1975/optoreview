import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, FileType, Clock, Shield, Lightbulb, Download, MessageSquare, BookOpen, ArrowLeft, Sparkles, ArrowRight } from 'lucide-react';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';
import { useNavigate } from 'react-router';

const faqs = [
  {
    q: '支持哪些文件格式？',
    a: '目前支持 PDF (.pdf) 和 Microsoft Word (.doc, .docx) 格式。文件大小不超过 100MB。建议上传最终版本的文稿以获取最准确的分析结果。',
    icon: FileType,
  },
  {
    q: '分析需要多长时间？',
    a: '三份报告顺序生成，每份约需 30-60 秒。通常情况下，从点击"开始分析"到获取全部三份报告，总耗时在 2-3 分钟左右。',
    icon: Clock,
  },
  {
    q: '三份报告是按照什么顺序生成的？',
    a: '系统严格按照以下顺序生成：1) 评价报告 — 先完成整体评估与期刊推荐；2) 质疑报告 — 基于评价结果提出尖锐质疑；3) 完善建议 — 针对每条质疑给出具体改进方案。三份报告之间具有逻辑递进关系。',
    icon: BookOpen,
  },
  {
    q: '我的文稿数据安全吗？',
    a: '我们采取严格的数据保护措施。上传的文稿仅用于分析，分析完成后立即从服务器删除，不做任何存储或用于其他用途。整个传输过程采用 HTTPS 加密。',
    icon: Shield,
  },
  {
    q: '可以分析非光学领域的文稿吗？',
    a: 'OptoReview 专为光学、光电子学与光学工程领域设计。虽然系统可以分析其他领域的文稿，但评估的准确性和文献调研的深度可能有限。',
    icon: Lightbulb,
  },
  {
    q: '报告可以导出吗？',
    a: '可以。每份报告支持 Markdown 格式导出，方便您在本地编辑和保存。后续版本还将支持 PDF 导出功能。',
    icon: Download,
  },
  {
    q: '分析结果是否可以直接用于回复审稿人？',
    a: '完善建议报告中的策略和思路可以作为参考，但建议您根据实际收到的审稿意见进行调整。质疑报告可以帮助您预判可能被问到的问题，提前准备回应。',
    icon: MessageSquare,
  },
];

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function FAQPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh]" style={{ background: 'var(--color-bg-base)' }}>
      <Navbar />

      {/* Page Header */}
      <section className="pt-32 pb-12 px-6 md:px-12" style={{ background: 'var(--color-bg-panel)' }}>
        <div className="max-w-[800px] mx-auto">
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
              <HelpCircle size={14} style={{ color: 'var(--color-primary)' }} />
              <span className="text-[12px] font-semibold tracking-wide" style={{ color: 'var(--color-primary)' }}>FAQ</span>
            </div>
            <h1 className="text-[32px] md:text-[42px] font-bold tracking-[-0.02em]" style={{ color: 'var(--color-text-primary)' }}>
              常见<span style={{ color: 'var(--color-primary)' }}>问题</span>
            </h1>
            <p className="mt-4 text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              关于 OptoReview 的常见疑问解答
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-[800px] mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => {
              const Icon = faq.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: easeOutExpo, delay: i * 0.06 }}
                >
                  <AccordionItem
                    value={`faq-${i}`}
                    className="rounded-xl border px-0 overflow-hidden transition-all duration-300 data-[state=open]:border-[var(--color-primary-light)] data-[state=open]:shadow-md group"
                    style={{ background: 'var(--color-bg-panel)', borderColor: 'var(--color-border)' }}
                  >
                    <AccordionTrigger className="px-5 py-5 text-base font-medium hover:no-underline focus:outline-none transition-colors duration-200" style={{ color: 'var(--color-text-primary)' }}>
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 group-data-[state=open]:bg-[var(--color-primary-light)]"
                          style={{ background: 'var(--color-bg-input)' }}>
                          <Icon size={15} className="transition-colors duration-200 group-data-[state=open]:text-[var(--color-primary)]" style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                        <span>{faq.q}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5 pl-[52px] text-[15px] leading-[1.7]" style={{ color: 'var(--color-text-secondary)' }}>
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              );
            })}
          </Accordion>

          {/* Still have questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.5 }}
            className="mt-12 text-center rounded-2xl border p-8"
            style={{ background: 'var(--color-bg-panel)', borderColor: 'var(--color-border)' }}
          >
            <HelpCircle size={32} className="mx-auto mb-4" style={{ color: 'var(--color-primary)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              还有其他问题？
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              直接开始使用，体验 OptoReview 的全部功能
            </p>
            <button
              onClick={() => navigate('/analyze')}
              className="btn-premium inline-flex items-center gap-2 text-sm font-medium text-white px-6 py-2.5 rounded-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <Sparkles size={16} />
              立即开始分析
              <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
