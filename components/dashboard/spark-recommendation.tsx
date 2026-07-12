"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export function SparkRecommendation() {
  return (
    <div className="relative rounded-[var(--radius-lg)] p-5 border bg-[hsl(var(--ai-assistant-bg))] border-[hsl(var(--ai-assistant-border))] overflow-hidden animate-fade-in shadow-sm group">
      {/* Decorative abstract glow in corner */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--sci-ai))]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between h-full min-h-[170px]">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-purple-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-purple-400">
              Spark Suggests
            </span>
          </div>
          <p className="text-muted-foreground text-[12px] mb-2 leading-relaxed">
            Concept worth exploring today:
          </p>
          <h3 className="text-sm font-semibold text-foreground leading-snug mb-4 inline-flex items-center gap-1.5 flex-wrap">
            "How does entropy shape the arrow of time?"
            {/* Blinking streaming cursor caret */}
            <span className="w-1.5 h-3.5 bg-primary animate-[pulse_1s_infinite] shrink-0" style={{ animationDuration: "1s" }} />
          </h3>
        </div>

        <Link
          href="/dashboard/spark"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-purple-400 hover:text-purple-300 transition-colors mt-auto group/link"
        >
          Explore with Spark AI
          <ArrowRight
            size={12}
            className="group-hover/link:translate-x-1 transition-transform"
          />
        </Link>
      </div>
    </div>
  );
}