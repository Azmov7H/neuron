"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AtSign, ArrowRight, Eye, EyeOff, Loader2, Lock, ScanLine } from "lucide-react";

// ─── Form Schema (frontend-only validation) ───────────────────────────────────

const formSchema = z.object({
  email: z.string().email("Invalid neural link (email address)."),
  password: z.string().min(1, "Access code (password) is required."),
  remember: z.boolean().default(false).optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Stores token in localStorage AND sets the httpOnly session cookie via
 * /api/auth/session so the Next.js middleware can protect private routes.
 */
async function persistSession(accessToken: string, refreshToken: string, user: unknown) {
  // 1. localStorage — for client-side API calls
  localStorage.setItem("neuronAccessToken", accessToken);
  localStorage.setItem("neuronRefreshToken", refreshToken);
  localStorage.setItem("neuronUser", JSON.stringify(user ?? {}));

  // 2. httpOnly cookie — for Next.js Edge middleware
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as any),
    defaultValues: { email: "", password: "", remember: false },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, password: values.password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        // Use the unified error shape: { error: { message } }
        setErrorMessage(payload?.error?.message ?? "Login failed. Please try again.");
        return;
      }

      const tokens = payload?.data?.tokens;
      if (!tokens?.accessToken) {
        setErrorMessage("Login succeeded but no access token was returned.");
        return;
      }

      // Persist session (localStorage + httpOnly cookie)
      await persistSession(tokens.accessToken, tokens.refreshToken, payload?.data?.user);

      // Read optional callbackUrl from query params
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
      router.push(callbackUrl);
    } catch {
      setErrorMessage("Unable to complete login. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative w-full max-w-[480px] mx-auto">
      {/* Background Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 blur-2xl rounded-3xl opacity-50" />

      <Card className="holo-panel p-8 rounded-3xl relative border-0">
        <div className="relative z-10 flex flex-col gap-6">

          <CardHeader className="p-0 space-y-1">
            <div className="flex items-center gap-2 text-primary mb-2">
              <ScanLine size={16} />
              <span className="font-mono text-xs uppercase tracking-[0.2em]">Identity Verification</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Access Your Node</h2>
            <p className="text-muted-foreground font-mono text-sm">Reconnect to the neural ecosystem.</p>
          </CardHeader>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button type="button" variant="outline" className="glass-panel border-white/10 hover:bg-white/10 text-foreground font-mono text-xs">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
            <Button type="button" variant="outline" className="glass-panel border-white/10 hover:bg-white/10 text-foreground font-mono text-xs">
              Apple
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Or access with credentials</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200 font-mono">
              {errorMessage}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-widest text-primary/80">Neural Link (Email)</FormLabel>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input type="email" placeholder="evolution@neuron.ai" className="pl-10 input-cyber" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage className="font-mono text-xs text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="font-mono text-xs uppercase tracking-widest text-primary/80">Access Code</FormLabel>
                      <Link href="#" className="font-mono text-xs text-secondary hover:text-primary transition-colors">
                        Forgot Code?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10 input-cyber"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-transparent text-muted-foreground hover:text-primary h-7 w-7"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <FormMessage className="font-mono text-xs text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remember"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md p-1">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                    </FormControl>
                    <FormLabel className="font-mono text-xs text-muted-foreground cursor-pointer">
                      Keep me connected to the grid
                    </FormLabel>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 mt-2 rounded-xl holo-btn font-bold tracking-wider text-white border-0"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    ACCESS NETWORK
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          <CardFooter className="p-0 pt-2 border-t border-white/5 justify-center">
            <p className="text-muted-foreground text-sm font-mono mt-4">
              Don&apos;t have a node?{" "}
              <Link href="/auth/register" className="text-primary font-bold hover:underline ml-1">
                CREATE PROFILE
              </Link>
            </p>
          </CardFooter>

        </div>
      </Card>
    </div>
  );
}