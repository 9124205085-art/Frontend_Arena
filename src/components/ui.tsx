import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

export function PageIntro({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="max-w-3xl">
      <p className="text-[10px] font-semibold uppercase tracking-[0.36em] text-accent">{kicker}</p>
      <h1 className="mt-3 text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">{title}</h1>
      {children ? <div className="mt-3 max-w-2xl text-[15px] leading-relaxed text-mute">{children}</div> : null}
    </header>
  );
}

export function CountUp({ value, className }: { value: number; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const [n, setN] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setN(value);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1100);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);

  return (
    <span className={className} aria-label={String(value)}>
      {n.toLocaleString("en-IN")}
    </span>
  );
}

export function MagneticLink({ to, children }: { to: string; children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduced = usePrefersReducedMotion();

  return (
    <Link
      ref={ref}
      to={to}
      className="magnetic-cta inline-flex items-center rounded-full bg-accent px-8 py-3.5 text-sm font-semibold tracking-wide text-white shadow-glow transition-[filter,box-shadow] duration-300 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      onMouseMove={(e) => {
        if (reduced || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        ref.current.style.transform = `translate(${x * 0.16}px, ${y * 0.16}px)`;
      }}
      onMouseLeave={() => {
        if (ref.current) ref.current.style.transform = "translate(0, 0)";
      }}
    >
      {children}
    </Link>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="glass-card mt-10 rounded-3xl px-6 py-16 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-mute">{body}</p>
    </div>
  );
}
