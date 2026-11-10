import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bell, Clock3, FileText, Sparkles } from "lucide-react";
import { getToolBySlug, PDF_TOOLS } from "@/lib/tools";
import { ToolPageHeader } from "@/components/pdf/tool-page-header";

export const dynamicParams = true;

export function generateStaticParams() {
  return PDF_TOOLS.filter((tool) => tool.status === "coming-soon").map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  return { title: tool ? `${tool.name} | Convia` : "PDF Tool | Convia", description: tool?.description || "Explore PDF tools on Convia." };
}

export default async function PdfToolFallback({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();
  // Existing static tool route files have priority over this dynamic fallback.
  // If a tool is marked available but its page file is missing, show this clear fallback instead of a 404.
  return (
    <>
      <ToolPageHeader title={tool.name} description={tool.description} />
      <main className="page-container tool-content-wrap">
        <section className="coming-soon-card">
          <div className="coming-soon-icon"><Clock3 size={28}/></div>
          <span className="section-kicker">IN THE WORKSPACE ROADMAP</span>
          <h2>{tool.status === "available" ? `${tool.name} page needs to be connected.` : `${tool.name} is coming soon.`}</h2>
          <p>{tool.status === "available" ? "This tool is marked available in the catalogue, but its working page file was not found. Restore or connect its existing processor page before marking it live." : "We are preparing this tool with a clear workflow and reliable output. This page is a preview; file processing is not enabled yet."}</p>
          <div className="coming-soon-actions"><Link href="/#pdf-tools" className="button-primary"><ArrowLeft size={16}/> Browse available tools</Link><span><Bell size={15}/> Check back for updates</span></div>
          <div className="coming-soon-note"><Sparkles size={16}/> We will mark this tool as Available when its processing flow is ready.</div>
        </section>
        <div className="tool-page-support"><div><FileText size={19}/><span><b>Need another PDF tool?</b><small>Explore the tools that are already available.</small></span></div><Link href="/#pdf-tools">Explore tools <ArrowLeft size={14}/></Link></div>
      </main>
    </>
  );
}
