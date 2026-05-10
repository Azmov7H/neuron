// components/spark/ai-message.tsx
import { Sparkles, Loader2, ArrowUpRight } from "lucide-react";

interface ConceptCard {
  title: string;
  domain: string;
}

interface AiMessageProps {
  content: string;
  concepts?: ConceptCard[];
  followUps?: string[];
  isStreaming: boolean;
  onFollowUpClick: (prompt: string) => void;
}

export function AiMessage({ content, concepts, followUps, isStreaming, onFollowUpClick }: AiMessageProps) {
  return (
    <div className="flex gap-4 animate-fade-up">
      <div className="shrink-0 mt-1">
        <div className="w-8 h-8 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center relative">
          <Sparkles size={16} className="text-secondary" />
          {isStreaming && (
            <div className="absolute inset-0 rounded-full bg-secondary/20 animate-ping" />
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div className="text-foreground/90 text-sm leading-relaxed">
          {isStreaming ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 size={16} className="animate-spin" /> 
              <span>Spark is thinking...</span>
            </div>
          ) : (
            content
          )}
        </div>

        {!isStreaming && concepts && concepts.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {concepts.map((concept) => (
              <div 
                key={concept.title} 
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors group"
              >
                <span className="text-xs font-medium text-foreground">{concept.title}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{concept.domain}</span>
                <ArrowUpRight size={12} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            ))}
          </div>
        )}

        {!isStreaming && followUps && followUps.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5 mt-4">
            {followUps.map((q) => (
              <button 
                key={q}
                onClick={() => onFollowUpClick(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}