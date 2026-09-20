import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "./Header";
import Sidebar, { BottomNav } from "./Sidebar";
import StoryPanel from "../components/network/StoryPanel";
import NarrationDock from "../components/narration/NarrationDock";
import { useLifeStore } from "../store";

export default function AppShell() {
  const location = useLocation();
  const toast = useLifeStore((s) => s.toast);

  return (
    <div className="grain flex min-h-svh bg-ink text-[#F5F5F7]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main id="main" className="flex-1 overflow-x-hidden pb-24 md:pb-10">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      <BottomNav />
      <NarrationDock />
      <StoryPanel />
      {toast && (
        <p className="glass pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-xs md:bottom-8">
          {toast}
        </p>
      )}
    </div>
  );
}
