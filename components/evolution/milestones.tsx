import { Clock, Flame, Atom } from "lucide-react";

export function Milestones({ streak, stats }: { streak: number; stats?: any }) {
  const currentStreak = streak || 0;
  const timeSpentMin = stats?.totalTimeSpent || 0;
  const completedPaths = stats?.totalPathsCompleted || 0;

  // Convert minutes to hours and format
  const hoursSpent = (timeSpentMin / 60).toFixed(1);

  const milestones = [
    { 
      icon: Clock, 
      title: `${hoursSpent} Hours Learning`, 
      desc: "Deep platform engagement", 
      achieved: timeSpentMin >= 60, // achieved after 1 hour of learning
      color: "border-blue-500/30 bg-blue-500/5" 
    },
    { 
      icon: Flame, 
      title: "30-Day Continuity", 
      desc: `${currentStreak}/30 streak days`, 
      achieved: currentStreak >= 30, 
      color: "border-amber-500/30 bg-amber-500/5" 
    },
    { 
      icon: Atom, 
      title: "Neural Path Pioneer", 
      desc: `${completedPaths} path(s) fully completed`, 
      achieved: completedPaths > 0, 
      color: "border-purple-500/30 bg-purple-500/5" 
    },
  ];

  return (
    <div className="animate-fade-up delay-300">
      <h3 className="text-lg font-semibold text-foreground mb-6">Milestones</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {milestones.map((milestone) => (
          <div 
            key={milestone.title} 
            className={`glass rounded-xl p-6 border ${milestone.color} transition-all hover:-translate-y-1 ${
              !milestone.achieved ? "opacity-40" : ""
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-white/5">
                <milestone.icon size={18} className="text-foreground" />
              </div>
              {milestone.achieved && (
                <span className="text-[10px] uppercase tracking-widest font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                  Achieved
                </span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-1">{milestone.title}</h4>
            <p className="text-xs text-muted-foreground">{milestone.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}