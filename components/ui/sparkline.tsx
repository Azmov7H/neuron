"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  /**
   * Array of normalised values (0–100). The component renders
   * a smooth cubic-bezier path through them.
   */
  points: number[];
  /** CSS color for the stroke line */
  stroke?: string;
  /** CSS color for the area gradient start (top) */
  gradientStart?: string;
  /** Unique ID — required when multiple sparklines appear on the same page */
  id: string;
  className?: string;
  /** Show a glowing dot at the final data point */
  showEndDot?: boolean;
}

function buildPath(pts: number[], w: number, h: number): string {
  if (pts.length < 2) return "";
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map((v) => h - (v / 100) * h * 0.8 - h * 0.1);

  let d = `M ${xs[0]},${ys[0]}`;
  for (let i = 1; i < pts.length; i++) {
    const cpX = (xs[i - 1] + xs[i]) / 2;
    d += ` C ${cpX},${ys[i - 1]} ${cpX},${ys[i]} ${xs[i]},${ys[i]}`;
  }
  return d;
}

/**
 * Reusable animated SVG sparkline with an optional trailing glow dot.
 * Pass a unique `id` to avoid gradient ID collisions when multiple
 * sparklines share the same page.
 */
export function Sparkline({
  points,
  stroke = "hsl(var(--primary))",
  gradientStart = "hsl(var(--primary) / 0.25)",
  id,
  className,
  showEndDot = true,
}: SparklineProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);

  const W = 120;
  const H = 40;
  const linePath = buildPath(points, W, H);

  const lastX = points.length > 0 ? (W) : W;
  const lastY =
    points.length > 0
      ? H - (points[points.length - 1] / 100) * H * 0.8 - H * 0.1
      : H / 2;

  // Animate the stroke in on mount
  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    el.style.strokeDasharray = String(len);
    el.style.strokeDashoffset = String(len);
    requestAnimationFrame(() => {
      el.style.transition = "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)";
      el.style.strokeDashoffset = "0";
    });
  }, [points]);

  const gradId = `sparkline-grad-${id}`;
  const areaPath = linePath ? `${linePath} L ${W},${H} L 0,${H} Z` : "";

  return (
    <div className={cn("relative w-full h-10 overflow-hidden", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientStart} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        {areaPath && (
          <path
            ref={areaRef}
            d={areaPath}
            fill={`url(#${gradId})`}
            className="opacity-80"
          />
        )}

        {/* Stroke line */}
        {linePath && (
          <path
            ref={pathRef}
            d={linePath}
            fill="none"
            stroke={stroke}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Trailing dot */}
        {showEndDot && linePath && (
          <circle
            cx={lastX}
            cy={lastY}
            r={2.5}
            fill={stroke}
            style={{ filter: `drop-shadow(0 0 4px ${stroke})` }}
          />
        )}
      </svg>
    </div>
  );
}
