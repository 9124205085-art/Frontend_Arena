import { TYPE_COLOR } from "../utils/constants";
import { RECEIPT_TYPES } from "../data/types";

const ORBS = Array.from({ length: 18 }, (_, i) => {
  const type = RECEIPT_TYPES[i % RECEIPT_TYPES.length];
  const left = 8 + ((i * 17) % 84);
  const top = 10 + ((i * 29) % 72);
  const size = 8 + (i % 5) * 5;
  const delay = (i % 7) * 0.4;
  return { type, left, top, size, delay };
});

export default function MemoryFallback() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,107,255,0.22),_transparent_58%)]" />
      <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/25 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-glow" />
      {ORBS.map((o, i) => (
        <span
          key={i}
          className="absolute rounded-[3px] opacity-70 shadow-glow animate-drift"
          style={{
            left: `${o.left}%`,
            top: `${o.top}%`,
            width: o.size,
            height: o.size * 1.25,
            background: TYPE_COLOR[o.type],
            animationDelay: `${o.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
