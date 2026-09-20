import { useLifeStore } from "../../store";
import { TYPE_ICON, TYPE_LABEL } from "../../utils/constants";
import { useGraphModel } from "../../hooks/useGraphModel";
import MemoryCanvas from "./MemoryCanvas";
import NetworkFilters from "./NetworkFilters";
import ConnectedMomentsList from "./ConnectedMomentsList";

export default function MemoryNetwork({ hint }: { hint?: string }) {
  const {
    graph,
    rfNodes,
    rfEdges,
    list,
    compact,
    connected,
    years,
    mode,
    locs,
    filteredOn,
    graphEmptyHint,
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

  return (
    <div className="mt-5 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Memory network</h2>
          <p className="mt-1 text-sm text-mute">
            {hint ?? "Each dot is a moment. Lines show relationships. Click a moment to explore."}
          </p>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {filteredOn && (
            <button
              type="button"
              onClick={() => clearLenses()}
              className="min-h-11 rounded-full border border-white/[0.08] px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-mute hover:text-white"
            >
              Reset view
            </button>
          )}
          <div
            className="flex min-h-11 gap-1 rounded-full border border-white/[0.08] p-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
            role="group"
            aria-label="Network layout"
          >
            {(["moments", "places", "time"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={`min-h-9 rounded-full px-3 ${mode === m ? "bg-accent text-white" : "text-mute hover:text-white"}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <NetworkFilters compact={compact} years={years} />

      <p className="mt-3 text-xs text-mute">
        Showing a connected sample of the archive
        {selectedId
          ? " · brighter nodes are linked to your selection"
          : ` · ${connected.toLocaleString("en-IN")} receipts have at least one stored relationship`}
        . {compact ? "Tap a moment or a line to open its story." : "Click a line to see why two moments connect."}
      </p>

      <p className="sr-only" aria-live="polite">
        {announced}
      </p>

      <MemoryCanvas graph={graph} rfNodes={rfNodes} rfEdges={rfEdges} compact={compact} empty={graphEmptyHint} />

      <ConnectedMomentsList
        items={listItems}
        selectedId={mode === "places" ? selectedPlace : selectedId}
        onSelect={mode === "places" ? selectPlace : select}
        heading={
          mode === "places"
            ? `${listItems.length} places in this view`
            : `${listItems.length} connected moments in this view`
        }
      />
    </div>
  );
}
