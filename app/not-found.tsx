import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
export default function NotFound() { return <main className="page-container error-state"><div className="error-icon"><SearchX size={27}/></div><span className="section-kicker">404 · PAGE NOT FOUND</span><h1>This page is not in the Convia workspace.</h1><p>The link may be outdated, or this tool may not be available yet.</p><Link href="/" className="button-primary"><ArrowLeft size={16}/> Back to homepage</Link></main>; }
