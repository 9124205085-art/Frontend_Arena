import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "./Header";
import Sidebar, { BottomNav } from "./Sidebar";
import StoryPanel from "../components/network/StoryPanel";
import NarrationDock from "../components/narration/NarrationDock";
import { useLifeStore } from "../store";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

export default function AppShell() {
  const location = useLocation();
  const toast = useLifeStore((s) => s.toast);
  const reduced = usePrefersReducedMotion();

  return (
    <div className="grain flex min-h-svh min-h-dvh overflow-x-clip bg-ink text-[#F5F5F7]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus-visible:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main id="main" className="flex-1 overflow-x-clip pb-[calc(var(--nav-h)+0.85rem)] md:pb-10">
          <motion.div
            key={location.pathname}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{ viewTransitionName: "page" }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      <BottomNav />
      <NarrationDock />
      <StoryPanel />
      {toast && (
        <p
          role="status"
          aria-live="polite"
          className="glass pointer-events-none fixed left-1/2 z-50 max-w-[min(22rem,calc(100vw-1.5rem))] -translate-x-1/2 rounded-full px-4 py-2 text-center text-xs"
          style={{ bottom: "calc(var(--nav-h) + var(--dock-h) + 0.75rem)" }}
        >
          {toast}
        </p>
      )}
    </div>
  );
}
