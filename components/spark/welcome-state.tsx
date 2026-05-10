// components/spark/welcome-state.tsx
import { Sparkles, RotateCcw, Atom, Brain, Clock } from "lucide-react";

const suggestions = [
  {
    icon: Atom,
    text: "Why does gravity bend time?",
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  },
  {
    icon: Brain,
    text: "Could consciousness be simulated?",
    color: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  },
  {
    icon: RotateCcw,
    text: "What is entropy really?",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
  {
    icon: Clock,
    text: "How do black holes store information?",
    color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  },
];

interface WelcomeStateProps {
  onPromptClick: (prompt: string) => void;
}

export function WelcomeState({ onPromptClick }: WelcomeStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center pt-20 animate-fade-up">
      <div className="relative mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.2)]">
          <Sparkles className="text-primary" size={32} />
        </div>
      </div>

      <h1 className="text-4xl font-bold tracking-tight mb-3 text-foreground">
        What sparks your curiosity?
      </h1>
      <p className="text-muted-foreground text-lg max-w-md mb-12">
        Ignite your understanding. Ask anything, explore concepts, or deepen your knowledge.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        {suggestions.map((s) => (
          <button
            key={s.text}
            onClick={() => onPromptClick(s.text)}
            className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:-translate-y-1 hover:shadow-lg ${s.color}`}
          >
            <s.icon size={20} className="shrink-0" />
            <span className="text-sm font-medium text-foreground/90">{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}