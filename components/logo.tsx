

import Link from "next/link";
export default function Logo() {
    return(
        <Link href="/" className="flex items-center gap-2.5 group">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/15 transition-colors">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="text-primary"
                    >
                      <path
                        d="M8 1L14.9282 5V11L8 15L1.07179 11V5L8 1Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                      />
                      <circle cx="8" cy="8" r="2" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="font-mono text-sm font-semibold tracking-wider uppercase text-foreground">
                    Neuron
                  </span>
                </Link>
    )
}