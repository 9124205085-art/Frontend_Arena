import { TYPE_COLOR, TYPE_ICON, TYPE_LABEL } from "../utils/constants";
import { useLifeStore } from "../store";

const chip =
  "inline-flex min-h-11 shrink-0 items-center rounded-full border px-3.5 text-xs font-semibold uppercase tracking-[0.12em] transition";

export default function FilterChips() {
  const active = useLifeStore((s) => s.activeTypes);
  const present = useLifeStore((s) => s.presentTypes);
  const toggle = useLifeStore((s) => s.toggleType);
  const setTypes = useLifeStore((s) => s.setTypes);
  const allOn = present.length > 0 && active.length === present.length;

  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by category">
      <button
        type="button"
        onClick={() => setTypes([...present])}
        aria-pressed={allOn}
        className={`${chip} ${allOn ? "border-accent bg-accent/20 text-white" : "border-white/[0.08] text-mute hover:border-white/25 hover:text-white"}`}
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
            className={`${chip} hover:brightness-125`}
            style={{
              borderColor: on || allOn ? TYPE_COLOR[t] : "rgba(255,255,255,0.08)",
              color: on || allOn ? TYPE_COLOR[t] : "#9696A5",
              background: on ? `${TYPE_COLOR[t]}18` : "transparent",
            }}
          >
            <span aria-hidden className="mr-1">
              {TYPE_ICON[t]}
            </span>{" "}
            {TYPE_LABEL[t]}
          </button>
        );
      })}
    </div>
  );
}
