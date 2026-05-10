"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Node {
  id: number;
  x: number;
  y: number;
  label: string;
  radius: number;
  connections: number[];
}

const NODES: Node[] = [
  { id: 0, x: 50, y: 45, label: "Quantum", radius: 6, connections: [1, 2, 5] },
  { id: 1, x: 25, y: 30, label: "Neural", radius: 5, connections: [0, 3, 4] },
  { id: 2, x: 75, y: 35, label: "Fluid", radius: 5, connections: [0, 6, 7] },
  { id: 3, x: 15, y: 55, label: "Cognition", radius: 4, connections: [1, 4, 8] },
  { id: 4, x: 35, y: 65, label: "Pattern", radius: 5, connections: [1, 3, 5, 9] },
  { id: 5, x: 55, y: 70, label: "Synthesis", radius: 4, connections: [0, 4, 6] },
  { id: 6, x: 70, y: 60, label: "Signal", radius: 4, connections: [2, 5, 7] },
  { id: 7, x: 85, y: 55, label: "Flow", radius: 3, connections: [2, 6] },
  { id: 8, x: 10, y: 75, label: "Memory", radius: 3, connections: [3, 9] },
  { id: 9, x: 45, y: 85, label: "Logic", radius: 3, connections: [4, 8] },
];

export function KnowledgeMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const handleResize = useCallback(() => {
    if (!containerRef.current) return;
    const { offsetWidth, offsetHeight } = containerRef.current;
    setDimensions({ width: offsetWidth, height: offsetHeight });
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      timeRef.current += 0.008;
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw connections
      NODES.forEach((node) => {
        node.connections.forEach((targetId) => {
          const target = NODES[targetId];
          const sx = (node.x / 100) * dimensions.width;
          const sy = (node.y / 100) * dimensions.height;
          const tx = (target.x / 100) * dimensions.width;
          const ty = (target.y / 100) * dimensions.height;

          const isHighlighted =
            hoveredNode === node.id || hoveredNode === targetId;

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(tx, ty);

          if (isHighlighted) {
            ctx.strokeStyle = "rgba(0, 255, 163, 0.5)";
            ctx.lineWidth = 1.5;
          } else {
            ctx.strokeStyle = "rgba(0, 255, 163, 0.08)";
            ctx.lineWidth = 0.5;
          }
          ctx.stroke();

          // Render pulse on highlighted connections
          if (isHighlighted) {
            const progress = (timeRef.current * 0.5 + node.id * 0.3) % 1;
            const px = sx + (tx - sx) * progress;
            const py = sy + (ty - sy) * progress;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0, 255, 163, 0.8)";
            ctx.fill();
          }
        });
      });

      // Draw nodes
      NODES.forEach((node) => {
        const x = (node.x / 100) * dimensions.width;
        const y = (node.y / 100) * dimensions.height;
        const isHovered = hoveredNode === node.id;
        const isConnected = hoveredNode !== null && NODES[hoveredNode]?.connections.includes(node.id);

        const r = isHovered ? node.radius + 3 : isConnected ? node.radius + 1 : node.radius;

        // Aura around hovered/connected nodes
        if (isHovered || isConnected) {
          ctx.beginPath();
          ctx.arc(x, y, r + 8, 0, Math.PI * 2);
          ctx.fillStyle = isHovered
            ? "rgba(0, 255, 163, 0.1)"
            : "rgba(0, 194, 255, 0.06)";
          ctx.fill();
        }

        // Pulse effect on hovered nodes
        if (isHovered) {
          const pulseR = r + 4 + Math.sin(timeRef.current * 3) * 4;
          ctx.beginPath();
          ctx.arc(x, y, pulseR, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(0, 255, 163, 0.2)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // node circle
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);

        if (isHovered) {
          ctx.fillStyle = "rgba(0, 255, 163, 0.9)";
        } else if (isConnected) {
          ctx.fillStyle = "rgba(0, 194, 255, 0.6)";
        } else {
          ctx.fillStyle = "rgba(0, 255, 163, 0.25)";
        }
        ctx.fill();

        // node label
        if (isHovered || isConnected) {
          ctx.font = `${isHovered ? "11" : "9"}px monospace`;
          ctx.fillStyle = isHovered ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)";
          ctx.textAlign = "center";
          ctx.fillText(node.label, x, y - r - 8);
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [dimensions, hoveredNode]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || dimensions.width === 0) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let found: number | null = null;
      NODES.forEach((node) => {
        const x = (node.x / 100) * dimensions.width;
        const y = (node.y / 100) * dimensions.height;
        const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2);
        if (dist < node.radius + 12) {
          found = node.id;
        }
      });

      setHoveredNode(found);
      canvasRef.current.style.cursor = found !== null ? "pointer" : "default";
    },
    [dimensions]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}