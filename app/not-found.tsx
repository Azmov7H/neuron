import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
      <div className="max-w-2xl rounded-[2rem] border border-slate-700 bg-slate-900/95 p-10 shadow-2xl text-center">
        <p className="text-sm uppercase tracking-[0.4em] text-cyan-300">404 • Page not found</p>
        <h1 className="mt-6 text-5xl font-semibold text-white">Lost in the neural network?</h1>
        <p className="mt-4 text-slate-400">
          The route you followed does not exist. Return to the dashboard or try another section.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
