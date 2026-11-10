import Link from "next/link";
import { Calculator, ArrowLeft, Clock3 } from "lucide-react";
import { ToolPageHeader } from "@/components/pdf/tool-page-header";
const labels: Record<string, { title: string; description: string }> = {
  "emi-calculator": { title: "EMI Calculator", description: "Estimate monthly loan payments and understand the cost of borrowing." },
  "loan-planner": { title: "Loan Planner", description: "Explore repayment timelines and compare loan scenarios." },
  "interest-calculator": { title: "Interest Calculator", description: "Understand simple and compound interest with clear estimates." },
};
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return { title: `${labels[slug]?.title || "Finance Tool"} | Convia` }; }
export default async function LoanToolPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const tool = labels[slug]; if (!tool) return <main className="page-container error-state"><h1>Finance tool not found</h1><Link className="button-primary" href="/#loans">Back to finance</Link></main>; return <><ToolPageHeader title={tool.title} description={tool.description} eyebrow="MONEY & PLANNING" backHref="/#loans"/><main className="page-container simple-state-wrap"><section className="coming-soon-card"><div className="coming-soon-icon"><Calculator size={28}/></div><span className="section-kicker">FINANCIAL TOOLKIT</span><h2>{tool.title} is coming soon.</h2><p>This calculator is listed in the Convia roadmap. We will enable it after the calculations and result explanations are implemented and checked.</p><div className="coming-soon-actions"><Link className="button-primary" href="/#loans"><ArrowLeft size={16}/> Back to finance</Link><span><Clock3 size={15}/> In development</span></div></section></main></>; }
