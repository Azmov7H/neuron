// components/matrix/matrix-edges.tsx
"use client";

import { nodes, edges } from "@/lib/matrix-data";
import { useMatrixStore } from "./matrix-store";
import { Line } from "@react-three/drei";

export function MatrixEdges() {
  const { selectedNodeId } = useMatrixStore();

  const getNodePosition = (id: string) => nodes.find(n => n.id === id)?.position;

  return (
    <group>
      {edges.map((edge, idx) => {
        const startPos = getNodePosition(edge.source);
        const endPos = getNodePosition(edge.target);
        
        if (!startPos || !endPos) return null;

        const isConnected = selectedNodeId === edge.source || selectedNodeId === edge.target;
        const opacity = selectedNodeId ? (isConnected ? 0.8 : 0.05) : 0.2;

        return (
          <Line 
            key={idx}
            points={[startPos, endPos]} 
            color={isConnected ? "#3b82f6" : "#ffffff"} 
            lineWidth={isConnected ? 2 : 1}
            transparent 
            opacity={opacity} 
          />
        );
      })}
    </group>
  );
}