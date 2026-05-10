import Link from "next/link";

export function CtaSection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        {/* Background Pulse */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          <div className="h-[400px] w-[400px] rounded-full border border-primary/10 animate-pulse-ring" />
          <div className="absolute h-[500px] w-[500px] rounded-full border border-primary/5 animate-pulse-ring" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative">
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
            The Next Step
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            Ready to evolve?
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground leading-relaxed">
            Join thousands of cognitive pioneers who have already begun their
            transformation. Your neural evolution starts with a single step.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="#"
              className="group relative inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground transition-all hover:shadow-[0_0_30px_rgba(0,255,163,0.3)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Begin Your Evolution
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="transition-transform group-hover:translate-x-0.5"
              >
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href="#"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-4 text-sm font-medium text-foreground transition-all hover:bg-muted/50 hover:border-muted-foreground/30"
            >
              View Documentation
            </Link>
          </div>

          {/* Statistics */}
          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-border/50 pt-10">
            <div>
              <p className="text-2xl font-bold text-primary sm:text-3xl">12k+</p>
              <p className="mt-1 text-xs text-muted-foreground">Active Learners</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary sm:text-3xl">98%</p>
              <p className="mt-1 text-xs text-muted-foreground">Completion Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground sm:text-3xl">4.9</p>
              <p className="mt-1 text-xs text-muted-foreground">Average Rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}