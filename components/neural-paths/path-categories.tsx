// components/neural-paths/path-categories.tsx
"use client";

interface CategoriesProps {
  categories: string[];
  active: string;
  onSelect: (category: string) => void;
}

export function PathCategories({ categories, active, onSelect }: CategoriesProps) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-5 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
            active === cat
              ? "bg-primary/10 border-primary/30 text-primary shadow-[0_0_10px_rgba(59,130,246,0.15)]"
              : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}