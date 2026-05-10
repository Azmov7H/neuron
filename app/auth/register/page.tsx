import { SignupForm } from "@/components/auth/signup-form";
import { LeftPanel } from "@/components/auth/left-panel";

export default function SignupPage() {
  return (
    <main className="min-h-screen flex relative font-sans bg-grid overflow-hidden">
      
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[150px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-secondary/10 blur-[150px]"></div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-12 z-10 my-auto">
        <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <LeftPanel />
          <SignupForm />
        </div>
      </div>
    </main>
  );
}