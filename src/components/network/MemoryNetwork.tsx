import { useLifeStore } from "../../store";
import { TYPE_ICON, TYPE_LABEL } from "../../utils/constants";
import { useGraphModel } from "../../hooks/useGraphModel";
import MemoryCanvas from "./MemoryCanvas";
import NetworkFilters from "./NetworkFilters";
import ConnectedMomentsList from "./ConnectedMomentsList";

const MODE_LABEL = {
  moments: "Moments",
  places: "Places",
  time: "Time",
} as const;

export default function MemoryNetwork({ hint }: { hint?: string }) {
  const {
    graph,
    rfNodes,
    rfEdges,
    list,
    compact,
    years,
    mode,
    locs,
    filteredOn,
  } = useGraphModel();
  const setMode = useLifeStore((s) => s.setNetworkMode);
  const select = useLifeStore((s) => s.select);
  const selectPlace = useLifeStore((s) => s.selectPlace);
  const selectedId = useLifeStore((s) => s.selectedId);
  const selectedPlace = useLifeStore((s) => s.selectedPlace);
  const clearLenses = useLifeStore((s) => s.clearLenses);
  const selectedTitle = useLifeStore((s) => (s.selectedId ? (s.receiptById.get(s.selectedId)?.title ?? null) : null));

  const listItems =
    mode === "places"
      ? locs.slice(0, 20).map((l) => ({
          id: l.location,
          title: l.location,
          typeLabel: `${l.count} records`,
          icon: "📍",
        }))
      : list.map((r) => ({
          id: r.id,
          title: r.title,
          typeLabel: TYPE_LABEL[r.type],
          icon: TYPE_ICON[r.type],
        }));

  const announced =
    mode === "places" && selectedPlace
      ? `${selectedPlace} selected. Story details opened.`
      : selectedTitle
        ? `${selectedTitle} selected. Story details opened.`
        : "";

  const graphEmpty = rfNodes.length === 0;

  return (
    <div className="mt-4 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {hint ? <p className="min-w-0 text-sm leading-relaxed text-white/80 sm:text-base">{hint}</p> : <span />}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {filteredOn && (
            <button
              type="button"
              onClick={() => clearLenses()}
              className="min-h-11 rounded-full border border-white/[0.08] px-4 text-sm font-semibold text-mute transition hover:border-white/30 hover:text-white"
            >
              Reset view
            </button>
          )}
          <div
            className="flex min-h-11 gap-1 rounded-full border border-white/[0.08] p-1 text-sm font-semibold"
            role="group"
            aria-label="Network layout"
          >
            {(["moments", "places", "time"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={`min-h-9 rounded-full px-3 capitalize transition ${
                  mode === m ? "bg-accent text-white" : "text-mute hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {MODE_LABEL[m]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {announced}
      </p>

      <MemoryCanvas
        graph={graph}
        rfNodes={rfNodes}
        rfEdges={rfEdges}
        compact={compact}
        empty={graphEmpty}
        selected={Boolean(selectedId || selectedPlace)}
        filtered={filteredOn}
        onReset={filteredOn ? () => clearLenses() : undefined}
      />

      <NetworkFilters years={years} />

      <ConnectedMomentsList
        items={listItems}
        selectedId={mode === "places" ? selectedPlace : selectedId}
        onSelect={mode === "places" ? selectPlace : select}
        heading={
          mode === "places"
            ? `${listItems.length} places in this view`
            : `${listItems.length} connected moments in this view`
        }
        onReset={filteredOn ? () => clearLenses() : undefined}
      />
    </div>
  );
}
