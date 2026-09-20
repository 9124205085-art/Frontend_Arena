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
      className={`group relative h-8 w-8 cursor-pointer ${active ? "z-20" : dim ? "z-0 opacity-30" : "z-10"}`}
    >
      <NodeToolbar
        position={Position.Top}
        className="!z-50 max-w-[220px] rounded-xl border border-white/10 bg-[#121218]/95 px-3 py-2 text-left shadow-soft backdrop-blur"
      >
        <p className="text-xs uppercase tracking-[0.16em]" style={{ color }}>
          {TYPE_LABEL[d.type]} · moment
        </p>
        <p className="mt-1 text-sm font-semibold leading-snug text-white">{d.title}</p>
        {d.preview ? <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-mute">{d.preview}</p> : null}
        <p className="mt-1 text-xs text-mute">{d.when}</p>
        <p className="mt-1 text-xs font-semibold text-accent">Click to explore →</p>
      </NodeToolbar>
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-accent/70" />
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-accent/70" />
      <span
        className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 transition duration-200 ${
          active
            ? "h-9 w-9 scale-110 shadow-glow ring-2 ring-white/85 ring-offset-2 ring-offset-[#0B0B10]"
            : "h-6 w-6 hover:scale-125 hover:ring-2 hover:ring-white/50"
        }`}
        style={{
          background: color,
          borderColor: active ? "#ffffff" : color,
          boxShadow: active ? `0 0 22px ${color}` : `0 0 10px ${color}66`,
        }}
        aria-hidden
      >
        {active ? <span className="text-xs drop-shadow">{TYPE_ICON[d.type]}</span> : null}
      </span>
      {active && (
        <p className="pointer-events-none absolute left-11 top-1/2 max-w-[9.5rem] -translate-y-1/2 truncate text-xs font-semibold text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)]">
          {d.title}
        </p>
      )}
    </div>
  );
}

export const MomentNode = memo(MomentNodeInner);
