// components/dashboard/side-nav.tsx
"use client";

import { 
  Home, 
  Compass, 
  Zap, 
  LayoutGrid, 
  MonitorPlay, 
  Route, 
  TrendingUp, 
  Trophy, 
  BookOpen, 
  Users, 
  Atom, 
  CircleUser, 
  Settings, 
  Play,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "../logo";

const navSections = [
  {
    title: "CORE",
    items: [
      { icon: Home, label: "Home", href: "/" },
      { icon: Compass, label: "Explore", href: "/explore" },
      { icon: Zap, label: "Spark", href: "/spark" },
      { icon: LayoutGrid, label: "Matrix", href: "/matrix" },
      { icon: MonitorPlay, label: "Simulations", href: "/simulations" },
      { icon: Route, label: "Neural Paths", href: "/neural-paths" },
    ],
  },
  {
    title: "PROGRESSION",
    items: [
      { icon: TrendingUp, label: "Evolution", href: "/evolution" },
      { icon: Trophy, label: "Achievements", href: "/achievements" },
      { icon: BookOpen, label: "Library", href: "/neural-paths" },
    ],
  },
  {
    title: "SOCIAL / FUTURE",
    items: [
      { icon: Users, label: "Community", href: "/community" },
      { icon: Atom, label: "Research Labs", href: "/research-labs" },
    ],
  },
  {
    title: "PERSONAL",
    items: [
      { icon: CircleUser, label: "Profile", href: "/profile" },
      { icon: Settings, label: "Settings", href: "/settings" },
    ],
  },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-72 flex-col h-screen border-r border-white/5 bg-card/30 backdrop-blur-xl">
      <div className="p-6 h-16 flex items-center">
        <Logo />
      </div>
      
      <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-6 scrollbar-none">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 font-semibold px-3 mb-2">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === `/dashboard${item.href}`;
                return (
                  <Link
                    key={item.label}
                    href={`/dashboard${item.href}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-white/5 text-foreground shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                        : "text-muted-foreground/70 hover:bg-white/5 hover:text-foreground"
                    }`}
                  >
                    <item.icon size={18} className={`transition-colors ${isActive ? "text-primary" : ""}`} />
                    {item.label}
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/5">
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-b from-white/5 to-transparent border border-white/5 shadow-[0_0_20px_rgba(59,130,246,0.05)]">
          <p className="text-sm font-semibold text-foreground mb-1">Ready to evolve?</p>
          <p className="text-xs text-muted-foreground mb-3">Your next session is queued.</p>
          <button className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] active:scale-95">
            <Play size={14} fill="currentColor" /> Start Session
          </button>
        </div>

        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground/50 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200">
          <LogOut size={18} /> Log Out
        </button>
      </div>
    </aside>
  );
}