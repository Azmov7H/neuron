import { LoginForm } from "@/components/auth/login-form";
import { LoginLeftPanel } from "@/components/auth/login-left-panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Login | Neuron",
  description: "Reconnect to the neural ecosystem and resume your cognitive evolution.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex relative font-sans bg-grid overflow-hidden">
      
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full bg-secondary/10 blur-[150px]"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px]"></div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-12 z-10 my-auto">
        <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <LoginLeftPanel />
          <LoginForm />
        </div>
      </div>
    </main>
  );
}