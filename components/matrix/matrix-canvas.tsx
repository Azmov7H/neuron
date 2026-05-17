// components/matrix/matrix-canvas.tsx
"use client";

import { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { MatrixNodes } from "./matrix-nodes";
import { MatrixEdges } from "./matrix-edges";
import { AmbientParticles } from "./ambient-particles";
import { useMatrixStore } from "./matrix-store";
import { nodes } from "@/lib/matrix-data";
import * as THREE from "three";

function CameraController() {
  const { camera, controls } = useThree();
  const selectedNodeId = useMatrixStore((state) => state.selectedNodeId);
  const setZoomLevel = useMatrixStore((state) => state.setZoomLevel);
  
  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const targetCameraPos = useRef(new THREE.Vector3(0, 0, 20));
  const lastZoom = useRef(20);

  useEffect(() => {
    if (selectedNode) {
      const [x, y, z] = selectedNode.position;
      // Focus look-at directly on the selected node
      targetLookAt.current.set(x, y, z);
      
      // Position the camera close to the node at a premium offset
      // Calculate node's angle from center to position camera outwards, or simply standard offset
      const length = Math.sqrt(x*x + y*y + z*z);
      const dirX = length > 0 ? x / length : 0;
      const dirY = length > 0 ? y / length : 0;
      const dirZ = length > 0 ? z / length : 1;

      // Position camera slightly outwards and upwards from the node
      targetCameraPos.current.set(
        x + dirX * 3.5 + 1.0, 
        y + dirY * 2.0 + 1.5, 
        z + dirZ * 4.0 + 1.5
      );
    } else {
      // Look back at the origin center
      targetLookAt.current.set(0, 0, 0);
    }
  }, [selectedNodeId, selectedNode]);

  useFrame((state) => {
    // 1. Measure and update camera zoom distance from target
    const currentTarget = controls ? (controls as any).target : new THREE.Vector3(0, 0, 0);
    const dist = state.camera.position.distanceTo(currentTarget);
    
    if (Math.abs(lastZoom.current - dist) > 0.15) {
      lastZoom.current = dist;
      setZoomLevel(dist);
    }

    // 2. Smoothly interpolate OrbitControls look-at target
    if (controls) {
      const orbitControls = controls as any;
      if (orbitControls.target) {
        orbitControls.target.lerp(targetLookAt.current, 0.08);
      }
    }

    // 3. Smoothly interpolate Camera Position when focusing
    if (selectedNodeId) {
      state.camera.position.lerp(targetCameraPos.current, 0.06);
    }
  });

  return null;
}

export function MatrixCanvas() {
  const selectedNodeId = useMatrixStore((state) => state.selectedNodeId);

  return (
    <Canvas camera={{ position: [0, 0, 22], fov: 55 }} dpr={[1, 2]}>
      {/* Premium deep-space fog */}
      <color attach="background" args={["#030712"]} />
      <fog attach="fog" args={["#030712", 12, 32]} />
      
      {/* Cinematic ambient and point lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[10, 15, 10]} intensity={0.6} color="#3b82f6" />
      <pointLight position={[-10, -15, -10]} intensity={0.3} color="#a855f7" />
      <directionalLight position={[0, 10, 5]} intensity={0.4} color="#ffffff" />
      
      <MatrixNodes />
      <MatrixEdges />
      <AmbientParticles />
      
      <CameraController />
      
      <OrbitControls 
        enableZoom={true} 
        enablePan={true} 
        enableDamping={true}
        dampingFactor={0.05}
        autoRotate={!selectedNodeId} // Turn off auto-rotation when focusing on a concept
        autoRotateSpeed={0.18} 
        maxDistance={30} 
        minDistance={5}
        maxPolarAngle={Math.PI * 0.85}
        minPolarAngle={Math.PI * 0.15}
      />
    </Canvas>
  );
}