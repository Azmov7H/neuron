"use client";

import { useState } from "react";
import { Send, Sparkles, Brain, Orbit, RotateCcw, CircuitBoard } from "lucide-react";
import type {
  NlInterpretationResult,
  NlReadyResult,
} from "@/lib/simulation/nl-interpreter.service";
import type { SimulationParameter } from "@/lib/simulation/registry.types";

interface NaturalLanguageInputProps {
  onApply: (ready: NlReadyResult) => void;
}

const EXAMPLE_PROMPTS = [
  "Launch an object at a 45 degree angle",
  "Black hole with mass 10 solar masses",
  "Bacteria growth at 37 degrees Celsius",
  "Kepler orbit with axis 10 and star mass 120",
];

const MAX_TEXT_LENGTH = 500;

function formatValue(value: number, spec: SimulationParameter): string {
  const fractionDigits = spec.step < 0.1 ? 2 : 1;
  const formatted = value.toFixed(fractionDigits);
  return spec.unit ? `${formatted} ${spec.unit}` : formatted;
}

function ParameterSlider({
  spec,
  value,
  onChange,
  status,
}: {
  spec: SimulationParameter;
  value: number;
  onChange: (value: number) => void;
  status: "provided" | "missing" | "default";
}) {
  const tone =
    status === "missing"
      ? { color: "text-primary", bar: "bg-primary/15 border-primary/30", dot: "bg-primary" }
      : status === "provided"
        ? { color: "text-emerald-400", bar: "bg-emerald-400/10 border-emerald-400/25", dot: "bg-emerald-400" }
        : { color: "text-muted-foreground", bar: "bg-white/5 border-white/10", dot: "bg-white/30" };

  return (
    <div className="rounded-lg border border-white/5 bg-white/2 p-2.5 space-y-1.5 transition-colors">
      <div className="flex justify-between items-center gap-2 text-[10px] font-mono">
        <span className={`font-semibold tracking-wider uppercase ${tone.color} truncate`}>
          {spec.label}
          {status === "missing" && (
            <span className="ml-1.5 px-1 py-px rounded text-[7px] font-black bg-primary/15 text-primary uppercase tracking-widest">
              required
            </span>
          )}
          {status === "default" && (
            <span className="ml-1.5 px-1 py-px rounded text-[7px] font-black bg-white/10 text-muted-foreground uppercase tracking-widest">
              default
            </span>
          )}
        </span>
        <span className={`font-bold tabular-nums shrink-0 ${tone.color}`}>
          {formatValue(value, spec)}
        </span>
      </div>
      <input
        type="range"
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(59,130,246,0.4)] transition-all"
      />
      <div className="flex justify-between text-[8px] font-mono text-muted-foreground/50 select-none">
        <span>{formatValue(spec.min, spec)}</span>
        <span>step {spec.step}</span>
        <span>{formatValue(spec.max, spec)}</span>
      </div>
    </div>
  );
}

export function NaturalLanguageInput({ onApply }: NaturalLanguageInputProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NlInterpretationResult | null>(null);
  const [edits, setEdits] = useState<Record<string, number>>({});

  const handleSubmit = async (raw?: string) => {
    const trimmed = (raw ?? text).trim();
    if (!trimmed || loading || launching) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/simulations/natural-language", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const body = await response.json();

      if (!response.ok || !body?.success) {
        setError(body?.error?.message ?? "Interpretation failed. Try again.");
        return;
      }

      const data = body.data as NlInterpretationResult;
      setResult(data);
      if (data.status === "ready" || data.status === "needs_input") {
        setEdits({ ...(data.status === "ready" ? data.parameters : data.providedParameters) });
      }
    } catch {
      setError("Unable to reach the interpretation service.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result?.status !== "ready" || launching) return;
    setLaunching(true);
    setTimeout(() => {
      onApply({
        status: "ready",
        simulationId: result.simulationId,
        domain: result.domain,
        name: result.name,
        equation: result.equation,
        parameters: edits,
        availableParameters: result.availableParameters,
      });
    }, 300);
  };

  const handleApplyWithDefaults = () => {
    if (result?.status !== "needs_input" || launching) return;
    const params = { ...edits };
    for (const spec of result.availableParameters) {
      if (params[spec.key] === undefined) params[spec.key] = spec.default;
    }
    setLaunching(true);
    setTimeout(() => {
      onApply({
        status: "ready",
        simulationId: result.simulationId,
        domain: result.domain,
        name: result.name,
        equation: result.equation,
        parameters: params,
        availableParameters: result.availableParameters,
      });
    }, 300);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setEdits({});
    setText("");
  };

  const statusOf = (spec: SimulationParameter): "provided" | "missing" | "default" => {
    if (result?.status === "ready") return "provided";
    if (result?.status === "needs_input") {
      if (result.missingParameters.includes(spec.key)) return "missing";
      return "provided";
    }
    return "default";
  };

  const matcherCard = result && (result.status === "ready" || result.status === "needs_input") && (
    <div className="p-2.5 rounded-xl border border-white/10 bg-white/2 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[8px] font-black tracking-widest text-muted-foreground uppercase">
            Matched · {result.domain}
          </p>
          <p className="text-[11px] font-black uppercase tracking-widest text-white truncate">
            {result.name}
          </p>
        </div>
        <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-primary/15 border border-primary/25 text-primary">
          {result.status === "ready" ? "Ready" : `${result.missingParameters.length} missing`}
        </span>
      </div>
      <p className="text-[9px] font-mono text-muted-foreground/70 leading-relaxed">
        {result.equation}
      </p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none max-h-[calc(100vh-220px)]">
        {(loading || launching) && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center text-muted-foreground animate-pulse font-mono text-[10px] uppercase">
            <Orbit size={18} className="animate-spin text-secondary" />
            <span className="leading-relaxed">
              {launching
                ? "Propagating configuration to engine..."
                : "Mapping description to the simulation catalog..."}
            </span>
          </div>
        )}

        {!loading && !launching && !result && !error && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center text-muted-foreground/45 select-none">
            <div className="p-3 rounded-2xl border border-white/5 bg-white/2">
              <Brain size={22} className="text-secondary/25" />
            </div>
            <p className="text-[10px] font-mono tracking-wider uppercase leading-relaxed px-6">
              Describe an experiment in plain words. The AI maps it to a validated simulation
              configuration — it never touches the engine directly.
            </p>
            <div className="space-y-1.5 w-full px-2">
              <p className="text-[8px] font-black tracking-wider text-muted-foreground/40 uppercase">
                Try an example
              </p>
              {EXAMPLE_PROMPTS.map((example) => (
                <button
                  key={example}
                  onClick={() => {
                    setText(example);
                    handleSubmit(example);
                  }}
                  className="w-full text-left px-2 py-1 rounded-md border border-white/5 bg-white/2 hover:bg-white/5 hover:border-secondary/25 hover:text-secondary text-[9px] font-mono text-muted-foreground/60 transition-all truncate"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && !launching && error && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <span className="text-[10px] font-mono text-rose-400/90 whitespace-pre-line">
              {error}
            </span>
            <button
              onClick={() => handleSubmit()}
              className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] uppercase tracking-wider font-bold text-muted-foreground transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !launching && result?.status === "ready" && (
          <div className="space-y-3">
            {matcherCard}
            <div className="space-y-2">
              <p className="text-[8px] font-black tracking-wider text-muted-foreground uppercase">
                Configured parameters
              </p>
              {result.availableParameters.map((spec) => {
                const value = edits[spec.key] ?? spec.default;
                return (
                  <ParameterSlider
                    key={spec.key}
                    spec={spec}
                    value={value}
                    status={statusOf(spec)}
                    onChange={(next) => setEdits((prev) => ({ ...prev, [spec.key]: next }))}
                  />
                );
              })}
            </div>
            <button
              onClick={handleApply}
              className="w-full py-1.5 bg-primary/15 border border-primary/35 text-primary hover:bg-primary/25 transition-colors font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5"
            >
              <CircuitBoard size={10} /> Apply &amp; Run
            </button>
            <button
              onClick={handleReset}
              className="w-full py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] uppercase tracking-wider font-bold text-muted-foreground rounded-lg flex items-center justify-center gap-1 transition-colors"
            >
              <RotateCcw size={9} /> Edit description
            </button>
          </div>
        )}

        {!loading && !launching && result?.status === "needs_input" && (
          <div className="space-y-3">
            {matcherCard}
            <p className="text-[9px] font-mono text-muted-foreground/70 leading-relaxed">
              The AI understood{" "}
              <span className="text-emerald-400/80">most</span> of your setup — fill in the{" "}
              <span className="text-primary">highlighted</span> values to launch.
            </p>
            <div className="space-y-2">
              <p className="text-[8px] font-black tracking-wider text-muted-foreground uppercase">
                Parameters
              </p>
              {result.availableParameters.map((spec) => {
                const value = edits[spec.key] ?? spec.default;
                return (
                  <ParameterSlider
                    key={spec.key}
                    spec={spec}
                    value={value}
                    status={statusOf(spec)}
                    onChange={(next) => setEdits((prev) => ({ ...prev, [spec.key]: next }))}
                  />
                );
              })}
            </div>
            <button
              onClick={handleApplyWithDefaults}
              className="w-full py-1.5 bg-secondary/15 border border-secondary/35 text-secondary hover:bg-secondary/25 transition-colors font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5"
            >
              <Sparkles size={10} /> Apply with Defaults
            </button>
            <button
              onClick={handleReset}
              className="w-full py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] uppercase tracking-wider font-bold text-muted-foreground rounded-lg flex items-center justify-center gap-1 transition-colors"
            >
              <RotateCcw size={9} /> Add more detail
            </button>
          </div>
        )}

        {!loading && !launching && result?.status === "unsupported" && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <div className="p-3 rounded-2xl border border-white/5 bg-white/2">
              <Brain size={22} className="text-muted-foreground/20" />
            </div>
            <p className="text-[10px] font-mono text-muted-foreground leading-relaxed px-4">
              {result.message}
            </p>
            {result.suggestions.length > 0 && (
              <div className="space-y-1.5 w-full px-2">
                <p className="text-[8px] font-black tracking-wider text-muted-foreground/40 uppercase">
                  Nearby labs you can describe
                </p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {result.suggestions.map((suggestion) => (
                    <span
                      key={suggestion}
                      className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-white/5 border border-white/10 text-muted-foreground/70"
                    >
                      {suggestion}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={handleReset}
              className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] uppercase tracking-wider font-bold text-muted-foreground transition-colors flex items-center gap-1"
            >
              <RotateCcw size={9} /> New description
            </button>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-black/20 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            maxLength={MAX_TEXT_LENGTH}
            onChange={(e) => {
              setText(e.target.value);
              if (result) setResult(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Describe an experiment..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-secondary transition-colors"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={loading || launching || !text.trim()}
            className="px-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors flex items-center justify-center disabled:opacity-50"
            aria-label="Interpret description"
          >
            <Send size={10} />
          </button>
        </div>
        <div className="flex justify-between items-center text-[8px] font-mono text-muted-foreground/40 px-0.5 select-none">
          <span>AI output is strictly validated before execution</span>
          <span>
            {text.length}/{MAX_TEXT_LENGTH}
          </span>
        </div>
      </div>
    </div>
  );
}