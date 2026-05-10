// components/simulation-runner/simulation-runner.tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, Sphere, MeshDistortMaterial } from "@react-three/drei";
import { SimHeader } from "./sim-header";
import { SimControls } from "./sim-controls";
import { SparkInsight } from "./spark-insight";
import { useState } from "react";

interface RunnerProps {
  slug: string;
}

export function SimulationRunner({ slug }: RunnerProps) {
  const [learningRate, setLearningRate] = useState(0.01);
  const [layers, setLayers] = useState(3);
  const [epochs, setEpochs] = useState(100);

  const isNeuralNet = slug === "neural-network-visualizer";

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* 3D Scene Area */}
      <div className="flex-1 relative bg-black/20">
        <Canvas camera={{ position: [0, 0, 6], fov: 50 }} className="w-full h-full">
          <ambientLight intensity={0.2} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} />
          
          {/* Placeholder Visuals for Neural Net */}
          {isNeuralNet && (
            <>
              <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1.5}>
                <Sphere args={[1, 64, 64]} position={[0, 0, 0]}>
                  <MeshDistortMaterial
                    color="#3b82f6"
                    attach="material"
                    distort={0.4 * learningRate * 10}
                    speed={epochs / 50}
                    roughness={0.2}
                    metalness={0.8}
                  />
                </Sphere>
              </Float>
              
              {/* Fake Nodes */}
              {Array.from({ length: layers * 3 }).map((_, i) => {
                const angle = (i / (layers * 3)) * Math.PI * 2;
                const radius = 3 + (i % 2);
                return (
                  <Float key={i} speed={1 + i * 0.1}>
                    <Sphere args={[0.1, 16, 16]} position={[Math.cos(angle) * radius, Math.sin(angle) * radius, i % 2 === 0 ? -2 : 2]}>
                      <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} />
                    </Sphere>
                  </Float>
                );
              })}
            </>
          )}

          {/* Fallback Visuals */}
          {!isNeuralNet && (
            <Float speed={2}>
              <Sphere args={[2, 64, 64]}>
                <MeshDistortMaterial color="#06b6d4" attach="material" distort={0.3} speed={2} roughness={0.1} metalness={0.9} />
              </Sphere>
            </Float>
          )}

          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>

        {/* Ambient Fog Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent pointer-events-none opacity-50" />
      </div>

      {/* Overlay UI */}
      <SimHeader title={isNeuralNet ? "Neural Network Visualizer" : "Quantum Experiment"} />
      <SimControls 
        learningRate={learningRate} setLearningRate={setLearningRate}
        layers={layers} setLayers={setLayers}
        epochs={epochs} setEpochs={setEpochs}
      />
      <SparkInsight />
    </div>
  );
}