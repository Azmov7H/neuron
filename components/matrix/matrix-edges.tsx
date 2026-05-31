// components/matrix/matrix-edges.tsx
"use client";

import { useRef, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { nodes, edges, domainColors, MatrixNode, MatrixEdge } from "@/lib/matrix-data";
import { useMatrixStore, LayoutMode } from "./matrix-store";
import { Line } from "@react-three/drei";
import * as THREE from "three";

// Case-insensitive domain color retriever
const getDomainColor = (domain: string): string => {
  const entry = Object.entries(domainColors).find(([k]) => k.toLowerCase() === domain.toLowerCase());
  return entry ? entry[1] : "#4b5563";
};

function SingleEdge({ edge }: { edge: MatrixEdge }) {
  const lineRef = useRef<any>(null);
  
  // Zustand Store variables
  const selectedNodeId = useMatrixStore((state) => state.selectedNodeId);
  const hoveredNodeId = useMatrixStore((state) => state.hoveredNodeId);

  const density = useMatrixStore((state) => state.density);
  const activeDomains = useMatrixStore((state) => state.activeDomains);
  const layoutMode = useMatrixStore((state) => state.layoutMode);

  const focusRadius = useMatrixStore((state) => state.focusRadius);
  const isolationMode = useMatrixStore((state) => state.isolationMode);
  const compareNodeId = useMatrixStore((state) => state.compareNodeId);
  
  const relationshipThreshold = useMatrixStore((state) => state.relationshipThreshold);
  const hideWeakConnections = useMatrixStore((state) => state.hideWeakConnections);
  const directOnly = useMatrixStore((state) => state.directOnly);
  const weightedEmphasis = useMatrixStore((state) => state.weightedEmphasis);

  const explorationDepth = useMatrixStore((state) => state.explorationDepth);

  // Cached active shortest path from store
  const activePath = useMatrixStore((state) => state.activePath);

  const startNode = useMemo(() => nodes.find(n => n.id === edge.source), [edge.source]);
  const endNode = useMemo(() => nodes.find(n => n.id === edge.target), [edge.target]);

  // Interpolated line coordinates tracking morphs
  const currentStart = useRef(new THREE.Vector3(startNode?.position[0] || 0, startNode?.position[1] || 0, startNode?.position[2] || 0));
  const currentEnd = useRef(new THREE.Vector3(endNode?.position[0] || 0, endNode?.position[1] || 0, endNode?.position[2] || 0));

  // Abort rendering if nodes are missing
  if (!startNode || !endNode) return null;

  // ==================================================
  // MORPH TARGET GENERATORS (MEMOIZED)
  // ==================================================
  const startTarget = useMemo(() => {
    if (layoutMode === "hierarchical") {
      const layerNodes = nodes.filter(n => n.layer === startNode.layer);
      const idxInLayer = layerNodes.findIndex(n => n.id === startNode.id);
      const totalInLayer = layerNodes.length;
      const spacing = totalInLayer > 1 ? 16 / (totalInLayer - 1) : 0;
      const x = -8 + idxInLayer * spacing;
      const y = startNode.layer === 1 ? 4.5 : startNode.layer === 2 ? 0 : -4.5;
      const z = Math.sin(idxInLayer * 1.5) * 1.5;
      return new THREE.Vector3(x, y, z);
    } else if (layoutMode === "force") {
      const idx = nodes.findIndex(n => n.id === startNode.id);
      const theta = idx * (Math.PI * 2 / nodes.length);
      const phi = Math.acos((idx / nodes.length) * 2 - 1);
      const r = 9.5;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    } else {
      return new THREE.Vector3(startNode.position[0], startNode.position[1], startNode.position[2]);
    }
  }, [layoutMode, startNode]);

  const endTarget = useMemo(() => {
    if (layoutMode === "hierarchical") {
      const layerNodes = nodes.filter(n => n.layer === endNode.layer);
      const idxInLayer = layerNodes.findIndex(n => n.id === endNode.id);
      const totalInLayer = layerNodes.length;
      const spacing = totalInLayer > 1 ? 16 / (totalInLayer - 1) : 0;
      const x = -8 + idxInLayer * spacing;
      const y = endNode.layer === 1 ? 4.5 : endNode.layer === 2 ? 0 : -4.5;
      const z = Math.sin(idxInLayer * 1.5) * 1.5;
      return new THREE.Vector3(x, y, z);
    } else if (layoutMode === "force") {
      const idx = nodes.findIndex(n => n.id === endNode.id);
      const theta = idx * (Math.PI * 2 / nodes.length);
      const phi = Math.acos((idx / nodes.length) * 2 - 1);
      const r = 9.5;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    } else {
      return new THREE.Vector3(endNode.position[0], endNode.position[1], endNode.position[2]);
    }
  }, [layoutMode, endNode]);

  const isAlongPath = useMemo(() => {
    if (activePath.length < 2) return false;
    for (let i = 0; i < activePath.length - 1; i++) {
      if ((activePath[i] === edge.source && activePath[i+1] === edge.target) ||
          (activePath[i] === edge.target && activePath[i+1] === edge.source)) {
        return true;
      }
    }
    return false;
  }, [activePath, edge]);

  // ==================================================
  // UNIFIED VISIBILITY GATE (MEMOIZED MEMORY-SAVING CALLBACK)
  // ==================================================
  const isNodeVisible = useCallback((node: MatrixNode) => {
    // 1. Global Domain Filtering (case-insensitive)
    const normalizedDomains = activeDomains.map(d => d.toLowerCase());
    if (!normalizedDomains.includes(node.domain.toLowerCase())) return false;

    // 2. Exploration Depth thresholds
    if (explorationDepth === 1 && node.layer > 1) return false;
    if (explorationDepth === 2 && node.layer > 2) return false;

    // 3. Density Gating (removes nodes based on importance slider)
    if (explorationDepth !== 4 && selectedNodeId !== node.id && hoveredNodeId !== node.id && !activePath.includes(node.id)) {
      if (node.importance === 2 && density < 0.45) {
        const isChild = selectedNodeId !== null && node.parentId === selectedNodeId;
        if (!isChild) return false;
      }
      if (node.importance === 3 && density < 0.75) {
        const isChild = selectedNodeId !== null && node.parentId === selectedNodeId;
        if (!isChild) return false;
      }
    }

    // 4. Isolation & Focus Radius Hops
    if (selectedNodeId !== null && isolationMode) {
      if (selectedNodeId === node.id || compareNodeId === node.id || activePath.includes(node.id)) return true;

      // 1 Hop Check
      const primaryConnected = nodes.find(n => n.id === selectedNodeId)?.connections.includes(node.id) || 
                               node.connections.includes(selectedNodeId);
      
      const compareConnected = compareNodeId ? (
        nodes.find(n => n.id === compareNodeId)?.connections.includes(node.id) || 
        node.connections.includes(compareNodeId)
      ) : false;

      let withinHops = primaryConnected || compareConnected;

      // 2 Hops Check
      if (!withinHops && focusRadius === 2) {
        const primaryNeighbors = nodes.find(n => n.id === selectedNodeId)?.connections || [];
        const isTwoHopsPrimary = primaryNeighbors.some(neighborId => 
          nodes.find(n => n.id === neighborId)?.connections.includes(node.id) || false
        );

        const compareNeighbors = compareNodeId ? (nodes.find(n => n.id === compareNodeId)?.connections || []) : [];
        const isTwoHopsCompare = compareNeighbors.some(neighborId => 
          nodes.find(n => n.id === neighborId)?.connections.includes(node.id) || false
        );

        withinHops = isTwoHopsPrimary || isTwoHopsCompare;
      }

      if (!withinHops) return false;
    }

    return true;
  }, [activeDomains, explorationDepth, selectedNodeId, hoveredNodeId, activePath, density, isolationMode, compareNodeId, focusRadius]);

  const baseStrength = edge.strength || 1;

  // Relationship Controls
  const passesStrengthThreshold = baseStrength >= relationshipThreshold;
  const passesWeakToggle = !(hideWeakConnections && baseStrength === 1);
  const passesDirectOnly = !directOnly || (selectedNodeId !== null && (selectedNodeId === edge.source || selectedNodeId === edge.target));

  const bothVisible = isNodeVisible(startNode) && isNodeVisible(endNode) && passesStrengthThreshold && passesWeakToggle && passesDirectOnly;

  // ==================================================
  // COLOR AND WIDTH CALCULATIONS
  // ==================================================
  let targetOpacity = 0;
  let targetWidth = 1.0;
  let targetColorHex = "#4b5563"; // default slate gray

  if (bothVisible) {
    const isSelectedSource = selectedNodeId === edge.source;
    const isSelectedTarget = selectedNodeId === edge.target;
    const isConnectedToSelection = selectedNodeId !== null && (isSelectedSource || isSelectedTarget);

    const isCompareSource = compareNodeId === edge.source;
    const isCompareTarget = compareNodeId === edge.target;
    const isConnectedToCompare = compareNodeId !== null && (isCompareSource || isCompareTarget);
    
    const isHoveredSource = hoveredNodeId === edge.source;
    const isHoveredTarget = hoveredNodeId === edge.target;
    const isConnectedToHover = hoveredNodeId !== null && (isHoveredSource || isHoveredTarget);

    if (isAlongPath) {
      // Shortest Path Highlighting (Teal conduit)
      targetOpacity = 1.0;
      targetWidth = baseStrength * 3.5;
      targetColorHex = "#06b6d4";
    } else if (selectedNodeId !== null) {
      if (isConnectedToSelection || isConnectedToCompare) {
        targetOpacity = 0.95;
        targetWidth = baseStrength * (weightedEmphasis ? 2.6 : 1.6);
        // Take color of the connected neighbor node
        const neighbor = isSelectedSource || isCompareSource ? endNode : startNode;
        targetColorHex = getDomainColor(neighbor.domain);
      } else {
        // Mute other background links in Focus Mode
        targetOpacity = 0.01;
        targetWidth = 0.35;
        targetColorHex = "#1e293b";
      }
    } else {
      // Standard view
      if (isConnectedToHover) {
        targetOpacity = 0.85;
        targetWidth = baseStrength * (weightedEmphasis ? 2.0 : 1.2);
        const hovered = isHoveredSource ? startNode : endNode;
        targetColorHex = getDomainColor(hovered.domain);
      } else {
        targetOpacity = 0.15;
        targetWidth = baseStrength * (weightedEmphasis ? 1.0 : 0.6);
        targetColorHex = "#4b5563";
      }
    }
  }

  // ==================================================
  // GPU setPositions & LINE MATERIAL TICK
  // ==================================================
  useFrame(() => {
    const line = lineRef.current;
    if (!line) return;

    // 1. Lerp dynamic line coordinates (Hierarchical / Force Fibonacci Sphere)
    currentStart.current.lerp(startTarget, 0.08);
    currentEnd.current.lerp(endTarget, 0.08);

    // Write flat positions array directly to Drei line geometry GPU buffers
    line.geometry.setPositions([
      currentStart.current.x, currentStart.current.y, currentStart.current.z,
      currentEnd.current.x, currentEnd.current.y, currentEnd.current.z
    ]);
    line.geometry.attributes.position.needsUpdate = true;
    line.computeLineDistances();

    // 2. Animate opacity, linewidth, and color
    if (line.material) {
      const mat = line.material;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.08);
      mat.linewidth = THREE.MathUtils.lerp(mat.linewidth, targetWidth, 0.08);
      
      const targetColor = new THREE.Color(targetColorHex);
      mat.color.lerp(targetColor, 0.08);
      
      line.visible = mat.opacity > 0.005;
    }
  });

  return (
    <Line
      ref={lineRef}
      points={[startNode.position, endNode.position]} // fallback positions
      color="#4b5563"
      lineWidth={1}
      transparent
      opacity={0}
    />
  );
}

export function MatrixEdges() {
  return (
    <group>
      {edges.map((edge, idx) => (
        <SingleEdge key={`${edge.source}-${edge.target}-${idx}`} edge={edge} />
      ))}
    </group>
  );
}