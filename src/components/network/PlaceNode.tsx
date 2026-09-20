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
    <div className={`relative h-8 w-8 cursor-pointer ${active ? "z-20" : dim ? "z-0 opacity-30" : "z-10"}`}>
      <NodeToolbar
        position={Position.Top}
        className="!z-50 max-w-[220px] rounded-xl border border-cyan-400/20 bg-[#101820]/95 px-3 py-2 text-left shadow-soft backdrop-blur"
      >
        <p className="text-xs uppercase tracking-[0.16em] text-cyan-300">Place · moment cluster</p>
        <p className="mt-1 text-sm font-semibold text-white">{d.location}</p>
        <p className="mt-1 text-xs leading-relaxed text-mute">{d.count} records in the archive</p>
        {d.mix ? <p className="mt-1 text-xs text-mute">{d.mix}</p> : null}
        <p className="mt-1 text-xs font-semibold text-cyan-300">Click to inspect →</p>
      </NodeToolbar>
      <Handle type="target" position={Position.Top} className="!h-1.5 !w-1.5 !border-0 !bg-cyan-300" />
      <Handle type="source" position={Position.Bottom} className="!h-1.5 !w-1.5 !border-0 !bg-cyan-300" />
      <span
        className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-cyan-200 transition duration-200 ${
          active
            ? "h-10 w-10 scale-110 bg-cyan-300 shadow-glow ring-2 ring-cyan-100 ring-offset-2 ring-offset-[#0B0B10]"
            : "h-7 w-7 bg-cyan-400/90 hover:scale-125 hover:ring-2 hover:ring-cyan-100/70"
        }`}
        aria-hidden
      >
        {active ? <span className="text-sm">📍</span> : null}
      </span>
      {active && (
        <p className="pointer-events-none absolute left-12 top-1/2 max-w-[9rem] -translate-y-1/2 truncate text-xs font-semibold text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)]">
          {d.location}
        </p>
      )}
    </div>
  );
}

export const PlaceNode = memo(PlaceNodeInner);
