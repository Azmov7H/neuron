import Image from "next/image";

export function DecorativeBackground() {
  return (
    <>
      {/* background light */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary aura-glow"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-secondary aura-glow"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[#070d1f] opacity-40"></div>
      </div>

      {/* decorative floating ball */}
      <div className="absolute bottom-10 right-10 w-64 h-64 opacity-20 pointer-events-none overflow-hidden hidden xl:block">
        <div className="w-full h-full glass-panel rounded-full relative animate-pulse shadow-[inset_0_0_40px_rgba(173,198,255,0.4)]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/10 rounded-full animate-spin"></div>
        </div>
      </div>

      {/* decorative node card */}
      <div className="absolute top-20 left-[5%] hidden 2xl:block opacity-60">
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
          <Image
            src="/nebula.jpg" 
            alt="Nebula Cluster"
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover border border-primary/40"
          />
          <div>
            <p className="text-xs uppercase tracking-widest text-primary font-medium">NEW NODE</p>
            <p className="text-sm font-medium">Dark Matter Simulation</p>
          </div>
        </div>
      </div>
    </>
  );
}