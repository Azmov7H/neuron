// components/explore/explore-hero.tsx
export function ExploreHero() {
  return (
    <section className="relative h-[40vh] min-h-[350px] flex items-center justify-center text-center overflow-hidden rounded-2xl border border-white/5 animate-fade-up">
      {/* Ambient Depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-breathe" />
      
      <div className="relative z-10 px-4">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-4">
          Explore Human <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Knowledge</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          From quantum mechanics to consciousness. Every concept is a door waiting to be opened.
        </p>
      </div>
    </section>
  );
}