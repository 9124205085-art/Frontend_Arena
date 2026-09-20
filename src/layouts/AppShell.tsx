import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar, { BottomNav } from "./Sidebar";
import ReceiptDrawer from "../components/ReceiptDrawer";

export default function AppShell() {
  return (
    <div className="grain flex min-h-svh bg-ink text-[#F5F5F7]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-x-hidden pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <ReceiptDrawer />
    </div>
  );
}
