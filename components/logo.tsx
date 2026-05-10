

import { Brain } from "lucide-react";
export default function Logo() {
    return(
        <div className="flex items-center gap-3 group">
        <div className="relative">
          <Brain className="w-10 h-10 text-primary neon-text" strokeWidth={1.5} />
          <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full group-hover:bg-primary/50 transition-all"></div>
        </div>
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tracking-tighter">
          NEURON
        </h1>
      </div>
    )
}