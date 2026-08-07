"use client";

import { useEffect, useRef, useState, memo } from "react";
import { Sparkles, Sigma } from "lucide-react";

interface ParamSpec {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface ConceptualTelemetryHUDProps {
  accent: string;
  sim: {
    name: string;
    equation: string;
    desc: string;
    paramsList: ParamSpec[];
  };
  params: Record<string, number>;
}

const W = 760;
const H = 480;
const MID = H / 2;

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function norm(value: number, min: number, max: number) {
  if (min === max) return 0.5;
  return clamp01((value - min) / (max - min));
}

/**
 * SVG-based "Conceptual Data Telemetry" renderer for the 31 simulations that
 * have no 60 FPS Canvas engine. It draws a living sinusoidal waveform whose
 * amplitude / frequency are driven by the live slider parameters, plus the
 * real equation and derived telemetry readouts. Assessment is provided by the
 * Spark AI drawer in the parent runner.
 */
function ConceptualTelemetryHUDComponent({ accent, sim, params }: ConceptualTelemetryHUDProps) {
  const [phase, setPhase] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let id = 0;
    const loop = (t: number) => {
      setPhase(t / 1000);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    rafRef.current = id;
    return () => cancelAnimationFrame(id);
  }, []);

  const specs = sim.paramsList || [];
  const p0 = specs[0] ? params[specs[0].key] ?? specs[0].min : 1;
  const p1 = specs[1] ? params[specs[1].key] ?? specs[1].min : 1;

  const n0 = specs[0] ? norm(p0, specs[0].min, specs[0].max) : 0.5;
  const n1 = specs[1] ? norm(p1, specs[1].min, specs[1].max) : 0.5;

  const cycles = 2 + n1 * 4;
  const ampA = 40 + n0 * (H / 2 - 95);
  const ampB = ampA * 0.35;

  const evalY = (x: number) => {
    const u = (x / W) * (Math.PI * 2 * cycles);
    const y = MID + ampA * Math.sin(u + phase) + ampB * Math.cos(1.7 * u - phase * 0.6);
    return Math.max(24, Math.min(H - 24, y));
  };

  let path = "";
  for (let x = 0; x <= W; x += 4) {
    const y = evalY(x);
    path += `${x === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)} `;
  }

  const headX = (phase * 45) % W;
  const headY = evalY(headX);

  // Derived telemetry readouts
  const readouts: Array<[string, string]> = [
    ["Amplitude", `${(ampA / (H / 2)).toFixed(2)} ×`],
    ["Frequency", `${cycles.toFixed(1)} cycles`],
    ["Phase", `${(phase % (Math.PI * 2)).toFixed(2)} rad`],
  ];
  if (specs[0]) readouts.push([specs[0].label, String(p0)]);
  if (specs[1]) readouts.push([specs[1].label, String(p1)]);

  return (
    <div className="absolute inset-0 w-full h-full z-0 rounded-2xl overflow-hidden bg-[#030305]">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-full block"
        role="img"
        aria-label={`Conceptual telemetry plot for ${sim.name}`}
      >
        {/* Grid */}
        <g stroke="rgba(255,255,255,0.05)" strokeWidth={1}>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={`h${f}`} x1={0} y1={H * f} x2={W} y2={H * f} />
          ))}
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={`v${f}`} x1={W * f} y1={0} x2={W * f} y2={H} />
          ))}
        </g>
        <line x1={0} y1={MID} x2={W} y2={MID} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

        {/* Waveform */}
        <path
          d={path}
          fill="none"
          stroke={accent}
          strokeWidth={2.5}
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 6px ${accent})` }}
        />

        {/* Playhead */}
        <line x1={headX} y1={0} x2={headX} y2={H} stroke={accent} strokeWidth={1} strokeOpacity={0.25} />
        <circle cx={headX} cy={headY} r={5.5} fill={accent} style={{ filter: `drop-shadow(0 0 8px ${accent})` }} />
      </svg>

      {/* Equation + name overlay */}
      <div className="absolute top-6 left-6 font-mono text-[10px] tracking-wider text-muted-foreground/70 flex flex-col gap-1 pointer-events-none select-none">
        <span className="font-bold" style={{ color: accent }}>
          <Sigma size={11} className="inline mr-1 -mt-0.5" />
          {sim.name}
        </span>
        <span>{sim.equation}</span>
      </div>

      {/* Mode badge */}
      <div className="absolute top-6 right-6 pointer-events-none">
        <span
          className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border"
          style={{ color: accent, borderColor: `${accent}55`, background: `${accent}14` }}
        >
          Conceptual Data Telemetry
        </span>
      </div>

      {/* Description */}
      <p className="absolute bottom-20 left-6 right-6 text-[10px] text-muted-foreground/60 font-mono max-w-md pointer-events-none select-none">
        {sim.desc}
      </p>

      {/* Derived telemetry readouts */}
      <div className="absolute bottom-6 left-6 font-mono text-[10px] text-foreground/80 pointer-events-none select-none">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          {readouts.map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-muted-foreground/50">{k}</span>
              <span style={{ color: accent }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Spark AI hint */}
      <div className="absolute bottom-6 right-6 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-secondary pointer-events-none">
        <Sparkles size={11} /> Open Spark AI for live assessment
      </div>
    </div>
  );
}

export const ConceptualTelemetryHUD = memo(ConceptualTelemetryHUDComponent);
