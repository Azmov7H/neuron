// app/(platform)/dashboard/matrix/page.tsx
import { MatrixCanvas } from "@/components/matrix/matrix-canvas";
import { MatrixHUD } from "@/components/matrix/matrix-hud";

export default function MatrixPage() {
  return (
    <div className="w-full h-[calc(100vh-8.5rem)] p-4 relative overflow-hidden bg-background">
      <div className="flex h-full w-full bg-[#030712] overflow-hidden relative text-foreground font-sans select-none rounded-2xl border border-white/5 shadow-2xl">
        <MatrixCanvas />
        <MatrixHUD />
      </div>
    </div>
  );
}