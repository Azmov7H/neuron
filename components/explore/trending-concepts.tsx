import { TrendingUp } from "lucide-react";

export function TrendingConcepts({ 
  concepts, 
  onConceptClick 
}: { 
  concepts: string[];
  onConceptClick: (name: string) => void;
}) {
  return (
    <section className="animate-fade-up delay-200">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="text-primary" size={20} />
        <h2 className="text-2xl font-bold text-foreground">Trending Concepts</h2>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {concepts.map((concept) => (
          <button 
            key={concept}
            onClick={() => onConceptClick(concept)}
            className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-medium text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all"
          >
            {concept}
          </button>
        ))}
      </div>
    </section>
  );
}