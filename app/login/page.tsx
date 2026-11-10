import Link from "next/link";
import { ToolPageHeader } from "@/components/pdf/tool-page-header";
import { LockKeyhole, ArrowLeft } from "lucide-react";
export const metadata = { title: "Log in | Convia" };
export default function LoginPage() { return <><ToolPageHeader title="Welcome back" description="Account access is being prepared for Convia." eyebrow="CONVIA ACCOUNT"/><main className="page-container simple-state-wrap"><section className="coming-soon-card"><div className="coming-soon-icon"><LockKeyhole size={28}/></div><h2>Login is coming soon.</h2><p>PDF tools are available without an account where marked Available. Account features will be added after authentication is configured.</p><Link className="button-primary" href="/#pdf-tools"><ArrowLeft size={16}/> Back to Convia</Link></section></main></>; }
