import { TYPE_COLOR, TYPE_LABEL } from "../utils/constants";
import { formatDay } from "../utils/format";
import type { Receipt } from "../data/types";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

export default function MomentCard({
  receipt,
  onOpen,
  connections = 0,
}: {
  receipt: Receipt;
  onOpen: () => void;
  connections?: number;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseMove={(e) => {
        if (reduced || window.matchMedia("(pointer: coarse)").matches) return;
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${-py * 5}deg) rotateY(${px * 7}deg) translateY(-3px)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
      }}
      className="glow-border glass-card group min-h-11 w-full rounded-2xl p-4 text-left transition-[transform,box-shadow] duration-300 will-change-transform"
    >
      <span
        className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-ink"
        style={{ background: TYPE_COLOR[receipt.type] }}
      >
        {TYPE_LABEL[receipt.type]}
      </span>
      <h3 className="mt-3 text-lg font-semibold leading-tight tracking-tight">{receipt.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-mute">{receipt.description}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.14em] text-mute">
        {formatDay(receipt.timestamp)}
        {receipt.location ? ` · ${receipt.location}` : ""}
      </p>
      {receipt.tags.length > 0 && (
        <p className="mt-2 line-clamp-1 text-xs text-mute/80">{receipt.tags.slice(0, 3).join(" · ")}</p>
      )}
      <p className="mt-3 text-sm font-semibold text-accent">
        Show on network →
        <span className="ml-2 font-medium text-mute">
          {connections} linked
        </span>
      </p>
    </button>
  );
}
