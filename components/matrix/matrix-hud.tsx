// components/matrix/matrix-hud.tsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useMatrixStore, LayoutMode, ExplorationDepth } from "./matrix-store";
import { nodes, domainColors, MatrixNode } from "@/lib/matrix-data";
import { findShortestPath } from "./matrix-nodes";
import { SparkFallback } from "@/src/modules/spark/spark.fallback";
import { 
  X, Sparkles, Search, Compass, RefreshCw, ZoomIn, 
  Layers, ArrowRight, Brain, Network, HelpCircle, ChevronRight,
  Sliders, Shield, Link2, Eye, EyeOff, Radio, GitCommit, Copy, Check
} from "lucide-react";

export function MatrixHUD() {
  // Zustand Store variables
  const selectedNodeId = useMatrixStore((state) => state.selectedNodeId);
  const hoveredNodeId = useMatrixStore((state) => state.hoveredNodeId);
  const expandedNodeIds = useMatrixStore((state) => state.expandedNodeIds);
  const zoomLevel = useMatrixStore((state) => state.zoomLevel);

  const density = useMatrixStore((state) => state.density);
  const activeDomains = useMatrixStore((state) => state.activeDomains);
  const layoutMode = useMatrixStore((state) => state.layoutMode);

  const focusRadius = useMatrixStore((state) => state.focusRadius);
  const isolationMode = useMatrixStore((state) => state.isolationMode);
  const compareNodeId = useMatrixStore((state) => state.compareNodeId);
  const pathTracingTargetId = useMatrixStore((state) => state.pathTracingTargetId);

  const relationshipThreshold = useMatrixStore((state) => state.relationshipThreshold);
  const hideWeakConnections = useMatrixStore((state) => state.hideWeakConnections);
  const directOnly = useMatrixStore((state) => state.directOnly);
  const weightedEmphasis = useMatrixStore((state) => state.weightedEmphasis);

  const explorationDepth = useMatrixStore((state) => state.explorationDepth);

  // Zustand Store Actions
  const setSelectedNode = useMatrixStore((state) => state.setSelectedNode);
  const resetFocus = useMatrixStore((state) => state.resetFocus);
  const toggleNodeExpansion = useMatrixStore((state) => state.toggleNodeExpansion);

  const setDensity = useMatrixStore((state) => state.setDensity);
  const toggleDomainFilter = useMatrixStore((state) => state.toggleDomainFilter);
  const setLayoutMode = useMatrixStore((state) => state.setLayoutMode);

  const setFocusRadius = useMatrixStore((state) => state.setFocusRadius);
  const setIsolationMode = useMatrixStore((state) => state.setIsolationMode);
  const setCompareNodeId = useMatrixStore((state) => state.setCompareNodeId);
  const setPathTracingTargetId = useMatrixStore((state) => state.setPathTracingTargetId);

  const setRelationshipThreshold = useMatrixStore((state) => state.setRelationshipThreshold);
  const setHideWeakConnections = useMatrixStore((state) => state.setHideWeakConnections);
  const setDirectOnly = useMatrixStore((state) => state.setDirectOnly);
  const setWeightedEmphasis = useMatrixStore((state) => state.setWeightedEmphasis);

  const setExplorationDepth = useMatrixStore((state) => state.setExplorationDepth);

  // Memoized concepts
  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [selectedNodeId]);
  const compareNode = useMemo(() => nodes.find(n => n.id === compareNodeId), [compareNodeId]);
  const hoveredNode = useMemo(() => nodes.find(n => n.id === hoveredNodeId), [hoveredNodeId]);

  // ==================================================
  // HUD SEARCH & PATH TRACING STATES
  // ==================================================
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeControlTab, setActiveControlTab] = useState<"global" | "focus" | "relation" | "depth">("global");
  const [copiedPath, setCopiedPath] = useState(false);

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return nodes.filter(n => 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Real-time computed learning path
  const activePath = useMemo(() => {
    if (selectedNodeId && pathTracingTargetId) {
      return findShortestPath(selectedNodeId, pathTracingTargetId);
    }
    return [];
  }, [selectedNodeId, pathTracingTargetId]);

  // ==================================================
  // SPARK AI SYNERGY & SYLLABUS STREAMER
  // ==================================================
  const [sparkExplanation, setSparkExplanation] = useState("");
  const [isGeneratingSpark, setIsGeneratingSpark] = useState(false);
  const [aiTab, setAiTab] = useState<"explain" | "syllabus" | "compare">("explain");
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (fallbackTimerRef.current) clearInterval(fallbackTimerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    if (!selectedNode) {
      setSparkExplanation("");
      setIsGeneratingSpark(false);
      return;
    }

    setSparkExplanation("");
    setIsGeneratingSpark(true);

    let prompt = "";
    if (compareNode) {
      setAiTab("compare");
      prompt = `Compare the scientific intersection, overlapping principles, and synergies between ${selectedNode.title} and ${compareNode.title}.`;
    } else if (pathTracingTargetId && activePath.length > 1) {
      setAiTab("syllabus");
      prompt = `Create a step-by-step learning syllabus along the conceptual pathway from ${selectedNode.title} to ${nodes.find(n => n.id === pathTracingTargetId)?.title || "Target Node"} through: ${activePath.map(id => nodes.find(n => n.id === id)?.title).join(" -> ")}.`;
    } else {
      setAiTab("explain");
      prompt = `Explain ${selectedNode.title} in the context of its scientific mechanism and domain relations.`;
    }

    const fetchStreamingSpark = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("neuronAccessToken") : null;
        if (!token) throw new Error("No token found");

        const controller = new AbortController();
        abortControllerRef.current = controller;

        const response = await fetch("/api/spark/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            sessionId: "new",
            content: prompt,
            domain: selectedNode.domain
          }),
          signal: controller.signal
        });

        if (!response.ok) throw new Error("API stream fail");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error("No reader");

        let accum = "";
        let done = false;
        while (!done) {
          const { done: d, value } = await reader.read();
          if (d) {
            done = true;
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          accum += chunk;

          let visible = accum;
          if (visible.includes("[METADATA_EVENT]")) visible = visible.split("[METADATA_EVENT]")[0].trim();
          if (visible.includes("[METADATA]")) visible = visible.split("[METADATA]")[0].trim();

          setSparkExplanation(visible);
        }
        setIsGeneratingSpark(false);

      } catch (err: any) {
        if (err.name === "AbortError") return;
        
        console.warn("[Spark HUD Failover] Running high-fidelity offline cognitive stream:", err.message);
        
        // Emulated educational streams for offline operations
        const offlineText = SparkFallback.generateExplanation(prompt, selectedNode.domain, "educational");
        const words = offlineText.split(" ");
        let currentText = "";
        let index = 0;

        fallbackTimerRef.current = setInterval(() => {
          if (index < words.length) {
            currentText += words[index] + " ";
            setSparkExplanation(currentText);
            index++;
          } else {
            if (fallbackTimerRef.current) clearInterval(fallbackTimerRef.current);
            setIsGeneratingSpark(false);
          }
        }, 15);
      }
    };

    fetchStreamingSpark();

    return () => {
      if (fallbackTimerRef.current) clearInterval(fallbackTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [selectedNodeId, compareNodeId, pathTracingTargetId, activePath.length]);

  // Clean parse out text tags
  const parsedSpark = useMemo(() => {
    const sections = {
      explanation: "Synthesizing dynamic concept telemetry...",
      keyPoints: [] as string[],
      concepts: [] as string[],
      followUps: [] as string[]
    };

    if (!sparkExplanation) return sections;

    const expSplit = sparkExplanation.split("[EXPLANATION]");
    const keySplit = sparkExplanation.split("[KEY POINTS]");
    const conSplit = sparkExplanation.split("[CONCEPTS]");
    const folSplit = sparkExplanation.split("[FOLLOW UPS]");

    if (expSplit.length > 1) {
      sections.explanation = expSplit[1].split("---")[0].split("[KEY POINTS]")[0].trim();
    } else {
      sections.explanation = sparkExplanation.split("---")[0].trim();
    }

    if (keySplit.length > 1) {
      const lines = keySplit[1].split("---")[0].split("[CONCEPTS]")[0].trim().split("\n");
      sections.keyPoints = lines.map(l => l.replace(/^-\s*/, "").trim()).filter(Boolean);
    }

    if (conSplit.length > 1) {
      const lines = conSplit[1].split("---")[0].split("[FOLLOW UPS]")[0].trim().split("\n");
      sections.concepts = lines.map(l => l.replace(/^-\s*/, "").trim()).filter(Boolean);
    }

    if (folSplit.length > 1) {
      const lines = folSplit[1].split("---")[0].trim().split("\n");
      sections.followUps = lines.map(l => l.replace(/^-\s*/, "").trim()).filter(Boolean);
    }

    return sections;
  }, [sparkExplanation]);

  const activeColor = selectedNode ? domainColors[selectedNode.domain] : "#3b82f6";

  const handleCopyPath = () => {
    if (activePath.length === 0) return;
    const pathNames = activePath.map(id => nodes.find(n => n.id === id)?.title).join(" -> ");
    navigator.clipboard.writeText(pathNames);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 p-6 flex flex-col justify-between overflow-hidden">
      
      {/* ======================================================================
          1. HEADER TELEMETRY HUD BAR
          ====================================================================== */}
      <div className="pointer-events-auto flex flex-col md:flex-row justify-between items-start gap-4 w-full select-none">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_12px_#3b82f6]" style={{ backgroundColor: activeColor }} />
            <h1 className="text-xl font-black tracking-widest uppercase text-white font-mono">
              Neuron Knowledge Matrix
            </h1>
          </div>
          
          <div className="flex items-center gap-2 mt-1.5 bg-black/45 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/5 text-[9px] uppercase tracking-widest text-muted-foreground font-mono">
            <Compass size={11} className="text-primary" />
            <span>Pathfinder:</span>
            {selectedNode ? (
              <span className="text-foreground font-bold flex items-center gap-1.5">
                Focusing
                <ChevronRight size={8} className="text-muted-foreground" /> 
                <span style={{ color: activeColor }}>
                  {selectedNode.title}
                </span>
                {compareNode && (
                  <>
                    <span className="text-muted-foreground">&</span>
                    <span style={{ color: domainColors[compareNode.domain] }}>
                      {compareNode.title}
                    </span>
                    <span className="text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1 py-0.2 rounded font-sans text-[7px]">Compare</span>
                  </>
                )}
                {pathTracingTargetId && (
                  <>
                    <span className="text-muted-foreground">&rarr;</span>
                    <span style={{ color: domainColors[nodes.find(n => n.id === pathTracingTargetId)?.domain || "Physics"] }}>
                      {nodes.find(n => n.id === pathTracingTargetId)?.title}
                    </span>
                    <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1 py-0.2 rounded font-sans text-[7px]">Path Traced</span>
                  </>
                )}
              </span>
            ) : hoveredNode ? (
              <span className="text-white/80 font-semibold">
                Scanning {hoveredNode.title}
              </span>
            ) : (
              <span>Dynamic Matrix System Idle</span>
            )}
          </div>
        </div>

        {/* Study Domains Color Legend */}
        <div className="hidden lg:block bg-black/45 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-2xl">
          <p className="text-[8px] uppercase tracking-widest text-muted-foreground font-black mb-2 flex items-center gap-1 font-mono">
            <Network size={11} className="text-secondary" /> Study Domains
          </p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
            {Object.entries(domainColors).map(([domain, color]) => (
              <div key={domain} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
                <span className="text-[10px] text-white/80 font-bold font-mono">{domain}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================================
          2. LEFT SIDE: MATRIX DEEP CONTROL DECK
          ====================================================================== */}
      <div className="pointer-events-auto absolute top-[12%] left-6 bottom-[10%] w-80 flex flex-col bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden select-none animate-fade-right">
        
        {/* Deck Header */}
        <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between bg-black/25">
          <span className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2 font-mono">
            <Sliders size={12} className="text-primary animate-pulse" /> Matrix Control Deck
          </span>
          <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded font-mono text-muted-foreground">O(n log n)</span>
        </div>

        {/* Tab Selectors */}
        <div className="grid grid-cols-4 border-b border-white/5 bg-black/15 text-[8px] font-black uppercase tracking-wider font-mono">
          <button 
            onClick={() => setActiveControlTab("global")}
            className={`py-2 text-center border-b-2 transition-all ${activeControlTab === "global" ? "border-primary text-white" : "border-transparent text-muted-foreground hover:text-white"}`}
          >
            Global
          </button>
          <button 
            onClick={() => setActiveControlTab("focus")}
            className={`py-2 text-center border-b-2 transition-all ${activeControlTab === "focus" ? "border-primary text-white" : "border-transparent text-muted-foreground hover:text-white"}`}
          >
            Focus
          </button>
          <button 
            onClick={() => setActiveControlTab("relation")}
            className={`py-2 text-center border-b-2 transition-all ${activeControlTab === "relation" ? "border-primary text-white" : "border-transparent text-muted-foreground hover:text-white"}`}
          >
            Links
          </button>
          <button 
            onClick={() => setActiveControlTab("depth")}
            className={`py-2 text-center border-b-2 transition-all ${activeControlTab === "depth" ? "border-primary text-white" : "border-transparent text-muted-foreground hover:text-white"}`}
          >
            Depth
          </button>
        </div>

        {/* Accordion Panels */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono scrollbar-none">
          
          {/* TAB A: GLOBAL VIEW DECK */}
          {activeControlTab === "global" && (
            <div className="space-y-4 animate-fade-in text-[10px]">
              
              {/* 1. Layout Mode Switch */}
              <div className="space-y-1.5">
                <label className="text-[8px] uppercase tracking-widest text-muted-foreground font-black">Layout Topology</label>
                <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                  {(["cluster", "hierarchical", "force"] as LayoutMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setLayoutMode(mode)}
                      className={`py-1 text-center rounded capitalize text-[9px] font-bold transition-all ${
                        layoutMode === mode 
                          ? "bg-primary text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]" 
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Density Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[8px] uppercase tracking-widest text-muted-foreground font-black">Node Density</label>
                  <span className="text-primary font-bold">{Math.round(density * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.05"
                  value={density}
                  onChange={(e) => setDensity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary transition-all"
                />
                <p className="text-[8px] text-muted-foreground/60 leading-normal">Gates nodes by scientific importance. High density reveals details.</p>
              </div>

              {/* 3. Domain Filters */}
              <div className="space-y-1.5">
                <label className="text-[8px] uppercase tracking-widest text-muted-foreground font-black">Domain Filtering</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {["Physics", "AI", "Biology", "Space", "Mathematics", "Consciousness"].map((dom) => {
                    const isFiltered = activeDomains.includes(dom);
                    const color = domainColors[dom as MatrixNode["domain"]];
                    return (
                      <button
                        key={dom}
                        onClick={() => toggleDomainFilter(dom)}
                        className={`px-2 py-1 rounded text-left flex items-center gap-1.5 border transition-all text-[9px] font-semibold ${
                          isFiltered 
                            ? "bg-white/5 text-white" 
                            : "bg-transparent text-muted-foreground border-transparent opacity-35"
                        }`}
                        style={{ borderColor: isFiltered ? `${color}40` : "transparent" }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                        {dom}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB B: FOCUS CONTROL SYSTEM */}
          {activeControlTab === "focus" && (
            <div className="space-y-4 animate-fade-in text-[10px]">
              
              {selectedNodeId ? (
                <>
                  {/* 1. Isolation Toggle */}
                  <div className="flex items-center justify-between bg-white/5 border border-white/5 p-2 rounded-lg">
                    <div className="space-y-0.5">
                      <span className="font-bold text-white text-[9px] uppercase tracking-wider block">Isolation Mode</span>
                      <span className="text-[8px] text-muted-foreground">Hide unrelated nodes completely</span>
                    </div>
                    <button
                      onClick={() => setIsolationMode(!isolationMode)}
                      className={`w-9 h-5 rounded-full transition-all relative border ${
                        isolationMode ? "bg-primary border-primary" : "bg-white/10 border-white/10"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all shadow-md ${
                        isolationMode ? "left-[18px]" : "left-0.5"
                      }`} />
                    </button>
                  </div>

                  {/* 2. Focus Hops Radius */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[8px] uppercase tracking-widest text-muted-foreground font-black">Focus Radius</label>
                      <span className="text-primary font-bold">{focusRadius} Hop{focusRadius > 1 ? "s" : ""}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 bg-white/5 p-1 rounded-lg border border-white/5">
                      {[1, 2].map((r) => (
                        <button
                          key={r}
                          onClick={() => setFocusRadius(r as 1 | 2)}
                          className={`py-1 text-center rounded text-[9px] font-bold transition-all ${
                            focusRadius === r 
                              ? "bg-primary text-white" 
                              : "text-muted-foreground hover:text-white"
                          }`}
                        >
                          {r} {r === 1 ? "Direct Link" : "Extended Neighborhood"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Concept Compare Mode */}
                  <div className="space-y-1.5">
                    <label className="text-[8px] uppercase tracking-widest text-muted-foreground font-black">Compare Mode</label>
                    <select
                      value={compareNodeId || ""}
                      onChange={(e) => setCompareNodeId(e.target.value || null)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[9px] focus:outline-none focus:border-primary text-white"
                    >
                      <option value="" className="bg-[#0f172a]">Select concept to contrast...</option>
                      {nodes.filter(n => n.id !== selectedNodeId).map(node => (
                        <option key={node.id} value={node.id} className="bg-[#0f172a] text-white">
                          [{node.domain}] {node.title}
                        </option>
                      ))}
                    </select>
                    <p className="text-[8px] text-muted-foreground/60 leading-normal">Contrast mutual connections, boundaries, and synergy paths between two nodes.</p>
                  </div>

                  {/* 4. Path Tracing Endpoint */}
                  <div className="space-y-1.5">
                    <label className="text-[8px] uppercase tracking-widest text-muted-foreground font-black">Shortest Path Tracing</label>
                    <select
                      value={pathTracingTargetId || ""}
                      onChange={(e) => setPathTracingTargetId(e.target.value || null)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[9px] focus:outline-none focus:border-primary text-white"
                    >
                      <option value="" className="bg-[#0f172a]">Select learning endpoint...</option>
                      {nodes.filter(n => n.id !== selectedNodeId).map(node => (
                        <option key={node.id} value={node.id} className="bg-[#0f172a] text-white">
                          [{node.domain}] {node.title}
                        </option>
                      ))}
                    </select>
                    <p className="text-[8px] text-muted-foreground/60 leading-normal">Highlight intermediate connection pipelines. Streams a custom syllabus.</p>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-muted-foreground/60 leading-relaxed font-sans text-xs">
                  <Brain size={20} className="mx-auto text-primary/30 mb-2 animate-bounce-slow" />
                  Select a knowledge node to initialize the Focus control systems.
                </div>
              )}
            </div>
          )}

          {/* TAB C: RELATIONSHIP CONTROL SYSTEM */}
          {activeControlTab === "relation" && (
            <div className="space-y-4 animate-fade-in text-[10px]">
              
              {/* 1. Strength Threshold */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[8px] uppercase tracking-widest text-muted-foreground font-black">Minimum Strength</label>
                  <span className="text-primary font-bold">Strength {relationshipThreshold}+</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="3" 
                  step="1"
                  value={relationshipThreshold}
                  onChange={(e) => setRelationshipThreshold(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary transition-all"
                />
              </div>

              {/* 2. Hide Weak Connections */}
              <div className="flex items-center justify-between bg-white/5 border border-white/5 p-2 rounded-lg">
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-[9px] uppercase tracking-wider block">Hide Weak links</span>
                  <span className="text-[8px] text-muted-foreground">Remove strength-1 links</span>
                </div>
                <button
                  onClick={() => setHideWeakConnections(!hideWeakConnections)}
                  className={`w-9 h-5 rounded-full transition-all relative border ${
                    hideWeakConnections ? "bg-primary border-primary" : "bg-white/10 border-white/10"
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all shadow-md ${
                    hideWeakConnections ? "left-[18px]" : "left-0.5"
                  }`} />
                </button>
              </div>

              {/* 3. Show Direct Only */}
              <div className="flex items-center justify-between bg-white/5 border border-white/5 p-2 rounded-lg">
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-[9px] uppercase tracking-wider block">Direct Links Only</span>
                  <span className="text-[8px] text-muted-foreground">Hide unrelated connections</span>
                </div>
                <button
                  onClick={() => setDirectOnly(!directOnly)}
                  disabled={!selectedNodeId}
                  className={`w-9 h-5 rounded-full transition-all relative border disabled:opacity-30 ${
                    directOnly ? "bg-primary border-primary" : "bg-white/10 border-white/10"
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all shadow-md ${
                    directOnly ? "left-[18px]" : "left-0.5"
                  }`} />
                </button>
              </div>

              {/* 4. Weighted Graph Emphasis */}
              <div className="flex items-center justify-between bg-white/5 border border-white/5 p-2 rounded-lg">
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-[9px] uppercase tracking-wider block">Weighted Emphasis</span>
                  <span className="text-[8px] text-muted-foreground">Stronger links glow thicker</span>
                </div>
                <button
                  onClick={() => setWeightedEmphasis(!weightedEmphasis)}
                  className={`w-9 h-5 rounded-full transition-all relative border ${
                    weightedEmphasis ? "bg-primary border-primary" : "bg-white/10 border-white/10"
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all shadow-md ${
                    weightedEmphasis ? "left-[18px]" : "left-0.5"
                  }`} />
                </button>
              </div>
            </div>
          )}

          {/* TAB D: DEPTH CONTROL SYSTEM */}
          {activeControlTab === "depth" && (
            <div className="space-y-4 animate-fade-in text-[10px]">
              
              {/* 1. Depth Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[8px] uppercase tracking-widest text-muted-foreground font-black">Exploration Depth</label>
                  <span className="text-primary font-bold">Level {explorationDepth}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="4" 
                  step="1"
                  value={explorationDepth}
                  onChange={(e) => setExplorationDepth(parseInt(e.target.value) as ExplorationDepth)}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary transition-all"
                />
              </div>

              {/* 2. Level Details Readout */}
              <div className="bg-white/5 border border-white/5 p-3 rounded-lg space-y-2">
                <span className="text-[9px] uppercase font-black tracking-wider text-white block">Level Specifications</span>
                <div className="space-y-1.5 text-[8px] text-muted-foreground">
                  <div className={`flex items-start gap-1.5 ${explorationDepth === 1 ? "text-primary font-bold" : ""}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5 shrink-0" />
                    <span>Level 1: Core Systems Only (Layer-1 central concepts)</span>
                  </div>
                  <div className={`flex items-start gap-1.5 ${explorationDepth === 2 ? "text-indigo-400 font-bold" : ""}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-0.5 shrink-0" />
                    <span>Level 2: Related Concepts (Layer-1 & Layer-2 nodes)</span>
                  </div>
                  <div className={`flex items-start gap-1.5 ${explorationDepth === 3 ? "text-purple-400 font-bold" : ""}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-0.5 shrink-0" />
                    <span>Level 3: Deep Dependencies (All Layer 1, 2, & 3 nodes)</span>
                  </div>
                  <div className={`flex items-start gap-1.5 ${explorationDepth === 4 ? "text-cyan-400 font-bold" : ""}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-0.5 shrink-0" />
                    <span>Level 4: Full Expansion (Ignores zoom/interaction gates)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Reset Command button */}
        <div className="p-3.5 border-t border-white/5 bg-black/25 flex items-center justify-between">
          <span className="text-[9px] font-mono text-muted-foreground flex items-center gap-1.5">
            <ZoomIn size={10} /> Camera Orbit: {zoomLevel.toFixed(1)}
          </span>
          <button
            onClick={resetFocus}
            className="px-2.5 py-1 bg-white/5 border border-white/15 hover:bg-primary/10 hover:border-primary/30 text-white/80 hover:text-white rounded text-[8px] uppercase tracking-widest font-black flex items-center gap-1 transition-all"
          >
            <RefreshCw size={8} /> Reset Deck
          </button>
        </div>
      </div>

      {/* ======================================================================
          3. BOTTOM-LEFT: AUTOCOMPLETE SEARCH CONSOLE
          ====================================================================== */}
      <div className="pointer-events-auto flex flex-col gap-2 max-w-sm w-full bg-black/65 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl mt-auto ml-88 select-none select-text">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <Search size={14} className="text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search concepts, equations, domains..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="bg-transparent border-none outline-none text-xs text-foreground placeholder-muted-foreground w-full font-mono text-[10px]"
          />
          {searchQuery && (
            <button 
              onClick={() => {
                setSearchQuery("");
                setShowSearchResults(false);
              }} 
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Autocomplete dropdown */}
        {showSearchResults && filteredNodes.length > 0 && (
          <div className="max-h-40 overflow-y-auto bg-black/95 border border-white/10 rounded-lg absolute bottom-20 left-88 w-72 z-50 p-1 flex flex-col gap-0.5 shadow-2xl font-mono">
            {filteredNodes.map(node => (
              <button
                key={node.id}
                onClick={() => {
                  setSelectedNode(node.id);
                  setSearchQuery("");
                  setShowSearchResults(false);
                }}
                className="flex items-center justify-between text-left px-3 py-2 text-[10px] rounded hover:bg-white/5 text-foreground transition-colors"
              >
                <span className="font-bold">{node.title}</span>
                <span 
                  className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border font-semibold" 
                  style={{ 
                    color: domainColors[node.domain], 
                    borderColor: `${domainColors[node.domain]}30`, 
                    backgroundColor: `${domainColors[node.domain]}10` 
                  }}
                >
                  {node.domain}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Zoom Tracker */}
        <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-muted-foreground font-mono pt-1">
          <span className="flex items-center gap-1"><ZoomIn size={10} /> Active Layer Depth:</span>
          <span className="text-white font-black" style={{ color: activeColor }}>
            {zoomLevel > 16.0 ? "Core (L1)" : zoomLevel > 10.5 ? "Related (L2)" : "Deep (L3)"}
          </span>
        </div>
      </div>

      {/* ======================================================================
          4. RIGHT SIDE: SPARK AI SYNAPTIC CONSOLE PANEL
          ====================================================================== */}
      {selectedNode && (
        <div className="pointer-events-auto absolute top-[12%] right-6 bottom-[10%] w-96 flex flex-col bg-black/60 backdrop-blur-2xl rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.6)] border animate-fade-left overflow-hidden"
          style={{ 
            borderColor: `${activeColor}25`,
            boxShadow: `0 0 40px ${activeColor}10` 
          }}
        >
          {/* Header Bar */}
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between"
            style={{ 
              background: `linear-gradient(90deg, ${activeColor}08, transparent)` 
            }}
          >
            <div className="flex items-center gap-2">
              <span 
                className="text-[9px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-full border font-mono" 
                style={{ 
                  color: activeColor, 
                  borderColor: `${activeColor}40`, 
                  backgroundColor: `${activeColor}12` 
                }}
              >
                {selectedNode.domain}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 font-mono">
                <Brain size={11} /> Spark Analyst
              </span>
            </div>
            
            <button 
              onClick={() => setSelectedNode(null)} 
              className="text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 p-1 rounded-full transition-all"
            >
              <X size={14} />
            </button>
          </div>

          {/* Concept Basic Readout */}
          <div className="p-5 pb-3">
            <h2 className="text-lg font-bold text-white leading-tight font-mono">{selectedNode.title}</h2>
            {compareNode && (
              <div className="flex items-center gap-2 mt-1 border-t border-white/5 pt-1 text-sm font-semibold">
                <span className="text-muted-foreground text-xs font-mono">Contrasted with:</span>
                <span style={{ color: domainColors[compareNode.domain] }} className="font-mono text-xs">{compareNode.title}</span>
              </div>
            )}
            <p className="text-[11px] text-white/70 mt-1.5 leading-relaxed font-medium">
              {selectedNode.description}
            </p>
          </div>

          {/* AI Streaming Tab headers */}
          <div className="px-5 flex gap-1 border-b border-white/5 bg-black/15 font-mono text-[9px] font-black uppercase tracking-wider">
            <button 
              onClick={() => setAiTab("explain")}
              className={`py-2 flex-1 text-center border-b-2 transition-all ${
                aiTab === "explain" 
                  ? "border-primary text-white" 
                  : "border-transparent text-muted-foreground hover:text-white"
              }`}
            >
              Explanation
            </button>
            <button 
              onClick={() => setAiTab("syllabus")}
              disabled={activePath.length < 2}
              className={`py-2 flex-1 text-center border-b-2 transition-all disabled:opacity-30 ${
                aiTab === "syllabus" 
                  ? "border-primary text-white" 
                  : "border-transparent text-muted-foreground hover:text-white"
              }`}
            >
              Syllabus
            </button>
            <button 
              onClick={() => setAiTab("compare")}
              disabled={!compareNode}
              className={`py-2 flex-1 text-center border-b-2 transition-all disabled:opacity-30 ${
                aiTab === "compare" 
                  ? "border-primary text-white" 
                  : "border-transparent text-muted-foreground hover:text-white"
              }`}
            >
              Compare
            </button>
          </div>

          {/* Dynamic AI content viewport */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono scrollbar-none text-xs leading-relaxed text-white/90">
            
            {/* Generating Loading Indicator */}
            {isGeneratingSpark && !sparkExplanation && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="w-10 h-10 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center relative">
                  <Sparkles size={16} className="text-primary animate-pulse" />
                  <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white uppercase tracking-wider">Establishing Synaptic Stream...</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Offline local failover engine hot-wired.</p>
                </div>
              </div>
            )}

            {sparkExplanation && (
              <div className="animate-fade-in whitespace-pre-line bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner">
                {sparkExplanation}
                {isGeneratingSpark && (
                  <div className="inline-block w-2.5 h-3.5 bg-primary/70 animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            )}

            {/* Path Syllabus details */}
            {aiTab === "syllabus" && activePath.length > 1 && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center border-b border-white/5 pb-1">
                  <p className="text-[9px] uppercase tracking-widest text-cyan-400 font-black">Path Nodes ({activePath.length} hops)</p>
                  <button 
                    onClick={handleCopyPath}
                    className="text-[8px] bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white rounded px-2 py-0.5 transition-all flex items-center gap-1 text-muted-foreground"
                  >
                    {copiedPath ? <Check size={8} className="text-green-400" /> : <Copy size={8} />}
                    {copiedPath ? "Copied" : "Copy Path"}
                  </button>
                </div>
                <div className="space-y-2">
                  {activePath.map((nodeId, idx) => {
                    const pathNode = nodes.find(n => n.id === nodeId);
                    if (!pathNode) return null;
                    return (
                      <div key={nodeId} className="flex gap-2.5 items-start p-2.5 rounded-lg bg-white/3 border border-white/5 hover:border-cyan-500/20 transition-all">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-white text-[11px] leading-tight">{pathNode.title}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5 capitalize">{pathNode.domain} domain • Layer {pathNode.layer}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Active neighbors list */}
          <div className="px-5 py-4 border-t border-white/5 bg-black/30 select-none">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-black mb-2 flex items-center gap-1 font-mono">
              <Network size={11} /> Concept Neighbors ({selectedNode.connections.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selectedNode.connections.map(connId => {
                const connNode = nodes.find(n => n.id === connId);
                if (!connNode) return null;
                return (
                  <button 
                    key={connId} 
                    onClick={() => setSelectedNode(connId)}
                    className="text-[10px] font-bold font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/90 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all flex items-center gap-1"
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: domainColors[connNode.domain] }} />
                    {connNode.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Suggested follow-up learning route */}
          {!isGeneratingSpark && parsedSpark.followUps.length > 0 && (
            <div className="px-5 py-4 border-t border-white/5 bg-secondary/5 font-mono">
              <p className="text-[9px] uppercase tracking-widest text-secondary font-black mb-2 flex items-center gap-1">
                <Sparkles size={11} className="animate-spin-slow" /> Recommended Route Steps
              </p>
              <div className="flex flex-col gap-1.5">
                {parsedSpark.followUps.slice(0, 3).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const cleanQuestion = q.toLowerCase();
                      const match = nodes.find(n => 
                        cleanQuestion.includes(n.title.toLowerCase()) || 
                        n.title.toLowerCase().includes(cleanQuestion)
                      );
                      if (match) setSelectedNode(match.id);
                    }}
                    className="text-[10px] text-left px-3 py-2 rounded-lg bg-black/35 border border-white/5 hover:border-secondary/30 hover:bg-secondary/10 text-white/90 hover:text-secondary transition-all flex items-center justify-between group"
                  >
                    <span className="truncate max-w-[270px] font-semibold">{q}</span>
                    <ArrowRight size={10} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-secondary shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}