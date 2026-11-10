"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import {
  Activity, ArrowRight, ArrowUpRight, Calculator, CarFront, Check,
  ChevronRight, FileImage, FileSpreadsheet, FileText, Files, HeartPulse,
  Image, Info, Layers, LockKeyhole, Menu, Plane, Presentation, Search,
  ShieldCheck, Sparkles, Scissors, Stamp, Type, Unlock, Wrench, RotateCw,
  Trash2, Crop, PenLine, ScanText, ArrowLeftRight, Highlighter, ImagePlus,
  Code2, ListOrdered, Droplets, Combine, Minimize2, FilePlus2, Clock3,
  Zap, Globe2, Lock, Heart, BadgeCheck, WalletCards
} from "lucide-react";
import { PDF_TOOLS, type ToolCategory } from "@/lib/tools";

const iconMap: Record<string, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  minimize: Minimize2, merge: Combine, split: Scissors, pages: Layers,
  extract: FilePlus2, stamp: Stamp, word: FileText, file: Files,
  image: FileImage, images: Image, sheet: FileSpreadsheet, presentation: Presentation,
  rotate: RotateCw, trash: Trash2, crop: Crop, numbers: ListOrdered,
  lock: LockKeyhole, unlock: Unlock, signature: PenLine, edit: PenLine,
  scan: ScanText, wrench: Wrench, layers: Layers, shield: ShieldCheck,
  compare: ArrowLeftRight, highlight: Highlighter, "image-plus": ImagePlus,
  code: Code2, type: Type, info: Info,
};

const categories: ToolCategory[] = ["All", "Convert", "Organize", "Edit", "Secure", "AI"];

export function HomePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ToolCategory>("All");
  const [showAll, setShowAll] = useState(false);
  const filtered = useMemo(() => PDF_TOOLS.filter((tool) => {
    const categoryMatch = category === "All" || tool.category === category;
    const queryMatch = !query.trim() || `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(query.trim().toLowerCase());
    return categoryMatch && queryMatch;
  }), [category, query]);
  const visible = showAll || query || category !== "All" ? filtered : filtered.slice(0, 12);

  return (
    <div className="home-page">
      <section className="home-hero page-container">
        <div className="hero-glow hero-glow-a"/><div className="hero-glow hero-glow-b"/>
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-pulse"/> YOUR EVERYDAY DIGITAL WORKSPACE</div>
          <h1>Less switching.<br/><span>More getting done.</span></h1>
          <p>Powerful PDF tools, practical financial calculators, insurance guides and useful health utilities — thoughtfully brought together in one simple workspace.</p>
          <div className="hero-actions"><a className="button-primary" href="#pdf-tools">Explore all tools <ArrowUpRight size={17}/></a><a className="button-secondary" href="#how-it-works"><span className="play-dot">▶</span> See what’s inside</a></div>
          <div className="hero-points"><span><Check size={15}/> Simple by design</span><span><Check size={15}/> Useful tools, without clutter</span><span><Check size={15}/> Built for everyday tasks</span></div>
        </div>
        <div className="hero-visual" aria-label="Convia workspace preview">
          <div className="hero-orbit hero-orbit-one"/><div className="hero-orbit hero-orbit-two"/>
          <div className="workspace-window">
            <div className="workspace-top"><div className="window-dots"><i/><i/><i/></div><span>convia.workspace</span><span className="window-top-badge"><Sparkles size={12}/> Workspace</span></div>
            <div className="workspace-content"><div className="workspace-greeting"><small>YOUR WORKSPACE</small><strong>What would you like to do?</strong></div><div className="workspace-search"><Search size={15}/><span>Search for a tool or calculator</span><kbd>⌘ K</kbd></div>
              <div className="workspace-quick-grid"><div className="quick-tile quick-purple"><span><FileText size={20}/></span><b>PDF tools</b><small>30 utilities</small></div><div className="quick-tile quick-blue"><span><Calculator size={20}/></span><b>EMI planner</b><small>Plan repayments</small></div><div className="quick-tile quick-green"><span><ShieldCheck size={20}/></span><b>Insurance</b><small>Explore cover</small></div><div className="quick-tile quick-orange"><span><HeartPulse size={20}/></span><b>Health</b><small>Everyday wellness</small></div></div>
              <div className="workspace-footer"><span><i/> All systems ready</span><span>Made to be simple <Sparkles size={12}/></span></div>
            </div>
          </div>
          <div className="floating-chip chip-one"><span className="chip-icon chip-icon-purple"><Zap size={15}/></span><span><b>Fast workflow</b><small>Less repetitive work</small></span></div>
          <div className="floating-chip chip-two"><span className="chip-icon chip-icon-green"><Lock size={15}/></span><span><b>Privacy aware</b><small>Clear processing info</small></span></div>
        </div>
      </section>

      <section className="trust-strip page-container" id="how-it-works"><div><span className="trust-number">30</span><span><b>PDF utilities</b><small>One focused workspace</small></span></div><div><span className="trust-icon"><Zap size={20}/></span><span><b>Simple workflows</b><small>Clear steps, less clutter</small></span></div><div><span className="trust-icon"><ShieldCheck size={20}/></span><span><b>Transparent tools</b><small>Know what each tool does</small></span></div><div><span className="trust-icon"><Globe2 size={20}/></span><span><b>Work from your browser</b><small>No desktop install needed</small></span></div></section>

      <section className="section-block page-container" id="pdf-tools">
        <div className="section-heading-row"><div className="section-heading"><span className="section-kicker">BUILT AROUND YOUR EVERYDAY TASKS</span><h2>PDF productivity suite<span>.</span></h2><p>Make PDFs work for you. Choose a tool and get started.</p></div><span className="tool-total-pill"><FileText size={15}/> {PDF_TOOLS.length} tools listed</span></div>
        <div className="tool-controls"><label className="tool-search"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search PDF tools..." aria-label="Search PDF tools"/><kbd>⌘ K</kbd></label><div className="tool-filters" role="tablist" aria-label="Filter PDF tools">{categories.map((item) => <button type="button" key={item} role="tab" aria-selected={category === item} className={category === item ? "filter-active" : ""} onClick={() => { setCategory(item); setShowAll(true); }}>{item}</button>)}</div></div>
        <div className="tool-grid">{visible.map((tool, index) => { const Icon = iconMap[tool.icon] || FileText; return <Link href={`/pdf/${tool.slug}`} key={tool.slug} className="tool-card" style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}><div className={`tool-card-icon tool-tone-${index % 6}`}><Icon size={21}/></div><div className="tool-card-meta"><span className={tool.status === "available" ? "status-available" : "status-soon"}>{tool.status === "available" ? "Available" : "Coming soon"}</span><ArrowUpRight size={15}/></div><h3>{tool.name}</h3><p>{tool.description}</p></Link>; })}</div>
        {filtered.length === 0 && <div className="empty-state"><Search size={24}/><b>No tools found</b><span>Try a different search or category.</span></div>}
        {!query && category === "All" && filtered.length > 12 && <div className="section-action"><button type="button" className="button-outline" onClick={() => setShowAll((value) => !value)}>{showAll ? "Show fewer tools" : `Explore all ${PDF_TOOLS.length} tools`} <ChevronRight size={16}/></button></div>}
      </section>

      <section className="section-block money-section" id="loans"><div className="page-container"><div className="feature-header"><div><span className="section-kicker">MONEY, MADE CLEARER</span><h2>Plan with more confidence.</h2><p>Explore everyday financial calculators and guides in one place.</p></div><span className="feature-stamp stamp-blue"><WalletCards size={24}/></span></div><div className="feature-card-grid"><Link href="/loans/emi-calculator" className="feature-card feature-blue"><div className="feature-card-icon"><Calculator size={23}/></div><span className="feature-tag">POPULAR</span><h3>EMI Calculator</h3><p>Estimate monthly payments and understand the total cost of a loan.</p><b>Explore calculator <ArrowUpRight size={15}/></b></Link><Link href="/loans/loan-planner" className="feature-card feature-violet"><div className="feature-card-icon"><WalletCards size={23}/></div><span className="feature-tag">PLANNING</span><h3>Loan Planner</h3><p>Explore repayment timelines and compare loan scenarios.</p><b>Explore planner <ArrowUpRight size={15}/></b></Link><Link href="/loans/interest-calculator" className="feature-card feature-cyan"><div className="feature-card-icon"><Activity size={23}/></div><span className="feature-tag">FINANCE</span><h3>Interest Calculator</h3><p>Understand simple and compound interest with clear estimates.</p><b>Calculate interest <ArrowUpRight size={15}/></b></Link></div></div></section>

      <section className="section-block page-container" id="insurance"><div className="feature-header"><div><span className="section-kicker">PROTECTION THAT MAKES SENSE</span><h2>Explore cover. Know your options.</h2><p>Learn about common insurance types and the protection they are designed to provide.</p></div><span className="feature-stamp stamp-green"><ShieldCheck size={24}/></span></div><div className="category-grid">{[{name:"Life Insurance",desc:"Financial protection for your loved ones.",icon:Heart},{name:"Health Insurance",desc:"Understand cover for medical expenses.",icon:HeartPulse},{name:"Motor Insurance",desc:"Explore cover for cars and two-wheelers.",icon:CarFront},{name:"Travel Insurance",desc:"Learn about protection for travel.",icon:Plane}].map((item) => <Link href="/insurance" className="category-card" key={item.name}><span><item.icon size={22}/></span><h3>{item.name}</h3><p>{item.desc}</p><b>Explore guide <ArrowUpRight size={14}/></b></Link>)}</div></section>

      <section className="section-block health-section" id="health"><div className="page-container health-layout"><div className="health-copy"><span className="section-kicker">SMALL STEPS, BETTER AWARENESS</span><h2>Everyday health,<br/><span>made simpler.</span></h2><p>Explore general wellness tools and practical health information. These utilities are educational and do not replace professional medical advice.</p><Link href="/health" className="button-primary">Explore health tools <ArrowRight size={16}/></Link></div><div className="health-tool-stack"><Link href="/health/bmi" className="health-tool-card"><span className="health-tool-icon"><HeartPulse size={21}/></span><span><b>BMI Calculator</b><small>Understand a general screening measure.</small></span><ArrowUpRight size={16}/></Link><Link href="/health/water-intake" className="health-tool-card"><span className="health-tool-icon"><Droplets size={21}/></span><span><b>Water Intake Guide</b><small>Explore general hydration information.</small></span><ArrowUpRight size={16}/></Link><Link href="/health/age-calculator" className="health-tool-card"><span className="health-tool-icon"><Clock3 size={21}/></span><span><b>Age Calculator</b><small>Calculate age from a date of birth.</small></span><ArrowUpRight size={16}/></Link></div></div></section>

      <section className="closing-cta page-container"><div className="closing-decoration"><Sparkles size={100}/></div><div><span className="section-kicker">ONE PLACE. MANY POSSIBILITIES.</span><h2>Ready to make your day<br/>a little easier?</h2><p>Find the tool you need and get straight to what matters.</p></div><a href="#pdf-tools" className="button-light">Find your tool <ArrowUpRight size={16}/></a></section>
    </div>
  );
}
