"use client";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Convia route error:", error); }, [error]);
  return <main className="page-container error-state"><div className="error-icon"><AlertTriangle size={27}/></div><span className="section-kicker">SOMETHING WENT WRONG</span><h1>This page could not finish loading.</h1><p>Please try again. Your original files should remain unchanged unless a tool explicitly completed an export.</p><button className="button-primary" onClick={() => reset()}><RefreshCw size={16}/> Try again</button></main>;
}
