import Link from "next/link";
import { ArrowLeft, FileText, Sparkles } from "lucide-react";

type ToolPageHeaderProps = {
  title: string;
  description: string;
  eyebrow?: string;
  backHref?: string;
};

export function ToolPageHeader({ title, description, eyebrow = "CONVIA PDF WORKSPACE", backHref = "/#pdf-tools" }: ToolPageHeaderProps) {
  return (
    <section className="tool-page-hero">
      <div className="tool-page-hero-inner page-container">
        <div className="tool-hero-copy">
          <div className="tool-eyebrow"><FileText size={14} /> {eyebrow}</div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <Link href={backHref} className="tool-back-link"><ArrowLeft size={16} /> Back to tools</Link>
        <div className="tool-hero-orb tool-hero-orb-one" aria-hidden="true" />
        <div className="tool-hero-orb tool-hero-orb-two" aria-hidden="true" />
        <Sparkles className="tool-hero-sparkle" size={27} aria-hidden="true" />
      </div>
    </section>
  );
}
