import { TYPE_COLOR, TYPE_LABEL } from "../utils/constants";
import { formatDay } from "../utils/format";
import type { Receipt } from "../data/types";

export default function MomentCard({
  receipt,
  onOpen,
  connections = 0,
}: {
  receipt: Receipt;
  onOpen: () => void;
  connections?: number;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="glow-border group w-full rounded-2xl border border-white/[0.08] bg-[#121218] p-4 text-left transition hover:-translate-y-0.5"
    >
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink"
        style={{ background: TYPE_COLOR[receipt.type] }}
      >
        {TYPE_LABEL[receipt.type]}
      </span>
      <h3 className="mt-3 text-lg font-semibold leading-tight">{receipt.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-mute">{receipt.description}</p>
      <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-mute">
        {formatDay(receipt.timestamp)}
        {receipt.location ? ` · ${receipt.location}` : ""}
      </p>
      <p className="mt-2 text-xs text-accent">Connected moments: {connections}</p>
    </button>
  );
}
