import { memo } from "react";
import { Handle, NodeToolbar, Position, type NodeProps } from "@xyflow/react";
import { TYPE_COLOR, TYPE_ICON, TYPE_LABEL } from "../../utils/constants";
import type { ReceiptType } from "../../data/types";
import { useLifeStore } from "../../store";

export type MomentNodeData = {
  title: string;
  type: ReceiptType;
  when: string;
  preview: string;
};

function MomentNodeInner({ id, data }: NodeProps) {
  const d = data as MomentNodeData;
  const color = TYPE_COLOR[d.type];
  const active = useLifeStore((s) => s.selectedId === id);
  const dim = useLifeStore((s) => {
    if (!s.selectedId || s.selectedId === id) return false;
    return !s.edgesByNode.get(s.selectedId)?.some((e) => e.a === id || e.b === id);
  });

  return (
    <div
      className={`group relative rounded-2xl border px-2.5 py-2 shadow-soft transition duration-300 ${
        active
          ? "z-10 border-accent bg-[#16161f] shadow-glow scale-[1.04]"
          : dim
            ? "border-white/[0.06] bg-[#101016] opacity-25"
            : "border-white/[0.1] bg-[#14141c] hover:border-white/20"
      }`}
      style={{ minWidth: 132, maxWidth: 156 }}
    >
      <NodeToolbar position={Position.Top} className="!z-50 max-w-[220px] rounded-xl border border-white/10 bg-[#121218]/95 px-3 py-2 text-left shadow-soft backdrop-blur">
        <p className="text-[9px] uppercase tracking-[0.16em]" style={{ color }}>
          {TYPE_LABEL[d.type]}
        </p>
        <p className="mt-1 text-[11px] font-semibold leading-snug text-white">{d.title}</p>
        {d.preview ? <p className="mt-1 line-clamp-3 text-[10px] leading-relaxed text-mute">{d.preview}</p> : null}
        <p className="mt-1 text-[9px] uppercase tracking-wider text-mute">{d.when}</p>
      </NodeToolbar>
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-accent/70" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-accent/70" />
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
          style={{ background: `${color}22`, color }}
          aria-hidden
        >
          {TYPE_ICON[d.type]}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold leading-tight">{d.title}</p>
          <p className="mt-0.5 text-[9px] uppercase tracking-wider text-mute">{d.when}</p>
        </div>
      </div>
    </div>
  );
}

export const MomentNode = memo(MomentNodeInner);
