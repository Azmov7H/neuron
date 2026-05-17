// components/matrix/matrix-canvas.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { MatrixNodes } from "./matrix-nodes";
import { MatrixEdges } from "./matrix-edges";
import { AmbientParticles } from "./ambient-particles";

export function MatrixCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 20], fov: 60 }} dpr={[1, 2]}>
      <fog attach="fog" args={["#0a0e1a", 15, 35]} />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      
      <MatrixNodes />
      <MatrixEdges />
      <AmbientParticles />
      
      <OrbitControls 
        enableZoom={true} 
        enablePan={true} 
        autoRotate 
        autoRotateSpeed={0.3} 
        maxDistance={35} 
        minDistance={8}
        maxPolarAngle={Math.PI * 0.85}
        minPolarAngle={Math.PI * 0.15}
      />
    </Canvas>
  );
}