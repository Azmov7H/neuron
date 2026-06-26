"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowRight, Loader2 } from "lucide-react";

// ─── Form Schema ──────────────────────────────────────────────────────────────
// Must match fields sent to /api/auth/register.
// fullName is UI-only (display), not sent to the backend.
// path maps to preferredDomain in the API payload.

const formSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must not exceed 20 characters")
      .regex(
        /^[a-z0-9_-]+$/,
        "Lowercase letters, numbers, underscores and hyphens only"
      )
      .toLowerCase(),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Must contain uppercase, lowercase, and a number"
      ),
    confirmPassword: z.string(),
    path: z.string().min(1, "Please select a learning path"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchCsrfToken() {
  const response = await fetch('/api/auth/csrf');
  if (!response.ok) {
    throw new Error('Unable to obtain CSRF token');
  }

  const payload = await response.json();
  return payload?.data?.csrfToken as string | undefined;
}

function getCsrfHeader(csrfToken: string | undefined): Record<string, string> {
  return csrfToken ? { 'x-csrf-token': csrfToken } : {};
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SignupForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Allow `any` here to accommodate resolver type differences between
  // `@hookform/resolvers` and `zod` minor-version typings.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      path: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setApiError(null);

    try {
      // Only send fields the backend expects — fullName stays UI-only
      const payload = {
        username: values.username,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        preferredDomain: values.path,
      };

      const csrfToken = await fetchCsrfToken();

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeader(csrfToken),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        // Unified error shape: { error: { message, fields? } }
        const errMsg = data?.error?.message ?? 'Registration failed.';
        const fields = data?.error?.fields as Record<string, string[]> | undefined;

        // Map server-side field errors back into react-hook-form
        if (fields) {
          (Object.keys(fields) as Array<keyof FormValues>).forEach((field) => {
            if (field in form.getValues()) {
              form.setError(field as keyof FormValues, {
                type: 'server',
                message: fields[field as string][0],
              });
            }
          });
        }

        setApiError(errMsg);
        return;
      }

      // Registration successful — redirect to login
      router.push("/auth/login");
    } catch {
      setApiError("Unable to complete registration. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[480px] mx-auto">
      <Card className="p-6">

        <CardHeader>
          <h2 className="text-2xl font-bold">Create Account</h2>
          <p className="text-muted-foreground text-sm">Join the neural ecosystem.</p>
        </CardHeader>

        {/* API-level error banner */}
        {apiError && (
          <div role="alert" className="mx-6 mb-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {apiError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-6 pb-6">

            {/* Full Name — UI only, not sent to API */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ada Lovelace" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Username */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="ada_lovelace" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="ada@neuron.ai" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Learning Path */}
            <FormField
              control={form.control}
              name="path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Learning Path</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your first domain" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ai">Artificial Intelligence</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="astronomy">Astronomy</SelectItem>
                      <SelectItem value="neuroscience">Neuroscience</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Create Account <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

          </form>
        </Form>

        <CardFooter className="justify-center pt-0">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>

      </Card>
    </div>
  );
}