import { useEffect } from "react";
import { useLifeStore } from "../store";
import MemoryNetwork from "../components/network/MemoryNetwork";

export default function Journey() {
  const setNetworkMode = useLifeStore((s) => s.setNetworkMode);

  useEffect(() => {
    setNetworkMode("time");
  }, [setNetworkMode]);

  return (
    <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8 md:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-accent">Journey</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Move through time</h1>
      <p className="mt-2 max-w-2xl text-mute">
        The network itself is the timeline. Pick a year. Click a moment. Follow the story — you never leave this map.
      </p>
      <MemoryNetwork hint="Selecting a year rebuilds the network from that slice of the official archive." />
    </div>
  );
}
