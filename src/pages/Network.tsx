import MemoryNetwork from "../components/network/MemoryNetwork";

export default function Network() {
  return (
    <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8 md:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-accent">Network</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Follow the threads</h1>
      <p className="mt-2 max-w-2xl text-mute">
        Each dot is a moment from the official archive. Lines are stored relationships — time, place, or shared fields.
        Click a moment, then follow the story.
      </p>
      <MemoryNetwork hint="Click any moment to explore its connections. Brighter nodes are linked to your selection." />
    </div>
  );
}
