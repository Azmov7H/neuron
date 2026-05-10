// components/simulations/simulations-hero.tsx
"use client";

import Link from "next/link";
import { Play, Sparkles, Zap, Brain, Activity } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, Sphere, MeshDistortMaterial } from "@react-three/drei";

function NeuralNetworkScene() {
  return (
    <>
      {/* Floating Neural Nodes */}
      <Float speed={1.4} rotationIntensity={1} floatIntensity={2}>
        <Sphere args={[0.1]} position={[-2, 1, 0]}>
          <MeshDistortMaterial color="#3b82f6" distort={0.3} speed={2} />
        </Sphere>
      </Float>
      <Float speed={1.2} rotationIntensity={1.2} floatIntensity={1.5}>
        <Sphere args={[0.08]} position={[2, -1, 0]}>
          <MeshDistortMaterial color="#06b6d4" distort={0.4} speed={1.5} />
        </Sphere>
      </Float>
      <Float speed={1.6} rotationIntensity={0.8} floatIntensity={2.5}>
        <Sphere args={[0.06]} position={[0, 0, 1]}>
          <MeshDistortMaterial color="#8b5cf6" distort={0.2} speed={2.5} />
        </Sphere>
      </Float>
      <Float speed={1.3} rotationIntensity={1.5} floatIntensity={1.8}>
        <Sphere args={[0.09]} position={[-1, -1.5, -0.5]}>
          <MeshDistortMaterial color="#f59e0b" distort={0.35} speed={1.8} />
        </Sphere>
      </Float>
    </>
  );
}

export function SimulationsHero() {
  return (
    <section className="relative h-[60vh] min-h-[500px] rounded-2xl overflow-hidden border border-white/5 group animate-fade-up">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-background to-blue-900/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80')] bg-cover bg-center opacity-15 mix-blend-luminosity group-hover:scale-105 transition-transform duration-1000" />

      {/* 3D Neural Network Overlay */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <NeuralNetworkScene />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>

      {/* Floating Particles Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-secondary/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-accent/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="relative h-full flex flex-col justify-end p-8 lg:p-12 z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center gap-1">
              <Zap size={10} /> Featured Lab
            </span>
            <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
              <Activity size={10} /> Live Simulation
            </span>
            <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest bg-white/5 text-muted-foreground border border-white/10 rounded-full">
              AI Domain
            </span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-bold tracking-tighter text-foreground mb-4">
            Neural Network <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Visualizer</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
            Watch intelligence emerge in real-time. Adjust layers, tweak learning rates, and see how a network learns to recognize patterns through interactive 3D visualization.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-primary" />
                <span>Real-time Training</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-secondary" />
                <span>Interactive Controls</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/simulations/neural-network-visualizer"
              className="group flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all active:scale-95 hover:scale-105"
            >
              <Play size={18} fill="currentColor" />
              Enter Lab
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Link>
            <button className="group flex items-center gap-2 bg-white/5 border border-white/10 hover:border-primary/30 text-foreground px-6 py-3 rounded-lg font-medium transition-all hover:bg-white/10 hover:scale-105">
              <Sparkles size={16} className="text-secondary group-hover:text-primary transition-colors" />
              Ask Spark
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-lg" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}