export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900/80 p-10 shadow-xl">
          <div className="h-6 w-56 rounded-full bg-slate-700" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="h-32 rounded-3xl bg-slate-800" />
            <div className="h-32 rounded-3xl bg-slate-800" />
            <div className="h-32 rounded-3xl bg-slate-800" />
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="h-24 rounded-3xl bg-slate-800" />
            <div className="h-24 rounded-3xl bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
