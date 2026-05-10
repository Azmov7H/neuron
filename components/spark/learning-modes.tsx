// components/spark/learning-modes.tsx
import { Lightbulb, Anchor, Eye, GitBranch } from "lucide-react";

const modes = [
  { id: "Simplify", icon: Lightbulb, desc: "Explain like I'm 5" },
  { id: "Deep Dive", icon: Anchor, desc: "Technical & thorough" },
  { id: "Visualize", icon: Eye, desc: "Mental models & analogies" },
  { id: "Relate", icon: GitBranch, desc: "Connect to other concepts" },
];

interface LearningModesProps {
  selectedMode: string;
  onModeChange: (mode: string) => void;
}

export function LearningModes({ selectedMode, onModeChange }: LearningModesProps) {
  return (
    <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2 scrollbar-none">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap ${
            selectedMode === mode.id
              ? "bg-primary/10 border-primary/30 text-primary shadow-[0_0_10px_rgba(59,130,246,0.15)]"
              : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          }`}
        >
          <mode.icon size={14} />
          {mode.id}
        </button>
      ))}
    </div>
  );
}