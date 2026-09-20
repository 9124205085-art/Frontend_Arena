import { RECEIPT_TYPES } from "../data/types";
import { TYPE_COLOR, TYPE_LABEL } from "../utils/constants";
import { useLifeStore } from "../store";

export default function FilterChips() {
  const active = useLifeStore((s) => s.activeTypes);
  const toggle = useLifeStore((s) => s.toggleType);
  const setTypes = useLifeStore((s) => s.setTypes);
  const allOn = active.length === RECEIPT_TYPES.length;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => setTypes([...RECEIPT_TYPES])}
        className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
          allOn ? "border-accent bg-accent/20 text-white" : "border-white/[0.08] text-mute"
        }`}
      >
        All
      </button>
      {RECEIPT_TYPES.map((t) => {
        const on = !allOn && active.includes(t);
        return (
          <button
            key={t}
            type="button"
            onClick={() => toggle(t)}
            className="shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{
              borderColor: on || allOn ? TYPE_COLOR[t] : "rgba(255,255,255,0.08)",
              color: on || allOn ? TYPE_COLOR[t] : "#9696A5",
            }}
          >
            {TYPE_LABEL[t]}
          </button>
        );
      })}
    </div>
  );
}
