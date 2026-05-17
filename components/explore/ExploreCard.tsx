"use client";

import Link from "next/link";
import { Atom, TrendingUp, Sparkles, Route, Network, LucideIcon } from "lucide-react";

interface NavSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  type: string;
  isActive: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  Atom,
  TrendingUp,
  Sparkles,
  Route,
  Network
};

export function ExploreCard({ section }: { section: NavSection }) {
  const IconComponent = iconMap[section.icon] || Sparkles;

  return (
    <Link 
      href={section.route} 
      className="group relative glass rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] glow-border overflow-hidden block"
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="mb-6">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:border-primary/50 group-hover:text-primary transition-all">
            <IconComponent size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-primary/80 mb-2 block">{section.type}</span>
          <h3 className="text-xl font-bold text-foreground mb-2">{section.title}</h3>
          <p className="text-sm text-muted-foreground">{section.description}</p>
        </div>
      </div>
    </Link>
  );
}
