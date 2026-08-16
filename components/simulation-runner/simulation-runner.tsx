// components/simulation-runner/simulation-runner.tsx
"use client";

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import type { LucideIcon } from "lucide-react";
import { 
  Sparkles, Play, Pause, RefreshCw, 
  Send, History, X, Settings, ChevronRight, Orbit, Brain
} from "lucide-react";
import { isInteractiveSim } from "@/components/simulations/constants";
import { DOMAIN_STYLES } from "@/components/simulations/domain-presentation";
import { ConceptualTelemetryHUD } from "@/components/simulation-runner/conceptual-telemetry-hud";
import { fetchSimulationConfig } from "@/components/simulations/simulation-config-client";
import {
  DOMAIN_ORDER,
} from "@/lib/simulation/registry";
import { buildSimulationConfigPayload } from "@/lib/simulation/config-payload";
import type { SimulationDomainConfig } from "@/lib/simulation/config-payload";
import type { ClientSimulation, ScientificDomain, SimulationParameter } from "@/lib/simulation/registry.types";

// Import centralized types and constants
import type {
  TelemetrySnapshot,
} from "@/components/simulation-runner/simulation.types";
import { SimulationEngine } from "@/components/simulation-runner/simulation-engine";
import { getSimulationStateType } from "@/components/simulation-runner/simulation-state";
import { NaturalLanguageInput } from "@/components/simulation-runner/natural-language-input";
import type { NlReadyResult } from "@/lib/simulation/nl-interpreter.service";
import { clampSimulationParameters } from "@/lib/simulation/schemas";
import { presentEquation } from "@/lib/simulation/equation-presentation";
import { FALLBACK_REASON_LABELS } from "@/lib/simulation/assessment";

// Runner-side domain config = the canonical API payload + the UI icon
// attached from the single presentation boundary.
export interface RunnerDomainConfig extends SimulationDomainConfig {
  icon: LucideIcon;
}

// Build the local fallback config from the registry (same shared builder as
// the config API) and attach presentation icons.
function buildLocalFallbackConfig(): Record<ScientificDomain, RunnerDomainConfig> {
  return buildSimulationConfigPayload().reduce((acc, domain) => {
    acc[domain.domainKey] = {
      ...domain,
      icon: DOMAIN_STYLES[domain.domainKey].icon,
    };
    return acc;
  }, {} as Record<ScientificDomain, RunnerDomainConfig>);
}

const LOCAL_FALLBACK_CONFIG = buildLocalFallbackConfig();


interface HistoryRun {
  _id: string;
  timestamp: string;
  parameters: Record<string, number>;
  aiInterpretation: {
    explanation: string;
    keyInsights: string[];
    concepts: string[];
    recommendedActions: string[];
    metadata?: {
      domain: string;
      simulationType: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      aiModel: string;
      source: 'ai' | 'deterministic';
      fallbackReason?: 'missing_api_key' | 'timeout' | 'provider_error';
    };
  };
}

/** Safe placeholder for legacy history rows that predate the AI schema. */
const EMPTY_LEGACY_INTERPRETATION: HistoryRun['aiInterpretation'] = {
  explanation: 'No stored analysis exists for this run.',
  keyInsights: [],
  concepts: [],
  recommendedActions: [],
};

/** Non-finite guard for displayed measurements (never render "NaN"). */
function formatParamValue(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : '—';
}

/**
 * S-04 telemetry isolation: the floating readout badge is the only UI driven
 * by the 10Hz telemetry snapshot. Memoizing it confines telemetry-triggered
 * re-renders to this badge (and the canvas layer) instead of re-reconciling
 * the whole lab every sync. Props are primitives + stable strings, so the
 * memo boundary is effective; no global state library involved.
 */
const TelemetryReadoutBadge = memo(function TelemetryReadoutBadge({
  name,
  equation,
  accentHex,
  isConceptual,
  timeStep,
  simulationTime,
}: {
  name: string;
  equation: string;
  accentHex: string;
  isConceptual: boolean;
  timeStep: number;
  simulationTime: number;
}) {
  return (
    <div className="px-3 py-1.5 rounded-lg bg-black/45 border border-white/5 backdrop-blur-md font-mono text-[10px] tracking-wider text-muted-foreground/60 flex items-center gap-2.5">
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          background: accentHex,
          boxShadow: `0 0 6px ${accentHex}`,
        }}
      />
      <span className="text-primary font-bold">{name}</span>
      <span className="w-px h-2.5 bg-white/10" />
      <span>{presentEquation(equation)}</span>
      {/* Only canvas labs emit real telemetry — hide the frame for conceptual HUD */}
      {!isConceptual && (
        <>
          <span className="w-px h-2.5 bg-white/10" />
          <span>Frame {timeStep}</span>
          {/* Physical clock (seconds) — frame-rate independent (S-03) */}
          <span className="text-muted-foreground/40">t {simulationTime.toFixed(1)}s</span>
        </>
      )}
    </div>
  );
});


// ============================================================================
// MAIN REAL-TIME SCIENTIFIC SIMULATION ENGINE COMPONENT
// ============================================================================
export function SimulationRunner({ slug }: { slug: string }) {
  const [domainsConfig, setDomainsConfig] = useState<Record<ScientificDomain, RunnerDomainConfig> | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);

  // States
  const [activeDomain, setActiveDomain] = useState<ScientificDomain>('physics');
  const [activeSimId, setActiveSimId] = useState<string>('relativity');

  const [uiActive, setUiActive] = useState<boolean>(true);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Playback and UI States
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [historyRuns, setHistoryRuns] = useState<HistoryRun[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Asynchronous Intel Drawer States
  const [aiOpen, setAiOpen] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiStreamText, setAiStreamText] = useState<string>("");
  const [aiResult, setAiResult] = useState<HistoryRun['aiInterpretation'] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [userQuestion, setUserQuestion] = useState<string>("");

  // Conceptual labs animate inside the SVG HUD: bump this counter to rewind
  // the HUD's phase when the toolbar reset is pressed without a canvas engine.
  const [conceptualResetTick, setConceptualResetTick] = useState<number>(0);

  // Natural-language experiment input mode (toggleable inside the AI drawer)
  const [nlMode, setNlMode] = useState<'traditional' | 'natural-language'>('traditional');

  // Live Sync Telemetry Overlay State
  const [telemetrySnap, setTelemetrySnap] = useState<TelemetrySnapshot>({
    timeStep: 0,
    simulationTime: 0,
    stateType: getSimulationStateType(activeSimId),
    stateSnapshot: {},
  });

  // Slider view parameters
  const [localParams, setLocalParams] = useState<Record<string, number>>({});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<SimulationEngine | null>(null);
  const historyCacheRef = useRef<Record<string, HistoryRun[]>>({});
  const pendingParamUpdatesRef = useRef<Record<string, number>>({});
  const paramUpdateRafRef = useRef<number | null>(null);
  // AI-generated configuration to seed the next engine instantiation with,
  // instead of registry defaults (consumed by the engine-creation effect).
  const nlParamOverrideRef = useRef<{
    simulationId: string;
    domain: ScientificDomain;
    parameters: Record<string, number>;
  } | null>(null);

  const activeDomainConfig = useMemo(
    () => (domainsConfig ? domainsConfig[activeDomain] : null),
    [domainsConfig, activeDomain]
  );

  const activeSim = useMemo<ClientSimulation | null>(
    () =>
      activeDomainConfig
        ? activeDomainConfig.simulations.find((s) => s.id === activeSimId) || activeDomainConfig.simulations[0]
        : null,
    [activeDomainConfig, activeSimId]
  );

  const isConceptual = useMemo(() => !isInteractiveSim(activeSimId), [activeSimId]);

  const flushPendingEngineUpdates = useCallback(() => {
    // Always release the RAF handle and clear the pending batch, even when no
    // engine exists (e.g. conceptual labs). Otherwise paramUpdateRafRef stays
    // non-null forever and every later slider change is silently dropped.
    const rafId = paramUpdateRafRef.current;
    paramUpdateRafRef.current = null;
    if (rafId !== null) cancelAnimationFrame(rafId);

    const engine = engineRef.current;
    const pending = pendingParamUpdatesRef.current;
    pendingParamUpdatesRef.current = {};
    if (!engine || Object.keys(pending).length === 0) return;

    Object.entries(pending).forEach(([key, value]) => {
      engine.updateParameter(key, value);
    });
  }, []);

  const scheduleEngineParameterUpdate = useCallback((key: string, value: number) => {
    pendingParamUpdatesRef.current[key] = value;
    if (paramUpdateRafRef.current === null) {
      paramUpdateRafRef.current = requestAnimationFrame(() => {
        flushPendingEngineUpdates();
      });
    }
  }, [flushPendingEngineUpdates]);

  useEffect(() => {
    // Background-tab safety (RC-02): rAF is suspended while the tab is
    // hidden, so slider changes made there would otherwise sit unapplied in
    // the pending batch until the tab re-paints. Flush them on visibility
    // return so the engine never silently runs stale parameters.
    const onVisibilityVisible = () => {
      if (!document.hidden && paramUpdateRafRef.current !== null) {
        flushPendingEngineUpdates();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityVisible);
      if (paramUpdateRafRef.current) {
        cancelAnimationFrame(paramUpdateRafRef.current);
        paramUpdateRafRef.current = null;
      }
    };
  }, [flushPendingEngineUpdates]);

  // Fetch Database Configurations on mount
  useEffect(() => {
    let isMounted = true;

    // Resolve the initial domain + simulation from the URL slug (can be a
    // domain key or a simulation id) against a typed config record.
    const resolveSlug = (mapping: Record<ScientificDomain, RunnerDomainConfig>) => {
      let initialDomain: ScientificDomain = 'physics';
      let initialSimId = '';

      for (const domKey of DOMAIN_ORDER) {
        const domConfig = mapping[domKey];
        if (slug === domKey) {
          initialDomain = domKey;
          initialSimId = domConfig.simulations[0]?.id || '';
          break;
        }
        const matched = domConfig.simulations.find((sim) => sim.id === slug);
        if (matched) {
          initialDomain = domKey;
          initialSimId = matched.id;
          break;
        }
      }

      if (!initialSimId && mapping[initialDomain]) {
        initialSimId = mapping[initialDomain].simulations[0]?.id || 'relativity';
      }
      return { initialDomain, initialSimId };
    };

    // Attach presentation icons to the API payload record (type-safe:
    // RunnerDomainConfig = payload + icon).
    const withIcons = (payload: Record<ScientificDomain, SimulationDomainConfig>): Record<ScientificDomain, RunnerDomainConfig> =>
      DOMAIN_ORDER.reduce((acc, domain) => {
        acc[domain] = {
          ...payload[domain],
          icon: DOMAIN_STYLES[domain].icon,
        };
        return acc;
      }, {} as Record<ScientificDomain, RunnerDomainConfig>);

    const resolveInitialConfig = async () => {
      try {
        const fetchedConfig = await fetchSimulationConfig();
        const mapping = withIcons(fetchedConfig || LOCAL_FALLBACK_CONFIG);

        if (!isMounted) return;
        setDomainsConfig(mapping);

        const resolved = resolveSlug(mapping);
        setActiveDomain(resolved.initialDomain);
        setActiveSimId(resolved.initialSimId);
        const activeSimObj = mapping[resolved.initialDomain]?.simulations.find((s) => s.id === resolved.initialSimId) || mapping[resolved.initialDomain]?.simulations[0];
        if (activeSimObj) setLocalParams(activeSimObj.defaultParams ?? {});
      } catch (err) {
        console.warn("[Simulation Config Loader] Failed, using local client fallbacks:", err);
        if (!isMounted) return;
        setDomainsConfig(LOCAL_FALLBACK_CONFIG);

        const resolved = resolveSlug(LOCAL_FALLBACK_CONFIG);
        setActiveDomain(resolved.initialDomain);
        setActiveSimId(resolved.initialSimId);
        const activeSimObj = LOCAL_FALLBACK_CONFIG[resolved.initialDomain].simulations.find((s) => s.id === resolved.initialSimId) || LOCAL_FALLBACK_CONFIG[resolved.initialDomain].simulations[0];
        if (activeSimObj) setLocalParams(activeSimObj.defaultParams ?? {});
      } finally {
        if (isMounted) setIsLoadingConfig(false);
      }
    };

    resolveInitialConfig();
    return () => { isMounted = false; };
  }, [slug]);

  const resetActivityTimer = useCallback(() => {
    setUiActive(true);
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
    }
    
    if (!aiOpen && !sidebarOpen && !showHistory) {
      activityTimerRef.current = setTimeout(() => {
        setUiActive(false);
      }, 3500);
    }
  }, [aiOpen, sidebarOpen, showHistory]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      resetActivityTimer();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    };
  }, [resetActivityTimer]);

  // EDGE-05: clear the previous simulation's telemetry on sim switch so the
  // floating badge cannot show the old lab's time under the new lab's name.
  // Deliberately a render-time adjustment (before the engine effect): React
  // re-renders immediately with the cleared snapshot, so the engine
  // instantiation effect never sees the stale badge.
  const [prevTelemetrySimId, setPrevTelemetrySimId] = useState(activeSimId);
  if (prevTelemetrySimId !== activeSimId) {
    setPrevTelemetrySimId(activeSimId);
    setTelemetrySnap({
      timeStep: 0,
      simulationTime: 0,
      stateType: getSimulationStateType(activeSimId),
      stateSnapshot: {},
    });
  }

  // Instantiates decoupled core engine when Sim toggles
  useEffect(() => {
    let syncTimer: number | null = null;

    // Param updates and coalesced RAF flushes are per-simulation: drop any
    // stale batch from the previously running lab so it cannot leak into the
    // engine created below.
    pendingParamUpdatesRef.current = {};
    if (paramUpdateRafRef.current !== null) {
      cancelAnimationFrame(paramUpdateRafRef.current);
      paramUpdateRafRef.current = null;
    }

    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }

    if (!activeSim) return;

    // Natural-language overrides: if an AI-generated configuration targets the
    // upcoming simulation, seed the engine with it instead of registry defaults.
    const nlOverride = nlParamOverrideRef.current;
    const initialParams =
      nlOverride &&
      nlOverride.simulationId === activeSimId &&
      nlOverride.domain === activeDomain
        ? nlOverride.parameters
        : activeSim.defaultParams;
    nlParamOverrideRef.current = null;

    // Conceptual labs have no Canvas engine — the SVG HUD handles rendering.
    if (isConceptual) {
      syncTimer = window.setTimeout(() => {
        setLocalParams(initialParams);
        setAiStreamText("");
        setAiResult(null);
        setAiError(null);
      }, 0);
      return () => {
        if (syncTimer !== null) window.clearTimeout(syncTimer);
      };
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new SimulationEngine(
      canvas,
      activeDomain,
      activeSimId,
      initialParams,
      (snap) => {
        setTelemetrySnap(snap);
      }
    );

    engineRef.current = engine;
    engine.isRunning = isRunning;
    engine.start();

    syncTimer = window.setTimeout(() => {
      setLocalParams(initialParams);
      setAiStreamText("");
      setAiResult(null);
      setAiError(null);
    }, 0);

    return () => {
      engine.destroy();
      if (syncTimer !== null) window.clearTimeout(syncTimer);
    };
  // NOTE: isRunning intentionally excluded — a separate effect (below) syncs it.
  // Including it here would destroy + re-create the engine on every pause/play.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSimId, activeDomain, activeSim, isLoadingConfig, isConceptual]);

  useEffect(() => {
    // S-04: Pausing suspends the engine's rAF loop entirely — no physics, no
    // render work, no telemetry emission — and resume restarts a single clean
    // loop whose first frame uses a safe nominal delta (the paused wall-clock
    // duration is never absorbed).
    const engine = engineRef.current;
    if (!engine) return;
    if (isRunning) engine.resume();
    else engine.pause();
  }, [isRunning]);

  useEffect(() => {
    if (!showHistory || !activeSimId) return;

    let active = true;
    const loadHistory = async () => {
      // Cache hit: serve synchronously-available data from the callback
      // (never from the effect body — the lint contract forbids setState
      // directly inside the effect) and clear any stale error from a
      // previous failed fetch.
      if (historyCacheRef.current[activeSimId]) {
        if (!active) return;
        setHistoryRuns(historyCacheRef.current[activeSimId]);
        setHistoryError(null);
        return;
      }

      try {
        const response = await fetch(`/api/simulations/history?simulationId=${activeSimId}&limit=5`, {
          credentials: "include",
        });
        if (!active || !response.ok) return;
        const body = await response.json();
        if (body.success && body.data) {
          historyCacheRef.current[activeSimId] = body.data;
          setHistoryRuns(body.data);
          setHistoryError(null);
        }
      } catch (e) {
        // UX-07: a failed history fetch must not masquerade as an empty
        // history — surface the failure to the user instead.
        console.warn("Failed fetching history runs:", e);
        setHistoryRuns([]);
        setHistoryError("Calibration history couldn't be loaded.");
      }
    };

    loadHistory();
    return () => {
      active = false;
    };
  }, [showHistory, activeSimId]);

  const handleSliderChange = useCallback((key: string, val: number) => {
    setLocalParams((prev) => ({ ...prev, [key]: val }));
    scheduleEngineParameterUpdate(key, val);
  }, [scheduleEngineParameterUpdate]);

  // Full reset per the simulation contract: return the current simulation to
  // a clean initial state using the registry defaults — engine time, engine
  // state, parameters (React + engine), telemetry, and assessment output.
  const handleFullReset = useCallback(() => {
    if (!activeSim) return;

    // RC-01: drain any deferred slider batch BEFORE resetting. Without this,
    // a slider drag followed immediately by Reset lets the next RAF flush
    // re-apply the stale pre-reset user value into engine.parameters after
    // resetTime() — leaving sliders at defaults while the engine runs the
    // wrong experiment.
    pendingParamUpdatesRef.current = {};
    if (paramUpdateRafRef.current !== null) {
      cancelAnimationFrame(paramUpdateRafRef.current);
      paramUpdateRafRef.current = null;
    }

    setLocalParams(activeSim.defaultParams);

    const engine = engineRef.current;
    if (engine) {
      // Synchronize engine parameters with the restored defaults BEFORE
      // resetting state, so re-initialized sub-simulations (immune, virus,
      // graph, probability) are seeded with the clean configuration.
      Object.entries(activeSim.defaultParams).forEach(([key, value]) => {
        engine.updateParameter(key, value);
      });
      engine.resetTime();
    } else {
      // Conceptual labs have no canvas engine: rewind the HUD animation phase.
      setConceptualResetTick((t) => t + 1);
    }

    // Clear telemetry state and any stale assessment/stream output.
    setTelemetrySnap({
      timeStep: 0,
      simulationTime: 0,
      stateType: getSimulationStateType(activeSim.id),
      stateSnapshot: {},
    });
    setAiStreamText("");
    setAiResult(null);
    setAiError(null);
  }, [activeSim]);

  // Parameter-only default restore. Observations (P3 runtime audit, PHYS-04):
  // a "Defaults" action must not leave a dynamic simulation running from grown
  // state under default sliders — that is an internal inconsistency users read
  // as a bug. Route it through the same deterministic reset contract as the
  // toolbar reset: parameters + engine time/state + telemetry.
  const handleResetParams = useCallback(() => {
    handleFullReset();
  }, [handleFullReset]);

  const handleSparkAIInterpretation = async () => {
    if (isAiLoading || !activeSim) return;
    setAiOpen(true);
    setIsAiLoading(true);
    setAiStreamText("");
    setAiResult(null);
    setAiError(null);

    const eng = engineRef.current;
    const paramsSnapshot = eng ? { ...eng.parameters } : localParams;
    // S-07 assessment payload contract: distinguish real measured state from
    // parameter-driven renders and conceptual visualizations. Dynamic engines
    // send their live snapshot; parameterized engines communicate the render
    // clock; conceptual labs signal explicitly that no dynamic state exists —
    // never an empty "no state" object.
    const stateType = eng ? eng.stateType : 'conceptual';
    const simulationTime = eng ? eng.simulationTime : undefined;
    const stateSnapshot = eng
      ? { ...eng.stateSnapshot }
      : { visualizationState: 'conceptual' };

    try {
      // SIM-BUG-002: Use credential-forwarding cookies (neuron_session httpOnly) instead of insecure localStorage
      const response = await fetch("/api/simulations/interpret", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: activeDomain,
          simulationId: activeSimId,
          parameters: paramsSnapshot,
          stateSnapshot,
          stateType,
          simulationTime,
          userQuestion: userQuestion ? userQuestion.trim() : undefined
        })
      });

      if (!response.ok) {
        // Surface the server's own message (e.g. 429 rate-limit responses)
        // instead of genericizing every failure into a connection error.
        let message = "API Connection failed";
        try {
          const body = await response.json();
          const serverMessage =
            body?.error?.message ?? body?.message ?? (typeof body === "string" ? body : null);
          if (typeof serverMessage === "string" && serverMessage.length > 0) {
            message = serverMessage;
          }
        } catch {}
        throw new Error(message);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader body");

      let accum = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const tokenChunk = decoder.decode(value, { stream: true });
        accum += tokenChunk;

        let visible = accum;
        if (visible.includes("[METADATA_EVENT]")) visible = visible.split("[METADATA_EVENT]")[0].trim();
        if (visible.includes("[METADATA]")) visible = visible.split("[METADATA]")[0].trim();
        setAiStreamText(visible);

        if (accum.includes("[METADATA_EVENT]")) {
          const parts = accum.split("[METADATA_EVENT]");
          const raw = parts[1]?.split("[END]")[0]?.trim();
          if (raw) {
            try {
              const meta = JSON.parse(raw);
              if (meta.interpretation) setAiResult(meta.interpretation);
            } catch {}
          }
        }
      }
    } catch (e) {
      console.warn("[Spark AI] Interpretation failed, surfacing explicit error state:", e);
      setAiStreamText("");
      setAiResult(null);
      setAiError(
        "Unable to reach the analysis service. The simulation is still running locally — retry the assessment or keep experimenting with the live lab."
      );
    } finally {
      setIsAiLoading(false);
      setUserQuestion("");
    }
  };

  const loadHistoryItem = (item: HistoryRun) => {
    if (!activeSim) return;
    // VAL-02: persisted parameters can be out-of-registry (legacy rows, or
    // writes from a bypassing client). Clamp them into the registry ranges
    // before touching the engine so a restored value (e.g. mass=0 → a=∞,
    // v≥1 → √(1−v²)=NaN) can never poison live physics.
    const { clamped } = clampSimulationParameters(activeSim.id, activeDomain, item.parameters || {});
    setLocalParams(clamped);
    if (engineRef.current) {
      Object.entries(clamped).forEach(([k, v]) => {
        engineRef.current?.updateParameter(k, v);
      });
    }
    // Stale/pre-schema history rows must not crash the runner: present them
    // with a safe placeholder instead of dereferencing undefined fields.
    const interpretation = item.aiInterpretation ?? EMPTY_LEGACY_INTERPRETATION;
    setAiResult(interpretation);
    setAiStreamText(
      `[EXPLANATION]\n${interpretation.explanation}\n\n[KEY INSIGHTS]\n${(interpretation.keyInsights ?? []).map((i: string) => `- ${i}`).join('\n')}`
    );
    setShowHistory(false);
    setAiOpen(true);
    setAiError(null);
  };

  // Applies an AI-generated configuration: same execution path as slider input.
  const handleNlApply = useCallback((ready: NlReadyResult) => {
    const engine = engineRef.current;
    const sameSim =
      !!engine && engine.simId === ready.simulationId && engine.domain === ready.domain;

    if (sameSim && isInteractiveSim(ready.simulationId)) {
      Object.entries(ready.parameters).forEach(([key, value]) => {
        engine.updateParameter(key, value);
      });
      setLocalParams(ready.parameters);
    } else if (sameSim) {
      setLocalParams(ready.parameters);
    } else {
      nlParamOverrideRef.current = {
        simulationId: ready.simulationId,
        domain: ready.domain,
        parameters: ready.parameters,
      };
      setActiveDomain(ready.domain);
      setActiveSimId(ready.simulationId);
      setLocalParams(ready.parameters);
    }

    setUiActive(true);
    setAiOpen(false);
  }, []);

  if (isLoadingConfig || !activeSim || !domainsConfig) {
    return (
      <div className="w-full h-full rounded-2xl border border-white/5 bg-[#030305] flex flex-col items-center justify-center gap-3 text-muted-foreground animate-pulse text-[10px] font-mono uppercase tracking-widest shadow-2xl">
        <Orbit size={24} className="animate-spin text-primary" />
        <span>Loading laboratories scope...</span>
      </div>
    );
  }

  return (
    <div 
      onMouseMove={resetActivityTimer}
      onClick={resetActivityTimer}
      onTouchStart={resetActivityTimer}
      className="flex h-full w-full bg-[#030305] overflow-hidden relative text-foreground font-sans select-none rounded-2xl border border-white/5 shadow-2xl"
    >
      
      {/* ======================================================================
          1. SIMULATION CANVAS LAYER (PRIMARY FOCUS - 100% CONTAINER PORT)
          ====================================================================== */}
      {isConceptual ? (
        <ConceptualTelemetryHUD
          accent={activeDomainConfig?.accentHex || "#3b82f6"}
          sim={activeSim}
          params={localParams}
          isRunning={isRunning}
          resetTick={conceptualResetTick}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full z-0 rounded-2xl overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover block"
          />

          {/* Soft edge grid overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030305]/60 via-transparent to-[#030305]/10 pointer-events-none" />
        </div>
      )}

      {/* Floating HUD Readout Overlay (Hides on inactivity) */}
      <div className={`absolute top-6 left-6 z-10 transition-all duration-500 ease-out select-none pointer-events-none ${
        uiActive 
          ? "opacity-100 scale-100 translate-y-0" 
          : "opacity-0 scale-[0.98] -translate-y-2"
      }`}>
        <TelemetryReadoutBadge
          name={activeSim.name}
          equation={activeSim.equation}
          accentHex={activeDomainConfig?.accentHex || '#3b82f6'}
          isConceptual={isConceptual}
          timeStep={telemetrySnap.timeStep}
          simulationTime={telemetrySnap.simulationTime}
        />
      </div>

      {/* Top Floating Systems Console Bar (Hides on inactivity) */}
      <div className={`absolute top-6 right-6 z-20 flex items-center gap-2.5 transition-all duration-500 ease-out ${
        uiActive 
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" 
          : "opacity-0 scale-[0.98] -translate-y-2 pointer-events-none"
      }`}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Close laboratories panel" : "Open laboratories panel"}
          className="p-2 rounded-lg bg-black/45 border border-white/5 hover:border-white/15 text-muted-foreground hover:text-white transition-all backdrop-blur-md flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold"
        >
          <Settings size={12} /> Labs
        </button>

        <button
          onClick={() => setIsRunning(!isRunning)}
          aria-label={isRunning ? "Pause simulation" : "Resume simulation"}
          className={`p-2 rounded-lg bg-black/45 border border-white/5 backdrop-blur-md transition-all flex items-center gap-1.5 ${
            isRunning 
              ? 'text-emerald-400/90 hover:border-emerald-400/25' 
              : 'text-amber-400/90 hover:border-amber-400/25'
          }`}
        >
          {isRunning ? <Pause size={12} /> : <Play size={12} />}
          <span className={`text-[8px] font-black uppercase tracking-widest ${isRunning ? 'text-emerald-400/80' : 'text-amber-400/80'}`}>
            {isRunning ? 'Run' : 'Paused'}
          </span>
        </button>

        <button
          onClick={handleFullReset}
          aria-label="Reset simulation"
          className="p-2 rounded-lg bg-black/45 border border-white/5 hover:border-white/15 text-muted-foreground hover:text-white transition-all backdrop-blur-md"
        >
          <RefreshCw size={12} />
        </button>

        <button
          onClick={() => setAiOpen(!aiOpen)}
          aria-label={aiOpen ? "Close Spark AI panel" : "Open Spark AI analysis"}
          className={`p-2 rounded-lg border transition-all backdrop-blur-md flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold ${
            aiOpen 
              ? 'bg-secondary text-secondary-foreground border-secondary/40 shadow-[0_0_15px_rgba(167,139,250,0.25)]' 
              : 'bg-black/45 border border-white/5 hover:border-white/15 text-secondary hover:text-white'
          }`}
        >
          <Sparkles size={12} /> Spark AI
        </button>
      </div>

      {/* ======================================================================
          2. CONTEXT LAYER (COLLAPSIBLE FLOATING GLASS DRAWER)
          ====================================================================== */}
      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-xl transition-all duration-500 ease-out ${
        uiActive 
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" 
          : "opacity-0 scale-[0.98] translate-y-4 pointer-events-none"
      }`}>
        <div className="bg-black/20 border border-white/5 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden p-3.5 space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[8px] font-black tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
              <span
                className="w-1 h-1 rounded-full"
                style={{ background: activeDomainConfig?.accentHex || '#3b82f6' }}
              />
              Live Parameters
            </span>
            <button
              onClick={handleResetParams}
              className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground border border-white/5 hover:border-white/15 transition-colors flex items-center gap-1"
            >
              <RefreshCw size={8} /> Defaults
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {activeSim.paramsList.map((p: SimulationParameter) => {
              const val = localParams[p.key] ?? p.min;
              return (
                <div key={p.key} className="rounded-lg border border-white/5 bg-white/2 p-2.5 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    {/* UX-01: render the registry unit beside the value (and
                        strip it from the label when already embedded, so the
                        unit is never shown twice). */}
                    <span className="text-muted-foreground font-semibold tracking-wider uppercase truncate">
                      {p.unit
                        ? p.label.replace(new RegExp(`\\s*\\(${p.unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)$`), '')
                        : p.label}
                    </span>
                    <span className="text-primary font-bold tabular-nums">
                      {p.type === 'integer' ? String(Math.round(val)) : val.toFixed(p.step < 0.1 ? 2 : 1)}
                      {p.unit ? ` ${p.unit}` : ''}
                    </span>
                  </div>
                  <input 
                    type="range"
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    value={val}
                    onChange={(e) => handleSliderChange(p.key, parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(59,130,246,0.4)] transition-all"
                  />
                  <div className="flex justify-between text-[7px] font-mono text-muted-foreground/40 select-none">
                    <span>{p.min}{p.unit ? ` ${p.unit}` : ''}</span>
                    <span>step {p.step}</span>
                    <span>{p.max}{p.unit ? ` ${p.unit}` : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================================================
          3. INTELLIGENCE LAYER (SPARK AI SLIDE DRAWERS)
          ====================================================================== */}
      <div className={`absolute top-0 right-0 h-full w-80 bg-black/45 border-l border-white/5 backdrop-blur-lg z-30 transition-transform duration-300 shadow-2xl flex flex-col rounded-r-2xl ${
        aiOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/25">
          <div className="flex items-center gap-1.5">
            <Sparkles className="text-secondary animate-pulse" size={14} />
            <h2 className="text-[10px] font-black tracking-widest uppercase text-white">Spark Analyst</h2>
          </div>
          <button 
            onClick={() => setAiOpen(false)}
            className="text-muted-foreground hover:text-white transition-colors"
            aria-label="Close Spark AI panel"
          >
            <X size={14} />
          </button>
        </div>

        {/* Mode toggle: traditional telemetry vs natural-language input */}
        <div className="p-3 border-b border-white/5 flex gap-1.5 bg-black/25">
          <button
            onClick={() => setNlMode('traditional')}
            className={`flex-1 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-colors border ${
              nlMode === 'traditional'
                ? 'bg-secondary/15 border-secondary/30 text-secondary'
                : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'
            }`}
          >
            Telemetry
          </button>
          <button
            onClick={() => setNlMode('natural-language')}
            className={`flex-1 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-colors border flex items-center justify-center gap-1 ${
              nlMode === 'natural-language'
                ? 'bg-secondary/15 border-secondary/30 text-secondary'
                : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles size={9} /> Describe
          </button>
        </div>

        {nlMode === 'traditional' && (
        <>
        {/* Console stream log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none max-h-[calc(100vh-140px)]">
          {/* Assessment origin badge — AI output is never conflated with the
              deterministic local fallback. */}
          {aiResult?.metadata?.source && (
            <div
              className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-mono leading-relaxed select-none ${
                aiResult.metadata.source === "ai"
                  ? "border-sci-ai/25 bg-sci-ai/10 text-sci-ai/90"
                  : "border-white/10 bg-white/5 text-muted-foreground"
              }`}
              role="status"
            >
              {aiResult.metadata.source === "ai" ? (
                <>
                  <span className="font-black uppercase tracking-widest">AI Analysis</span>
                  <span className="mx-1.5 opacity-50">·</span>
                  {aiResult.metadata.aiModel || "configured model"}
                </>
              ) : (
                <>
                  <span className="font-black uppercase tracking-widest">Local Deterministic Analysis</span>
                  <span className="mx-1.5 opacity-50">·</span>
                  Generated without an AI model
                  {aiResult.metadata.fallbackReason && (
                    <>
                      {" "}
                      (reason:{" "}
                      {FALLBACK_REASON_LABELS[aiResult.metadata.fallbackReason] ??
                        aiResult.metadata.fallbackReason}
                      )
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {isAiLoading && !aiStreamText && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center text-muted-foreground animate-pulse font-mono text-[10px] uppercase">
              <Orbit size={18} className="animate-spin text-secondary" />
              <span>Analyzing live telemetry...</span>
            </div>
          )}

          {!isAiLoading && !aiStreamText && !aiError && (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-center text-muted-foreground/45 select-none">
              <Brain size={20} className="text-secondary/20" />
              <p className="text-[10px] font-mono tracking-wider uppercase">Submit Telemetry Assessment to begin.</p>
            </div>
          )}

          {aiError && !isAiLoading && (
            <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 space-y-2" role="alert">
              <p className="text-[10px] font-mono text-rose-300/90 leading-relaxed">{aiError}</p>
              <button
                onClick={handleSparkAIInterpretation}
                className="w-full py-1 bg-rose-400/15 border border-rose-400/30 text-rose-300 hover:bg-rose-400/25 transition-colors font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={10} /> Retry Assessment
              </button>
            </div>
          )}

          {aiStreamText && (
            <div className="whitespace-pre-line text-[10px] font-mono text-foreground/90 bg-white/2 rounded-xl p-3 border border-white/5 leading-relaxed overflow-x-auto select-text">
              {aiStreamText}
            </div>
          )}

          {/* Tag discovered concepts */}
          {aiResult?.concepts && (
            <div className="space-y-1.5 select-none">
              <span className="text-[8px] font-black tracking-wider text-muted-foreground uppercase block">Discovered Concepts</span>
              <div className="flex flex-wrap gap-1">
                {aiResult.concepts.map((concept: string) => (
                  <span 
                    key={concept} 
                    className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-secondary/10 border border-secondary/20 text-secondary hover:bg-secondary/20 transition-colors cursor-pointer"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action advices */}
          {aiResult?.recommendedActions && (
            <div className="space-y-1.5">
              <span className="text-[8px] font-black tracking-wider text-muted-foreground uppercase block">Recommended Adjustments</span>
              <ul className="space-y-1 list-none pl-0 text-[10px] font-mono">
                {aiResult.recommendedActions.map((act: string, idx: number) => (
                  <li key={idx} className="pl-3.5 relative before:content-['-'] before:absolute before:left-0 before:text-secondary text-foreground/80">
                    {act}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Input block bar */}
        <div className="p-4 border-t border-white/5 bg-black/20 space-y-2">
          <div className="flex gap-2">
            <input 
              type="text"
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              placeholder="Ask custom question..."
              onKeyDown={(e) => e.key === 'Enter' && handleSparkAIInterpretation()}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-secondary transition-colors"
            />
            <button
              onClick={handleSparkAIInterpretation}
              disabled={isAiLoading}
              aria-label="Submit telemetry assessment"
              className="px-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              <Send size={10} />
            </button>
          </div>
          
          <button
            onClick={handleSparkAIInterpretation}
            disabled={isAiLoading}
            className="w-full py-1.5 bg-secondary/15 border border-secondary/35 text-secondary hover:bg-secondary/25 transition-colors font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles size={10} />
            {isAiLoading ? "Interpreting..." : "Telemetry Assessment"}
          </button>
        </div>
        </>
      )}

      {nlMode === 'natural-language' && (
        <NaturalLanguageInput onApply={handleNlApply} />
      )}
      </div>

      {/* Left Laboratories Sidebar Selection Drawer */}
      <div className={`absolute top-0 left-0 h-full w-60 bg-black/50 border-r border-white/5 backdrop-blur-lg z-40 transition-transform duration-300 shadow-2xl flex flex-col rounded-l-2xl ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/25">
          <span className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: activeDomainConfig?.accentHex || '#3b82f6',
                boxShadow: `0 0 8px ${activeDomainConfig?.accentHex || '#3b82f6'}`,
              }}
            />
            Laboratories
          </span>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="text-muted-foreground hover:text-white transition-colors"
            aria-label="Close laboratories panel"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-none">
          <span className="block px-1 text-[8px] font-black tracking-widest text-muted-foreground/40 uppercase">Domains</span>
          {DOMAIN_ORDER.map((domKey) => {
            const domConfig = domainsConfig[domKey];
            const Icon = domConfig.icon;
            const isActive = activeDomain === domKey;
            
            return (
              <div key={domKey} className="space-y-1">
                <button
                  onClick={() => {
                    setActiveDomain(domKey);
                    setActiveSimId(domConfig.simulations[0].id);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-[10px] uppercase font-bold tracking-wider transition-all ${
                    isActive 
                      ? 'text-white' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
                  }`}
                  style={isActive ? {
                    backgroundColor: `${domConfig.accentHex}14`,
                    borderColor: `${domConfig.accentHex}33`,
                    boxShadow: `inset 0 0 12px ${domConfig.accentHex}0d`,
                  } : undefined}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="w-1 h-1 rounded-full shrink-0"
                      style={{
                        background: domConfig.accentHex,
                        opacity: isActive ? 1 : 0.5,
                        boxShadow: isActive ? `0 0 8px ${domConfig.accentHex}` : 'none',
                      }}
                    />
                    <Icon size={12} style={isActive ? { color: domConfig.accentHex } : undefined} className="text-muted-foreground" />
                    {domConfig.name}
                  </span>
                  <ChevronRight size={10} className={`transition-transform ${isActive ? 'rotate-90' : 'text-muted-foreground'}`} style={isActive ? { color: domConfig.accentHex } : undefined} />
                </button>

                {isActive && (
                  <div className="pl-4 space-y-1 mt-0.5 ml-3.5" style={{ borderLeft: `1px solid ${domConfig.accentHex}26` }}>
                    {domConfig.simulations.map((sim: ClientSimulation) => {
                      const isSimActive = activeSimId === sim.id;
                      return (
                        <button
                          key={sim.id}
                          onClick={() => {
                            setActiveSimId(sim.id);
                            setSidebarOpen(false); // Close drawer on selection
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-medium transition-all ${
                            isSimActive 
                              ? 'font-bold' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                          }`}
                          style={isSimActive ? {
                            color: domConfig.accentHex,
                            backgroundColor: `${domConfig.accentHex}14`,
                          } : undefined}
                        >
                          {sim.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* History calibration panel button */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => {
              setSidebarOpen(false);
              setShowHistory(true);
            }}
            className="w-full py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] uppercase tracking-wider font-bold rounded-lg flex items-center justify-center gap-1 transition-colors group"
          >
            <History size={10} className="text-muted-foreground group-hover:text-white transition-colors" /> History
          </button>
        </div>
      </div>

      {/* Calibration history modal */}
      {showHistory && (
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 rounded-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Calibration history"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowHistory(false);
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowHistory(false);
          }}
        >
          <div className="w-full max-w-sm bg-black/70 border border-white/5 rounded-2xl p-4 shadow-2xl space-y-3 backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
              <h3 className="text-[10px] font-black uppercase text-foreground tracking-widest flex items-center gap-1.5">
                <span
                  className="w-1 h-1 rounded-full"
                  style={{
                    background: activeDomainConfig?.accentHex || '#3b82f6',
                    boxShadow: `0 0 6px ${activeDomainConfig?.accentHex || '#3b82f6'}`,
                  }}
                />
                Calibration History
              </h3>
              <button 
                onClick={() => setShowHistory(false)}
                className="text-muted-foreground hover:text-white transition-colors"
                aria-label="Close history"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1 scrollbar-none">
              {historyError ? (
                <div className="text-center py-6 text-[10px] font-mono text-rose-300/80" role="alert">
                  {historyError}
                </div>
              ) : historyRuns.length === 0 ? (
                <div className="text-center py-6 text-[10px] font-mono text-muted-foreground/60">
                  No previous runs logged for this lab.
                </div>
              ) : (
                historyRuns.map((run) => (
                  <button 
                    key={run._id}
                    type="button"
                    onClick={() => loadHistoryItem(run)}
                    className="w-full p-2.5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/15 cursor-pointer transition-all flex justify-between items-center text-[10px] font-mono group text-left"
                  >
                    <div>
                      <p className="font-bold text-foreground">{new Date(run.timestamp).toLocaleString()}</p>
                      <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                        Params: {Object.entries(run.parameters || {}).map(([k, v]) => `${k}: ${formatParamValue(v)}`).join(', ')}
                      </p>
                    </div>
                    <ChevronRight
                      size={12}
                      className="transition-transform group-hover:translate-x-0.5 shrink-0"
                      style={{ color: activeDomainConfig?.accentHex || '#3b82f6' }}
                    />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}