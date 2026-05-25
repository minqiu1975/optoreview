import { useRef } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    q: '支持哪些文件格式？',
    a: '目前支持 PDF (.pdf) 和 Microsoft Word (.doc, .docx) 格式。文件大小不超过 100MB。建议上传最终版本的文稿以获取最准确的分析结果。',
  },
  {
    q: '分析需要多长时间？',
    a: '三份报告顺序生成，每份约需 30-60 秒。通常情况下，从点击"开始分析"到获取全部三份报告，总耗时在 2-3 分钟左右。',
  },
  {
    q: '三份报告是按照什么顺序生成的？',
    a: '系统严格按照以下顺序生成：1) 评价报告 — 先完成整体评估与期刊推荐；2) 质疑报告 — 基于评价结果提出尖锐质疑；3) 完善建议 — 针对每条质疑给出具体改进方案。三份报告之间具有逻辑递进关系。',
  },
  {
    q: '我的文稿数据安全吗？',
    a: '我们采取严格的数据保护措施。上传的文稿仅用于分析，分析完成后立即从服务器删除，不做任何存储或用于其他用途。整个传输过程采用 HTTPS 加密。',
  },
  {
    q: '可以分析非光学领域的文稿吗？',
    a: 'OptoReview 专为光学、光电子学与光学工程领域设计。虽然系统可以分析其他领域的文稿，但评估的准确性和文献调研的深度可能有限。',
  },
  {
    q: '报告可以导出吗？',
    a: '可以。每份报告支持 Markdown 格式导出，方便您在本地编辑和保存。后续版本还将支持 PDF 导出功能。',
  },
  {
    q: '分析结果是否可以直接用于回复审稿人？',
    a: '完善建议报告中的策略和思路可以作为参考，但建议您根据实际收到的审稿意见进行调整。质疑报告可以帮助您预判可能被问到的问题，提前准备回应。',
  },
];

export default function FAQ() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;
    const items = sectionRef.current.querySelectorAll('.faq-item');
    gsap.fromTo(
      items,
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.06,
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
      id="faq"
      ref={sectionRef}
      className="py-20 md:py-[80px] px-6 md:px-12"
      style={{ background: 'var(--color-bg-base)' }}
    >
      <div className="max-w-[800px] mx-auto">
        <h2 className="text-[26px] md:text-[36px] font-bold text-center mb-12" style={{ color: 'var(--color-text-primary)' }}>
          常见问题
        </h2>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="faq-item rounded-xl border px-0 overflow-hidden transition-colors duration-200 data-[state=open]:border-[var(--color-primary-light)]"
              style={{ background: 'var(--color-bg-panel)', borderColor: 'var(--color-border)' }}
            >
              <AccordionTrigger className="px-6 py-5 text-base font-medium hover:no-underline focus:outline-none" style={{ color: 'var(--color-text-primary)' }}>
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-5 text-[15px] leading-[1.7]" style={{ color: 'var(--color-text-secondary)' }}>
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
