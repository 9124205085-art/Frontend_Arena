import { NavLink, Link } from "react-router-dom";
import { Activity, GitBranch, Home, Search, Sparkles } from "lucide-react";

const LINKS = [
  { to: "/overview", label: "Home", icon: Home },
  { to: "/journey", label: "Journey", icon: Activity },
  { to: "/network", label: "Network", icon: GitBranch },
  { to: "/discoveries", label: "Discoveries", icon: Sparkles },
  { to: "/search", label: "Search", icon: Search },
];

export default function Sidebar() {
  return (
    <aside className="hidden h-svh w-56 shrink-0 flex-col border-r border-white/[0.08] bg-[#0D0D12]/90 px-4 py-6 backdrop-blur-xl md:flex">
      <Link to="/" className="px-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-mute transition hover:text-white">
        Life // Receipts
      </Link>
      <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Primary">
        {LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isActive
                  ? "bg-white/[0.07] text-white shadow-[inset_0_0_0_1px_rgba(124,107,255,0.35)]"
                  : "text-mute hover:bg-white/[0.04] hover:text-white"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <Link to="/" className="glass-card rounded-2xl p-3 transition hover:border-accent/40">
        <p className="text-sm font-semibold">Alex</p>
        <p className="text-xs text-mute">Return to the landing — then enter the network.</p>
      </Link>
    </aside>
  );
}

export function BottomNav() {
  const mobile = [
    { to: "/overview", label: "Home", icon: Home },
    { to: "/journey", label: "Journey", icon: Activity },
    { to: "/network", label: "Network", icon: GitBranch },
    { to: "/discoveries", label: "Discover", icon: Sparkles },
  ];
  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/[0.08] bg-[#0D0D12]/95 px-2 py-2 backdrop-blur-xl md:hidden"
    >
      {mobile.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={label}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] uppercase tracking-wider ${
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
