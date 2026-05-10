// components/simulation-runner/spark-insight.tsx
import { Sparkles } from "lucide-react";

export function SparkInsight() {
  return (
    <div className="absolute bottom-20 sm:bottom-2 lg:bottom-6 left-2 sm:left-6 right-2 sm:right-16 lg:right-80 z-20 pointer-events-none">
      <div className="glass rounded-xl p-3 sm:p-4 flex items-start gap-3 shadow-[0_0_20px_rgba(0,0,0,0.3)] border-secondary/10 max-w-2xl">
        <div className="p-1.5 rounded-md bg-secondary/10 text-secondary mt-0.5 shrink-0">
          <Sparkles size={14} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-secondary/80 mb-1">Spark Observation</p>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Notice how increasing the learning rate causes the network to overshoot optimal weights, represented by the erratic distortion of the core. A slower rate allows smoother convergence.
          </p>
        </div>
      </div>
    </div>
  );
}