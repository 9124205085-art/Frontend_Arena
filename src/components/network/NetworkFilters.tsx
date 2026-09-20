import FilterChips from "../FilterChips";
import { useLifeStore } from "../../store";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function NetworkFilters({ years }: { years: number[] }) {
  const year = useLifeStore((s) => s.year);
  const setYear = useLifeStore((s) => s.setYear);
  const month = useLifeStore((s) => s.month);
  const setMonth = useLifeStore((s) => s.setMonth);

  return (
    <details className="mt-4 rounded-2xl border border-white/[0.08] bg-[#101016] px-3 py-1 open:pb-3">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl text-sm text-mute transition hover:text-white [&::-webkit-details-marker]:hidden">
        <span className="font-semibold text-white">Refine this view</span>
        <span className="truncate text-sm text-mute">
          {year ?? "All years"} · {month ? MONTHS[month - 1] : "All months"}
        </span>
      </summary>
      <div className="mt-3 space-y-3">
        <FilterChips />
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-mute">
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
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-mute">
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
