import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Heart, ExternalLink } from 'lucide-react';
import logoImg from '@/assets/logo-icon.png';

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
              <img src={logoImg} alt="OptoReview" className="w-8 h-8 object-contain" />
              <span className="font-display text-xl font-bold text-white">
                Opto<span className="text-[#5BC9B8]">Review</span>
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed max-w-[240px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
              面向光学领域科研工作者的 AI 顶刊预审平台
            </p>
            <div className="mt-4 flex items-center gap-3">
              {/* GitHub link */}
              <a
                href="https://github.com/minqiu1975/optoreview"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
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
                      className="text-sm transition-all duration-200 focus:outline-none flex items-center gap-1 group"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
                    >
                      {link}
                      <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
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
          <p className="text-[13px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            &copy; 2025 OptoReview. 西湖大学仇旻教授用 Kimi AI 工具产生本网站
          </p>
          <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Made with <Heart size={10} className="text-red-400" /> for the optics community
          </p>
        </div>
      </div>
    </footer>
  );
}
