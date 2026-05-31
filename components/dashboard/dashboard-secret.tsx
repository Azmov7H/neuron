"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

export function DashboardSecret() {
  const [secret, setSecret] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Loading dashboard secret...");

  useEffect(() => {
    const fetchSecret = async () => {
      try {
        // Use httpOnly session cookie via credentials: same-origin
        const response = await fetch("/api/dashboard/secret", {
          credentials: "same-origin",
        });

        const payload = await response.json();

        if (!response.ok) {
          setStatus(payload?.message || "Sign in to unlock the dashboard secret.");
          return;
        }

        setSecret(payload?.data?.secret ?? null);
        setStatus("Secret unlocked");
      } catch (error) {
        setStatus("Unable to load dashboard secret.");
      }
    };

    fetchSecret();
  }, []);

  return (
    <section className="glass rounded-3xl p-6 glow-border animate-fade-up delay-150">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Secure Insights</p>
          <h2 className="text-2xl font-semibold text-foreground">Dashboard Secret</h2>
        </div>
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <ShieldCheck size={20} />
        </div>
      </div>

      <div className="mt-6">
        {secret ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-mono text-foreground">
            {secret}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{status}</p>
        )}
      </div>
    </section>
  );
}
