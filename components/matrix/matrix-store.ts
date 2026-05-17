// components/matrix/matrix-store.ts
import { create } from "zustand";

export type LayoutMode = "cluster" | "force" | "hierarchical";
export type ExplorationDepth = 1 | 2 | 3 | 4;

interface MatrixState {
  // Original States
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  expandedNodeIds: string[];
  zoomLevel: number; // camera distance from center
  cameraTarget: [number, number, number];
  cameraPosition: [number, number, number] | null;

  // Layer 1: Global View Controls
  density: number; // 0.1 to 1.0 (Low -> High node importance visibility)
  activeDomains: string[]; // Domains visible in the graph
  layoutMode: LayoutMode;

  // Layer 2: Focus Controls
  focusRadius: number; // 1 or 2 hops for relationships
  isolationMode: boolean; // Hide unrelated nodes completely if true
  compareNodeId: string | null; // Secondary concept selected for side-by-side comparison
  pathTracingTargetId: string | null; // Target concept for learning path tracing

  // Layer 3: Relationship Controls
  relationshipThreshold: number; // 1 to 3 (minimum link strength to render)
  hideWeakConnections: boolean; // Hides strength-1 edges
  directOnly: boolean; // Hides non-direct edges of selected node
  weightedEmphasis: boolean; // Glow active/strong connections more

  // Layer 4: Exploration Depth
  explorationDepth: ExplorationDepth; // Level 1 to 4 exploration levels

  // Actions
  setSelectedNode: (id: string | null) => void;
  setHoveredNode: (id: string | null) => void;
  setZoomLevel: (zoom: number) => void;
  toggleNodeExpansion: (id: string) => void;
  resetFocus: () => void;

  // New Actions for 4-Layer Control System
  setDensity: (density: number) => void;
  toggleDomainFilter: (domain: string) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setFocusRadius: (r: number) => void;
  setIsolationMode: (iso: boolean) => void;
  setCompareNodeId: (id: string | null) => void;
  setPathTracingTargetId: (id: string | null) => void;
  setRelationshipThreshold: (threshold: number) => void;
  setHideWeakConnections: (hide: boolean) => void;
  setDirectOnly: (direct: boolean) => void;
  setWeightedEmphasis: (emp: boolean) => void;
  setExplorationDepth: (depth: ExplorationDepth) => void;
}

const ALL_DOMAINS = ["Physics", "AI", "Biology", "Space", "Mathematics", "Consciousness"];

export const useMatrixStore = create<MatrixState>((set) => ({
  // Defaults
  selectedNodeId: null,
  hoveredNodeId: null,
  expandedNodeIds: [],
  zoomLevel: 20,
  cameraTarget: [0, 0, 0],
  cameraPosition: null,

  density: 0.8,
  activeDomains: ALL_DOMAINS,
  layoutMode: "cluster",

  focusRadius: 1,
  isolationMode: false,
  compareNodeId: null,
  pathTracingTargetId: null,

  relationshipThreshold: 1,
  hideWeakConnections: false,
  directOnly: false,
  weightedEmphasis: true,

  explorationDepth: 3,

  // Action Implementations
  setSelectedNode: (id) => set((state) => {
    if (id === null) {
      return { 
        selectedNodeId: null,
        compareNodeId: null,
        pathTracingTargetId: null,
        cameraTarget: [0, 0, 0],
        cameraPosition: [0, 0, 20]
      };
    }

    const updatedExpanded = state.expandedNodeIds.includes(id) 
      ? state.expandedNodeIds 
      : [...state.expandedNodeIds, id];

    return {
      selectedNodeId: id,
      expandedNodeIds: updatedExpanded,
      // If we clicked the same node as compareNodeId, clear compareNodeId
      compareNodeId: state.compareNodeId === id ? null : state.compareNodeId,
      pathTracingTargetId: state.pathTracingTargetId === id ? null : state.pathTracingTargetId
    };
  }),

  setHoveredNode: (id) => set({ hoveredNodeId: id }),

  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),

  toggleNodeExpansion: (id) => set((state) => {
    const isExpanded = state.expandedNodeIds.includes(id);
    const updated = isExpanded 
      ? state.expandedNodeIds.filter(x => x !== id)
      : [...state.expandedNodeIds, id];
    return { expandedNodeIds: updated };
  }),

  resetFocus: () => set({
    selectedNodeId: null,
    compareNodeId: null,
    pathTracingTargetId: null,
    expandedNodeIds: [],
    cameraTarget: [0, 0, 0],
    cameraPosition: [0, 0, 20],
    density: 0.8,
    activeDomains: ALL_DOMAINS,
    layoutMode: "cluster",
    focusRadius: 1,
    isolationMode: false,
    relationshipThreshold: 1,
    hideWeakConnections: false,
    directOnly: false,
    explorationDepth: 3
  }),

  // Advanced Controls Actions
  setDensity: (density) => set({ density }),

  toggleDomainFilter: (domain) => set((state) => {
    const isFiltered = state.activeDomains.includes(domain);
    const updated = isFiltered
      ? state.activeDomains.filter(d => d !== domain)
      : [...state.activeDomains, domain];
    return { activeDomains: updated };
  }),

  setLayoutMode: (layoutMode) => set({ layoutMode }),

  setFocusRadius: (focusRadius) => set({ focusRadius }),

  setIsolationMode: (isolationMode) => set({ isolationMode }),

  setCompareNodeId: (compareNodeId) => set((state) => ({ 
    compareNodeId,
    // Clear path tracing if transitioning to compare mode
    pathTracingTargetId: compareNodeId ? null : state.pathTracingTargetId
  })),

  setPathTracingTargetId: (pathTracingTargetId) => set((state) => ({ 
    pathTracingTargetId,
    // Clear compare node if transitioning to path tracing mode
    compareNodeId: pathTracingTargetId ? null : state.compareNodeId
  })),

  setRelationshipThreshold: (relationshipThreshold) => set({ relationshipThreshold }),

  setHideWeakConnections: (hideWeakConnections) => set({ hideWeakConnections }),

  setDirectOnly: (directOnly) => set({ directOnly }),

  setWeightedEmphasis: (weightedEmphasis) => set({ weightedEmphasis }),

  setExplorationDepth: (explorationDepth) => set({ explorationDepth })
}));