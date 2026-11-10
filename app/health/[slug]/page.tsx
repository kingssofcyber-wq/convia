import Link from "next/link";
import { HeartPulse, ArrowLeft, Clock3 } from "lucide-react";
import { ToolPageHeader } from "@/components/pdf/tool-page-header";
const guides: Record<string, { title: string; description: string }> = {
  bmi: { title: "BMI Calculator", description: "An educational height-to-weight screening estimate." },
  "water-intake": { title: "Water Intake Guide", description: "General hydration information and factors that affect fluid needs." },
  "age-calculator": { title: "Age Calculator", description: "Calculate age from a date of birth." },
};
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return { title: `${guides[slug]?.title || "Health Guide"} | Convia` }; }
export default async function HealthGuidePage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const item = guides[slug]; if (!item) return <main className="page-container error-state"><h1>Health tool not found</h1><Link className="button-primary" href="/#health">Back to health</Link></main>; return <><ToolPageHeader title={item.title} description={item.description} eyebrow="EVERYDAY WELLNESS" backHref="/#health"/><main className="page-container simple-state-wrap"><section className="coming-soon-card"><div className="coming-soon-icon"><HeartPulse size={28}/></div><span className="section-kicker">WELLNESS TOOLKIT</span><h2>{item.title} is coming soon.</h2><p>This general-information tool is planned for a later release. It will not diagnose, treat or replace advice from a qualified health professional.</p><div className="coming-soon-actions"><Link className="button-primary" href="/#health"><ArrowLeft size={16}/> Back to health</Link><span><Clock3 size={15}/> In development</span></div></section></main></>; }
