import { TYPE_COLOR, TYPE_ICON, TYPE_LABEL } from "../utils/constants";
import { useLifeStore } from "../store";

export default function FilterChips() {
  const active = useLifeStore((s) => s.activeTypes);
  const present = useLifeStore((s) => s.presentTypes);
  const toggle = useLifeStore((s) => s.toggleType);
  const setTypes = useLifeStore((s) => s.setTypes);
  const allOn = present.length > 0 && active.length === present.length;

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by category">
      <button
        type="button"
        onClick={() => setTypes([...present])}
        aria-pressed={allOn}
        className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
          allOn ? "border-accent bg-accent/20 text-white" : "border-white/[0.08] text-mute hover:text-white"
        }`}
      >
        All
      </button>
      {present.map((t) => {
        const on = !allOn && active.includes(t);
        return (
          <button
            key={t}
            type="button"
            onClick={() => toggle(t)}
            aria-pressed={on || allOn}
            className="shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition hover:brightness-125"
            style={{
              borderColor: on || allOn ? TYPE_COLOR[t] : "rgba(255,255,255,0.08)",
              color: on || allOn ? TYPE_COLOR[t] : "#9696A5",
              background: on ? `${TYPE_COLOR[t]}18` : "transparent",
            }}
          >
            <span aria-hidden>{TYPE_ICON[t]}</span> {TYPE_LABEL[t]}
          </button>
        );
      })}
    </div>
  );
}
