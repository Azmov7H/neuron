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
       {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full bg-secondary/10 blur-[150px]"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px]"></div>
      </div>

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