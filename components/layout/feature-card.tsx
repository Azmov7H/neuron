import Image from "next/image";

interface FeatureCardProps {
  id: string;
  icon: string;
  tag: string;
  title: string;
  description: string;
  image: string;
  accent: "primary" | "secondary";
}

const icons: Record<string, React.ReactNode> = {
  quantum: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
    </svg>
  ),
  brain: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" />
      <path d="M10 22h4M9 17h6" />
    </svg>
  ),
  simulation: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 3v18" />
      <circle cx="15" cy="15" r="2" fill="currentColor" />
    </svg>
  ),
};

export function FeatureCard({
  id,
  icon,
  tag,
  title,
  description,
  image,
  accent,
}: FeatureCardProps) {
  const accentColor = accent === "primary" ? "text-primary" : "text-secondary";
  const accentBg = accent === "primary" ? "bg-primary/10" : "bg-secondary/10";
  const accentBorder = accent === "primary" ? "border-primary/20" : "border-secondary/20";
  const accentHoverBorder = accent === "primary" ? "hover:border-primary/30" : "hover:border-secondary/30";

  return (
    <article
      id={id}
      className={`glow-border group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 ${accentHoverBorder}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

        {/* Tag */}
        <span
          className={`absolute top-4 left-4 font-mono text-[10px] font-medium uppercase tracking-widest ${accentColor} ${accentBg} ${accentBorder} border px-2.5 py-1 rounded-md backdrop-blur-sm`}
        >
          {tag}
        </span>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${accentBg} ${accentColor}`}>
          {icons[icon]}
        </div>
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-4">
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-medium ${accentColor} transition-all group-hover:gap-2.5`}
          >
            Explore module
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 7h10M8 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </article>
  );
}