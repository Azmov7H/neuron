
export default function About() {
  return (
    <div className="relative min-h-screen bg-grid overflow-x-hidden">
       <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div className="absolute top-1/4 -left-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] animate-float-slow" />
        <div className="absolute bottom-1/4 -right-32 h-[400px] w-[400px] rounded-full bg-secondary/5 blur-[120px] animate-float-slower" />
      </div>
        <div className="relative z-10">
        <h1 className="text-4xl font-bold text-center mt-20">About Neural Mastery</h1>
        <p className="mt-6 text-lg text-center max-w-2xl mx-auto">
          Neural Mastery is an AI-driven cognitive engine designed to transform how you perceive, learn, and evolve. By unlocking the patterns hidden within complexity through quantum-enhanced neural pathways, we aim to accelerate your cognitive evolution and help you master the art of understanding reality.
        </p>
      </div>
    </div>
  );
}