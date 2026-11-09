import { Heart, ShieldCheck, Sparkles, Target } from "lucide-react";

export const metadata = { title: "About Convia" };

export default function AboutPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-14 sm:py-20">
      <header className="mx-auto mb-14 max-w-3xl text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">About the workspace</p>
        <h1 className="mb-5 text-4xl font-extrabold tracking-tight sm:text-5xl">Useful tools, <span className="gradient-text">one simpler place.</span></h1>
        <p className="text-lg leading-8 text-muted-foreground">Convia is a growing digital workspace built to make everyday document and information tasks easier to approach. We are developing practical PDF utilities first, with finance, insurance and wellness resources planned alongside them.</p>
      </header>
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card p-7 shadow-sm">
          <Target className="mb-4 h-9 w-9 text-primary" />
          <h2 className="mb-3 text-xl font-bold">Our purpose</h2>
          <p className="leading-7 text-muted-foreground">We want useful digital tasks to feel clear and approachable. The aim is a straightforward workspace with practical tools, transparent limits and helpful instructions.</p>
        </section>
        <section className="rounded-3xl border border-border bg-card p-7 shadow-sm">
          <Sparkles className="mb-4 h-9 w-9 text-primary" />
          <h2 className="mb-3 text-xl font-bold">A platform in progress</h2>
          <p className="leading-7 text-muted-foreground">Some PDF tools are available today. Other PDF, financial, insurance and health features are marked Coming Soon until their pages and functions are ready.</p>
        </section>
        <section className="rounded-3xl border border-border bg-card p-7 shadow-sm">
          <ShieldCheck className="mb-4 h-9 w-9 text-primary" />
          <h2 className="mb-3 text-xl font-bold">Clear privacy information</h2>
          <p className="leading-7 text-muted-foreground">We aim to explain how each tool handles files. Read the notice on an individual tool before using it for sensitive documents; different features may use different processing methods.</p>
        </section>
        <section className="rounded-3xl border border-border bg-card p-7 shadow-sm">
          <Heart className="mb-4 h-9 w-9 text-primary" />
          <h2 className="mb-3 text-xl font-bold">Built for everyday use</h2>
          <p className="leading-7 text-muted-foreground">Convia focuses on a simple interface, clear steps and accessible tools. The project footer credits Mivaan Jangra as its creator.</p>
        </section>
      </div>
    </main>
  );
}
