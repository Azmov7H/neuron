// app/(dashboard)/layout.tsx
import { TopBar } from "@/components/dashboard/top-bar";
import { SideNav } from "@/components/dashboard/side-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Ambient Depth Glows - visible across entire dashboard */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full animate-breathe pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full animate-breathe pointer-events-none" style={{ animationDelay: "4s" }} />

      <SideNav />
      
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}