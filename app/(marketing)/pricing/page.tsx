

export default function PricingPage() {
  return (
    <div className="relative min-h-screen bg-grid overflow-x-hidden">
       <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div className="absolute top-1/4 -left-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] animate-float-slow" />
        <div className="absolute bottom-1/4 -right-32 h-[400px] w-[400px] rounded-full bg-secondary/5 blur-[120px] animate-float-slower" />
      </div>
        <div className="relative z-10">
          <main>
            <h1 className="text-4xl font-bold text-center mt-20">Pricing Page</h1>
          </main>
        </div>
      </div>
  );
}