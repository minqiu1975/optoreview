import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const footerColumns = [
  {
    title: '产品',
    links: ['文稿预审', '报告解读', 'API 接口', '定价方案'],
  },
  {
    title: '资源',
    links: ['使用指南', '常见问题', '更新日志', '反馈建议'],
  },
  {
    title: '关于',
    links: ['关于我们', '联系我们', '隐私政策', '服务条款'],
  },
];

export default function Footer() {
  const footerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!footerRef.current) return;
    const items = footerRef.current.querySelectorAll('.footer-item');
    gsap.fromTo(
      items,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 90%',
          once: true,
        },
      }
    );
  }, { scope: footerRef });

  return (
    <footer
      ref={footerRef}
      className="py-16 px-6 md:px-12"
      style={{ background: 'var(--color-text-primary)' }}
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
          {/* Column 1 - Logo */}
          <div className="footer-item">
            <div className="flex items-center gap-2.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <span className="font-display text-xl font-bold text-white">
                OptoReview
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed max-w-[240px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
              面向光学领域科研工作者的 AI 顶刊预审平台
            </p>
          </div>

          {/* Columns 2-4 */}
          {footerColumns.map((col) => (
            <div key={col.title} className="footer-item">
              <h4
                className="text-sm font-semibold tracking-wider mb-4"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <button
                      className="text-sm transition-colors duration-200 focus:outline-none"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            &copy; 2025 OptoReview. 西湖大学仇旻教授用 Kimi AI 工具产生本网站
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Made with care for the optics community
          </p>
        </div>
      </div>
    </footer>
  );
}
