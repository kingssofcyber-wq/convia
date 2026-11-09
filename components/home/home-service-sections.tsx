import Link from "next/link";
import { ArrowUpRight, Calculator, HeartPulse, ShieldCheck } from "lucide-react";

const sections = [
  {
    id: "loans",
    eyebrow: "Money & planning",
    title: "Loans & EMI",
    description: "Plan repayments and understand common borrowing terms with practical calculators and plain-language guides.",
    icon: Calculator,
    items: ["EMI Calculator", "Loan Planner", "Interest Calculator"],
  },
  {
    id: "insurance",
    eyebrow: "Protection & cover",
    title: "Insurance",
    description: "Explore basic information about life, health, motor and travel insurance before comparing policy details with a licensed provider.",
    icon: ShieldCheck,
    items: ["Life Insurance Guide", "Health Insurance Guide", "Motor & Travel Cover"],
  },
  {
    id: "health",
    eyebrow: "Everyday wellbeing",
    title: "Health & wellness",
    description: "Simple educational utilities and general wellness information. These tools are not a diagnosis or a substitute for professional care.",
    icon: HeartPulse,
    items: ["BMI Calculator", "Water Intake Guide", "Age Calculator"],
  },
];

export function HomeServiceSections() {
  return (
    <div className="w-full min-w-0">
      {sections.map((section, index) => {
        const Icon = section.icon;
        return (
          <section
            key={section.id}
            id={section.id}
            className={`scroll-mt-24 border-t border-border py-14 sm:py-20 ${index % 2 === 0 ? "bg-muted/20" : "bg-background"}`}
            aria-labelledby={`${section.id}-heading`}
          >
            <div className="container mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-[minmax(0,1.05fr)_minmax(280px,.95fr)] md:items-center">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">{section.eyebrow}</p>
                <h2 id={`${section.id}-heading`} className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">{section.title}</h2>
                <p className="max-w-2xl leading-7 text-muted-foreground">{section.description}</p>
                <Link href="/#pdf-tools" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                  Explore available tools <ArrowUpRight size={16} />
                </Link>
              </div>
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={22} /></div>
                  <div>
                    <p className="font-semibold">Planned utilities</p>
                    <p className="text-xs text-muted-foreground">Not available yet</p>
                  </div>
                  <span className="ml-auto rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Coming soon</span>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {section.items.map((item) => (
                    <li key={item} className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
