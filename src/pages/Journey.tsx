import { useEffect } from "react";
import { useLifeStore } from "../store";
import MemoryNetwork from "../components/network/MemoryNetwork";

export default function Journey() {
  const setNetworkMode = useLifeStore((s) => s.setNetworkMode);

  useEffect(() => {
    setNetworkMode("time");
  }, [setNetworkMode]);

  return (
    <div className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-6 md:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Journey</p>
      <h1 className="mt-2 text-[clamp(1.75rem,5vw,3rem)] font-extrabold tracking-tight">Move through time</h1>
      <p className="mt-2 max-w-2xl text-base leading-relaxed text-white/85">
        The network is the timeline. Open Refine this view, pick a year, click a moment, follow the story.
      </p>
      <MemoryNetwork hint="Selecting a year rebuilds the network from that slice of the official archive." />
    </div>
  );
}
