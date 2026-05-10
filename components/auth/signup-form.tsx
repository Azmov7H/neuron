"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
import { AtSign, Compass, User, ArrowRight, Eye, EyeOff, Loader2, Lock, ScanLine } from "lucide-react";

const formSchema = z.object({
  fullName: z.string().min(3, "Name must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  path: z.string().min(1, "Please select a path."),
});

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema as any),
    defaultValues: { fullName: "", email: "", password: "", path: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    // replace with actual signup logic (e.g., call to API route)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log(values);
    setIsSubmitting(false);
  }

  return (
    <div className="relative w-full max-w-[480px] mx-auto">
      {/* Background Glow for the Card */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 blur-2xl rounded-3xl opacity-50"></div>
      
      <Card className="holo-panel p-8 rounded-3xl relative border-0">
        <div className="relative z-10 flex flex-col gap-6">
          
          <CardHeader className="p-0 space-y-1">
            <div className="flex items-center gap-2 text-primary mb-2">
              <ScanLine size={16} />
              <span className="font-mono text-xs uppercase tracking-[0.2em]">Identity Verification</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Create Your Profile</h2>
            <p className="text-muted-foreground font-mono text-sm">Step into the neural ecosystem.</p>
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
              
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-widest text-primary/80">Full Name</FormLabel>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input placeholder="Nikola Tesla" className="pl-10 input-cyber" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage className="font-mono text-xs text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-widest text-primary/80">Email Address</FormLabel>
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
                    <FormLabel className="font-mono text-xs uppercase tracking-widest text-primary/80">Password</FormLabel>
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
                        onClick={() => setShowPassword(!showPassword)}
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
                name="path"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-widest text-primary/80">Learning Path</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="input-cyber data-[placeholder]:text-muted-foreground">
                          <Compass className="h-4 w-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Select Discipline" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#0f172a] border-primary/20 text-foreground font-mono">
                        <SelectItem value="ai" className="hover:bg-primary/10">Artificial Intelligence</SelectItem>
                        <SelectItem value="physics" className="hover:bg-primary/10">Quantum Physics</SelectItem>
                        <SelectItem value="astronomy" className="hover:bg-primary/10">Theoretical Astronomy</SelectItem>
                        <SelectItem value="neuroscience" className="hover:bg-primary/10">Neuroscience</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="font-mono text-xs text-red-400" />
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
                    BEGIN EVOLUTION
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          <CardFooter className="p-0 pt-2 border-t border-white/5 justify-center">
            <p className="text-muted-foreground text-sm font-mono mt-4">
              Already part of the network?{" "}
              <Link href="/auth/login" className="text-primary font-bold hover:underline ml-1">
                LOG IN
              </Link>
            </p>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}