"use client";

import { useEffect, useRef, useState, memo, useMemo } from "react";
import { Sparkles, Sigma } from "lucide-react";
import {
  integrateLotkaVolterra,
  LOTKA_VOLTERRA_EQUILIBRIUM,
} from "@/lib/simulation/lotka-volterra";
import { presentEquation } from "@/lib/simulation/equation-presentation";

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
    id: string;
    name: string;
    equation: string;
    desc: string;
    paramsList: ParamSpec[];
  };
  params: Record<string, number>;
  isRunning?: boolean;
  resetTick?: number;
}

const W = 760;
const H = 480;
const MID = H / 2;
const PREDATOR_COLOR = "#f43f5e";
const LV_WINDOW_SECONDS = 50;
const LV_SAMPLE_COUNT = 190;

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
function ConceptualTelemetryHUDComponent({ accent, sim, params, isRunning = true, resetTick = 0 }: ConceptualTelemetryHUDProps) {
  const [phase, setPhase] = useState(0);
  const rafRef = useRef<number | null>(null);

  // Wall-clock phase accumulator: pause freezes the waveform (phase stops
  // advancing) and resume continues seamlessly from the frozen value.
  // Toolbar reset (resetTick) rewinds the accumulator to 0 — detected inside
  // the rAF callback rather than an effect, keeping phase updates in the loop.
  const phaseAccRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  const lastResetTickRef = useRef(resetTick);

  // S-04: while paused the rAF loop is cancelled entirely — no frame callbacks,
  // no 60fps setState churn, no path rebuilds. Resume installs a single fresh
  // loop whose first frame skips accumulation (safe delta), so the frozen
  // phase continues without absorbing the paused wall-clock duration.
  useEffect(() => {
    if (!isRunning) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    let id = 0;
    const loop = (t: number) => {
      if (resetTick !== lastResetTickRef.current) {
        lastResetTickRef.current = resetTick;
        phaseAccRef.current = 0;
      }
      const last = lastFrameRef.current;
      if (last !== null) {
        phaseAccRef.current += (t - last) / 1000;
      }
      lastFrameRef.current = t;
      setPhase(phaseAccRef.current);
      id = requestAnimationFrame(loop);
    };
    lastFrameRef.current = null;
    id = requestAnimationFrame(loop);
    rafRef.current = id;
    return () => {
      cancelAnimationFrame(id);
      rafRef.current = null;
    };
  }, [isRunning, resetTick]);

  const specs = sim.paramsList || [];
  const p0 = specs[0] ? params[specs[0].key] ?? specs[0].min : 1;
  const p1 = specs[1] ? params[specs[1].key] ?? specs[1].min : 1;

  const isEcosystem = sim.id === "ecosystem";

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

  // RF-3: the ecosystem simulation renders an actual Lotka–Volterra
  // integration instead of the generic two-sine waveform. MEAS-03: the
  // 190-sample integration + path building are pure functions of (p0, p1), so
  // memoize them instead of recomputing on every animation frame.
  const lvSamples = useMemo(
    () => (isEcosystem ? integrateLotkaVolterra(p0, p1, LV_WINDOW_SECONDS, LV_SAMPLE_COUNT) : []),
    [isEcosystem, p0, p1]
  );
  const maxPop = isEcosystem ? Math.max(...lvSamples.map((s) => Math.max(s.prey, s.predators)), 1) : 1;
  const yFor = (v: number) => H - 24 - (v / (maxPop * 1.08)) * (H - 48);
  const lvStepX = W / (lvSamples.length - 1);
  const headFrac = ((phase % LV_WINDOW_SECONDS) / LV_WINDOW_SECONDS);
  const headIdx = isEcosystem ? Math.min(lvSamples.length - 1, Math.floor(headFrac * (lvSamples.length - 1))) : 0;

  let path = "";
  let preyPath = "";
  let predatorPath = "";
  if (isEcosystem) {
    lvSamples.forEach((s, i) => {
      const x = i * lvStepX;
      preyPath += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${yFor(s.prey).toFixed(1)} `;
      predatorPath += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${yFor(s.predators).toFixed(1)} `;
    });
  } else {
    for (let x = 0; x <= W; x += 4) {
      const y = evalY(x);
      path += `${x === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)} `;
    }
  }

  const headX = (phase * 45) % W;
  const headY = evalY(headX);

  // Derived telemetry readouts
  const readouts: Array<[string, string]> = isEcosystem
    ? [
        [specs[0]?.label ?? "Prey", lvSamples[headIdx].prey.toFixed(1)],
        [specs[1]?.label ?? "Predators", lvSamples[headIdx].predators.toFixed(1)],
        ["Equilibrium", `${LOTKA_VOLTERRA_EQUILIBRIUM.prey} · ${LOTKA_VOLTERRA_EQUILIBRIUM.predators}`],
      ]
    : [
        ["Amplitude", `${(ampA / (H / 2)).toFixed(2)} ×`],
        ["Frequency", `${cycles.toFixed(1)} cycles`],
        ["Phase", `${(phase % (Math.PI * 2)).toFixed(2)} rad`],
      ];
  if (!isEcosystem) {
    if (specs[0]) readouts.push([specs[0].label, String(p0)]);
    if (specs[1]) readouts.push([specs[1].label, String(p1)]);
  }

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

        {/* Waveform / Lotka-Volterra curves */}
        {isEcosystem ? (
          <>
            <path
              d={preyPath}
              fill="none"
              stroke={accent}
              strokeWidth={2.5}
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 6px ${accent})` }}
            />
            <path
              d={predatorPath}
              fill="none"
              stroke={PREDATOR_COLOR}
              strokeWidth={2.5}
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 6px ${PREDATOR_COLOR})` }}
            />
          </>
        ) : (
          <path
            d={path}
            fill="none"
            stroke={accent}
            strokeWidth={2.5}
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 6px ${accent})` }}
          />
        )}

        {/* Playhead */}
        {isEcosystem ? (
          <>
            <line x1={headIdx * lvStepX} y1={0} x2={headIdx * lvStepX} y2={H} stroke={accent} strokeWidth={1} strokeOpacity={0.25} />
            <circle cx={headIdx * lvStepX} cy={yFor(lvSamples[headIdx].prey)} r={5.5} fill={accent} style={{ filter: `drop-shadow(0 0 8px ${accent})` }} />
            <circle cx={headIdx * lvStepX} cy={yFor(lvSamples[headIdx].predators)} r={5.5} fill={PREDATOR_COLOR} style={{ filter: `drop-shadow(0 0 8px ${PREDATOR_COLOR})` }} />
          </>
        ) : (
          <>
            <line x1={headX} y1={0} x2={headX} y2={H} stroke={accent} strokeWidth={1} strokeOpacity={0.25} />
            <circle cx={headX} cy={headY} r={5.5} fill={accent} style={{ filter: `drop-shadow(0 0 8px ${accent})` }} />
          </>
        )}
      </svg>

      {/* Equation + name overlay */}
      <div className="absolute top-6 left-6 font-mono text-[10px] tracking-wider text-muted-foreground/70 flex flex-col gap-1 pointer-events-none select-none">
        <span className="font-bold" style={{ color: accent }}>
          <Sigma size={11} className="inline mr-1 -mt-0.5" />
          {sim.name}
        </span>
        <span>{presentEquation(sim.equation)}</span>
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
