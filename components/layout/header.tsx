import Link from "next/link";
import Logo from "../logo";

const navLinks = [
  { href: "#features", label: "Modules" },
  { href: "#labs", label: "Labs" },
  { href: "#mentorship", label: "Mentorship" },
  { href: "#maps", label: "Knowledge" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Logo />

        
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        
        <div className="flex items-center gap-3">
          <Link
            href="#"
            className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Begin Evolution
          </Link>
        </div>
      </div>
    </header>
  );
}