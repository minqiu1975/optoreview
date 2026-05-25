import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: 50, suffix: '+', label: '覆盖顶级光学期刊', sublabel: 'Nature Photonics, Light: Science & Applications, Optica 等' },
  { value: 10000, suffix: '+', label: '文稿已分析', sublabel: '来自全球 80+ 个国家与地区的研究者' },
  { value: 3, suffix: '', label: '份结构化报告', sublabel: '评价 · 质疑 · 完善建议，全方位预判' },
];

function AnimatedNumber({ value, suffix, triggered }: { value: number; suffix: string; triggered: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!triggered) return;
    let start = 0;
    const duration = 2000;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-expo approx
      start = Math.floor(eased * value);
      setDisplay(start);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [triggered, value]);

  const formatted = value >= 10000
    ? display.toLocaleString()
    : display.toString();

  return (
    <span className="text-[36px] md:text-[42px] font-bold" style={{ color: 'var(--color-primary)' }}>
      {formatted}{suffix}
    </span>
  );
}

export default function Trust() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  useGSAP(() => {
    if (!sectionRef.current) return;
    const items = sectionRef.current.querySelectorAll('.trust-item');

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 85%',
      once: true,
      onEnter: () => setTriggered(true),
    });

    gsap.fromTo(
      items,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.1,
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
      ref={sectionRef}
      className="py-16 md:py-[64px] px-6 md:px-12"
      style={{ background: 'var(--color-bg-panel)' }}
    >
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        {stats.map((stat) => (
          <div key={stat.label} className="trust-item text-center">
            <AnimatedNumber value={stat.value} suffix={stat.suffix} triggered={triggered} />
            <p className="mt-2 text-[15px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {stat.label}
            </p>
            <p className="mt-1 text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
              {stat.sublabel}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
