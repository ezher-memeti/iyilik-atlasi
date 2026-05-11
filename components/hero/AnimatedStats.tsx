"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type StatItem = {
  label: string;
  value: number;
};

type AnimatedStatsProps = {
  stats: StatItem[];
};

function AnimatedNumber({ value, start }: { value: number; start: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!start) return;

    let rafId = 0;
    const duration = 1000;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(value * eased));

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [start, value]);

  return <>{display.toLocaleString("tr-TR")}+</>;
}

export function AnimatedStats({ stats }: AnimatedStatsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || hasStarted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasStarted]);

  const safeStats = useMemo(
    () => stats.map((item) => ({ ...item, value: Math.max(0, item.value) })),
    [stats],
  );

  return (
    <div ref={containerRef} className="mx-auto mt-8 w-full max-w-3xl">
      <div className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:pb-0">
        {safeStats.map((stat, index) => (
          <article
            key={stat.label}
            className={`group min-w-[31%] flex-1 rounded-xl border border-divider-softLight bg-surface-pageLight/80 px-3 py-3 text-center shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-soft sm:min-w-0 sm:px-4 sm:py-4 ${
              hasStarted
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0"
            } ${index === 0 ? "delay-0" : index === 1 ? "delay-100" : "delay-200"}`}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-brand-primary/30 transition group-hover:bg-brand-primary/45" />
            <p className="text-xl font-bold tracking-tight text-text-primary sm:text-3xl">
              <AnimatedNumber value={stat.value} start={hasStarted} />
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-text-secondary sm:text-xs sm:tracking-[0.12em]">
              {stat.label}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
