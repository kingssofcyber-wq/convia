"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Convia route error:", error);
  }, [error]);

  return (
    <main className="grid min-h-[60vh] place-items-center bg-background px-4 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-7 text-center shadow-sm sm:p-9">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/10 text-rose-600" aria-hidden="true">
          <span className="text-2xl font-bold">!</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">This page could not finish loading</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Your original files are not changed by this message. You can retry the page or return to the Convia homepage.</p>
        {error.digest && <p className="mt-3 text-xs text-muted-foreground">Reference: {error.digest}</p>}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => reset()} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Try again</button>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:bg-muted">Back to Convia</Link>
        </div>
      </section>
    </main>
  );
}
