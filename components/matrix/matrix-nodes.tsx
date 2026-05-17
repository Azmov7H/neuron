// components/matrix/matrix-nodes.tsx
"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Html } from "@react-three/drei";
import { nodes, domainColors, MatrixNode } from "@/lib/matrix-data";
import { useMatrixStore, LayoutMode, ExplorationDepth } from "./matrix-store";
import * as THREE from "three";

// ==================================================
// BFS PATHFINDER FOR PATH TRACING
// ==================================================
export function findShortestPath(startId: string, endId: string): string[] {
  if (startId === endId) return [startId];
  const queue: [string, string[]][] = [[startId, [startId]]];
  const visited = new Set<string>([startId]);

  while (queue.length > 0) {
    const [curr, path] = queue.shift()!;
    if (curr === endId) return path;

    const currNode = nodes.find(n => n.id === curr);
    if (currNode) {
      for (const neighbor of currNode.connections) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([neighbor, [...path, neighbor]]);
        }
      }
    }
  }
  return [];
}

function SingleNode({ node }: { node: MatrixNode }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Zustand Store parameters
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
  
  const explorationDepth = useMatrixStore((state) => state.explorationDepth);

  const setSelectedNode = useMatrixStore((state) => state.setSelectedNode);
  const setHoveredNode = useMatrixStore((state) => state.setHoveredNode);

  const isSelected = selectedNodeId === node.id;
  const isCompared = compareNodeId === node.id;
  const isHovered = hoveredNodeId === node.id || hovered;
  const color = domainColors[node.domain];

  // ==================================================
  // PATH TRACING ANALYSIS
  // ==================================================
  const activePath = useMemo(() => {
    if (selectedNodeId && pathTracingTargetId) {
      return findShortestPath(selectedNodeId, pathTracingTargetId);
    }
    return [];
  }, [selectedNodeId, pathTracingTargetId]);

  const isAlongPath = activePath.includes(node.id);

  // ==================================================
  // MULTI-LAYOUT TARGET COORDINATE GENERATOR (MEMOIZED)
  // ==================================================
  const targetPos = useMemo(() => {
    if (layoutMode === "hierarchical") {
      // Stack along Y by layer depth, spread horizontally on X
      const layerNodes = nodes.filter(n => n.layer === node.layer);
      const idxInLayer = layerNodes.findIndex(n => n.id === node.id);
      const totalInLayer = layerNodes.length;
      
      const widthRange = 16;
      const spacing = totalInLayer > 1 ? widthRange / (totalInLayer - 1) : 0;
      const x = -(widthRange / 2) + idxInLayer * spacing;
      
      // Layer 1 = Top (+4.5), Layer 2 = Middle (0), Layer 3 = Bottom (-4.5)
      const y = node.layer === 1 ? 4.5 : node.layer === 2 ? 0 : -4.5;
      const z = Math.sin(idxInLayer * 1.5) * 1.5;
      return new THREE.Vector3(x, y, z);

    } else if (layoutMode === "force") {
      // Fibonacci Sphere Uniform 3D Lattice (Orbital Galaxy)
      const idx = nodes.findIndex(n => n.id === node.id);
      const theta = idx * (Math.PI * 2 / nodes.length);
      const phi = Math.acos((idx / nodes.length) * 2 - 1);
      const r = 9.5;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      return new THREE.Vector3(x, y, z);

    } else {
      // Default semantic cluster orbits
      return new THREE.Vector3(node.position[0], node.position[1], node.position[2]);
    }
  }, [layoutMode, node]);

  // ==================================================
  // UNIFIED VISIBILITY GATE PREDICATE
  // ==================================================
  const isVisible = useMemo(() => {
    // 1. Global Domain Filtering
    if (!activeDomains.includes(node.domain)) return false;

    // 2. Exploration Depth thresholds
    if (explorationDepth === 1 && node.layer > 1) return false;
    if (explorationDepth === 2 && node.layer > 2) return false;
    // Level 3 allows layer 3 nodes. Level 4 expands all always.

    // 3. Density Gating (removes lower importance nodes based on slider)
    if (explorationDepth !== 4 && selectedNodeId !== node.id && hoveredNodeId !== node.id && !isAlongPath) {
      if (node.importance === 2 && density < 0.45) {
        // Direct child bypass
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
      if (isSelected || isCompared || isAlongPath) return true;

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
  }, [node, activeDomains, explorationDepth, density, selectedNodeId, hoveredNodeId, isAlongPath, isolationMode, focusRadius, compareNodeId, isSelected, isCompared]);

  // ==================================================
  // SCALE, OPACITY & GLOW INTENSITIES (MICRO-SCALED FOR HIGH PRECISION)
  // ==================================================
  const baseSize = node.importance === 1 ? 0.32 : node.importance === 2 ? 0.22 : 0.14;

  let targetScale = 0;
  let targetOpacity = 0;
  let targetGlow = 0;

  if (isVisible) {
    if (selectedNodeId !== null) {
      if (isSelected || isCompared) {
        targetScale = baseSize * 1.35;
        targetOpacity = 1.0;
        targetGlow = 2.4; // Intense focus glow
      } else if (isAlongPath) {
        targetScale = baseSize * 1.12;
        targetOpacity = 1.0;
        targetGlow = 1.8; // Learning path emphasis
      } else {
        // Unrelated or hop connected node
        const primaryConnected = nodes.find(n => n.id === selectedNodeId)?.connections.includes(node.id) || 
                                 node.connections.includes(selectedNodeId);
        
        if (primaryConnected) {
          targetScale = baseSize * 0.9;
          targetOpacity = 0.9;
          targetGlow = 1.3;
        } else {
          // Contextual microscopic dots for unrelated nodes in non-isolated Focus Mode
          targetScale = baseSize * 0.2;
          targetOpacity = 0.02;
          targetGlow = 0.1;
        }
      }
    } else {
      // Standard Orbit view
      targetScale = baseSize * (isHovered ? 1.25 : 1.0);
      targetOpacity = isHovered ? 1.0 : 0.85;
      targetGlow = node.activationFrequency * (isHovered ? 1.6 : 0.55);
    }
  }

  // ==================================================
  // 60 FPS GRAPHICS RENDERING TICK
  // ==================================================
  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = clock.getElapsedTime();

    // 1. Floating space micro-bobbing animation
    if (targetOpacity > 0.05) {
      const bobbing = Math.sin(t * 1.2 + node.position[0] * 0.4) * 0.12;
      mesh.position.copy(targetPos);
      mesh.position.y += bobbing;
    } else {
      mesh.position.copy(targetPos);
    }

    // 2. Scale coordinate lerp with micro-breathing pulse
    const breathe = targetOpacity > 0.05 ? 1.0 + Math.sin(t * 1.5 + node.position[0]) * 0.06 : 1.0;
    mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, targetScale * breathe, 0.08));

    // 3. Material opacity and glow breathing pulses
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (mat) {
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.08);
      const breatheGlow = 1.0 + Math.sin(t * 2.2 + node.position[0]) * 0.15;
      
      // Highlight path nodes with pure cyan emissive shift if along path
      if (isAlongPath) {
        mat.emissive.setHex(0x06b6d4);
      } else {
        mat.emissive.copy(new THREE.Color(color));
      }
      
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetGlow * breatheGlow, 0.08);
      mesh.visible = mat.opacity > 0.005;
    }

    // 4. Spin cybernetic ring helper
    const ring = ringRef.current;
    if (ring) {
      ring.position.copy(mesh.position);
      ring.rotation.z = t * 0.5;
      ring.rotation.y = t * 0.2;
    }
  });

  // Zero-Clutter Standby View: Show label ONLY when active hovered, selected, compared, or along path
  const isInteractiveLabel = isHovered || isSelected || isCompared || isAlongPath;
  const shouldShowLabel = targetOpacity > 0.15 && isInteractiveLabel;

  return (
    <group>
      {/* Node Sphere with Neon emissive glow */}
      <Sphere 
        ref={meshRef} 
        args={[0.65, 32, 32]} 
        position={[node.position[0], node.position[1], node.position[2]]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedNode(isSelected ? null : node.id);
        }} 
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          setHoveredNode(node.id);
        }} 
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          setHoveredNode(null);
        }}
      >
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          transparent 
          opacity={0} 
          roughness={0.15} 
          metalness={0.1}
        />
      </Sphere>

      {/* Cybernetic outer rotating ring for active focus/compared/path/hovered nodes */}
      {targetOpacity > 0.15 && (isSelected || isCompared || isAlongPath || isHovered) && (
        <mesh ref={ringRef} position={[node.position[0], node.position[1], node.position[2]]}>
          <ringGeometry args={[0.75 * targetScale, 0.85 * targetScale, 32]} />
          <meshBasicMaterial 
            color={isAlongPath ? "#06b6d4" : color} 
            transparent 
            opacity={isSelected || isCompared || isAlongPath ? 0.75 : 0.35} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      )}
      
      {/* Sci-Fi Cyberpunk glassmorphism label overlay */}
      {shouldShowLabel && (
        <Html 
          center 
          distanceFactor={28} 
          position={[node.position[0], node.position[1] + 0.85, node.position[2]]}
          style={{ transition: "all 0.3s ease" }}
        >
          <div 
            className="flex items-center gap-1.5 px-2 py-0.8 rounded border backdrop-blur-md shadow-2xl pointer-events-auto cursor-pointer select-none transition-all duration-300 animate-fade-in opacity-100 scale-100 whitespace-nowrap"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNode(isSelected ? null : node.id);
            }}
            style={{ 
              backgroundColor: "rgba(3, 7, 18, 0.88)",
              borderColor: isAlongPath ? "rgba(6, 182, 212, 0.5)" : `${color}40`,
              boxShadow: isAlongPath ? "0 0 10px rgba(6, 182, 212, 0.25)" : `0 0 10px ${color}15`
            }}
          >
            <div className="w-1.2 h-1.2 rounded-full animate-pulse" style={{ backgroundColor: isAlongPath ? "#06b6d4" : color }} />
            <span className="text-[7.5px] uppercase tracking-widest font-extrabold" style={{ color: isAlongPath ? "#06b6d4" : color }}>
              {node.domain}
            </span>
            <span className="text-[10px] font-bold text-white/95">
              {node.title}
            </span>
            {isAlongPath && (
              <span className="text-[7px] bg-cyan-500/20 px-1 py-0.2 rounded text-cyan-300 font-bold uppercase tracking-wider">Path</span>
            )}
            {isSelected && (
              <span className="text-[7px] bg-white/10 px-1 py-0.2 rounded text-white/50 font-bold uppercase tracking-wider">Focus</span>
            )}
            {isCompared && (
              <span className="text-[7px] bg-purple-500/20 px-1 py-0.2 rounded text-purple-300 font-bold uppercase tracking-wider">Compare</span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

export function MatrixNodes() {
  return (
    <group>
      {nodes.map(node => (
        <SingleNode key={node.id} node={node} />
      ))}
    </group>
  );
}