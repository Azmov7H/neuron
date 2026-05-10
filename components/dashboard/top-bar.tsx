// components/dashboard/top-bar.tsx
"use client";

import { Search, Bell, Settings, Command } from "lucide-react";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-6 lg:px-8 bg-card/50 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center gap-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-foreground transition-colors" />
          <input 
            type="text" 
            placeholder="Search nodes, paths, concepts..." 
            className="w-64 lg:w-80 bg-white/5 border border-white/5 focus:border-primary/30 rounded-lg py-2 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-muted-foreground/40 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)]"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground/40 border border-white/10 rounded px-1.5 py-0.5">
            <Command size={10} /> <span className="text-[10px] font-medium">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
        </button>
        <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground">
          <Settings size={18} />
        </button>
        <div className="ml-2 h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-accent overflow-hidden ring-2 ring-white/10 cursor-pointer hover:ring-primary/50 transition-all">
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-background">A</div>
        </div>
      </div>
    </header>
  );
}