"use client";

import { useEffect, useState } from "react";
import {
  Award,
  Brain,
  Flame,
  Orbit,
  Sparkles,
  TrendingUp,
  Loader2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/users/profile", {
          credentials: "same-origin",
        });
        const payload = await res.json();
        if (res.ok) {
          setProfileData(payload.data);
        } else {
          setError(payload.message || "Failed to load profile.");
        }
      } catch (err) {
        setError("Network error while loading profile.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h2 className="text-xl text-red-500">{error || "Failed to retrieve profile."}</h2>
      </div>
    );
  }

  const { user, totalSimulations, totalSparkSessions, recentActivity, neuralPathsProgress, recommendations } = profileData;

  // Calculate Level and XP Progress
  const totalXP = user.totalXP || 0;
  const level = Math.floor(totalXP / 1000) + 1;
  const xpInLevel = totalXP % 1000;
  const progressPercent = Math.min(Math.round(xpInLevel / 10), 100);

  // Default domains list to merge with user.domains
  const defaultDomains = [
    { name: "Physics", key: "physics" },
    { name: "Mathematics", key: "mathematics" },
    { name: "Technology", key: "technology" },
    { name: "Space Science", key: "space" },
    { name: "Biology", key: "biology" },
    { name: "Quantum Mechanics", key: "quantum-mechanics" },
  ];

  const skills = defaultDomains.map((d) => {
    const dbDomain = user.domains?.find(
      (ud: any) =>
        ud.domain?.toLowerCase() === d.key.toLowerCase() ||
        ud.domain?.toLowerCase() === d.name.toLowerCase()
    );
    return {
      label: d.name,
      value: dbDomain ? Math.round(dbDomain.mastery || 0) : 0,
    };
  });

  // Dynamic Insight Text
  const getInsightText = () => {
    const focusAreas = user.cognitiveProfile?.focusAreas || [];
    const strengths = user.cognitiveProfile?.strengths || [];
    const weaknesses = user.cognitiveProfile?.weaknesses || [];

    if (strengths.length > 0 || weaknesses.length > 0) {
      const strengthsStr = strengths.join(" and ");
      const weaknessesStr = weaknesses.join(" and ");
      let text = `You demonstrate strong analytical reasoning in ${strengthsStr || "your learning fields"}.`;
      if (weaknesses.length > 0) {
        text += ` Consider improving your ${weaknessesStr} foundations to enhance your overall cognitive balance.`;
      }
      if (focusAreas.length > 0) {
        text += ` Your current focus areas include ${focusAreas.join(", ")}.`;
      }
      return text;
    }

    // Dynamic fallback based on real domains progress
    const sortedDomains = [...(user.domains || [])].sort((a: any, b: any) => b.xp - a.xp);
    if (sortedDomains.length > 0) {
      const topDomain = sortedDomains[0].domain;
      const weakDomain = sortedDomains[sortedDomains.length - 1].domain;
      if (topDomain !== weakDomain) {
        return `You demonstrate strong analytical reasoning in ${topDomain}. Consider improving your ${weakDomain} foundations to expand your cross-disciplinary knowledge matrix.`;
      }
      return `You demonstrate strong dedication to exploring ${topDomain}. Continue completing lessons and simulations to unlock advanced cognitive structures.`;
    }

    return "Your cognitive profile is developing. Explore new concepts in the dashboard, run simulations, or chat with Spark to generate personalized learning insights.";
  };

  return (
    <div className="space-y-8 p-6">
      {/* Hero Section */}
      <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-black">
        <CardContent className="p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-500/10">
              <Brain className="h-12 w-12 text-yellow-400" />
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-bold capitalize">{user.username || "Anonymous"}</h1>

              <p className="mt-2 text-muted-foreground">
                {user.rank || "Observer"} • Cognitive Explorer
              </p>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Level {level}</span>
                  <span>{totalXP.toLocaleString()} XP</span>
                </div>

                <Progress value={progressPercent} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                icon={<Award />}
                value={user.rank || "Observer"}
                label="Current Rank"
              />

              <StatCard
                icon={<Flame />}
                value={`${user.streak || 0} Days`}
                label="Streak"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Stats */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<TrendingUp />}
          title="Total XP"
          value={totalXP.toLocaleString()}
        />

        <MetricCard
          icon={<Brain />}
          title="Concepts Learned"
          value={(user.discoveredConcepts?.length || 0).toString()}
        />

        <MetricCard
          icon={<Orbit />}
          title="Simulations"
          value={(totalSimulations || 0).toString()}
        />

        <MetricCard
          icon={<Sparkles />}
          title="AI Sessions"
          value={(totalSparkSessions || 0).toString()}
        />
      </section>

      {/* Cognitive Profile */}
      <Card>
        <CardContent className="space-y-6 p-6">
          <h2 className="text-xl font-semibold">
            Cognitive Profile
          </h2>

          {skills.map((skill, idx) => (
            <SkillBar key={idx} label={skill.label} value={skill.value} />
          ))}
        </CardContent>
      </Card>

      {/* Paths + Insights */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-5 text-xl font-semibold">
              Neural Paths
            </h2>

            <div className="space-y-5">
              {neuralPathsProgress && neuralPathsProgress.length > 0 ? (
                neuralPathsProgress.map((path: any, idx: number) => (
                  <PathProgress
                    key={idx}
                    title={path.title}
                    progress={path.progress}
                  />
                ))
              ) : (
                <div className="text-center text-muted-foreground py-6">
                  No active learning paths. Go to Explore to start one!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-5 text-xl font-semibold">
              Spark Insights
            </h2>

            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <p className="leading-relaxed text-muted-foreground">
                {getInsightText()}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {recommendations && recommendations.length > 0 ? (
                recommendations.map((rec: any, idx: number) => (
                  <Recommendation key={rec._id || idx}>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-foreground">{rec.targetTitle}</span>
                      <span className="text-xs text-muted-foreground">{rec.reason}</span>
                    </div>
                  </Recommendation>
                ))
              ) : (
                <>
                  <Recommendation>Complete Thermodynamics Advanced</Recommendation>
                  <Recommendation>Run Relativistic Orbit Simulation</Recommendation>
                  <Recommendation>Explore Black Hole Physics</Recommendation>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-6 text-xl font-semibold">
            Recent Activity
          </h2>

          <div className="space-y-4">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((act: any, idx: number) => {
                const dateStr = new Date(act.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <ActivityItem
                    key={act._id || idx}
                    title={`${act.reason}${act.xp > 0 ? ` (+${act.xp} XP)` : ""}`}
                    date={dateStr}
                  />
                );
              })
            ) : (
              <div className="text-center text-muted-foreground py-6">
                No recent activity logged yet. Start a learning path to begin!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* Helper Components */

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">
            {title}
          </p>
          <h3 className="mt-1 text-2xl font-bold">
            {value}
          </h3>
        </div>

        <div className="text-yellow-400">{icon}</div>
      </CardContent>
    </Card>
  );
}

function SkillBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between">
        <span>{label}</span>
        <span>{value}%</span>
      </div>

      <Progress value={value} />
    </div>
  );
}

function PathProgress({
  title,
  progress,
}: {
  title: string;
  progress: number;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between">
        <span>{title}</span>
        <span>{progress}%</span>
      </div>

      <Progress value={progress} />
    </div>
  );
}

function Recommendation({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-yellow-500/15 p-3">
      {children}
    </div>
  );
}

function ActivityItem({
  title,
  date,
}: {
  title: string;
  date: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <span>{title}</span>
      <span className="text-sm text-muted-foreground">
        {date}
      </span>
    </div>
  );
}

function StatCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-yellow-500/20 bg-black/40 p-4">
      <div className="mb-2 text-yellow-400">{icon}</div>
      <div className="font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">
        {label}
      </div>
    </div>
  );
}