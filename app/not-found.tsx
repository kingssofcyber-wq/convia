import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-[65vh] place-items-center bg-background px-4 py-12">
      <section className="max-w-lg text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><FileQuestion size={30} /></div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">404 · Page not found</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">This page could not be found.</h1>
        <p className="mt-3 text-muted-foreground">The link may be outdated or the page may have moved. Choose an available Convia tool from the homepage.</p>
        <Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"><ArrowLeft size={16} /> Back to homepage</Link>
      </section>
    </main>
  );
}
