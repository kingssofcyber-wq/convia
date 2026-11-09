import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";

export const metadata: Metadata = {
  title: "Log in — Coming Soon",
  robots: { index: false, follow: true },
};

export default function AccountComingSoonPage() {
  return (
    <main className="grid min-h-[70vh] place-items-center bg-background px-4 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-border bg-card p-7 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><LockKeyhole size={26} /></div>
        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Coming soon</span>
        <h1 className="mt-5 text-3xl font-extrabold">Log in</h1>
        <p className="mt-3 leading-7 text-muted-foreground">Account access is being prepared. You can continue using the available tools without an account.</p>
        <Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"><ArrowLeft size={16} /> Back to Convia</Link>
      </section>
    </main>
  );
}
