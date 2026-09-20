import { useRef, type ReactNode } from "react";
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
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent sm:tracking-[0.28em]">{kicker}</p>
      <h1 className="mt-3 text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">{title}</h1>
      {children ? <div className="mt-3 max-w-2xl text-base leading-relaxed text-mute">{children}</div> : null}
    </header>
  );
}

export function MagneticLink({ to, children }: { to: string; children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduced = usePrefersReducedMotion();

  return (
    <Link
      ref={ref}
      to={to}
      className="magnetic-cta inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-full bg-accent px-7 py-4 text-base font-semibold tracking-wide text-white shadow-glow transition-[filter,box-shadow,transform] duration-300 hover:brightness-125 hover:shadow-[0_0_32px_rgba(124,107,255,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 sm:w-auto sm:px-10"
      onMouseMove={(e) => {
        if (reduced || window.matchMedia("(pointer: coarse)").matches || !ref.current) return;
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

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="mt-10 rounded-3xl border border-white/[0.08] bg-[#121218]/70 px-6 py-14 text-center">
      <p className="text-xl font-semibold">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-mute">{body}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
