import Link from "next/link";
import { ToolPageHeader } from "@/components/pdf/tool-page-header";
import { UserPlus, ArrowLeft } from "lucide-react";
export const metadata = { title: "Sign up | Convia" };
export default function SignupPage() { return <><ToolPageHeader title="Create your Convia account" description="A simpler workspace is on the way." eyebrow="CONVIA ACCOUNT"/><main className="page-container simple-state-wrap"><section className="coming-soon-card"><div className="coming-soon-icon"><UserPlus size={28}/></div><h2>Sign up is coming soon.</h2><p>Account registration is not active yet. You can continue using the PDF tools marked Available without signing in.</p><Link className="button-primary" href="/#pdf-tools"><ArrowLeft size={16}/> Back to Convia</Link></section></main></>; }
