import { Brain, Sparkles, Wifi } from "lucide-react";
import Logo from "../logo";

export function LoginLeftPanel() {
  return (
    <div className="hidden lg:flex flex-col space-y-10 px-10 relative">
      {/* Logo */}
      <Logo />

      <h2 className="text-6xl font-extrabold leading-[1.1] tracking-tighter text-foreground">
        Reconnect. <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          Resume Evolution.
        </span>
      </h2>

      <p className="text-lg text-muted-foreground max-w-[500px] leading-relaxed font-light">
        Your neural pathways await. Access your simulations, learning nodes, and AI mentors right where you left off.
      </p>

      {/* Features */}
      <div className="flex flex-col gap-8 pt-6">
        <div className="flex items-start gap-5 group">
          <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:border-primary/60 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
            <Wifi size={24} />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">Seamless Sync</p>
            <p className="text-sm text-muted-foreground font-mono mt-1">Your cognitive progress is synced across the neural grid.</p>
          </div>
        </div>

        <div className="flex items-start gap-5 group">
          <div className="w-12 h-12 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary group-hover:border-secondary/60 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">AI Continuity</p>
            <p className="text-sm text-muted-foreground font-mono mt-1">Your AI mentor adapts instantly to your current cognitive state.</p>
          </div>
        </div>
      </div>
    </div>
  );
}