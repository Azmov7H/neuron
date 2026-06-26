'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    logger.error('[App Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center">
      <div className="max-w-2xl rounded-[2rem] border border-slate-700 bg-slate-900/95 p-10 shadow-2xl">
        <h1 className="text-4xl font-semibold text-slate-100">Something went wrong</h1>
        <p className="mt-4 text-slate-400">
          We hit an unexpected issue while loading this page. You can retry to continue.
        </p>
        <div className="mt-8 flex gap-3">
          <button
            className="rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            onClick={() => reset()}
          >
            Retry
          </button>
          <button
            className="rounded-full border border-slate-700 px-6 py-3 text-sm text-slate-200 transition hover:bg-slate-800"
            onClick={() => window.location.reload()}
          >
            Refresh page
          </button>
        </div>
      </div>
    </div>
  );
}
