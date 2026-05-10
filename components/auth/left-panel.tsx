import { Brain, Sparkles, Blocks } from "lucide-react";
import Logo from "@/components/logo";

export function LeftPanel() {
  return (
    <div className="hidden lg:flex flex-col space-y-10 px-10 relative">
      
   <Logo />
      <h2 className="text-6xl font-extrabold leading-[1.1] tracking-tighter text-foreground">
        Decode Reality. <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          Master Thought.
        </span>
      </h2>

      <p className="text-lg text-muted-foreground max-w-[500px] leading-relaxed font-light">
        Join an elite network of minds evolving through AI-enhanced learning trajectories. Your cognitive ascension begins here.
      </p>

      {/* Features */}
      <div className="flex flex-col gap-8 pt-6">
        <div className="flex items-start gap-5 group">
          <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:border-primary/60 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">Neural Pathmapping</p>
            <p className="text-sm text-muted-foreground font-mono mt-1">AI-generated curricula tailored to your synaptic rhythm.</p>
          </div>
        </div>

        <div className="flex items-start gap-5 group">
          <div className="w-12 h-12 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary group-hover:border-secondary/60 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all">
            <Blocks size={24} />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">Deep Study Nodes</p>
            <p className="text-sm text-muted-foreground font-mono mt-1">Immersive simulations that bridge theory and practice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}