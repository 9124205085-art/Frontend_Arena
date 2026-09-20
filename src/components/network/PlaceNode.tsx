import { memo } from "react";
import { Handle, NodeToolbar, Position, type NodeProps } from "@xyflow/react";
import { useLifeStore } from "../../store";

export type PlaceNodeData = {
  location: string;
  count: number;
  mix: string;
};

function PlaceNodeInner({ data }: NodeProps) {
  const d = data as PlaceNodeData;
  const selectedPlace = useLifeStore((s) => s.selectedPlace);
  const active = selectedPlace === d.location;
  const dim = Boolean(selectedPlace && !active);
  return (
    <div
      className={`rounded-full border px-3 py-3 text-center shadow-soft transition duration-300 ${
        active
          ? "z-10 border-cyan-300 bg-[#102026] shadow-glow scale-105"
          : dim
            ? "opacity-25"
            : "border-cyan-400/30 bg-[#101820] hover:border-cyan-300/50"
      }`}
      style={{ minWidth: 104 }}
    >
      <NodeToolbar position={Position.Top} className="!z-50 max-w-[220px] rounded-xl border border-cyan-400/20 bg-[#101820]/95 px-3 py-2 text-left shadow-soft backdrop-blur">
        <p className="text-[9px] uppercase tracking-[0.16em] text-cyan-300">Place</p>
        <p className="mt-1 text-[11px] font-semibold text-white">{d.location}</p>
        <p className="mt-1 text-[10px] leading-relaxed text-mute">{d.count} records in the archive</p>
        {d.mix ? <p className="mt-1 text-[10px] text-mute">{d.mix}</p> : null}
        <p className="mt-1 text-[9px] uppercase tracking-wider text-cyan-300">Click to inspect</p>
      </NodeToolbar>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-cyan-300" />
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-cyan-300" />
      <p className="text-lg" aria-hidden>
        📍
      </p>
      <p className="mt-1 max-w-[7.5rem] truncate text-[11px] font-semibold">{d.location}</p>
      <p className="text-[9px] uppercase tracking-wider text-mute">{d.count} records</p>
    </div>
  );
}

export const PlaceNode = memo(PlaceNodeInner);
