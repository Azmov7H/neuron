// components/simulations/simulations-hero.tsx
"use client";

import Link from "next/link";
import { Play, Sparkles, Zap, Brain, Activity } from "lucide-react";
import React, { useEffect, useRef } from 'react';

function CanvasNeuralNetwork() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }> = [];

    const colors = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b'];

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.2;
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Update & Draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

export function SimulationsHero() {
  return (
    <section className="relative h-[60vh] min-h-[500px] rounded-2xl overflow-hidden border border-white/5 group animate-fade-up">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-background to-blue-900/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      {/* Self-hosted CSS texture — replaces external Unsplash URL (S-5 CSP fix) */}
      <div className="absolute inset-0 opacity-20 mix-blend-luminosity group-hover:scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 20% 40%, rgba(96,165,250,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 20%, rgba(167,139,250,0.15) 0%, transparent 55%),
            radial-gradient(ellipse 40% 40% at 50% 80%, rgba(34,211,238,0.12) 0%, transparent 50%),
            repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.008) 40px, rgba(255,255,255,0.008) 41px),
            repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.008) 40px, rgba(255,255,255,0.008) 41px)
          `
        }}
      />

      {/* Pure Canvas Neural Network Overlay */}
      <div className="absolute inset-0">
        <CanvasNeuralNetwork />
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
              <Zap size={10} /> Unified Core
            </span>
            <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
              <Activity size={10} /> Deterministic Loops
            </span>
            <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest bg-white/5 text-muted-foreground border border-white/10 rounded-full">
              6 Scientific Domains
            </span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-bold tracking-tighter text-foreground mb-4">
            Scientific Telemetry <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Laboratories</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
            Explore Einstein&apos;s relativity, epidemic SIR transmissions, white blood cell phagocytosis sweeps, quantized quantum energy fields, and Schwarzschild redshift event horizons at 60 FPS, with direct Spark AI streaming assessments.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-primary" />
                <span>60 FPS Render Engines</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-secondary" />
                <span>Spark Stream Telemetry</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/simulations/physics"
              className="group flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all active:scale-95 hover:scale-105"
            >
              <Play size={18} fill="currentColor" />
              Enter Laboratories
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Link>
            <Link 
              href="/dashboard/simulations/physics"
              className="group flex items-center gap-2 bg-white/5 border border-white/10 hover:border-primary/30 text-foreground px-6 py-3 rounded-lg font-medium transition-all hover:bg-white/10 hover:scale-105"
            >
              <Sparkles size={16} className="text-secondary group-hover:text-primary transition-colors" />
              Telemetry HUD
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}