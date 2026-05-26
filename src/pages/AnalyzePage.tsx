import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, FileUp, Shield, Zap } from 'lucide-react';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';
import AppSection from '@/sections/AppSection';
import { useNavigate } from 'react-router';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function AnalyzePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh]" style={{ background: 'var(--color-bg-base)' }}>
      <Navbar />

      {/* Page Header */}
      <section className="pt-32 pb-8 px-6 md:px-12" style={{ background: 'var(--color-bg-panel)' }}>
        <div className="max-w-[1440px] mx-auto">
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
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: 'var(--color-primary-light)' }}>
                <Sparkles size={14} style={{ color: 'var(--color-primary)' }} />
                <span className="text-[12px] font-semibold tracking-wide" style={{ color: 'var(--color-primary)' }}>ANALYZE</span>
              </div>
              <h1 className="text-[32px] md:text-[42px] font-bold tracking-[-0.02em]" style={{ color: 'var(--color-text-primary)' }}>
                开始<span style={{ color: 'var(--color-primary)' }}>分析</span>
              </h1>
              <p className="mt-2 text-lg max-w-[600px]" style={{ color: 'var(--color-text-secondary)' }}>
                上传你的光学论文，获取三份专业预审报告
              </p>
            </div>
            {/* Quick badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                <FileUp size={12} />
                PDF / Word
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                <Zap size={12} />
                2-3 分钟
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                <Shield size={12} />
                数据安全
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* App Section */}
      <AppSection />

      <Footer />
    </div>
  );
}
