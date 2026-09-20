import { NavLink, Link } from "react-router-dom";
import {
  Activity,
  GitBranch,
  Home,
  Layers,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";

const LINKS = [
  { to: "/overview", label: "Home", icon: Home },
  { to: "/journey", label: "Journey", icon: Activity },
  { to: "/connections", label: "Connections", icon: GitBranch },
  { to: "/chapters", label: "Chapters", icon: Layers },
  { to: "/patterns", label: "Patterns", icon: Sparkles },
  { to: "/places", label: "Places", icon: MapPin },
  { to: "/search", label: "Search", icon: Search },
];

export default function Sidebar() {
  return (
    <aside className="hidden h-svh w-56 shrink-0 flex-col border-r border-white/[0.08] bg-[#0D0D12] px-4 py-6 md:flex">
      <Link to="/" className="px-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-mute">
        Life // Receipts
      </Link>
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isActive ? "bg-white/[0.06] text-white" : "text-mute hover:bg-white/[0.04] hover:text-white"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="rounded-2xl border border-white/[0.08] bg-[#121218] p-3">
        <p className="text-sm font-semibold">Alex</p>
        <p className="text-xs text-mute">Digital memory explorer</p>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const mobile = LINKS.filter((l) => ["/overview", "/journey", "/connections", "/patterns"].includes(l.to));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/[0.08] bg-[#0D0D12]/95 px-2 py-2 backdrop-blur md:hidden">
      {mobile.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 text-[10px] uppercase tracking-wider ${
              isActive ? "text-white" : "text-mute"
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
