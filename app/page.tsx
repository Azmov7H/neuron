import { Navbar } from "../components/layout/header";
import { HeroSection } from "../components/layout/hero";
import { FeaturesGrid } from "../components/layout/features-grid";
import { CtaSection } from "../components/layout/cta-section";
import { Footer } from "../components/layout/footer";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-grid overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div className="absolute top-1/4 -left-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] animate-float-slow" />
        <div className="absolute bottom-1/4 -right-32 h-[400px] w-[400px] rounded-full bg-secondary/5 blur-[120px] animate-float-slower" />
      </div>
      <div className="relative z-10">
        <Navbar />
        <main>
          <HeroSection />
          <FeaturesGrid />
          <CtaSection />
        </main>
        <Footer />
      </div>
    </div>
  );
}
