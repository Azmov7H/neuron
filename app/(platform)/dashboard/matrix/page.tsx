// app/(platform)/dashboard/matrix/page.tsx
import { MatrixCanvas } from "@/components/matrix/matrix-canvas";
import { MatrixHUD } from "@/components/matrix/matrix-hud";

export default function MatrixPage() {
  return (
    <div className="relative w-full h-[calc(100vh-4rem)] -m-8 bg-background overflow-hidden">
      <MatrixCanvas />
      <MatrixHUD />
    </div>
  );
}