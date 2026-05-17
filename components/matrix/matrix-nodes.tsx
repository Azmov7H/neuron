// components/matrix/matrix-nodes.tsx
"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Html } from "@react-three/drei";
import { nodes, domainColors, MatrixNode } from "@/lib/matrix-data";
import { useMatrixStore } from "./matrix-store";
import * as THREE from "three";

function SingleNode({ node }: { node: MatrixNode }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { selectedNodeId, setSelectedNode } = useMatrixStore();
  
  const isSelected = selectedNodeId === node.id;
  const color = domainColors[node.domain];

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime();
      meshRef.current.position.y = node.position[1] + Math.sin(t + node.position[0]) * 0.2;
      meshRef.current.scale.setScalar(isSelected ? 1.5 : hovered ? 1.2 : 1);
    }
  });

  return (
    <group position={[node.position[0], node.position[1], node.position[2]]}>
      {/* Glow Effect */}
      <Sphere ref={meshRef} args={[0.6, 32, 32]} onClick={() => setSelectedNode(isSelected ? null : node.id)} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isSelected ? 2 : hovered ? 1 : 0.4} transparent opacity={0.9} roughness={0.2} />
      </Sphere>
      
      {/* Label */}
      {(hovered || isSelected) && (
        <Html center distanceFactor={15} style={{ transform: "translateY(-1.5rem)" }}>
          <div className="px-2 py-1 rounded bg-black/80 border border-white/10 text-xs text-white whitespace-nowrap shadow-lg pointer-events-none">
            {node.title}
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