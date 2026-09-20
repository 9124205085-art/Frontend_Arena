import FilterChips from "../FilterChips";
import { useLifeStore } from "../../store";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function NetworkFilters({
  compact,
  years,
}: {
  compact: boolean;
  years: number[];
}) {
  const year = useLifeStore((s) => s.year);
  const setYear = useLifeStore((s) => s.setYear);
  const month = useLifeStore((s) => s.month);
  const setMonth = useLifeStore((s) => s.setMonth);

  if (compact) {
    return (
      <details className="mt-4 rounded-2xl border border-white/[0.08] bg-[#101016] px-3 py-1 open:pb-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm text-mute [&::-webkit-details-marker]:hidden">
          <span className="font-semibold text-white">Filters</span>
          <span className="truncate text-[11px] uppercase tracking-[0.12em]">
            {year ?? "All years"} · {month ? MONTHS[month - 1] : "All months"}
          </span>
        </summary>
        <div className="mt-3 space-y-3">
          <FilterChips />
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-[10px] uppercase tracking-[0.14em] text-mute">
              Year
              <select
                value={year ?? ""}
                onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}
                className="mt-1 min-h-11 w-full rounded-xl border border-white/[0.08] bg-[#121218] px-3 text-base text-white outline-none"
              >
                <option value="">All years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[10px] uppercase tracking-[0.14em] text-mute">
              Month
              <select
                value={month ?? ""}
                onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : null)}
                className="mt-1 min-h-11 w-full rounded-xl border border-white/[0.08] bg-[#121218] px-3 text-base text-white outline-none"
              >
                <option value="">All months</option>
                {MONTHS.map((label, i) => (
                  <option key={label} value={i + 1}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </details>
    );
  }

  return (
    <>
      <div className="mt-4">
        <FilterChips />
      </div>
      <div className="relative mt-5">
        <div className="pointer-events-none absolute inset-x-3 top-[15px] h-px bg-white/[0.08]" />
        <div className="no-scrollbar relative flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by year">
          <button
            type="button"
            aria-pressed={year == null}
            onClick={() => setYear(null)}
            className={`min-h-11 shrink-0 rounded-full border px-3 text-[10px] uppercase tracking-[0.14em] ${
              year == null ? "border-accent text-white" : "border-white/[0.08] text-mute"
            }`}
          >
            All years
          </button>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              aria-pressed={year === y}
              onClick={() => setYear(y)}
              className={`min-h-11 shrink-0 rounded-full border px-3 text-[10px] uppercase tracking-[0.14em] ${
                year === y ? "border-accent text-white" : "border-white/[0.08] text-mute"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by month">
        <button
          type="button"
          aria-pressed={month == null}
          onClick={() => setMonth(null)}
          className={`min-h-11 shrink-0 rounded-full border px-3 text-[10px] uppercase tracking-[0.14em] ${
            month == null ? "border-accent/70 text-white" : "border-white/[0.08] text-mute"
          }`}
        >
          All months
        </button>
        {MONTHS.map((label, i) => (
          <button
            key={label}
            type="button"
            aria-pressed={month === i + 1}
            onClick={() => setMonth(i + 1)}
            className={`min-h-11 shrink-0 rounded-full border px-3 text-[10px] uppercase tracking-[0.14em] ${
              month === i + 1 ? "border-accent text-white" : "border-white/[0.08] text-mute"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
