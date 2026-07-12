"use client";

import { Sparkles, ArrowRight, Tag } from "lucide-react";
import Link from "next/link";
import { useTypewriter } from "@/hooks/use-typewriter";
import { DomainBadge } from "@/components/ui/domain-badge";

const CONCEPT = "How does entropy shape the arrow of time?";
const TAGS = ["physics", "quantum", "math"];

export function SparkRecommendation() {
  const { displayed, done } = useTypewriter(CONCEPT, 26, 400);

  return (
    <div className="relative rounded-[var(--radius-lg)] p-5 border border-[hsl(var(--ai-assistant-border))] bg-[hsl(var(--ai-assistant-bg))] overflow-hidden animate-fade-in shadow-sm group">
      {/* Domain glow */}
      <div
        className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-40 transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: "radial-gradient(circle, hsl(var(--sci-ai)/0.15) 0%, transparent 70%)" }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          {/* Live pulse indicator */}
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--sci-ai))] opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--sci-ai))]" />
          </span>
          <Sparkles size={12} className="text-[hsl(var(--sci-ai))]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--sci-ai))]">
            Spark Suggests
          </span>
        </div>

        {/* Label */}
        <p className="text-[11px] text-muted-foreground mb-2">Concept worth exploring today:</p>

        {/* Typewriter question */}
        <h3 className="text-[13px] font-semibold text-foreground leading-snug mb-3 min-h-[3rem]">
          &ldquo;{displayed}
          {!done && (
            <span
              className="inline-block w-[2px] h-[0.9em] bg-primary ml-0.5 align-middle"
              style={{ animation: "pulse 0.9s steps(1) infinite" }}
            />
          )}
          &rdquo;
        </h3>

        {/* Domain tags */}
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          <Tag size={9} className="text-muted-foreground/30" />
          {TAGS.map((t) => (
            <DomainBadge key={t} domain={t} size="xs" />
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/dashboard/spark"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[hsl(var(--sci-ai))] hover:text-[hsl(var(--sci-ai)/0.8)] transition-colors group/link"
        >
          Explore with Spark AI
          <ArrowRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}