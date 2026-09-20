import MemoryNetwork from "../components/network/MemoryNetwork";

export default function Network() {
  return (
    <div className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-6 md:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Network</p>
      <h1 className="mt-2 text-[clamp(1.75rem,5vw,3rem)] font-extrabold tracking-tight">Each dot is a moment</h1>
      <p className="mt-2 max-w-2xl text-base leading-relaxed text-white/85">
        Lines show relationships. Click a moment to explore it. Follow the connections to discover a story.
      </p>
      <MemoryNetwork hint="" />
    </div>
  );
}
